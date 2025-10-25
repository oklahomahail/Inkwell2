// Polyfill IndexedDB for Vitest/Node
import 'fake-indexeddb/auto';

// Optional: minimal navigator.storage + isSecureContext shims
// so code that checks persistence/quota does not throw.
if (typeof globalThis.navigator === 'object') {
  // @ts-expect-error - add missing shape for tests
  globalThis.navigator.storage ??= {
    estimate: async () => ({ quota: 1024 * 1024 * 1024, usage: 0 }),
    persist: async () => false,
    persisted: async () => false,
  };
}
// Many storage APIs check this
if (!('isSecureContext' in globalThis)) {
  // @ts-expect-error - define for tests
  globalThis.isSecureContext = true;
}
