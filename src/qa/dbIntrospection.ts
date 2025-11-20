/**
 * IndexedDB Schema Introspection
 *
 * Provides utilities to inspect the actual state of IndexedDB databases
 * and compare them against the expected schema. Useful for debugging
 * and verifying schema integrity.
 */

import { DATABASE_SCHEMAS, type DatabaseDefinition } from '@/services/dbSchema';

// ============================================================================
// Types
// ============================================================================

export interface StoreIntrospection {
  name: string;
  expected: boolean; // expected by schema registry
  exists: boolean; // actually present in the DB
  count: number | null; // null if we could not count
  error?: string;
}

export interface DatabaseIntrospection {
  name: string;
  version: number | null; // actual version, null if open failed
  expectedVersion: number;
  ok: boolean;
  stores: StoreIntrospection[];
  unexpectedStores: string[]; // stores that exist but aren't in schema
  error?: string;
}

export interface FullIntrospectionReport {
  databases: DatabaseIntrospection[];
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Open a database without forcing an upgrade
 * Uses the version from the descriptor but will gracefully handle mismatches
 */
function openDatabaseForIntrospection(descriptor: DatabaseDefinition): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(descriptor.name, descriptor.version);

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to open DB ${descriptor.name}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    // NOTE: if onupgradeneeded fires here, your centralized schema logic will run
    // That can actually be OK for "self-healing introspection," but be aware
  });
}

/**
 * Count records in a specific store
 */
function countStoreRecords(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error ?? new Error('count failed'));
      request.onsuccess = () => resolve(request.result);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Introspect a single database: version, store existence, record counts
 */
async function introspectDatabase(descriptor: DatabaseDefinition): Promise<DatabaseIntrospection> {
  let db: IDBDatabase | null = null;

  try {
    db = await openDatabaseForIntrospection(descriptor);
    const actualVersion = db.version;
    const storeNames = Array.from(db.objectStoreNames);
    const expectedStoreNames = descriptor.stores.map((s) => s.name);

    const stores: StoreIntrospection[] = await Promise.all(
      descriptor.stores.map(async (expectedStore) => {
        const exists = storeNames.includes(expectedStore.name);

        if (!exists) {
          return {
            name: expectedStore.name,
            expected: true,
            exists: false,
            count: null,
            error: 'Store missing',
          };
        }

        try {
          const count = await countStoreRecords(db!, expectedStore.name);
          return {
            name: expectedStore.name,
            expected: true,
            exists: true,
            count,
          };
        } catch (error) {
          return {
            name: expectedStore.name,
            expected: true,
            exists: true,
            count: null,
            error: (error as Error).message,
          };
        }
      }),
    );

    // Find stores that exist but aren't in the schema
    const unexpectedStores = storeNames.filter((name) => !expectedStoreNames.includes(name));

    const ok =
      actualVersion === descriptor.version &&
      stores.every((s) => s.exists && s.error == null) &&
      unexpectedStores.length === 0;

    return {
      name: descriptor.name,
      version: actualVersion,
      expectedVersion: descriptor.version,
      ok,
      stores,
      unexpectedStores,
    };
  } catch (error) {
    return {
      name: descriptor.name,
      version: null,
      expectedVersion: descriptor.version,
      ok: false,
      stores: [],
      unexpectedStores: [],
      error: (error as Error).message,
    };
  } finally {
    if (db) db.close();
  }
}

/**
 * Introspect all registered databases
 * Returns a comprehensive report of schema health
 */
export async function inspectAllDatabases(): Promise<FullIntrospectionReport> {
  const databases = await Promise.all(
    DATABASE_SCHEMAS.map((descriptor) => introspectDatabase(descriptor)),
  );

  return { databases };
}

/**
 * Convenience helper to log a human-readable report to the console
 */
export async function logDatabaseIntrospection(): Promise<void> {
  const report = await inspectAllDatabases();

  // eslint-disable-next-line no-console
  console.group('[Inkwell][IndexedDB] Introspection report');
  for (const db of report.databases) {
    // eslint-disable-next-line no-console
    console.group(
      `${db.name} (expected v${db.expectedVersion}, actual ${db.version ?? 'N/A'}) ${db.ok ? 'OK' : 'ISSUES'}`,
    );
    if (db.error) {
      console.warn('DB error:', db.error);
    }
    for (const store of db.stores) {
      const status = store.exists ? 'exists' : 'MISSING';
      // eslint-disable-next-line no-console
      console.log(
        `Store: ${store.name} – ${status}, count: ${store.count ?? 'N/A'}${store.error ? `, error: ${store.error}` : ''}`,
      );
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
}
