/**
 * Centralized IndexedDB Schema Management
 *
 * Single source of truth for all IndexedDB databases and their schemas.
 * Provides self-healing initialization that ensures all stores and indexes exist.
 *
 * Key Features:
 * - Idempotent schema initialization using objectStoreNames.contains()
 * - Version-independent store creation (no more fragile version checks)
 * - Easy to add new databases and stores
 * - Comprehensive validation utilities for QA
 */

import devLog from '@/utils/devLog';
import { hasIndexedDB } from '@/utils/idbUtils';

// ============================================================================
// Type Definitions
// ============================================================================

export type StoreIndexDefinition = {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
};

export type StoreDefinition = {
  name: string;
  options?: IDBObjectStoreParameters;
  indexes?: StoreIndexDefinition[];
};

export type DatabaseDefinition = {
  name: string;
  version: number;
  stores: StoreDefinition[];
};

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Main application database (inkwell_v1)
 * Stores project metadata, settings, and sessions
 */
const MAIN_DATABASE: DatabaseDefinition = {
  name: 'inkwell_v1',
  version: 3,
  stores: [
    {
      name: 'projects',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'updatedAt', keyPath: 'updatedAt' },
        { name: 'createdAt', keyPath: 'createdAt' },
      ],
    },
    {
      name: 'settings',
      options: { keyPath: 'key' },
    },
    {
      name: 'sessions',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'projectId', keyPath: 'projectId' },
        { name: 'startedAt', keyPath: 'startedAt' },
      ],
    },
  ],
};

/**
 * Chapters database (inkwell_chapters)
 * Stores chapter metadata and content separately for performance
 */
const CHAPTERS_DATABASE: DatabaseDefinition = {
  name: 'inkwell_chapters',
  version: 1,
  stores: [
    {
      name: 'chapter_meta',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'projectId', keyPath: 'projectId' },
        { name: 'projectId_index', keyPath: ['projectId', 'index'] },
      ],
    },
    {
      name: 'chapter_docs',
      options: { keyPath: 'id' },
    },
  ],
};

/**
 * Projects database (inkwell-projects)
 * Stores enhanced project metadata
 */
const PROJECTS_DATABASE: DatabaseDefinition = {
  name: 'inkwell-projects',
  version: 1,
  stores: [
    {
      name: 'projects',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'name', keyPath: 'name' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'updatedAt', keyPath: 'updatedAt' },
        { name: 'genre', keyPath: 'genre' },
        { name: 'isDemo', keyPath: 'isDemo' },
      ],
    },
  ],
};

/**
 * Sync queue database (inkwell-sync-queue)
 * Stores pending sync operations
 */
const SYNC_QUEUE_DATABASE: DatabaseDefinition = {
  name: 'inkwell-sync-queue',
  version: 1,
  stores: [
    {
      name: 'queue',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'status', keyPath: 'status' },
        { name: 'projectId', keyPath: 'projectId' },
        { name: 'createdAt', keyPath: 'createdAt' },
      ],
    },
  ],
};

/**
 * AI features database (inkwell-ai)
 * Stores AI-generated suggestions, analysis, and metadata for Wave 1-8 features
 */
const AI_DATABASE: DatabaseDefinition = {
  name: 'inkwell-ai',
  version: 1,
  stores: [
    {
      name: 'ai_suggestions',
      options: { keyPath: 'id' },
      indexes: [
        { name: 'projectId', keyPath: 'projectId' },
        { name: 'chapterId', keyPath: 'chapterId' },
        { name: 'type', keyPath: 'type' },
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'project_type', keyPath: ['projectId', 'type'] },
      ],
    },
    {
      name: 'scene_metadata',
      options: { keyPath: 'chapterId' },
      indexes: [
        { name: 'sceneType', keyPath: 'sceneType' },
        { name: 'analyzedAt', keyPath: 'analyzedAt' },
      ],
    },
  ],
};

/**
 * Central schema registry
 * Add new databases here to include them in self-healing initialization
 */
export const DATABASE_SCHEMAS: DatabaseDefinition[] = [
  MAIN_DATABASE,
  CHAPTERS_DATABASE,
  PROJECTS_DATABASE,
  SYNC_QUEUE_DATABASE,
  AI_DATABASE,
];

// ============================================================================
// Core Initialization Functions
// ============================================================================

/**
 * Open a database with self-healing schema initialization
 * Creates missing stores and indexes automatically
 */
