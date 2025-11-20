/**
 * IndexedDB Reset Utilities
 *
 * Development-only utilities for resetting local IndexedDB data.
 * WARNING: These functions ONLY affect local browser storage, not Supabase.
 */

import devLog from '@/utils/devLog';

// ============================================================================
// Types
// ============================================================================

export interface ResetResult {
  summary: string;
  details: Array<{
    db: string;
    store: string;
    deleted: number;
  }>;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Open a database at its expected version
 */
async function openDb(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onerror = () => reject(req.error ?? new Error(`Failed to open DB ${name}`));
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * Delete all records in a store where a field matches a value
 */
async function deleteByField(
  db: IDBDatabase,
  storeName: string,
  fieldName: string,
  fieldValue: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let deleted = 0;

    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const cursorReq = store.openCursor();

      cursorReq.onerror = () => reject(cursorReq.error ?? new Error('openCursor failed'));

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve(deleted);
          return;
        }

        const value: any = cursor.value;
        if (value && value[fieldName] === fieldValue) {
          cursor.delete();
          deleted += 1;
        }
        cursor.continue();
      };
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Reset all local data for a given projectId
 *
 * WARNING: This only affects IndexedDB on this browser, not Supabase.
 * All local chapters, metadata, and project records will be deleted.
 *
 * @param projectId - The project ID to reset
 * @returns Summary and details of deleted records
 */
export async function resetLocalDataForProject(projectId: string): Promise<ResetResult> {
  const details: Array<{ db: string; store: string; deleted: number }> = [];

  // Map of DB -> stores to clean, with field name to match
  const projectStoreMap: Array<{
    dbName: string;
    version: number;
    stores: Array<{ name: string; field: string }>;
  }> = [
    {
      dbName: 'inkwell_chapters',
      version: 1,
      stores: [
        { name: 'chapter_meta', field: 'projectId' },
        { name: 'chapter_docs', field: 'projectId' },
      ],
    },
    {
      dbName: 'inkwell-projects',
      version: 1,
      stores: [
        // Remove the project record itself
        { name: 'projects', field: 'id' },
      ],
    },
    {
      dbName: 'inkwell_v1',
      version: 3,
      stores: [
        // Remove project from main DB if it exists there
        { name: 'projects', field: 'id' },
      ],
    },
  ];

  for (const cfg of projectStoreMap) {
    let db: IDBDatabase | null = null;
    try {
      db = await openDb(cfg.dbName, cfg.version);

      for (const storeCfg of cfg.stores) {
        // Check if store exists before trying to delete from it
        if (!db.objectStoreNames.contains(storeCfg.name)) {
          details.push({
            db: cfg.dbName,
            store: storeCfg.name,
            deleted: 0,
          });
          continue;
        }

        const deleted = await deleteByField(db, storeCfg.name, storeCfg.field, projectId);
        details.push({
          db: cfg.dbName,
          store: storeCfg.name,
          deleted,
        });
      }
    } catch (error) {
      details.push({
        db: cfg.dbName,
        store: '(error opening DB)',
        deleted: -1,
      });
      // Surface in console but do not throw, so other DBs still process
      devLog.warn('[dbReset] Failed to reset project in DB', cfg.dbName, error);
    } finally {
      if (db) db.close();
    }
  }

  const totalDeleted = details.filter((d) => d.deleted >= 0).reduce((sum, d) => sum + d.deleted, 0);

  const summary = `Reset local data for project ${projectId}. Records deleted: ${totalDeleted}.`;

  devLog.log('[dbReset]', summary, details);

  return { summary, details };
}

/**
 * Nuclear option: Delete ALL IndexedDB databases
 *
 * WARNING: This will delete ALL local data. Cannot be undone.
 * The app will need to be reloaded after this operation.
 *
 * @returns Summary of deleted databases
 */
export async function resetAllLocalData(): Promise<{
  summary: string;
  deleted: string[];
  errors: Array<{ db: string; error: string }>;
}> {
  const databasesToDelete = [
    'inkwell_v1',
    'inkwell_chapters',
    'inkwell-projects',
    'inkwell-sync-queue',
  ];

  const deleted: string[] = [];
  const errors: Array<{ db: string; error: string }> = [];

  for (const dbName of databasesToDelete) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error ?? new Error('Delete failed'));
        req.onblocked = () => {
          devLog.warn(`[dbReset] Delete of ${dbName} is blocked. Close all connections first.`);
        };
      });
      deleted.push(dbName);
    } catch (error) {
      errors.push({
        db: dbName,
        error: (error as Error).message,
      });
    }
  }

  const summary = `Deleted ${deleted.length} databases. Errors: ${errors.length}. Reload required.`;
  devLog.log('[dbReset]', summary, { deleted, errors });

  return { summary, deleted, errors };
}
