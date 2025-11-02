/**
 * AutosaveService Tests
 *
 * Tests for queue-based autosave with debouncing, checksum tracking,
 * offline resilience, and state management.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutosaveService } from '../autosaveService';

import type { AutosaveState } from '../autosaveService';

describe('AutosaveService', () => {
  let mockSaveFn: ReturnType<typeof vi.fn>;
  let service: AutosaveService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveFn = vi.fn().mockResolvedValue({ checksum: 'abc123' });
    service = new AutosaveService(mockSaveFn, 1000);
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('debounce behavior', () => {
    it('should debounce multiple schedule calls', async () => {
      service.schedule('ch1', 'content v1');
      service.schedule('ch1', 'content v2');
      service.schedule('ch1', 'content v3');

      expect(mockSaveFn).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
      expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'content v3');
    });

    it('should reset debounce timer on each schedule', async () => {
      service.schedule('ch1', 'content v1');

      await vi.advanceTimersByTimeAsync(500);
      service.schedule('ch1', 'content v2');

      await vi.advanceTimersByTimeAsync(500);
      expect(mockSaveFn).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);
      expect(mockSaveFn).toHaveBeenCalledTimes(1);
      expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'content v2');
    });

    it('should use single debounce timer across all chapters', async () => {
      // Schedule ch1, then schedule ch2 before ch1's timer fires
      service.schedule('ch1', 'content 1');
      await vi.advanceTimersByTimeAsync(500);
      service.schedule('ch2', 'content 2');

      // ch1's timer was cancelled, only ch2 should save
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockSaveFn).toHaveBeenCalledTimes(1);
      expect(mockSaveFn).toHaveBeenCalledWith('ch2', 'content 2');
    });
  });

  describe('flush behavior', () => {
    it('should flush immediately without debounce', async () => {
      await service.flush('ch1', 'content');

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
      expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'content');
    });

    it('should not allow concurrent flushes', async () => {
      const slowSave = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ checksum: 'abc' }), 2000)),
      );
      const slowService = new AutosaveService(slowSave, 1000);

      const flush1 = slowService.flush('ch1', 'content1');
      const flush2 = slowService.flush('ch1', 'content2');

      await vi.advanceTimersByTimeAsync(2000);
      await flush1;
      await flush2;

      expect(slowSave).toHaveBeenCalledTimes(1);
      slowService.destroy();
    });

    it('should store checksum after successful save', async () => {
      mockSaveFn.mockResolvedValue({ checksum: 'checksum-abc' });

      await service.flush('ch1', 'content');

      expect(service.checksum('ch1')).toBe('checksum-abc');
    });

    it('should handle different checksums per chapter', async () => {
      mockSaveFn.mockResolvedValueOnce({ checksum: 'ch1-checksum' });
      mockSaveFn.mockResolvedValueOnce({ checksum: 'ch2-checksum' });

      await service.flush('ch1', 'content1');
      await service.flush('ch2', 'content2');

      expect(service.checksum('ch1')).toBe('ch1-checksum');
      expect(service.checksum('ch2')).toBe('ch2-checksum');
    });
  });

  describe('state transitions', () => {
    it('should transition idle → saving → saved on success', async () => {
      const states: AutosaveState[] = [];
      service.onState((s) => states.push(s));

      expect(service.getState()).toBe('idle');

      const flushPromise = service.flush('ch1', 'content');
      expect(states).toEqual(['saving']);

      await flushPromise;
      expect(states).toEqual(['saving', 'saved']);
      expect(service.getState()).toBe('saved');
    });

    it('should transition to error state on save failure when online', async () => {
      const states: AutosaveState[] = [];
      service.onState((s) => states.push(s));

      mockSaveFn.mockRejectedValue(new Error('Save failed'));

      await expect(service.flush('ch1', 'content')).rejects.toThrow('Save failed');

      expect(states).toEqual(['saving', 'error']);
      expect(service.getState()).toBe('error');
    });

    it('should transition to offline state when navigator.onLine is false', async () => {
      const states: AutosaveState[] = [];
      service.onState((s) => states.push(s));

      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const flushPromise = service.flush('ch1', 'content');
      expect(states).toEqual(['offline']);

      await flushPromise;
      expect(states).toEqual(['offline', 'saved']);

      // Restore
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });

    it('should handle offline state on failure when offline', async () => {
      const states: AutosaveState[] = [];
      service.onState((s) => states.push(s));

      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      mockSaveFn.mockRejectedValue(new Error('Network error'));

      await expect(service.flush('ch1', 'content')).rejects.toThrow('Network error');

      expect(states).toEqual(['offline', 'offline']);
      expect(service.getState()).toBe('offline');

      // Restore
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });

  describe('state subscriptions', () => {
    it('should notify all subscribers on state change', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.onState(listener1);
      service.onState(listener2);

      await service.flush('ch1', 'content');

      expect(listener1).toHaveBeenCalledWith('saving');
      expect(listener1).toHaveBeenCalledWith('saved');
      expect(listener2).toHaveBeenCalledWith('saving');
      expect(listener2).toHaveBeenCalledWith('saved');
    });

    it('should allow unsubscribing from state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = service.onState(listener);

      await service.flush('ch1', 'content');
      expect(listener).toHaveBeenCalledTimes(2); // saving, saved

      listener.mockClear();
      unsubscribe();

      await service.flush('ch2', 'content');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel pending scheduled save', async () => {
      service.schedule('ch1', 'content');
      service.cancel();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockSaveFn).not.toHaveBeenCalled();
    });

    it('should not affect already-flushed saves', async () => {
      await service.flush('ch1', 'content');
      service.cancel();

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should cancel pending saves', async () => {
      service.schedule('ch1', 'content');
      service.destroy();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockSaveFn).not.toHaveBeenCalled();
    });

    it('should clear all state listeners', async () => {
      const listener = vi.fn();
      service.onState(listener);

      service.destroy();

      await service.flush('ch1', 'content');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should clear checksum cache', async () => {
      await service.flush('ch1', 'content');
      expect(service.checksum('ch1')).toBe('abc123');

      service.destroy();

      expect(service.checksum('ch1')).toBeUndefined();
    });
  });

  describe('checksum tracking', () => {
    it('should return undefined for unknown chapter', () => {
      expect(service.checksum('unknown')).toBeUndefined();
    });

    it('should update checksum on each save', async () => {
      mockSaveFn.mockResolvedValueOnce({ checksum: 'v1' });
      await service.flush('ch1', 'content v1');
      expect(service.checksum('ch1')).toBe('v1');

      mockSaveFn.mockResolvedValueOnce({ checksum: 'v2' });
      await service.flush('ch1', 'content v2');
      expect(service.checksum('ch1')).toBe('v2');
    });
  });

  describe('custom debounce time', () => {
    it('should respect custom debounce duration', async () => {
      const fastService = new AutosaveService(mockSaveFn, 500);

      fastService.schedule('ch1', 'content');
      await vi.advanceTimersByTimeAsync(500);

      expect(mockSaveFn).toHaveBeenCalledTimes(1);

      fastService.destroy();
    });
  });
});
