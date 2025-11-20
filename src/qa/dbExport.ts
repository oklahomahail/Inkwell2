/**
 * IndexedDB Data Export
 *
 * Utilities to export all IndexedDB data as a JSON snapshot.
 * Useful for debugging, bug reports, and data recovery.
 */

import { DATABASE_SCHEMAS, type DatabaseDefinition } from '@/services/dbSchema';

// ============================================================================
// Types
// ============================================================================

interface StoreDump {
  [storeName: string]: unknown[];
}

interface DatabaseDump {
  name: string;
  version: number | null;
  stores: StoreDump;
  error?: string;
}

export interface FullDatabaseDump {
  exportedAt: string;
  userAgent: string;
  databases: DatabaseDump[];
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Get all records from a specific store
 */
function getAllFromStore(db: IDBDatabase, storeName: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error ?? new Error('getAll failed'));
      request.onsuccess = () => resolve(request.result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Dump a single database with all its stores and records
 */
async function dumpSingleDatabase(descriptor: DatabaseDefinition): Promise<DatabaseDump> {
  let db: IDBDatabase | null = null;

  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(descriptor.name, descriptor.version);

      request.onerror = () => {
        reject(request.error ?? new Error(`Failed to open DB ${descriptor.name}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });

    const storeNames = Array.from(db.objectStoreNames);
    const stores: StoreDump = {};

    for (const storeName of storeNames) {
      try {
        const records = await getAllFromStore(db, storeName);
        stores[storeName] = records;
      } catch (error) {
        // If one store fails, record the error and keep going
        stores[storeName] = [{ __error: (error as Error).message, __store: storeName }];
      }
    }

    return {
      name: descriptor.name,
      version: db.version,
      stores,
    };
  } catch (error) {
    return {
      name: descriptor.name,
      version: null,
      stores: {},
      error: (error as Error).message,
    };
  } finally {
    if (db) db.close();
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Produce an in-memory snapshot of all registered databases
 */
export async function createFullDatabaseDump(): Promise<FullDatabaseDump> {
  const databases = await Promise.all(
    DATABASE_SCHEMAS.map((descriptor) => dumpSingleDatabase(descriptor)),
  );

  return {
    exportedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    databases,
  };
}

/**
 * Trigger a download of a JSON file containing all IndexedDB data
 */
export async function exportDatabasesToFile(): Promise<void> {
  const dump = await createFullDatabaseDump();
  const json = JSON.stringify(dump, null, 2);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `inkwell-idb-dump-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Get a summary of database sizes for quick inspection
 */
export async function getDatabaseSizes(): Promise<
  Array<{
    name: string;
    totalRecords: number;
    stores: Array<{ name: string; count: number }>;
  }>
> {
  const dump = await createFullDatabaseDump();

  return dump.databases.map((db) => {
    const stores = Object.entries(db.stores).map(([name, records]) => ({
      name,
      count: Array.isArray(records) ? records.length : 0,
    }));

    const totalRecords = stores.reduce((sum, store) => sum + store.count, 0);

    return {
      name: db.name,
      totalRecords,
      stores,
    };
  });
}
