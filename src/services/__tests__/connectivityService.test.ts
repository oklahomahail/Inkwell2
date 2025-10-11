import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import connectivityService from '../connectivityService';

describe('ConnectivityService', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // Reset storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset connectivity service internals between tests
    const service: any = connectivityService as any;
    if (service) {
      service.queue = [];
      service.listeners = [];
      service.processingQueue = false;
      service.isOnline = window.navigator.onLine;
      service.lastOnline = null;
      service.lastOffline = null;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      Object.defineProperty(window.navigator, 'onLine', { value: false });

      await connectivityService.queueWrite('save', 'test-key', 'test-data');
      expect(connectivityService.getQueuedOperations()).toHaveLength(1);
    });

    it('should process queue when coming online', async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });

      await connectivityService.queueWrite('save', 'test-key', 'test-data');
      // At this point the service auto-processes if online; since we've forced offline earlier in other tests,
      // ensure we start from a clean state
      expect(connectivityService.getQueuedOperations().length).toBeGreaterThanOrEqual(1);

      Object.defineProperty(window.navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Wait for queue processing
      await new Promise((resolve) => setTimeout(resolve, 1600));
      expect(connectivityService.getQueuedOperations()).toHaveLength(0);
    });

    it('should handle multiple queued operations', async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });

      await connectivityService.queueWrite('save', 'key1', 'data1');
      await connectivityService.queueWrite('update', 'key2', 'data2');
      await connectivityService.queueWrite('delete', 'key3');

      const queued = connectivityService.getQueuedOperations();
      expect(queued.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Handling', () => {
    it('should persist queue on storage errors', async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });

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
});
