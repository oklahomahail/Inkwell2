// src/utils/storage/storageVerification.ts - Storage verification utilities for debugging and testing

/**
 * Storage Verification Utilities
 *
 * Use these utilities in DevTools console to verify storage persistence,
 * quota, and data survival across re-authentication.
 *
 * Quick Start (paste in console):
 * ```
 * import { verifyStorage } from '@/utils/storage/storageVerification';
 * await verifyStorage.checkAll();
 * ```
 */

export interface StorageInfo {
  persisted: boolean;
  quota: number;
  usage: number;
  usagePercent: number;
  databases: string[];
  origin: string;
}

export interface DatabaseInfo {
  name: string;
  version: number;
  stores: string[];
}

export interface StoreContents {
  storeName: string;
  count: number;
  items: any[];
}

/**
 * Check if persistent storage is granted
 */
export async function checkPersistence(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persisted) {
    console.warn('[Storage] navigator.storage.persisted() not available');
    return false;
  }

  const persisted = await navigator.storage.persisted();
  console.log(`[Storage] Persistence status: ${persisted ? '✅ GRANTED' : '❌ NOT GRANTED'}`);
  return persisted;
}

/**
 * Request persistent storage permission
 */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.warn('[Storage] navigator.storage.persist() not available');
    return false;
  }

  const granted = await navigator.storage.persist();
  console.log(`[Storage] Persistence request: ${granted ? '✅ GRANTED' : '❌ DENIED'}`);
  return granted;
}

/**
 * Get storage quota and usage
 */
export async function checkQuota(): Promise<{ quota: number; usage: number; percent: number }> {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn('[Storage] navigator.storage.estimate() not available');
    return { quota: 0, usage: 0, percent: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const quota = estimate.quota || 0;
  const usage = estimate.usage || 0;
  const percent = quota > 0 ? (usage / quota) * 100 : 0;

  console.log('[Storage] Quota info:');
  console.log(`  Used: ${formatBytes(usage)}`);
  console.log(`  Total: ${formatBytes(quota)}`);
  console.log(`  Percent: ${percent.toFixed(2)}%`);

  return { quota, usage, percent };
}

/**
 * List all IndexedDB databases
 */
export async function listDatabases(): Promise<string[]> {
  if (!('databases' in indexedDB)) {
    console.warn('[Storage] indexedDB.databases() not supported in this browser');
    return [];
  }

  const dbs = await indexedDB.databases();
  const names = dbs.map((db) => db.name || 'unnamed');

  console.log('[Storage] Databases found:', names);
  return names;
}

/**
 * Open a database and return basic info
 */
export async function inspectDatabase(dbName: string): Promise<DatabaseInfo | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = () => {
      const db = request.result;
      const info: DatabaseInfo = {
        name: db.name,
        version: db.version,
        stores: Array.from(db.objectStoreNames),
      };

      console.log(`[Storage] Database "${dbName}":`, info);
      db.close();
      resolve(info);
    };

    request.onerror = () => {
      console.error(`[Storage] Failed to open database "${dbName}":`, request.error);
      resolve(null);
    };
  });
}

/**
 * List all items in a specific object store
 */
export async function listStoreContents(
  dbName: string,
  storeName: string,
  limit = 100,
): Promise<StoreContents> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        console.error(`[Storage] Store "${storeName}" not found in database "${dbName}"`);
        db.close();
        resolve({ storeName, count: 0, items: [] });
        return;
      }

      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const items: any[] = [];
      let count = 0;

      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && count < limit) {
          items.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          console.log(`[Storage] Store "${storeName}" contains ${count} items`);
          if (count > 0) {
            console.log('First item:', items[0]);
          }
          db.close();
          resolve({ storeName, count, items });
        }
      };

      cursorRequest.onerror = () => {
        console.error(`[Storage] Failed to read store "${storeName}":`, cursorRequest.error);
        db.close();
        reject(cursorRequest.error);
      };
    };

    request.onerror = () => {
      console.error(`[Storage] Failed to open database "${dbName}":`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear Supabase auth token to simulate re-authentication
 * (without clearing IndexedDB)
 */
export function clearAuthToken(): void {
  const authKeys = Object.keys(localStorage).filter(
    (key) => key.includes('sb-') && key.includes('-auth-token'),
  );

  if (authKeys.length === 0) {
    console.log('[Auth] No Supabase auth tokens found');
    return;
  }

  authKeys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`[Auth] Removed: ${key}`);
  });

  console.log('[Auth] ✅ Auth tokens cleared. Refresh page to re-authenticate.');
  console.log('[Auth] Your IndexedDB data should still be intact.');
}

/**
 * Comprehensive storage check
 */
export async function checkAll(): Promise<StorageInfo> {
  console.group('[Storage] Running comprehensive storage check...');

  const persisted = await checkPersistence();
  const { quota, usage, percent } = await checkQuota();
  const databases = await listDatabases();
  const origin = window.location.origin;

  console.log('[Storage] Origin:', origin);

  const info: StorageInfo = {
    persisted,
    quota,
    usage,
    usagePercent: percent,
    databases,
    origin,
  };

  console.groupEnd();

  return info;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Global window access for console debugging
 */
if (typeof window !== 'undefined') {
  (window as any).storageDebug = {
    checkPersistence,
    requestPersistence,
    checkQuota,
    listDatabases,
    inspectDatabase,
    listStoreContents,
    clearAuthToken,
    checkAll,
  };

  console.log(
    '[Storage] Debug utilities available at window.storageDebug',
    '\nExamples:',
    '\n  await storageDebug.checkAll()',
    '\n  await storageDebug.checkPersistence()',
    '\n  await storageDebug.requestPersistence()',
    '\n  await storageDebug.listDatabases()',
    '\n  await storageDebug.inspectDatabase("inkwell-db")',
    '\n  await storageDebug.listStoreContents("inkwell-db", "projects")',
    '\n  storageDebug.clearAuthToken()',
  );
}

// Export everything
export const verifyStorage = {
  checkPersistence,
  requestPersistence,
  checkQuota,
  listDatabases,
  inspectDatabase,
  listStoreContents,
  clearAuthToken,
  checkAll,
};
