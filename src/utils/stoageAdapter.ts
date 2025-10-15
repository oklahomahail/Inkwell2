// src/utils/storageAdapter.ts
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let current: KeyValueStorage = {
  getItem: (k) => (typeof window === 'undefined' ? null : window.localStorage.getItem(k)),
  setItem: (k, v) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(k);
  },
};

// Allows tests to inject a spy/mock that still counts as “localStorage-ish”
export function setStorageAdapter(adapter: KeyValueStorage) {
  current = adapter;
}
export function getStorageAdapter() {
  return current;
}
