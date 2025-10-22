import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { quotaAwareStorage } from '../../utils/quotaAwareStorage';
import connectivityService from '../connectivityService';

describe('ConnectivityService', () => {
  beforeEach(async () => {
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: { effectiveType: '4g' },
    });

    vi.useFakeTimers();

    // Reset storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset connectivity service internals between tests via public reset
    try {
      await (connectivityService as any).reset();
    } catch (_e) {
      // ignore if not available
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    connectivityService.stopMonitoring();
  });

  describe('Status Management', () => {
    it('should handle undefined callbacks gracefully', () => {
      // @ts-ignore - Testing invalid input
      expect(() => connectivityService.onStatusChange(undefined)).not.toThrow();
    });

    it('should handle invalid callbacks gracefully', () => {
      // @ts-ignore - Testing invalid input
      expect(() => connectivityService.onStatusChange('not a function')).not.toThrow();
    });

    it('should provide current status immediately', () => {
      const mockCallback = vi.fn();
      connectivityService.onStatusChange(mockCallback);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
          queuedWrites: 0,
        }),
      );
    });

    it('should handle callback errors gracefully', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      expect(() => connectivityService.onStatusChange(mockCallback)).not.toThrow();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should remove erroring callbacks from listeners', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      connectivityService.onStatusChange(mockCallback);

      // Trigger online event to see if callback is still called
      window.dispatchEvent(new Event('online'));
      expect(mockCallback).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('Online/Offline Events', () => {
    it('should handle online events', () => {
      const mockCallback = vi.fn();
      connectivityService.onStatusChange(mockCallback);
      mockCallback.mockClear(); // Clear initial call

      // Directly invoke handleOnline
      (connectivityService as any).handleOnline();

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
        }),
      );
    });

    it('should handle offline events', () => {
      const mockCallback = vi.fn();
      connectivityService.onStatusChange(mockCallback);
      mockCallback.mockClear(); // Clear initial call

      // Directly invoke handleOffline
      (connectivityService as any).handleOffline();

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: false,
        }),
      );
    });
  });

  describe('Queue Management', () => {
    it('should queue writes when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      await connectivityService.queueWrite('save', 'test-key', 'test-data');
      expect(connectivityService.getQueuedOperations()).toHaveLength(1);
    });

    it('should process queue when coming online', async () => {
      // Start with a clean instance
      await (connectivityService as any).reset();

      // Ensure we're testing queue processing
      vi.spyOn(quotaAwareStorage, 'safeSetItem').mockResolvedValue({ success: true });

      // Queue an operation
      await connectivityService.queueWrite('save', 'test-key', 'test-data');

      // Check that the queue has an item
      expect(connectivityService.getQueuedOperations().length).toBe(1);

      // Process the queue directly
      await (connectivityService as any).processQueue();

      // Verify the queue is now empty after processing
      expect(connectivityService.getQueuedOperations().length).toBe(0);
    });

    it('should handle multiple queued operations', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      await connectivityService.queueWrite('save', 'key1', 'data1');
      await connectivityService.queueWrite('update', 'key2', 'data2');
      await connectivityService.queueWrite('delete', 'key3');

      const queued = connectivityService.getQueuedOperations();
      expect(queued.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Handling', () => {
    it('should persist queue on storage errors', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const mockStorageError = new Error('Storage full');
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw mockStorageError;
      });

      await connectivityService.queueWrite('save', 'test-key', 'test-data');
      const queued = connectivityService.getQueuedOperations();
      expect(queued.length).toBeGreaterThanOrEqual(1);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('Teardown Logic', () => {
    it('should clean up listeners and stop background tasks', () => {
      const service: any = connectivityService as any;

      // Spy on cleanup methods
      const cleanupListenersSpy = vi.spyOn(service, 'cleanupListeners');

      // Call teardown
      connectivityService.stopMonitoring();

      // Verify listeners are cleaned up
      expect(cleanupListenersSpy).toHaveBeenCalled();
      expect(service.listeners).toEqual([]);
      expect(service.processingQueue).toBe(false);
    });
  });

  describe('Navigator Stubbing', () => {
    it('should handle navigator.onLine stubbing', () => {
      // Stub navigator.onLine to be false
      vi.stubGlobal('navigator', {
        onLine: false,
        connection: { effectiveType: '4g' },
      });

      // Force update the connectivity state to read from navigator.onLine
      (connectivityService as any).updateConnectionStatus();

      // Now check status
      const status = connectivityService.getStatus();
      expect(status.isOnline).toBe(false);
    });
  });

  it('should clear all timers and listeners on stopMonitoring', () => {
    const clearRetryTimerSpy = vi.spyOn(connectivityService as any, 'clearRetryTimer');
    const removeListenersSpy = vi.spyOn(connectivityService as any, 'removeListeners');

    connectivityService.stopMonitoring();

    expect(clearRetryTimerSpy).toHaveBeenCalled();
    expect(removeListenersSpy).toHaveBeenCalled();
  });
});
