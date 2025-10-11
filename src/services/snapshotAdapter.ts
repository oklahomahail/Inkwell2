export interface SnapshotMeta {
  id: string;
  createdAt: number;
  description?: string;
  label?: string;
  stats?: {
    chapters: number;
    words: number;
  };
}

/**
 * Adapter class for managing project snapshots with storage fallback
 */
class SnapshotAdapter {
  private readonly storagePrefix = 'inkwell:project:';

  async listSnapshots(projectId: string): Promise<SnapshotMeta[]> {
    try {
      const snapshots = localStorage.getItem(`${this.storagePrefix}${projectId}:snapshots`);
      return snapshots ? JSON.parse(snapshots) : [];
    } catch {
      return [];
    }
  }

  async restoreSnapshot(projectId: string, snapshotId: string): Promise<void> {
    const snapshots = await this.listSnapshots(projectId);
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);

    const data = localStorage.getItem(`${this.storagePrefix}${projectId}:snapshot:${snapshotId}`);
    if (!data) throw new Error(`Snapshot data ${snapshotId} not found`);

    await this.replaceProject(projectId, JSON.parse(data));
  }

  async deleteSnapshot(projectId: string, snapshotId: string): Promise<void> {
    const snapshots = await this.listSnapshots(projectId);
    const filtered = snapshots.filter((s) => s.id !== snapshotId);
    localStorage.setItem(`${this.storagePrefix}${projectId}:snapshots`, JSON.stringify(filtered));
    localStorage.removeItem(`${this.storagePrefix}${projectId}:snapshot:${snapshotId}`);
  }

  async makeSnapshot(
    project: any,
    opts?: { label?: string; description?: string },
  ): Promise<SnapshotMeta> {
    const snapshotId = Math.random().toString(36).slice(2);
    const snapshot: SnapshotMeta = {
      id: snapshotId,
      createdAt: Date.now(),
      description: opts?.description,
      label: opts?.label,
      stats: {
        chapters: project.chapters?.length ?? 0,
        words: project.stats?.wordCount ?? 0,
      },
    };

    const snapshots = await this.listSnapshots(project.id);
    snapshots.unshift(snapshot);
    localStorage.setItem(`${this.storagePrefix}${project.id}:snapshots`, JSON.stringify(snapshots));
    localStorage.setItem(
      `${this.storagePrefix}${project.id}:snapshot:${snapshotId}`,
      JSON.stringify(project),
    );

    return snapshot;
  }

  async replaceProject(projectId: string, project: any): Promise<void> {
    localStorage.setItem(`${this.storagePrefix}${projectId}`, JSON.stringify(project));
  }
}

// Export singleton instance
export const snapshotAdapter = new SnapshotAdapter();
export default snapshotAdapter;
