import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isLikelyPrivateMode } from '../privateMode';

describe('privateMode detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isLikelyPrivateMode', () => {
    it('should detect private mode via low quota', async () => {
      const mockStorage = {
        estimate: vi.fn().mockResolvedValue({
          quota: 50 * 1024 * 1024, // 50 MB - less than 80 MB threshold
        }),
        persist: vi.fn(),
        persisted: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(true);
    });

    it('should not detect private mode with sufficient quota', async () => {
      const mockStorage = {
        estimate: vi.fn().mockResolvedValue({
          quota: 100 * 1024 * 1024, // 100 MB - above threshold
        }),
        persist: vi.fn(),
        persisted: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      // Mock IndexedDB success
      const mockOpen = vi.fn().mockImplementation(() => {
        const mockRequest = {
          onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
          onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
          result: {
            close: vi.fn(),
          },
        } as unknown as IDBOpenDBRequest;

        // Trigger success callback asynchronously
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess.call(mockRequest, new Event('success'));
          }
        }, 0);

        return mockRequest;
      });

      const mockDeleteDatabase = vi.fn();

      Object.defineProperty(global, 'indexedDB', {
        value: {
          open: mockOpen,
          deleteDatabase: mockDeleteDatabase,
        },
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(false);
    });

    it('should detect private mode via IndexedDB failure', async () => {
      const mockStorage = {
        estimate: vi.fn().mockResolvedValue({
          quota: 100 * 1024 * 1024, // Good quota
        }),
        persist: vi.fn(),
        persisted: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      // Mock IndexedDB failure
      const mockOpen = vi.fn().mockImplementation(() => {
        const mockRequest = {
          onsuccess: null,
          onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
          error: new Error('IndexedDB not available'),
        } as unknown as IDBOpenDBRequest;

        // Trigger error callback asynchronously
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror.call(mockRequest, new Event('error'));
          }
        }, 0);

        return mockRequest;
      });

      Object.defineProperty(global, 'indexedDB', {
        value: {
          open: mockOpen,
          deleteDatabase: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(true);
    });

    it('should detect private mode via localStorage failure', async () => {
      const mockStorage = {
        estimate: vi.fn().mockResolvedValue({
          quota: 100 * 1024 * 1024,
        }),
        persist: vi.fn(),
        persisted: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      // Mock IndexedDB success
      const mockOpen = vi.fn().mockImplementation(() => {
        const mockRequest = {
          onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
          onerror: null,
          result: {
            close: vi.fn(),
          },
        } as unknown as IDBOpenDBRequest;

        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess.call(mockRequest, new Event('success'));
          }
        }, 0);

        return mockRequest;
      });

      Object.defineProperty(global, 'indexedDB', {
        value: {
          open: mockOpen,
          deleteDatabase: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      // Mock localStorage failure
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: vi.fn().mockImplementation(() => {
            throw new Error('localStorage not available');
          }),
          getItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(true);
    });

    it('should handle missing Storage API', async () => {
      Object.defineProperty(global.navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock IndexedDB success
      const mockOpen = vi.fn().mockImplementation(() => {
        const mockRequest = {
          onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
          onerror: null,
          result: {
            close: vi.fn(),
          },
        } as unknown as IDBOpenDBRequest;

        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess.call(mockRequest, new Event('success'));
          }
        }, 0);

        return mockRequest;
      });

      Object.defineProperty(global, 'indexedDB', {
        value: {
          open: mockOpen,
          deleteDatabase: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(false);
    });

    it('should handle storage estimate errors', async () => {
      const mockStorage = {
        estimate: vi.fn().mockRejectedValue(new Error('Estimate failed')),
        persist: vi.fn(),
        persisted: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });

      const result = await isLikelyPrivateMode();
      expect(result).toBe(true);
    });
  });
});
