// src/services/projectsDB.ts
/**
 * ProjectsDB - IndexedDB storage for project metadata
 *
 * Replaces localStorage storage of `inkwell_enhanced_projects` with IndexedDB
 * for better performance, larger capacity, and structured queries.
 *
 * Benefits over localStorage:
 * - No 5-10MB quota limit (typically 50MB+ available)
 * - Structured queries and indexes
 * - Async operations don't block main thread
 * - Automatic serialization/deserialization
 * - Better for full-text search integration
 *
 * Migration Strategy:
 * 1. Read existing projects from localStorage on first run
 * 2. Write to both localStorage (fallback) and IndexedDB
 * 3. Eventually deprecate localStorage writes
 */

import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';

const DB_NAME = 'inkwell-projects';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

class ProjectsDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private pendingTransactions = 0;

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        devLog.debug('[ProjectsDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Indexes for common queries
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('genre', 'genre', { unique: false });
          store.createIndex('isDemo', 'isDemo', { unique: false });

          devLog.debug('[ProjectsDB] Object store and indexes created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save a project to IndexedDB
   */
  async saveProject(project: EnhancedProject): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const updated = { ...project, updatedAt: Date.now() };
      const request = store.put(updated);

      request.onsuccess = () => {
        devLog.debug(`[ProjectsDB] Project saved: ${project.id}`);
        resolve();
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to save project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load a single project by ID
   */
  async loadProject(projectId: string): Promise<EnhancedProject | null> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readonly');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);

      request.onsuccess = () => {
        const project = request.result as EnhancedProject | undefined;
        resolve(project || null);
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to load project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load all projects
   */
  async loadAllProjects(): Promise<EnhancedProject[]> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readonly');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result as EnhancedProject[];
        resolve(projects);
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to load all projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(projectId);

      request.onsuccess = () => {
        devLog.debug(`[ProjectsDB] Project deleted: ${projectId}`);
        resolve();
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to delete project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Query projects by index (e.g., by genre, date range)
   */
  async queryProjects(
    indexName: 'name' | 'createdAt' | 'updatedAt' | 'genre' | 'isDemo',
    query?: IDBValidKey | IDBKeyRange,
  ): Promise<EnhancedProject[]> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readonly');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(indexName);

    return new Promise((resolve, reject) => {
      const request = query ? index.getAll(query) : index.getAll();

      request.onsuccess = () => {
        const projects = request.result as EnhancedProject[];
        resolve(projects);
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to query projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get total project count
   */
  async getCount(): Promise<number> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readonly');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to count projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if database is initialized and connected
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Close database connection
   * Should be called on app unmount
   */
  close(): void {
    if (this.db) {
      devLog.debug('[ProjectsDB] Closing database connection');
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Track transaction lifecycle for safe shutdown
   */
  private trackTransaction(tx: IDBTransaction): void {
    this.pendingTransactions++;
    const cleanup = () => {
      this.pendingTransactions--;
    };
    tx.addEventListener('complete', cleanup);
    tx.addEventListener('error', cleanup);
    tx.addEventListener('abort', cleanup);
  }

  /**
   * Close IndexedDB connection and wait for pending transactions
   * Should be called on app unmount to prevent connection leaks
   */
  async closeAndWait(): Promise<void> {
    if (!this.db) return;

    devLog.debug('[ProjectsDB] Closing database connection (waiting for pending transactions)');

    // Wait for all pending transactions to complete
    const maxWaitTime = 5000; // 5 seconds max
    const startTime = Date.now();
    while (this.pendingTransactions > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (this.pendingTransactions > 0) {
      devLog.warn(
        `[ProjectsDB] Closing with ${this.pendingTransactions} pending transactions after timeout`,
      );
    }

    this.db.close();
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Clear all projects (use with caution!)
   */
  async clearAll(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        devLog.warn('[ProjectsDB] All projects cleared');
        resolve();
      };

      request.onerror = () => {
        devLog.error('[ProjectsDB] Failed to clear projects:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const ProjectsDB = new ProjectsDBService();
