// Comprehensive storage abstraction layer for Inkwell
// Provides IndexedDB helpers, JSON snapshots, and streaming export capabilities

import {
  createVersionedData,
  runMigrations,
  needsMigration,
  validateSchemaVersion,
  getSchemaVersion,
} from '../domain/schemaVersion';

/**
 * Check if IndexedDB is available in the current environment
 */
function hasIDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

/* ========= Types ========= */
export interface StorageOptions {
  useCompression?: boolean;
  enableVersioning?: boolean;
  autoMigrate?: boolean;
}

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

/* ========= IndexedDB Implementation ========= */
class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'InkwellStorage';
  private version = 1;
  private storeName = 'keyvalue';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    if (!hasIDB()) {
      throw new Error('IndexedDB is not available in this environment');
    }

    const idb = (globalThis as any).indexedDB;

    return new Promise((resolve, reject) => {
      const request = idb.open(this.dbName, this.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? JSON.parse(result.data) : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const data = {
        key,
        data: JSON.stringify(value),
        timestamp: Date.now(),
      };

      const request = store.put(data, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async list(prefix?: string): Promise<string[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result as string[];
        resolve(prefix ? keys.filter((key) => key.startsWith(prefix)) : keys);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/* ========= LocalStorage Fallback ========= */
class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn('LocalStorage get failed:', err);
      return null;
    }
  }

  async put<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('LocalStorage put failed:', err);
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

/* ========= Storage Manager ========= */
class StorageManager {
  private adapter: StorageAdapter;

  constructor() {
    // Try IndexedDB first, fall back to localStorage
    if (hasIDB()) {
      this.adapter = new IndexedDBAdapter();
    } else {
      this.adapter = new LocalStorageAdapter();
    }
  }

  /**
   * Get data with automatic migration support
   */
  async get<T>(key: string, options: StorageOptions = {}): Promise<T | null> {
    try {
      const data = await this.adapter.get<T>(key);

      if (!data) return null;

      // Handle versioning and migrations
      if (options.enableVersioning !== false) {
        const version = getSchemaVersion(data);
        validateSchemaVersion(version);

        if (options.autoMigrate !== false && needsMigration(data)) {
          console.log(`🔄 Auto-migrating data for key: ${key}`);
          const migrated = await runMigrations(data, version);
          await this.adapter.put(key, migrated); // Save migrated data
          return migrated as T;
        }
      }

      return data;
    } catch (err) {
      console.error(`Storage get failed for key ${key}:`, err);
      throw err;
    }
  }

  /**
   * Store data with automatic versioning
   */
  async put<T>(key: string, value: T, options: StorageOptions = {}): Promise<void> {
    try {
      let dataToStore = value;

      // Add versioning if enabled
      if (options.enableVersioning !== false) {
        dataToStore = createVersionedData(value) as T;
      }

      await this.adapter.put(key, dataToStore);
    } catch (err) {
      console.error(`Storage put failed for key ${key}:`, err);
      throw err;
    }
  }

  /**
   * Delete data
   */
  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  /**
   * List keys with optional prefix filter
   */
  async list(prefix?: string): Promise<string[]> {
    return this.adapter.list(prefix);
  }

  /**
   * Clear all data (use with caution!)
   */
  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Perform a transactional operation
   */
  async transact(operations: Array<() => Promise<void>>): Promise<void> {
    // Simple implementation - could be enhanced with proper transactions
    for (const operation of operations) {
      await operation();
    }
  }

  /**
   * Create a JSON snapshot of all data
   */
  async createSnapshot(prefix?: string): Promise<Record<string, any>> {
    const keys = await this.list(prefix);
    const snapshot: Record<string, any> = {};

    for (const key of keys) {
      const data = await this.get(key, { enableVersioning: false });
      if (data) {
        snapshot[key] = data;
      }
    }

    return snapshot;
  }

  /**
   * Restore data from a JSON snapshot
   */
  async restoreSnapshot(
    snapshot: Record<string, any>,
    options: StorageOptions = {},
  ): Promise<void> {
    const operations = Object.entries(snapshot).map(
      ([key, value]) =>
        () =>
          this.put(key, value, options),
    );

    await this.transact(operations);
  }

  // Compatibility methods for localStorage-like API
  async getItem<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    return this.put(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return this.list();
  }
}

/* ========= Singleton Instance ========= */
export const storage = new StorageManager();

/* ========= Legacy Compatibility Layer ========= */
// Keep existing API for gradual migration
export const legacyStorage = {
  saveWritingContent: async (data: { title: string; content: string }) => {
    await storage.put('writing_content', data);
  },

  loadWritingContent: async (): Promise<{ title: string; content: string } | null> => {
    return storage.get('writing_content');
  },

  saveTimeline: async (scenes: any[]) => {
    await storage.put('timeline_scenes', scenes);
  },

  loadTimeline: async (): Promise<any[]> => {
    const data = await storage.get<any[]>('timeline_scenes');
    return data || [];
  },
};
