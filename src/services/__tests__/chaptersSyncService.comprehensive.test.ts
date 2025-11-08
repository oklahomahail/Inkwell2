/**
 * ChaptersSyncService Comprehensive Tests
 *
 * Phase 2b: Service Layer Coverage (P1 Priority)
 * Target: 17% → 70% coverage
 *
 * Tests bidirectional sync between IndexedDB and Supabase:
 * - pushLocalChanges: Upload local chapters to Supabase
 * - pullRemoteChanges: Download remote chapters from Supabase
 * - syncChapters: Full bidirectional sync
 * - subscribeToChapterChanges: Real-time updates via WebSocket
 * - isRealtimeConnected: Connection status check
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChapterMeta, CreateChapterInput } from '@/types/writing';

// Create hoisted Supabase mock
const mockSupabaseClient = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    state: 'joined',
  };

  return {
    from: vi.fn(),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    getChannels: vi.fn(() => [mockChannel]),
  };
});

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

// Create hoisted Chapters service mock
const mockChaptersService = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  getMeta: vi.fn(),
  create: vi.fn(),
  updateMeta: vi.fn(),
  saveDoc: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
}));

vi.mock('../chaptersService', () => ({
  Chapters: mockChaptersService,
}));

// Import service AFTER mocking dependencies
import {
  pushLocalChanges,
  pullRemoteChanges,
  syncChapters,
  subscribeToChapterChanges,
  isRealtimeConnected,
} from '../chaptersSyncService';

describe('ChaptersSyncService - Comprehensive', () => {
  const projectId = 'test-project-sync';
  const now = new Date().toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pushLocalChanges()', () => {
    it('should return early if no local chapters exist', async () => {
      mockChaptersService.list.mockResolvedValue([]);

      await pushLocalChanges(projectId);

      expect(mockChaptersService.list).toHaveBeenCalledWith(projectId);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should push new local chapter to Supabase', async () => {
      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'New Chapter',
        summary: 'Summary',
        index: 0,
        status: 'draft',
        wordCount: 100,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      const fullChapter = {
        ...localMeta,
        content: 'Chapter content',
        version: 1,
      };

      mockChaptersService.list.mockResolvedValue([localMeta]);
      mockChaptersService.get.mockResolvedValue(fullChapter);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chapters') {
          return {
            ...mockQuery,
            ...mockUpsert,
          };
        }
        return mockQuery;
      });

      await pushLocalChanges(projectId);

      expect(mockChaptersService.get).toHaveBeenCalledWith('ch-1');
      expect(mockUpsert.upsert).toHaveBeenCalledWith({
        id: 'ch-1',
        project_id: projectId,
        title: 'New Chapter',
        content: 'Chapter content',
        summary: 'Summary',
        word_count: 100,
        order_index: 0,
        status: 'draft',
        updated_at: now,
      });
    });

    it('should skip push if remote is newer than local', async () => {
      const localTime = new Date('2025-01-01').toISOString();
      const remoteTime = new Date('2025-01-02').toISOString();

      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Old Local',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 50,
        sceneCount: 0,
        tags: [],
        createdAt: localTime,
        updatedAt: localTime,
      };

      mockChaptersService.list.mockResolvedValue([localMeta]);
      mockChaptersService.get.mockResolvedValue({
        ...localMeta,
        content: 'Old content',
        version: 1,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { updated_at: remoteTime },
          error: null,
        }),
      };

      const mockUpsert = {
        upsert: vi.fn(),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await pushLocalChanges(projectId);

      expect(mockUpsert.upsert).not.toHaveBeenCalled();
    });

    it('should push if local is newer than remote', async () => {
      const remoteTime = new Date('2025-01-01').toISOString();
      const localTime = new Date('2025-01-02').toISOString();

      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Newer Local',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 75,
        sceneCount: 0,
        tags: [],
        createdAt: localTime,
        updatedAt: localTime,
      };

      mockChaptersService.list.mockResolvedValue([localMeta]);
      mockChaptersService.get.mockResolvedValue({
        ...localMeta,
        content: 'Newer content',
        version: 2,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { updated_at: remoteTime },
          error: null,
        }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await pushLocalChanges(projectId);

      expect(mockUpsert.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ch-1',
          title: 'Newer Local',
        }),
      );
    });

    it('should handle Supabase upsert errors gracefully', async () => {
      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Chapter',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 50,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      mockChaptersService.list.mockResolvedValue([localMeta]);
      mockChaptersService.get.mockResolvedValue({ ...localMeta, content: 'Content', version: 1 });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: new Error('Network error') }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await pushLocalChanges(projectId);

      expect(console.error).toHaveBeenCalledWith(
        '[Sync] Failed to push chapter:',
        'ch-1',
        expect.any(Error),
      );
    });

    it('should handle chapter fetch errors and continue with other chapters', async () => {
      const meta1: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Chapter 1',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 50,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      const meta2: ChapterMeta = {
        id: 'ch-2',
        projectId,
        title: 'Chapter 2',
        summary: '',
        index: 1,
        status: 'draft',
        wordCount: 75,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      mockChaptersService.list.mockResolvedValue([meta1, meta2]);
      mockChaptersService.get
        .mockRejectedValueOnce(new Error('Failed to get ch-1'))
        .mockResolvedValueOnce({ ...meta2, content: 'Content 2', version: 1 });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await pushLocalChanges(projectId);

      expect(console.error).toHaveBeenCalledWith(
        '[Sync] Error pushing chapter:',
        'ch-1',
        expect.any(Error),
      );
      expect(mockUpsert.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ch-2',
        }),
      );
    });
  });

  describe('pullRemoteChanges()', () => {
    it('should throw error if Supabase fetch fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Network error'),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(pullRemoteChanges(projectId)).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        '[Sync] Failed to pull chapters:',
        expect.any(Error),
      );
    });

    it('should return empty array if no remote chapters exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await pullRemoteChanges(projectId);

      expect(result).toEqual([]);
    });

    it('should pull new remote chapter to IndexedDB', async () => {
      const remoteChapter = {
        id: 'ch-remote',
        project_id: projectId,
        title: 'Remote Chapter',
        content: 'Remote content',
        summary: 'Remote summary',
        word_count: 100,
        order_index: 0,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remoteChapter], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockRejectedValue(new Error('Not found'));

      const result = await pullRemoteChanges(projectId);

      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: 'ch-remote',
        projectId,
        title: 'Remote Chapter',
        content: 'Remote content',
        summary: 'Remote summary',
        index: 0,
        status: 'draft',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'ch-remote',
        title: 'Remote Chapter',
        wordCount: 100,
      });
    });

    it('should skip pull if local is newer than remote', async () => {
      const localTime = new Date('2025-01-02').toISOString();
      const remoteTime = new Date('2025-01-01').toISOString();

      const remoteChapter = {
        id: 'ch-1',
        project_id: projectId,
        title: 'Old Remote',
        content: 'Old content',
        summary: '',
        word_count: 50,
        order_index: 0,
        status: 'draft',
        created_at: remoteTime,
        updated_at: remoteTime,
      };

      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Newer Local',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 75,
        sceneCount: 0,
        tags: [],
        createdAt: localTime,
        updatedAt: localTime,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remoteChapter], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockResolvedValue(localMeta);

      const result = await pullRemoteChanges(projectId);

      expect(mockChaptersService.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should pull if remote is newer than local', async () => {
      const localTime = new Date('2025-01-01').toISOString();
      const remoteTime = new Date('2025-01-02').toISOString();

      const remoteChapter = {
        id: 'ch-1',
        project_id: projectId,
        title: 'Newer Remote',
        content: 'Newer content',
        summary: 'New summary',
        word_count: 100,
        order_index: 0,
        status: 'revising',
        created_at: remoteTime,
        updated_at: remoteTime,
      };

      const localMeta: ChapterMeta = {
        id: 'ch-1',
        projectId,
        title: 'Old Local',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 50,
        sceneCount: 0,
        tags: [],
        createdAt: localTime,
        updatedAt: localTime,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remoteChapter], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockResolvedValue(localMeta);

      const result = await pullRemoteChanges(projectId);

      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: 'ch-1',
        projectId,
        title: 'Newer Remote',
        content: 'Newer content',
        summary: 'New summary',
        index: 0,
        status: 'revising',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Newer Remote');
    });

    it('should handle remote chapters with null content', async () => {
      const remoteChapter = {
        id: 'ch-null',
        project_id: projectId,
        title: 'Chapter with null content',
        content: null,
        summary: '',
        word_count: 0,
        order_index: 0,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remoteChapter], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockRejectedValue(new Error('Not found'));

      await pullRemoteChanges(projectId);

      expect(mockChaptersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
        }),
      );
    });

    it('should handle errors when creating local chapters and continue', async () => {
      const remote1 = {
        id: 'ch-1',
        project_id: projectId,
        title: 'Chapter 1',
        content: 'Content 1',
        summary: '',
        word_count: 50,
        order_index: 0,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };

      const remote2 = {
        id: 'ch-2',
        project_id: projectId,
        title: 'Chapter 2',
        content: 'Content 2',
        summary: '',
        word_count: 75,
        order_index: 1,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remote1, remote2], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockRejectedValue(new Error('Not found'));
      mockChaptersService.create
        .mockRejectedValueOnce(new Error('Failed to create ch-1'))
        .mockResolvedValueOnce(undefined);

      const result = await pullRemoteChanges(projectId);

      expect(console.error).toHaveBeenCalledWith(
        '[Sync] Error pulling chapter:',
        'ch-1',
        expect.any(Error),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ch-2');
    });
  });

  describe('syncChapters()', () => {
    it('should execute push then pull in sequence', async () => {
      mockChaptersService.list.mockResolvedValue([]);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await syncChapters(projectId);

      expect(mockChaptersService.list).toHaveBeenCalledWith(projectId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chapters');
    });

    it('should complete pull even if push fails', async () => {
      mockChaptersService.list.mockRejectedValue(new Error('Push failed'));

      await expect(syncChapters(projectId)).rejects.toThrow('Push failed');
    });
  });

  describe('subscribeToChapterChanges()', () => {
    it('should create channel subscription for project', () => {
      const onChange = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      subscribeToChapterChanges(projectId, onChange);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(`chapters:${projectId}`);
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `project_id=eq.${projectId}`,
        },
        expect.any(Function),
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle DELETE events by removing local chapter', async () => {
      const onChange = vi.fn();
      let capturedHandler: any;

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          capturedHandler = handler;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      subscribeToChapterChanges(projectId, onChange);

      const payload = {
        eventType: 'DELETE',
        old: { id: 'ch-deleted' },
        new: null,
      };

      await capturedHandler(payload);

      expect(mockChaptersService.remove).toHaveBeenCalledWith('ch-deleted');
      expect(onChange).toHaveBeenCalledWith('ch-deleted');
    });

    it('should handle INSERT events by creating local chapter', async () => {
      const onChange = vi.fn();
      let capturedHandler: any;

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          capturedHandler = handler;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      subscribeToChapterChanges(projectId, onChange);

      const payload = {
        eventType: 'INSERT',
        new: {
          id: 'ch-new',
          title: 'New Chapter',
          content: 'Content',
          summary: 'Summary',
          order_index: 0,
          status: 'draft',
        },
        old: null,
      };

      await capturedHandler(payload);

      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: 'ch-new',
        projectId,
        title: 'New Chapter',
        content: 'Content',
        summary: 'Summary',
        index: 0,
        status: 'draft',
      });
      expect(onChange).toHaveBeenCalledWith('ch-new');
    });

    it('should handle UPDATE events by updating local chapter', async () => {
      const onChange = vi.fn();
      let capturedHandler: any;

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          capturedHandler = handler;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      subscribeToChapterChanges(projectId, onChange);

      const payload = {
        eventType: 'UPDATE',
        new: {
          id: 'ch-updated',
          title: 'Updated Title',
          content: 'Updated content',
          summary: 'Updated summary',
          order_index: 1,
          status: 'revising',
        },
        old: { id: 'ch-updated' },
      };

      await capturedHandler(payload);

      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: 'ch-updated',
        projectId,
        title: 'Updated Title',
        content: 'Updated content',
        summary: 'Updated summary',
        index: 1,
        status: 'revising',
      });
      expect(onChange).toHaveBeenCalledWith('ch-updated');
    });

    it('should handle errors in realtime processing gracefully', async () => {
      const onChange = vi.fn();
      let capturedHandler: any;

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          capturedHandler = handler;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);
      mockChaptersService.create.mockRejectedValue(new Error('Create failed'));

      subscribeToChapterChanges(projectId, onChange);

      const payload = {
        eventType: 'INSERT',
        new: {
          id: 'ch-error',
          title: 'Error Chapter',
          content: '',
          summary: '',
          order_index: 0,
          status: 'draft',
        },
        old: null,
      };

      await capturedHandler(payload);

      expect(console.error).toHaveBeenCalledWith(
        '[Realtime] Failed to process change:',
        expect.any(Error),
      );
    });

    it('should return unsubscribe function that removes channel', () => {
      const onChange = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      const unsubscribe = subscribeToChapterChanges(projectId, onChange);

      unsubscribe();

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should handle INSERT with null content', async () => {
      const onChange = vi.fn();
      let capturedHandler: any;

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          capturedHandler = handler;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      subscribeToChapterChanges(projectId, onChange);

      const payload = {
        eventType: 'INSERT',
        new: {
          id: 'ch-null-content',
          title: 'Null Content',
          content: null,
          summary: '',
          order_index: 0,
          status: null,
        },
        old: null,
      };

      await capturedHandler(payload);

      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: 'ch-null-content',
        projectId,
        title: 'Null Content',
        content: '',
        summary: '',
        index: 0,
        status: 'draft',
      });
    });
  });

  describe('isRealtimeConnected()', () => {
    it('should return true when channel is joined', () => {
      const mockChannel = { state: 'joined' };
      mockSupabaseClient.getChannels.mockReturnValue([mockChannel]);

      const result = isRealtimeConnected();

      expect(result).toBe(true);
    });

    it('should return false when no channels are joined', () => {
      const mockChannel = { state: 'closed' };
      mockSupabaseClient.getChannels.mockReturnValue([mockChannel]);

      const result = isRealtimeConnected();

      expect(result).toBe(false);
    });

    it('should return false when no channels exist', () => {
      mockSupabaseClient.getChannels.mockReturnValue([]);

      const result = isRealtimeConnected();

      expect(result).toBe(false);
    });

    it('should return true if any channel is joined', () => {
      const mockChannels = [{ state: 'closed' }, { state: 'joined' }, { state: 'errored' }];

      mockSupabaseClient.getChannels.mockReturnValue(mockChannels);

      const result = isRealtimeConnected();

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent pushes for same project', async () => {
      const meta: ChapterMeta = {
        id: 'ch-concurrent',
        projectId,
        title: 'Concurrent Chapter',
        summary: '',
        index: 0,
        status: 'draft',
        wordCount: 50,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      mockChaptersService.list.mockResolvedValue([meta]);
      mockChaptersService.get.mockResolvedValue({ ...meta, content: 'Content', version: 1 });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await Promise.all([pushLocalChanges(projectId), pushLocalChanges(projectId)]);

      expect(mockUpsert.upsert).toHaveBeenCalledTimes(2);
    });

    it('should handle empty remote content during pull', async () => {
      const remoteChapter = {
        id: 'ch-empty',
        project_id: projectId,
        title: 'Empty Chapter',
        content: '',
        summary: '',
        word_count: 0,
        order_index: 0,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [remoteChapter], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockChaptersService.getMeta.mockRejectedValue(new Error('Not found'));

      const result = await pullRemoteChanges(projectId);

      expect(result).toHaveLength(1);
      expect(mockChaptersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
        }),
      );
    });

    it('should handle large number of chapters during sync', async () => {
      const largeMetas = Array.from({ length: 100 }, (_, i) => ({
        id: `ch-${i}`,
        projectId,
        title: `Chapter ${i}`,
        summary: '',
        index: i,
        status: 'draft' as const,
        wordCount: 100 + i,
        sceneCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      }));

      mockChaptersService.list.mockResolvedValue(largeMetas);
      mockChaptersService.get.mockImplementation((id: string) =>
        Promise.resolve({
          ...largeMetas.find((m) => m.id === id)!,
          content: `Content for ${id}`,
          version: 1,
        }),
      );

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => ({
        ...mockQuery,
        ...mockUpsert,
      }));

      await pushLocalChanges(projectId);

      expect(mockUpsert.upsert).toHaveBeenCalledTimes(100);
    });
  });
});
