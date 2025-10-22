import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { quotaAwareStorage } from '../../utils/quotaAwareStorage';
import connectivityService from '../connectivityService';

describe('ConnectivityService', () => {
  beforeEach(async () => {
    // Ensure navigator.onLine is writable/configurable for tests
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

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
    // Ensure background work is stopped between tests
    try {
      connectivityService.teardown();
    } catch (_e) {
      // ignore
    }
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

      // Ensure runtime navigator reflects online
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      window.dispatchEvent(new Event('online'));
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

      // Ensure runtime navigator reflects offline
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      window.dispatchEvent(new Event('offline'));
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
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Mock storage calls to succeed immediately
      const safeSetSpy = vi
        .spyOn(quotaAwareStorage, 'safeSetItem')
        .mockResolvedValue({ success: true });
      const safeRemoveSpy = vi
        .spyOn(quotaAwareStorage, 'safeRemoveItem')
        .mockResolvedValue({ success: true });

      await connectivityService.queueWrite('save', 'test-key', 'test-data');
      // Ensure we have at least one queued item
      expect(connectivityService.getQueuedOperations().length).toBeGreaterThanOrEqual(1);

      // Bring navigator online and dispatch event
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));

      // Wait until queue drains or timeout
      const start = Date.now();
      while (connectivityService.getQueuedOperations().length > 0 && Date.now() - start < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(connectivityService.getQueuedOperations()).toHaveLength(0);

      safeSetSpy.mockRestore();
      safeRemoveSpy.mockRestore();
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
      connectivityService.teardown();

      // Verify listeners are cleaned up
      expect(cleanupListenersSpy).toHaveBeenCalled();
      expect(service.listeners).toEqual([]);
      expect(service.processingQueue).toBe(false);
    });
  });

  describe('Navigator Stubbing', () => {
    it('should handle navigator.onLine stubbing', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const status = connectivityService.getStatus();
      expect(status.isOnline).toBe(false);
    });
  });
});
