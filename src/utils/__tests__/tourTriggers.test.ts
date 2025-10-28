import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  dispatchTourTrigger,
  triggerDashboardView,
  triggerOnProjectCreated,
  triggerWritingPanelOpen,
  triggerStoryPlanningOpen,
  triggerBeatSheetCompleted,
  triggerCharactersAdded,
  triggerWorldBuildingVisited,
  triggerAiIntegrationConfigured,
  triggerTimelineVisited,
  triggerAnalyticsVisited,
  resetTriggerDebounce,
} from '../tourTriggers';

describe('tourTriggers', () => {
  beforeEach(() => {
    resetTriggerDebounce();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetTriggerDebounce();
  });

  describe('dispatchTourTrigger', () => {
    test('dispatches custom event with correct name', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      const result = dispatchTourTrigger('onProjectCreated', { projectId: undefined });

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('onProjectCreated', spy);
    });

    test('includes payload in event detail', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      const result = dispatchTourTrigger('onProjectCreated', { projectId: '123' });

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: '123' });

      window.removeEventListener('onProjectCreated', spy);
    });

    test('debounces duplicate triggers within 300ms', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      // Fire twice rapidly
      const result1 = dispatchTourTrigger('onProjectCreated', { projectId: undefined });
      const result2 = dispatchTourTrigger('onProjectCreated', { projectId: undefined });

      // First should succeed, second should be debounced
      expect(result1).toBe(true);
      expect(result2).toBe(false);

      // Should only fire once due to debouncing
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('onProjectCreated', spy);
    });

    test('allows triggers after debounce window', async () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      // First trigger
      const result1 = dispatchTourTrigger('onProjectCreated', { projectId: undefined });
      expect(result1).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);

      // Wait for debounce window to pass
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Second trigger should now work
      const result2 = dispatchTourTrigger('onProjectCreated', { projectId: undefined });
      expect(result2).toBe(true);
      expect(spy).toHaveBeenCalledTimes(2);

      window.removeEventListener('onProjectCreated', spy);
    });

    test('dispatches with empty payload object when no payload provided', () => {
      const spy = vi.fn();
      window.addEventListener('dashboardView', spy);

      const result = dispatchTourTrigger('dashboardView', {});

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('dashboardView', spy);
    });

    test('handles different event types independently', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      window.addEventListener('onProjectCreated', spy1);
      window.addEventListener('writingPanelOpen', spy2);

      // Trigger both events rapidly
      dispatchTourTrigger('onProjectCreated');
      dispatchTourTrigger('writingPanelOpen');
      dispatchTourTrigger('onProjectCreated'); // Should be debounced
      dispatchTourTrigger('writingPanelOpen'); // Should be debounced

      // Each should fire once
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);

      window.removeEventListener('onProjectCreated', spy1);
      window.removeEventListener('writingPanelOpen', spy2);
    });

    test('handles errors when dispatchEvent fails', () => {
      const originalDispatchEvent = window.dispatchEvent;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock dispatchEvent to throw an error
      window.dispatchEvent = vi.fn().mockImplementation(() => {
        throw new Error('Failed to dispatch');
      });

      // Should not throw, but should return false
      const result = dispatchTourTrigger('onProjectCreated', { projectId: undefined });
      expect(result).toBe(false);

      // Restore original
      window.dispatchEvent = originalDispatchEvent;
      consoleErrorSpy.mockRestore();
    });

    test('returns false in SSR context (window undefined)', () => {
      const originalWindow = global.window;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate SSR by removing window
      // @ts-expect-error - intentionally setting to undefined for test
      delete global.window;

      const result = dispatchTourTrigger('onProjectCreated', { projectId: undefined });
      expect(result).toBe(false);

      // Restore window
      global.window = originalWindow;
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Convenience trigger functions', () => {
    test('triggerDashboardView dispatches event', () => {
      const spy = vi.fn();
      window.addEventListener('dashboardView', spy);

      const result = triggerDashboardView();

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('dashboardView', spy);
    });

    test('triggerOnProjectCreated dispatches with projectId', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      const result = triggerOnProjectCreated('project-123');

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: 'project-123' });

      window.removeEventListener('onProjectCreated', spy);
    });

    test('triggerOnProjectCreated dispatches without projectId', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      const result = triggerOnProjectCreated();

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: undefined });

      window.removeEventListener('onProjectCreated', spy);
    });

    test('triggerWritingPanelOpen dispatches with projectId', () => {
      const spy = vi.fn();
      window.addEventListener('writingPanelOpen', spy);

      triggerWritingPanelOpen('project-456');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: 'project-456' });

      window.removeEventListener('writingPanelOpen', spy);
    });

    test('triggerWritingPanelOpen dispatches without projectId', () => {
      const spy = vi.fn();
      window.addEventListener('writingPanelOpen', spy);

      triggerWritingPanelOpen();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: undefined });

      window.removeEventListener('writingPanelOpen', spy);
    });

    test('triggerStoryPlanningOpen dispatches with projectId', () => {
      const spy = vi.fn();
      window.addEventListener('storyPlanningOpen', spy);

      triggerStoryPlanningOpen('project-789');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: 'project-789' });

      window.removeEventListener('storyPlanningOpen', spy);
    });

    test('triggerStoryPlanningOpen dispatches without projectId', () => {
      const spy = vi.fn();
      window.addEventListener('storyPlanningOpen', spy);

      triggerStoryPlanningOpen();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: undefined });

      window.removeEventListener('storyPlanningOpen', spy);
    });

    test('triggerBeatSheetCompleted dispatches with beatCount', () => {
      const spy = vi.fn();
      window.addEventListener('beatSheetCompleted', spy);

      triggerBeatSheetCompleted(5);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ beatCount: 5 });

      window.removeEventListener('beatSheetCompleted', spy);
    });

    test('triggerBeatSheetCompleted dispatches without beatCount', () => {
      const spy = vi.fn();
      window.addEventListener('beatSheetCompleted', spy);

      triggerBeatSheetCompleted();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ beatCount: undefined });

      window.removeEventListener('beatSheetCompleted', spy);
    });

    test('triggerCharactersAdded dispatches with characterCount', () => {
      const spy = vi.fn();
      window.addEventListener('charactersAdded', spy);

      triggerCharactersAdded(3);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ characterCount: 3 });

      window.removeEventListener('charactersAdded', spy);
    });

    test('triggerCharactersAdded dispatches without characterCount', () => {
      const spy = vi.fn();
      window.addEventListener('charactersAdded', spy);

      triggerCharactersAdded();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ characterCount: undefined });

      window.removeEventListener('charactersAdded', spy);
    });

    test('triggerWorldBuildingVisited dispatches event', () => {
      const spy = vi.fn();
      window.addEventListener('worldBuildingVisited', spy);

      triggerWorldBuildingVisited();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('worldBuildingVisited', spy);
    });

    test('triggerAiIntegrationConfigured dispatches event', () => {
      const spy = vi.fn();
      window.addEventListener('aiIntegrationConfigured', spy);

      triggerAiIntegrationConfigured();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('aiIntegrationConfigured', spy);
    });

    test('triggerTimelineVisited dispatches event', () => {
      const spy = vi.fn();
      window.addEventListener('timelineVisited', spy);

      triggerTimelineVisited();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('timelineVisited', spy);
    });

    test('triggerAnalyticsVisited dispatches event', () => {
      const spy = vi.fn();
      window.addEventListener('analyticsVisited', spy);

      triggerAnalyticsVisited();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({});

      window.removeEventListener('analyticsVisited', spy);
    });
  });

  describe('resetTriggerDebounce', () => {
    test('clears debounce map allowing immediate re-trigger', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      // First trigger
      dispatchTourTrigger('onProjectCreated');
      expect(spy).toHaveBeenCalledTimes(1);

      // Reset debounce
      resetTriggerDebounce();

      // Should allow immediate re-trigger
      dispatchTourTrigger('onProjectCreated');
      expect(spy).toHaveBeenCalledTimes(2);

      window.removeEventListener('onProjectCreated', spy);
    });
  });
});
