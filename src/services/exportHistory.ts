/**
 * Export History Service (v0.7.0)
 *
 * Tracks export operations for analytics and history viewing.
 * Uses IndexedDB for local-first storage with future Supabase sync capability.
 */

import type { ExportRecord, CreateExportRecordParams, ExportHistoryStats } from '@/types/export';
import devLog from '@/utils/devLog';
import { generateId } from '@/utils/id';

// IndexedDB configuration
const DB_NAME = 'inkwell_exports';
const DB_VERSION = 1;
const EXPORT_STORE = 'export_records';

class ExportHistoryService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        devLog.log('[ExportHistory] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Export records store
        if (!db.objectStoreNames.contains(EXPORT_STORE)) {
          const store = db.createObjectStore(EXPORT_STORE, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('result', 'result', { unique: false });
          devLog.log('[ExportHistory] Created export_records store with indexes');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get database instance (ensures init)
   */
  private async getDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Failed to initialize export history database');
    return this.db;
  }

  /**
   * Add a new export record
   */
  async add(params: CreateExportRecordParams): Promise<ExportRecord> {
    const db = await this.getDB();

    const record: ExportRecord = {
      id: generateId(),
      projectId: params.projectId,
      type: params.type,
      chaptersIncluded: params.chaptersIncluded,
      totalWordCount: params.totalWordCount,
      durationMs: params.durationMs,
      createdAt: new Date().toISOString(),
      result: params.result,
      errorMessage: params.errorMessage,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readwrite');
      const request = tx.objectStore(EXPORT_STORE).add(record);

      request.onsuccess = () => {
        devLog.log('[ExportHistory] Record added:', record.id);
        resolve();
      };
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to add record:', request.error);
        reject(request.error);
      };
    });

    return record;
  }

  /**
   * List export records for a project (sorted by newest first)
   */
  async list(projectId: string, limit?: number): Promise<ExportRecord[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readonly');
      const store = tx.objectStore(EXPORT_STORE);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const records = (request.result as ExportRecord[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        resolve(limit ? records.slice(0, limit) : records);
      };
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to list records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all export records across all projects
   */
  async listAll(limit?: number): Promise<ExportRecord[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readonly');
      const store = tx.objectStore(EXPORT_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result as ExportRecord[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        resolve(limit ? records.slice(0, limit) : records);
      };
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to list all records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single export record by ID
   */
  async get(id: string): Promise<ExportRecord | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readonly');
      const request = tx.objectStore(EXPORT_STORE).get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to get record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get export history statistics for a project
   */
  async getStats(projectId: string): Promise<ExportHistoryStats> {
    const records = await this.list(projectId);

    if (records.length === 0) {
      return {
        totalExports: 0,
        successfulExports: 0,
        failedExports: 0,
        lastExportTime: null,
        lastExportWordCount: 0,
        averageDurationMs: 0,
        totalWordsExported: 0,
      };
    }

    const successfulRecords = records.filter((r) => r.result === 'success');
    const failedRecords = records.filter((r) => r.result === 'fail');

    const totalDuration = successfulRecords.reduce((sum, r) => sum + r.durationMs, 0);
    const totalWords = successfulRecords.reduce((sum, r) => sum + r.totalWordCount, 0);

    const lastExport = records[0];

    return {
      totalExports: records.length,
      successfulExports: successfulRecords.length,
      failedExports: failedRecords.length,
      lastExportTime: lastExport?.createdAt || null,
      lastExportWordCount: lastExport?.totalWordCount || 0,
      averageDurationMs:
        successfulRecords.length > 0 ? Math.round(totalDuration / successfulRecords.length) : 0,
      totalWordsExported: totalWords,
    };
  }

  /**
   * Clear all export history for a project
   */
  async clear(projectId: string): Promise<void> {
    const db = await this.getDB();
    const records = await this.list(projectId);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readwrite');
      const store = tx.objectStore(EXPORT_STORE);

      let completed = 0;
      let hasError = false;

      if (records.length === 0) {
        resolve();
        return;
      }

      records.forEach((record) => {
        const request = store.delete(record.id);

        request.onsuccess = () => {
          completed++;
          if (completed === records.length && !hasError) {
            devLog.log('[ExportHistory] Cleared history for project:', projectId);
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            devLog.error('[ExportHistory] Failed to clear history:', request.error);
            reject(request.error);
          }
        };
      });
    });
  }

  /**
   * Clear all export history (all projects)
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readwrite');
      const request = tx.objectStore(EXPORT_STORE).clear();

      request.onsuccess = () => {
        devLog.log('[ExportHistory] Cleared all export history');
        resolve();
      };
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to clear all history:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific export record
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDB();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EXPORT_STORE, 'readwrite');
      const request = tx.objectStore(EXPORT_STORE).delete(id);

      request.onsuccess = () => {
        devLog.log('[ExportHistory] Deleted record:', id);
        resolve();
      };
      request.onerror = () => {
        devLog.error('[ExportHistory] Failed to delete record:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const exportHistory = new ExportHistoryService();
