export type SnapshotStats = { chapters: number; words: number };
export type SnapshotMeta = {
  id: string;
  createdAt: number;
  description?: string;
  label?: string;
  stats?: SnapshotStats;
};

const SNAPSHOT_KEY = (pid: string) => `inkwell:snapshots:${pid}`;

function getStore(pid: string) {
  const raw = localStorage.getItem(SNAPSHOT_KEY(pid));
  return (raw ? JSON.parse(raw) : { items: [] }) as {
    items: Array<SnapshotMeta & { payload: any }>;
  };
}

function setStore(pid: string, store: ReturnType<typeof getStore>) {
  localStorage.setItem(SNAPSHOT_KEY(pid), JSON.stringify(store));
}

export const snapshotService = {
  async makeSnapshot(project: any, opts?: { label?: string; description?: string }) {
    const pid = project?.id || 'default';
    const stats: SnapshotStats = {
      chapters: project?.chapters?.length || 0,
      words: (project?.chapters || []).reduce((a: number, c: any) => a + (c.wordCount || 0), 0),
    };
    const store = getStore(pid);
    const id = crypto.randomUUID();
    const item: SnapshotMeta & { payload: any } = {
      id,
      createdAt: Date.now(),
      description: opts?.description,
      label: opts?.label || `Snapshot ${new Date().toLocaleString()}`,
      stats,
      payload: project,
    };

    // Retention: keep last 10 and prune hourly/daily (simple rule here)
    store.items.unshift(item);
    store.items = store.items.slice(0, 20);
    setStore(pid, store);
    return id;
  },

  async listSnapshots(pid: string): Promise<SnapshotMeta[]> {
    const store = getStore(pid);
    return store.items.map(({ payload, ...meta }) => meta);
  },

  async restoreSnapshot(pid: string, id: string) {
    const store = getStore(pid);
    const found = store.items.find((s) => s.id === id);
    if (!found) throw new Error('Snapshot not found');
    await this.replaceProject(pid, found.payload);
  },

  async deleteSnapshot(pid: string, id: string) {
    const store = getStore(pid);
    setStore(pid, { items: store.items.filter((s) => s.id !== id) });
  },

  async replaceProject(pid: string, project: any) {
    // Implement this according to your storage layer.
    // If you have enhancedStorageService, call into it; else, fall back to localStorage.
    localStorage.setItem(`inkwell:project:${pid}`, JSON.stringify(project));
  },
};
