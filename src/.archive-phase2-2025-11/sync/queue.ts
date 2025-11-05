// Minimal interface so you can swap into your existing IDB service
export type SyncOp = 'upsert' | 'delete';
export interface SyncItem<T = any> {
  id: string;
  table: 'chapters' | 'characters' | 'notes';
  project_id: string;
  op: SyncOp;
  payload?: T;
  client_rev: number;
  created_at: number;
}

const STORE = 'sync_queue';

export const SyncQueue = {
  async enqueue<T>(db: IDBDatabase, item: SyncItem<T>) {
    return tx(db, STORE, 'readwrite').objectStore(STORE).add(item);
  },
  async dequeueBatch(db: IDBDatabase, limit = 100): Promise<SyncItem[]> {
    const items: SyncItem[] = [];
    await iterate(db, STORE, (val) => {
      if (items.length < limit) items.push(val as SyncItem);
    });
    return items;
  },
  async acknowledge(db: IDBDatabase, ids: string[]) {
    await Promise.all(ids.map((id) => tx(db, STORE, 'readwrite').objectStore(STORE).delete(id)));
  },
};

// Helpers (replace with your own IDB utils if you prefer)
function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  const t = db.transaction(store, mode);
  return Object.assign(t, { objectStore: (s: string) => t.objectStore(s) });
}

async function iterate(db: IDBDatabase, store: string, onValue: (v: unknown) => void) {
  await new Promise<void>((resolve, reject) => {
    const req = tx(db, store, 'readonly').objectStore(store).openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      onValue(cursor.value);
      cursor.continue();
    };
  });
}
