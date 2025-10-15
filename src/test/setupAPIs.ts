// @ts-nocheck
import { vi, beforeAll, beforeEach, afterEach } from 'vitest';

let dispatchSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeAll(() => {
  // ensure it exists in JSDOM
  if (typeof globalThis.dispatchEvent !== 'function') {
    (globalThis as any).dispatchEvent = () => true;
  }
});

export function setupStorage() {
  // Setup localStorage if not available
  // Always mock storage with fresh object
  const store = new Map<string, string>();
  const storage = {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k)! : null)),
    setItem: vi.fn((k, v) => {
      store.set(k, String(v));
    }),
    removeItem: vi.fn((k) => {
      store.delete(k);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((i) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });

  // Setup StorageManager API
  (globalThis as any).navigator ||= {};
  (globalThis as any).navigator.storage ||= {
    estimate: vi.fn().mockResolvedValue({
      quota: 5_000_000, // 5MB default
      usage: 1_000,
      usageDetails: {
        localStorage: 1_000,
        indexedDB: 0,
        caches: 0,
        serviceWorkerRegistrations: 0,
      },
    }),
    persist: vi.fn().mockResolvedValue(true),
    persisted: vi.fn().mockResolvedValue(true),
  };

  // Setup dispatchEvent for custom events
  (globalThis as any).dispatchEvent ||= vi.fn();

  beforeEach(() => {
    // Reset quota estimate to default values
    if (globalThis.navigator?.storage?.estimate) {
      (globalThis.navigator.storage.estimate as any).mockImplementation(async () => ({
        quota: 5_000_000,
        usage: 1_000,
        usageDetails: {
          localStorage: 1_000,
          indexedDB: 0,
          caches: 0,
          serviceWorkerRegistrations: 0,
        },
      }));
    }

    // Reset storage mocks
    if (globalThis.localStorage) {
      vi.clearAllMocks();
      localStorage.clear();
    }

    // make it a spy so it has mock* methods
    dispatchSpy = vi.spyOn(globalThis as any, 'dispatchEvent');
  });

  afterEach(() => {
    // restore the real function; no direct mockReset on non-spies
    dispatchSpy?.mockRestore();
    dispatchSpy = null;
    vi.clearAllMocks();
    if (globalThis.localStorage) {
      localStorage.clear();
    }
  });

  return {
    mockQuotaExceeded() {
      (globalThis.navigator.storage.estimate as any).mockResolvedValue({
        quota: 1_000,
        usage: 990,
        usageDetails: {
          localStorage: 990,
          indexedDB: 0,
          caches: 0,
          serviceWorkerRegistrations: 0,
        },
      });
    },
    mockStorageError() {
      const error = new Error('Storage error');
      error.name = 'QuotaExceededError';
      (error as any).code = 22;
      if (globalThis.localStorage) {
        (localStorage.setItem as any).mockImplementation(() => {
          throw error;
        });
      }
    },
    mockStorageNotAvailable() {
      Object.defineProperty(globalThis, 'localStorage', { value: undefined });
      Object.defineProperty(globalThis, 'navigator', { value: undefined });
    },
  };
}
