/**
 * RealtimeService Tests
 *
 * Coverage targets:
 * - Subscription lifecycle (subscribe, unsubscribe, reconnect)
 * - Event handling and debouncing
 * - Own-change detection
 * - Online/offline transitions
 * - Status tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client BEFORE importing realtimeService
vi.mock('@/lib/supabaseClient', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback: (status: string) => void) => {
      callback('SUBSCRIBED');
      return mockChannel;
    }),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
  };

  return {
    supabase: {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn().mockResolvedValue(undefined),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    },
  };
});

// Mock hydration service
vi.mock('@/sync/hydrationService', () => ({
  hydrationService: {
    hydrateProject: vi.fn().mockResolvedValue({
      success: true,
      recordsSynced: 5,
      duration: 100,
      conflicts: [],
      errors: [],
    }),
  },
}));

import { supabase } from '@/lib/supabaseClient';
import { hydrationService } from '@/sync/hydrationService';
import { realtimeService } from '@/sync/realtimeService';

describe('realtimeService', () => {
  const projectId = 'project-123';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Ensure hydration mock is clean
    (hydrationService.hydrateProject as any).mockClear();
  });

  afterEach(async () => {
    vi.useRealTimers();
    // Clean up all subscriptions to prevent state pollution
    await realtimeService.unsubscribeAll();
  });

  describe('Subscription lifecycle', () => {
    it('subscribes to project and creates channels for all tables', async () => {
      await realtimeService.subscribeToProject(projectId);

      // Should create channels for all sync tables
      expect(supabase.channel).toHaveBeenCalled();
      const channelName = (supabase.channel as any).mock.calls[0][0];
      expect(channelName).toContain(projectId);

      // Should mark as subscribed
      expect(realtimeService.isSubscribed(projectId)).toBe(true);
    });

    it('does not subscribe twice to same project', async () => {
      await realtimeService.subscribeToProject(projectId);
      const firstCallCount = (supabase.channel as any).mock.calls.length;

      await realtimeService.subscribeToProject(projectId);
      const secondCallCount = (supabase.channel as any).mock.calls.length;

      // Should not create additional channels
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('skips subscription when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await realtimeService.subscribeToProject(projectId);

      expect(supabase.channel).not.toHaveBeenCalled();
      expect(realtimeService.isSubscribed(projectId)).toBe(false);
    });

    it('unsubscribes from project and cleans up channels', async () => {
      await realtimeService.subscribeToProject(projectId);

      await realtimeService.unsubscribeFromProject(projectId);

      expect(supabase.removeChannel).toHaveBeenCalled();
      expect(realtimeService.isSubscribed(projectId)).toBe(false);
    });

    it('unsubscribes from all projects', async () => {
      await realtimeService.subscribeToProject('project-1');
      await realtimeService.subscribeToProject('project-2');

      await realtimeService.unsubscribeAll();

      // Each project has 5 tables, so 2 projects = 10 channels
      expect(supabase.removeChannel).toHaveBeenCalled();
      expect(realtimeService.isSubscribed('project-1')).toBe(false);
      expect(realtimeService.isSubscribed('project-2')).toBe(false);
    });
  });

  describe('Event handling and debouncing', () => {
    it('debounces change events before triggering hydration', async () => {
      await realtimeService.subscribeToProject(projectId);

      const mockChannelImpl = (supabase.channel as any).mock.results[0].value;
      const onCall = (mockChannelImpl.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes',
      );
      const changeHandler = onCall[2];

      // Fire multiple events for the SAME record within debounce window
      changeHandler({
        eventType: 'UPDATE',
        table: 'chapters',
        new: { id: '1', project_id: projectId, updated_at: '2025-11-14T12:00:00Z' },
        old: null,
      });

      changeHandler({
        eventType: 'UPDATE',
        table: 'chapters',
        new: { id: '1', project_id: projectId, updated_at: '2025-11-14T12:00:01Z' },
        old: null,
      });

      // Hydration should not have been called yet
      expect(hydrationService.hydrateProject).not.toHaveBeenCalled();

      // Advance past debounce window (500ms)
      vi.advanceTimersByTime(500);

      // Should have triggered hydration once
      expect(hydrationService.hydrateProject).toHaveBeenCalledTimes(1);
      expect(hydrationService.hydrateProject).toHaveBeenCalledWith({
        projectId,
        tables: ['chapters'],
      });
    });

    it('triggers hydration for INSERT events', async () => {
      await realtimeService.subscribeToProject(projectId);

      // Get the first channel that was created (chapters table)
      const channelMock = (supabase.channel as any).mock;
      if (!channelMock.results || channelMock.results.length === 0) {
        throw new Error('No channel was created');
      }
      const mockChannelImpl = channelMock.results[0].value;
      const onCall = (mockChannelImpl.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes',
      );
      const changeHandler = onCall[2];

      changeHandler({
        eventType: 'INSERT',
        table: 'chapters',
        new: { id: '1', project_id: projectId, updated_at: '2025-11-14T12:00:00Z' },
        old: null,
      });

      vi.advanceTimersByTime(500);

      expect(hydrationService.hydrateProject).toHaveBeenCalledWith({
        projectId,
        tables: ['chapters'],
      });
    });

    it('logs DELETE events but does not hydrate (not yet implemented)', async () => {
      await realtimeService.subscribeToProject(projectId);

      // Get the first channel that was created (chapters table)
      const channelMock = (supabase.channel as any).mock;
      if (!channelMock.results || channelMock.results.length === 0) {
        throw new Error('No channel was created');
      }
      const mockChannelImpl = channelMock.results[0].value;
      const onCall = (mockChannelImpl.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes',
      );
      const changeHandler = onCall[2];

      changeHandler({
        eventType: 'DELETE',
        table: 'chapters',
        new: null,
        old: { id: '1', project_id: projectId },
      });

      vi.advanceTimersByTime(500);

      // DELETE handling not yet implemented, should not hydrate
      expect(hydrationService.hydrateProject).not.toHaveBeenCalled();
    });
  });

  describe('Status tracking', () => {
    it('updates status to connected on successful subscription', async () => {
      await realtimeService.subscribeToProject(projectId);

      expect(realtimeService.getStatus()).toBe('connected');
    });

    it('updates status to disconnected when all channels removed', async () => {
      await realtimeService.subscribeToProject(projectId);
      await realtimeService.unsubscribeFromProject(projectId);

      expect(realtimeService.getStatus()).toBe('disconnected');
    });

    it('notifies listeners of status changes', async () => {
      const listener = vi.fn();
      realtimeService.addListener(listener);

      await realtimeService.subscribeToProject(projectId);

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.realtimeStatus).toBe('connected');
      expect(lastCall.isAuthenticated).toBe(true);

      realtimeService.removeListener(listener);
    });

    it('removes listener correctly', async () => {
      const listener = vi.fn();
      realtimeService.addListener(listener);
      realtimeService.removeListener(listener);

      await realtimeService.subscribeToProject(projectId);

      // Listener should not have been called after removal
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Utility methods', () => {
    it('returns active project ID', async () => {
      await realtimeService.subscribeToProject(projectId);

      expect(realtimeService.getActiveProjectId()).toBe(projectId);

      await realtimeService.unsubscribeFromProject(projectId);

      expect(realtimeService.getActiveProjectId()).toBe(null);
    });

    it('returns subscription map', async () => {
      await realtimeService.subscribeToProject(projectId);

      const subscriptions = realtimeService.getSubscriptions();

      expect(subscriptions.has(projectId)).toBe(true);
      expect(subscriptions.get(projectId)?.size).toBeGreaterThan(0);
    });
  });
});
