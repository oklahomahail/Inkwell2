import { vi } from 'vitest';

export function _makeMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => void store.set(k, String(v))),
    removeItem: vi.fn((k: string) => void store.delete(k)),
    clear: vi.fn(() => void store.clear()),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
    store,
  } as unknown as Storage;
}

export const makeMockStorage = _makeMockStorage;
