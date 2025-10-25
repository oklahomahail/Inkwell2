# IndexedDB Polyfill Setup for Tests

## Summary

Successfully added IndexedDB polyfill support to resolve test errors where `indexedDB is not defined` in Node.js/Vitest environment.

## Changes Made

### 1. Installed fake-indexeddb

```bash
pnpm add -D fake-indexeddb
```

This package provides a complete IndexedDB implementation that works in Node.js environments.

### 2. Created Test Setup File

**File:** `test/setupIndexedDB.ts`

```typescript
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
```

### 3. Updated Vitest Configuration

**File:** `vitest.config.ts`

Added the setup file to the test configuration:

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./test/setupIndexedDB.ts', './src/setupTests.ts'],
  // ...rest of config
}
```

### 4. Hardened Runtime Guardrails

Updated storage utilities to safely check for IndexedDB availability before using it:

#### src/utils/storage/storageHealth.ts

```typescript
/**
 * Check if IndexedDB is available in the current environment
 */
function hasIDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

/**
 * Check whether an IndexedDB database exists.
 * Must not throw in non-browser or test environments.
 */
async function checkDatabaseExists(dbName: string): Promise<boolean> {
  if (!hasIDB()) return false;

  const idb: IDBFactory = (globalThis as any).indexedDB;
  // ...rest of implementation with safe fallbacks
}

export async function getStorageHealth(): Promise<StorageHealth> {
  // Early return when IndexedDB is not available
  if (!hasIDB()) {
    return {
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      dbExists: false,
      // ...other default values
      warnings: ['IndexedDB not available in this environment'],
    };
  }
  // ...rest of implementation
}
```

#### src/utils/storage/privateMode.ts

```typescript
function hasIDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

export async function isLikelyPrivateMode(): Promise<boolean> {
  if (!hasIDB()) {
    return false;
  }
  // ...rest of implementation using (globalThis as any).indexedDB
}
```

#### src/utils/storage.ts

```typescript
function hasIDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

class IndexedDBAdapter implements StorageAdapter {
  async init(): Promise<void> {
    if (this.db) return;

    if (!hasIDB()) {
      throw new Error('IndexedDB is not available in this environment');
    }

    const idb = (globalThis as any).indexedDB;
    // ...rest of implementation
  }
}

class StorageManager {
  constructor() {
    // Use hasIDB() for consistent checking
    if (hasIDB()) {
      this.adapter = new IndexedDBAdapter();
    } else {
      this.adapter = new LocalStorageAdapter();
    }
  }
}
```

## Benefits

### 1. No More ReferenceErrors

- Tests no longer crash with "indexedDB is not defined"
- Code can safely check for IndexedDB availability in any environment

### 2. Realistic Testing

- Tests now run against actual IndexedDB implementation (polyfilled)
- Better coverage of IndexedDB-specific code paths
- More confidence that code works in real browsers

### 3. SSR/Node Safety

- Code is safe to import/execute in server-side rendering environments
- Early returns with sensible defaults when IndexedDB is unavailable
- No need for environment-specific conditional imports

### 4. Graceful Degradation

- Code detects IndexedDB availability and falls back to localStorage
- UI can display appropriate warnings when storage is limited
- Works correctly in browsers that don't support IndexedDB

## Test Status

✅ IndexedDB polyfill is working - no more "not defined" errors
⚠️ Some tests need updates to work with IndexedDB instead of mocked localStorage

### Tests Still Requiring Updates

The following test file needs updates to work with the real IndexedDB polyfill:

- `src/utils/__tests__/storage.test.ts` - Currently expects localStorage behavior, needs to be updated to work with IndexedDB or properly mock it

## Next Steps

1. **Update storage.test.ts** - Rewrite tests to work with IndexedDB polyfill or properly mock the IndexedDB adapter
2. **Test Coverage** - Add more tests for IndexedDB-specific scenarios
3. **Integration Tests** - Verify storage works end-to-end with the polyfill

## Verification

Run tests to verify no IndexedDB errors:

```bash
pnpm test -- --run 2>&1 | grep -i "indexeddb.*not defined"
```

Should return no results (empty).

## Optional: Quiet Logs in Tests

If storage components log warnings during tests, you can gate them:

```typescript
const isTest = process.env.VITEST_WORKER_ID != null;
if (!isTest) {
  console.warn('[Storage] IndexedDB not available...');
}
```

## References

- [fake-indexeddb on npm](https://www.npmjs.com/package/fake-indexeddb)
- [IndexedDB API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Vitest Configuration](https://vitest.dev/config/)
