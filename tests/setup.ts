// tests/setup.ts
import { vi } from 'vitest';

// ---- Partial mock for ../data/dbFactory
vi.mock('../data/dbFactory', async (importOriginal) => {
  const actual = await importOriginal<any>();

  // A tiny in-memory Dexie-ish stub
  function createMemoryDb() {
    const stores = new Map<string, Map<any, any>>();
    function table(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        async get(key: any) {
          return store.get(key) ?? null;
        },
        async put(val: any) {
          store.set(val.slug ?? val.id ?? crypto.randomUUID(), val);
        },
        async delete(key: any) {
          store.delete(key);
        },
        async clear() {
          store.clear();
        },
        async toArray() {
          return Array.from(store.values());
        },
        async bulkPut(arr: any[]) {
          arr.forEach((v) => store.set(v.slug ?? v.id ?? crypto.randomUUID(), v));
        },
      };
    }
    return { table, __stores: stores };
  }

  const useMaybeDB = vi.fn(() => createMemoryDb());

  return {
    ...actual,
    useMaybeDB, // <— make it exist for tests
    __TESTING__: { createMemoryDb }, // optional helper if a spec needs a fresh db
  };
});

// ---- Mock useProfile cleanly (we'll control returns in each test)
vi.mock('../context/ProfileContext', () => ({
  useProfile: vi.fn(() => ({ active: { id: 'test-profile', name: 'Test' } })),
}));

// ---- Stable LocalStorage spies for tests that assert removeItem calls
const lsProto = Object.getPrototypeOf(window.localStorage);
vi.spyOn(lsProto, 'getItem');
vi.spyOn(lsProto, 'setItem');
vi.spyOn(lsProto, 'removeItem');
