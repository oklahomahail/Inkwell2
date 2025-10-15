// Mock implementation of SnapshotService for tests
export interface Snapshot<T = unknown> {
  id: string;
  projectId: string;
  createdAt: number; // epoch ms
  isAutomatic?: boolean;
  metadata?: Record<string, unknown>;
  data?: T;
}

type Timer = ReturnType<typeof setInterval> | null;

export class SnapshotService {
  private store = new Map<string, Snapshot[]>(); // projectId -> snapshots
  private autoTimer: Timer = null;
  private autoProjectId: string | null = null;

  /** For tests that stub this. Default throws to make stubbing obvious. */
  async readCurrentState<T = unknown>(_projectId: string): Promise<T> {
    throw new Error('readCurrentState not implemented. Tests should mock this.');
  }

  async createSnapshot<T = unknown>(
    projectId: string,
    data: T,
    opts?: { isAutomatic?: boolean; metadata?: Record<string, unknown> },
  ): Promise<Snapshot<T>> {
    const snap: Snapshot<T> = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      projectId,
      createdAt: Date.now(),
      isAutomatic: !!opts?.isAutomatic,
      metadata: opts?.metadata ?? {},
      data,
    };
    const list = this.store.get(projectId) ?? [];
    list.push(snap);
    this.store.set(projectId, list);
    return snap;
  }

  async getSnapshots<T = unknown>(projectId: string): Promise<Snapshot<T>[]> {
    return (this.store.get(projectId) ?? []) as Snapshot<T>[];
  }

  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    let removed = false;
    for (const [pid, list] of this.store.entries()) {
      const next = list.filter((s) => s.id !== snapshotId);
      if (next.length !== list.length) {
        this.store.set(pid, next);
        removed = true;
        break;
      }
    }
    return removed;
  }

  /**
   * Starts automatic snapshots. Tests typically expect:
   * - Returns a cleanup function
   * - `stopAutoSnapshots()` also stops the same interval
   * - Each snapshot is marked `isAutomatic: true`
   */
  startAutoSnapshots(projectId: string, intervalMs: number): () => void {
    this.stopAutoSnapshots(); // ensure only one
    this.autoProjectId = projectId;

    this.autoTimer = setInterval(
      async () => {
        try {
          const state = await this.readCurrentState(projectId);
          await this.createSnapshot(projectId, state, { isAutomatic: true });
        } catch {
          // swallow in auto mode; tests generally don't want throws from background work
        }
      },
      Math.max(0, intervalMs | 0),
    );

    return () => this.stopAutoSnapshots();
  }

  stopAutoSnapshots(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
      this.autoProjectId = null;
    }
  }

  /** Utility for tests */
  clearAll(): void {
    this.store.clear();
    this.stopAutoSnapshots();
  }

  async getSnapshotStorageUsage() {
    // Tests only check that this returns basics
    return {
      snapshotCount: 0,
      totalSize: 0,
      details: [],
    };
  }

  async emergencyCleanup() {
    // Tests only verify this exists and returns void
    return undefined;
  }
}

// Export consistent interface with real implementation
export const snapshotService = new SnapshotService();
export default snapshotService;
