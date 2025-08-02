export const indexedDbBackupService = {
  dbName: 'WritingAppBackups',
  storeName: 'backups',
  db: null as IDBDatabase | null,

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'metadata.id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  },

  async saveBackup(backup: any) {
    if (!this.db) await this.init();
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(backup);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getBackup(id: string) {
    if (!this.db) await this.init();
    return new Promise<any>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllBackups() {
    if (!this.db) await this.init();
    return new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteBackup(id: string) {
    if (!this.db) await this.init();
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
