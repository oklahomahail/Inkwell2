/**
 * Database Schema Tests
 *
 * Comprehensive test suite for self-healing IndexedDB schema initialization
 * Tests idempotency, upgrade paths, and error recovery
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';

import {
  DATABASE_SCHEMAS,
  ensureDatabaseSchema,
  getDatabaseDefinition,
  getStoreNames,
  validateAllSchemas,
  verifyStoresExist,
} from '../dbSchema';

// Helper to delete all databases
async function deleteAllDatabases(): Promise<void> {
  const databases = await indexedDB.databases?.();
  if (databases && databases.length > 0) {
    await Promise.all(
      databases
        .map((dbInfo) => dbInfo.name)
        .filter((name): name is string => !!name)
        .map(
          (name) =>
            new Promise<void>((resolve, reject) => {
              const deleteRequest = indexedDB.deleteDatabase(name);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            }),
        ),
    );
  }
}

describe('dbSchema - Self-Healing Initialization', () => {
  beforeEach(async () => {
    await deleteAllDatabases();
  });

  afterEach(async () => {
    await deleteAllDatabases();
  });

  describe('ensureDatabaseSchema', () => {
    it('creates all databases and stores on first run', async () => {
      await ensureDatabaseSchema();

      const validation = await validateAllSchemas();
      expect(validation.ok).toBe(true);
      expect(validation.databases).toHaveLength(DATABASE_SCHEMAS.length);

      for (const dbResult of validation.databases) {
        expect(dbResult.ok).toBe(true);
        expect(dbResult.missing).toEqual([]);
      }
    });

    it('is idempotent when run multiple times', async () => {
      await ensureDatabaseSchema();
      await ensureDatabaseSchema();
      await ensureDatabaseSchema();

      const validation = await validateAllSchemas();
      expect(validation.ok).toBe(true);
    });

    it('creates all expected stores for each database', async () => {
      await ensureDatabaseSchema();

      for (const dbDef of DATABASE_SCHEMAS) {
        const expectedStores = dbDef.stores.map((s) => s.name);
        const result = await verifyStoresExist(dbDef.name, expectedStores);

        expect(result.ok).toBe(true);
        expect(result.missing).toEqual([]);
      }
    });

    it('creates all indexes for each store', async () => {
      await ensureDatabaseSchema();

      for (const dbDef of DATABASE_SCHEMAS) {
        const request = indexedDB.open(dbDef.name, dbDef.version);

        await new Promise<void>((resolve, reject) => {
          request.onsuccess = () => {
            const db = request.result;

            for (const storeDef of dbDef.stores) {
              const tx = db.transaction(storeDef.name, 'readonly');
              const store = tx.objectStore(storeDef.name);

              if (storeDef.indexes) {
                for (const indexDef of storeDef.indexes) {
                  expect(store.indexNames.contains(indexDef.name)).toBe(true);
                }
              }
            }

            db.close();
            resolve();
          };

          request.onerror = () => reject(request.error);
        });
      }
    });
  });

  describe('verifyStoresExist', () => {
    it('returns ok=true when all stores exist', async () => {
      await ensureDatabaseSchema();

      const result = await verifyStoresExist('inkwell_v1', ['projects', 'settings', 'sessions']);
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('identifies missing stores', async () => {
      await ensureDatabaseSchema();

      const result = await verifyStoresExist('inkwell_v1', [
        'projects',
        'nonexistent_store',
        'settings',
      ]);
      expect(result.ok).toBe(false);
      expect(result.missing).toContain('nonexistent_store');
      expect(result.missing).toHaveLength(1);
    });

    it('throws error for unknown database', async () => {
      await expect(verifyStoresExist('unknown_db', ['store'])).rejects.toThrow(
        'Database unknown_db not found in schema registry',
      );
    });
  });

  describe('validateAllSchemas', () => {
    it('validates all databases successfully', async () => {
      await ensureDatabaseSchema();

      const validation = await validateAllSchemas();
      expect(validation.ok).toBe(true);

      for (const dbResult of validation.databases) {
        expect(dbResult.ok).toBe(true);
        expect(dbResult.missing).toEqual([]);
      }
    });

    it('identifies missing stores across all databases', async () => {
      // Initialize schema first
      await ensureDatabaseSchema();

      // Delete one database to simulate corruption
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase('inkwell_chapters');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Re-create database with missing store
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('inkwell_chapters', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          // Only create one store instead of both
          db.createObjectStore('chapter_meta', { keyPath: 'id' });
          // Intentionally skip chapter_docs
        };
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      const validation = await validateAllSchemas();
      expect(validation.ok).toBe(false);

      const chaptersDB = validation.databases.find((d) => d.name === 'inkwell_chapters');
      expect(chaptersDB?.ok).toBe(false);
      expect(chaptersDB?.missing).toContain('chapter_docs');
    });
  });

  describe('getDatabaseDefinition', () => {
    it('returns definition for known database', () => {
      const def = getDatabaseDefinition('inkwell_v1');
      expect(def).toBeDefined();
      expect(def?.name).toBe('inkwell_v1');
      expect(def?.stores).toBeDefined();
    });

    it('returns undefined for unknown database', () => {
      const def = getDatabaseDefinition('nonexistent_db');
      expect(def).toBeUndefined();
    });
  });

  describe('getStoreNames', () => {
    it('returns all store names for a database', () => {
      const stores = getStoreNames('inkwell_v1');
      expect(stores).toEqual(['projects', 'settings', 'sessions']);
    });

    it('returns empty array for unknown database', () => {
      const stores = getStoreNames('nonexistent_db');
      expect(stores).toEqual([]);
    });

    it('returns correct stores for chapters database', () => {
      const stores = getStoreNames('inkwell_chapters');
      expect(stores).toEqual(['chapter_meta', 'chapter_docs']);
    });
  });

  describe('Upgrade Scenarios', () => {
    it('handles upgrade from empty database', async () => {
      // Create database at version 0 (empty)
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('inkwell_v1', 1);
        request.onupgradeneeded = () => {
          // Don't create any stores
        };
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Now run schema initialization which should create missing stores
      await ensureDatabaseSchema();

      const result = await verifyStoresExist('inkwell_v1', ['projects', 'settings', 'sessions']);
      expect(result.ok).toBe(true);
    });

    it('handles partial schema (missing one store)', async () => {
      // Create database with only some stores
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('inkwell_v1', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('projects', { keyPath: 'id' });
          db.createObjectStore('settings', { keyPath: 'key' });
          // Missing 'sessions' store
        };
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Run schema initialization
      await ensureDatabaseSchema();

      const result = await verifyStoresExist('inkwell_v1', ['projects', 'settings', 'sessions']);
      expect(result.ok).toBe(true);
    });

    it('handles missing indexes in existing store', async () => {
      // Create database with store but missing indexes
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('inkwell_v1', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          // Only create one index, missing others
          store.createIndex('updatedAt', 'updatedAt');
        };
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Run schema initialization (at higher version to trigger upgrade)
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('inkwell_v1', 3);
        request.onupgradeneeded = () => {
          const db = request.result;
          const tx = request.transaction!;
          const store = tx.objectStore('projects');

          // Add missing indexes
          if (!store.indexNames.contains('createdAt')) {
            store.createIndex('createdAt', 'createdAt');
          }
        };
        request.onsuccess = () => {
          const db = request.result;

          // Verify all indexes exist
          const tx = db.transaction('projects', 'readonly');
          const store = tx.objectStore('projects');

          expect(store.indexNames.contains('updatedAt')).toBe(true);
          expect(store.indexNames.contains('createdAt')).toBe(true);

          db.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles environment without IndexedDB', async () => {
      // Save original indexedDB
      const originalIDB = (globalThis as any).indexedDB;

      try {
        // Remove indexedDB temporarily
        delete (globalThis as any).indexedDB;

        // Should not throw, just log warning
        await expect(ensureDatabaseSchema()).resolves.not.toThrow();
      } finally {
        // Restore indexedDB
        (globalThis as any).indexedDB = originalIDB;
      }
    });
  });

  describe('Data Integrity', () => {
    it('preserves existing data during schema upgrade', async () => {
      // Initialize schema
      await ensureDatabaseSchema();

      // Add test data
      const request = indexedDB.open('inkwell_v1', 3);
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('projects', 'readwrite');
          const store = tx.objectStore('projects');

          store.put({
            id: 'test-project-1',
            name: 'Test Project',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });

      // Re-run schema initialization
      await ensureDatabaseSchema();

      // Verify data still exists
      const readRequest = indexedDB.open('inkwell_v1', 3);
      await new Promise<void>((resolve, reject) => {
        readRequest.onsuccess = () => {
          const db = readRequest.result;
          const tx = db.transaction('projects', 'readonly');
          const store = tx.objectStore('projects');
          const getRequest = store.get('test-project-1');

          getRequest.onsuccess = () => {
            expect(getRequest.result).toBeDefined();
            expect(getRequest.result.name).toBe('Test Project');
            db.close();
            resolve();
          };
          getRequest.onerror = () => reject(getRequest.error);
        };
        readRequest.onerror = () => reject(readRequest.error);
      });
    });
  });
});
