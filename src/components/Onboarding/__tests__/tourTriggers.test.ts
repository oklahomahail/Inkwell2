import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  dispatchTourTrigger,
  triggerOnProjectCreated,
  triggerWritingPanelOpen,
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

      dispatchTourTrigger('onProjectCreated');

      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('onProjectCreated', spy);
    });

    test('includes payload in event detail', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      dispatchTourTrigger('onProjectCreated', { projectId: '123' });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: '123' });

      window.removeEventListener('onProjectCreated', spy);
    });

    test('debounces duplicate triggers within 300ms', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      // Fire twice rapidly
      dispatchTourTrigger('onProjectCreated');
      dispatchTourTrigger('onProjectCreated');

      // Should only fire once due to debouncing
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('onProjectCreated', spy);
    });

    test('allows triggers after debounce window', async () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      // First trigger
      dispatchTourTrigger('onProjectCreated');
      expect(spy).toHaveBeenCalledTimes(1);

      // Wait for debounce window to pass
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Second trigger should now work
      dispatchTourTrigger('onProjectCreated');
      expect(spy).toHaveBeenCalledTimes(2);

      window.removeEventListener('onProjectCreated', spy);
    });
  });

  describe('Convenience trigger functions', () => {
    test('triggerOnProjectCreated dispatches with projectId', () => {
      const spy = vi.fn();
      window.addEventListener('onProjectCreated', spy);

      triggerOnProjectCreated('project-123');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ projectId: 'project-123' });

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
