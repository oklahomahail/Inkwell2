// @ts-nocheck
import { vi } from 'vitest';

// Storage API - Consistent quota management shape
(globalThis as any).navigator ??= {};
(globalThis as any).navigator.storage ??= {
  estimate: vi.fn().mockResolvedValue({
    quota: 5_000_000, // 5MB
    usage: 1_000, // 1KB
    usageDetails: {
      indexedDB: 0,
      caches: 0,
      serviceWorkerRegistrations: 0,
    },
  }),
};

// localStorage shim - Consistent in-memory implementation
(globalThis as any).localStorage ??= (() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => {
      store.set(k, String(v));
    }),
    removeItem: vi.fn((k: string) => {
      store.delete(k);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
  };
})();

// Console methods - Quiet by default
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();