function openDatabase(dbDef: DatabaseDefinition): Promise<IDBDatabase> {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbDef.name, dbDef.version);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion || 0;

      devLog.log(`[DBSchema] Upgrading ${dbDef.name} from v${oldVersion} to v${dbDef.version}`);

      // Defensive pattern: always check existence by name, not just version
      for (const storeDef of dbDef.stores) {
        let store: IDBObjectStore;

        if (!db.objectStoreNames.contains(storeDef.name)) {
          store = db.createObjectStore(storeDef.name, storeDef.options);
          devLog.log(`[DBSchema] Created store: ${dbDef.name}.${storeDef.name}`);
        } else {
          // Store exists, get reference from transaction
          const tx = request.transaction;
          if (tx) {
            store = tx.objectStore(storeDef.name);
          } else {
            continue;
          }
        }

        // Ensure all indexes exist
        if (storeDef.indexes) {
          for (const indexDef of storeDef.indexes) {
            if (!store.indexNames.contains(indexDef.name)) {
              store.createIndex(indexDef.name, indexDef.keyPath, indexDef.options);
              devLog.log(
                `[DBSchema] Created index: ${dbDef.name}.${storeDef.name}.${indexDef.name}`,
              );
            }
          }
        }
      }
    };

    request.onsuccess = () => {
      devLog.debug(`[DBSchema] ${dbDef.name} v${dbDef.version} ready`);
      resolve(request.result);
    };

    request.onerror = () => {
      devLog.error(`[DBSchema] Failed to open ${dbDef.name}:`, request.error);
      reject(request.error ?? new Error(`Unknown error opening ${dbDef.name}`));
    };

    request.onblocked = () => {
      devLog.warn(
        `[DBSchema] ${dbDef.name} upgrade blocked - close other tabs/windows running Inkwell`,
      );
    };
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Self-healing entry point to call during app boot
 * Ensures all required databases, stores, and indexes exist
 *
 * Idempotent: Safe to call multiple times
 * Non-blocking: Runs async and logs errors instead of throwing
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (!hasIndexedDB()) {
    devLog.warn('[DBSchema] IndexedDB not available - skipping schema initialization');
    return;
  }

  const startTime = performance.now();
  devLog.log('[DBSchema] Starting self-healing schema initialization...');

  const results = await Promise.allSettled(
    DATABASE_SCHEMAS.map(async (dbDef) => {
      const db = await openDatabase(dbDef);
      db.close(); // Close connection after schema validation
      return dbDef.name;
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  const succeeded = results.filter((r) => r.status === 'fulfilled');

  const duration = performance.now() - startTime;

  if (failed.length > 0) {
    devLog.error(
      `[DBSchema] Schema initialization completed with ${failed.length} failures (${duration.toFixed(1)}ms)`,
    );
    for (const result of failed) {
      if (result.status === 'rejected') {
        devLog.error('[DBSchema] Failed database:', result.reason);
      }
    }
  } else {
    devLog.log(
      `[DBSchema] All ${succeeded.length} databases initialized successfully (${duration.toFixed(1)}ms)`,
    );
  }
}

/**
 * Verify that specific stores exist in a database
 * Useful for QA checks and debugging
 */
export async function verifyStoresExist(
  dbName: string,
  storeNames: string[],
): Promise<{ ok: boolean; missing: string[] }> {
  const dbDef = DATABASE_SCHEMAS.find((d) => d.name === dbName);
  if (!dbDef) {
    throw new Error(`Database ${dbName} not found in schema registry`);
  }

  const db = await openDatabase(dbDef);
  const missing: string[] = [];

  for (const name of storeNames) {
    if (!db.objectStoreNames.contains(name)) {
      missing.push(name);
    }
  }

  db.close();

  return { ok: missing.length === 0, missing };
}

/**
 * Verify that all databases have their expected stores
 * Returns comprehensive validation results
 */
export async function validateAllSchemas(): Promise<{
  ok: boolean;
  databases: Array<{
    name: string;
    ok: boolean;
    missing: string[];
  }>;
}> {
  const databases = await Promise.all(
    DATABASE_SCHEMAS.map(async (dbDef) => {
      const expectedStores = dbDef.stores.map((s) => s.name);
      const result = await verifyStoresExist(dbDef.name, expectedStores);
      return {
        name: dbDef.name,
        ok: result.ok,
        missing: result.missing,
      };
    }),
  );

  const allOk = databases.every((d) => d.ok);

  return { ok: allOk, databases };
}

/**
 * Get database definition by name
 * Useful for services that need to know their schema
 */
export function getDatabaseDefinition(dbName: string): DatabaseDefinition | undefined {
  return DATABASE_SCHEMAS.find((d) => d.name === dbName);
}

/**
 * Get all store names for a database
 * Useful for validation and testing
 */
export function getStoreNames(dbName: string): string[] {
  const dbDef = getDatabaseDefinition(dbName);
  return dbDef ? dbDef.stores.map((s) => s.name) : [];
}
