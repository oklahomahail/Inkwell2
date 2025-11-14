/**
 * Database Initialization Service
 *
 * Ensures all IndexedDB databases are initialized before the app fully loads.
 * Prevents "Database not yet initialized" errors in storage health checks.
 */

import devLog from '@/utils/devLog';

/**
 * Main inkwell_v1 database - stores project metadata, settings, and configuration
 */
const MAIN_DB_NAME = 'inkwell_v1';
const MAIN_DB_VERSION = 3;

/**
 * Check if IndexedDB is available
 */
function hasIDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

/**
 * Initialize the main inkwell_v1 database
 * This creates the database structure that storage health checks expect
 */
async function initMainDatabase(): Promise<void> {
  if (!hasIDB()) {
    devLog.warn('[DBInit] IndexedDB not available - skipping initialization');
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MAIN_DB_NAME, MAIN_DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      devLog.log(`[DBInit] Upgrading ${MAIN_DB_NAME} from v${oldVersion} to v${MAIN_DB_VERSION}`);

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('projects')) {
        const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        projectsStore.createIndex('createdAt', 'createdAt', { unique: false });
        devLog.log('[DBInit] Created projects store');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
        devLog.log('[DBInit] Created settings store');
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionsStore.createIndex('projectId', 'projectId', { unique: false });
        sessionsStore.createIndex('startedAt', 'startedAt', { unique: false });
        devLog.log('[DBInit] Created sessions store');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      devLog.log(`[DBInit] ${MAIN_DB_NAME} v${db.version} ready`);
      // Don't close - keep connection open to prevent race conditions
      // The connection will be reused by services or closed on app unload
      resolve();
    };

    request.onerror = () => {
      devLog.error(`[DBInit] Failed to initialize ${MAIN_DB_NAME}:`, request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      devLog.warn(`[DBInit] ${MAIN_DB_NAME} blocked - close other tabs/windows`);
    };
  });
}

/**
 * Database initialization state
 */
class DBInitService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize all databases
   * Safe to call multiple times - subsequent calls return the same promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    const startTime = performance.now();
    devLog.log('[DBInit] Starting database initialization...');

    try {
      // Initialize main database
      await initMainDatabase();

      // Note: Other databases (inkwell_analytics, inkwell_chapters, etc.)
      // are initialized lazily by their respective services

      this.initialized = true;
      const duration = performance.now() - startTime;
      devLog.log(`[DBInit] All databases ready (${duration.toFixed(1)}ms)`);
    } catch (error) {
      devLog.error('[DBInit] Initialization failed:', error);
      // Don't throw - allow app to continue with degraded functionality
      // The storage health check will show appropriate warnings
    }
  }

  /**
   * Check if databases have been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Wait for database initialization to complete
   */
  async waitForInit(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
    } else {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const dbInitService = new DBInitService();

/**
 * Convenience function - initialize databases
 */
export async function ensureDatabaseReady(): Promise<void> {
  await dbInitService.initialize();
}
