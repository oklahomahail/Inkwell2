/**
 * In-memory storage fallback when localStorage is not available
 */
let _memoryStore: Record<string, string> | null = null;

/**
 * Safe accessor for localStorage that falls back to in-memory storage when needed
 * @returns A Storage-compatible interface
 */
export function getLocalStorage(): Storage {
  // 1) Prefer a globally-stubbed localStorage (what tests patch)
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage as Storage;
    }
  } catch {
    // ignore and try window/local fallback
  }

  // 2) Fallback to window.localStorage if available
  try {
    if (typeof window !== 'undefined' && (window as any).localStorage) {
      return (window as any).localStorage as Storage;
    }
  } catch {
    // Fall through to memory store
  }

  // 3) Final fallback: in-memory Storage shim (stable across calls)
  if (!_memoryStore) {
    _memoryStore = {};
  }
  const mem = _memoryStore;

  const api: Storage = {
    get length() {
      return Object.keys(mem).length;
    },
    clear() {
      Object.keys(mem).forEach((k) => delete mem[k]);
    },
    getItem(k: string): string | null {
      return Object.prototype.hasOwnProperty.call(mem, k) ? (mem[k] ?? null) : null;
    },
    key(i: number) {
      return Object.keys(mem)[i] ?? null;
    },
    removeItem(k: string) {
      delete mem[k];
    },
    setItem(k: string, v: string) {
      mem[k] = String(v);
    },
  };

  return api;
}

// Keeping old functions for backward compatibility
export const ls = getLocalStorage;
export const getStorage = getLocalStorage;
