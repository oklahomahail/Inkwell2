import { getStorage } from '@/utils/storageFactory';
import type { IQuotaStorage } from '@/utils/storageTypes';

export interface SnapshotMeta {
  id: string;
  projectId: string;
  createdAt: number;
  timestamp?: number | undefined; // alias for createdAt for legacy tests
  label?: string | undefined;
  reason?: 'auto' | 'custom' | 'maintenance' | string | undefined;
  description?: string | undefined;
  isAutomatic?: boolean | undefined;
  tags?: string[] | undefined;
  version?: string | undefined;
  wordCount?: number | undefined;
  sizeBytes?: number | undefined;
}

export interface Snapshot<T = unknown> {
  meta: SnapshotMeta;
  data: T;
}

export interface SnapshotCreateOptions<T> {
  label?: string;
  reason?: SnapshotMeta['reason'];
  description?: string;
  isAutomatic?: boolean;
  tags?: string[];
  validate?: (project: T) => boolean;
}

export interface CleanupOptions {
  maxPerProject?: number; // keep newest N
  maxAgeMs?: number; // drop older than this
}

type SnapshotIndex = Record<string, string[]>; // projectId -> [snapshotIds newest-first]

const INDEX_KEY = 'inkwell_snapshot_index';
const SNAP_KEY = (id: string) => `inkwell_snapshot_${id}`;

const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2) + now().toString(36);

export class SnapshotService<T = any> {
  private snapshotTimer?: ReturnType<typeof setInterval> | undefined;
  private autoSnapshotProject?: T | undefined;
  private storage: IQuotaStorage;

  constructor(storage?: IQuotaStorage) {
    // getStorage may return an implementation that doesn't declare optional members (e.g., `clear`).
    // We only use the safe* methods, so this cast is fine for our purposes.
    this.storage = (storage ?? getStorage('snapshot')) as IQuotaStorage;
  }

  async createSnapshot(project: T, opts: SnapshotCreateOptions<T> = {}) {
    const p: any = project as any;
    if (!p?.id) throw new Error('Cannot snapshot invalid project');
    return this.createCustomSnapshot(p.id, project, opts);
  }

  async getSnapshots(projectId: string): Promise<SnapshotMeta[]> {
    try {
      const idxRaw = this.storage.safeGetItem(INDEX_KEY);
      if (!idxRaw.success) throw new Error(idxRaw.error?.message || 'index read failed');

      const idx = idxRaw.data ? (JSON.parse(idxRaw.data) as SnapshotIndex | unknown) : {};
      const index: SnapshotIndex =
        Array.isArray(idx) || typeof idx !== 'object' || idx === null ? {} : (idx as SnapshotIndex);

      const ids = index[projectId] ?? [];
      const snaps: Snapshot<T>[] = [];
      for (const id of ids) {
        const r = this.readSnapshot(id);
        if (r.ok && r.value) snaps.push(r.value);
      }

      return snaps
        .sort((a, b) => b.meta.createdAt - a.meta.createdAt)
        .map((s) => ({ ...s.meta, timestamp: s.meta.createdAt }));
    } catch (error) {
      console.error('Failed to load snapshot index:', error as any);
      return [];
    }
  }

  async deleteSnapshot(id: string): Promise<void> {
    const remove = this.removeSnapshot(id);
    if (!remove.ok) {
      // Tests expect a generic failure message here
      throw new Error('Snapshot deletion failed');
    }
    console.log(`Snapshot deleted: ${id}`);

    // Update index by removing this id from any project arrays
    const idx = this.readIndex();
    let changed = false;

    for (const projectId of Object.keys(idx)) {
      const list = idx[projectId] ?? [];
      const before = list.length;
      const filtered = list.filter((i) => i !== id);

      if (filtered.length !== before) {
        changed = true;
        if (filtered.length === 0) {
          delete idx[projectId];
        } else {
          idx[projectId] = filtered;
        }
      }
    }

    if (changed) {
      await this.writeIndex(idx);
    }
  }

  async startAutoSnapshots(project: T, intervalMs = 10 * 60 * 1000) {
    this.stopAutoSnapshots();
    this.autoSnapshotProject = project;
    console.log('Auto-snapshots started');

    this.snapshotTimer = setInterval(async () => {
      try {
        await this.createSnapshot(this.autoSnapshotProject!, {
          isAutomatic: true,
          tags: ['auto'],
          reason: 'auto',
          description: 'Automatic snapshot',
        });
      } catch (error) {
        console.error('Auto-snapshot failed:', error);
      }
    }, intervalMs);
  }

  stopAutoSnapshots() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = undefined;
      this.autoSnapshotProject = undefined;
      console.log('Auto-snapshots stopped');
    }
  }

  private readIndex(): SnapshotIndex {
    const r = this.storage.safeGetItem(INDEX_KEY);
    if (!r.success) {
      console.error('Failed to read snapshot index:', r.error);
      return {};
    }
    if (!r.data) return {};

    try {
      const parsed = JSON.parse(r.data);
      if (Array.isArray(parsed)) return {}; // legacy empty format
      if (typeof parsed !== 'object' || parsed === null) return {};

      const index = parsed as SnapshotIndex;

      // scrub/normalize
      for (const [projectId, snapshotIds] of Object.entries(index)) {
        if (!Array.isArray(snapshotIds)) {
          delete index[projectId];
          continue;
        }
        index[projectId] = [...new Set(snapshotIds)].filter(
          (id) => typeof id === 'string' && id.length > 0,
        );
        if (index[projectId].length === 0) delete index[projectId];
      }

      return index;
    } catch (error) {
      console.error('Failed to parse snapshot index:', error);
      return {};
    }
  }

  private async writeIndex(idx: SnapshotIndex) {
    try {
      for (const [projectId, snapshotIds] of Object.entries(idx)) {
        idx[projectId] = [...new Set(snapshotIds)].filter(
          (id) => typeof id === 'string' && id.length > 0,
        );
        if (idx[projectId].length === 0) delete idx[projectId];
      }
      // Legacy tests expect '[]' when empty
      const payload = Object.keys(idx).length === 0 ? '[]' : JSON.stringify(idx);
      const result = await this.storage.safeSetItem(INDEX_KEY, payload);
      if (!result.success) {
        console.error('Failed to write snapshot index:', result.error);
        return { ok: false as const, error: result.error };
      }
      return { ok: true as const };
    } catch (error) {
      console.error('Failed to write snapshot index:', error);
      return { ok: false as const, error: new Error('Failed to write snapshot index') };
    }
  }

  private readSnapshot(id: string) {
    const r = this.storage.safeGetItem(SNAP_KEY(id));
    if (!r.success || !r.data)
      return { ok: false as const, error: new Error('Failed to read snapshot') };
    try {
      const parsed = JSON.parse(r.data) as any;

      // Support both { metadata, project } and { meta, data } shapes
      if (parsed && parsed.metadata && parsed.project) {
        const snap: Snapshot<T> = { meta: parsed.metadata, data: parsed.project };
        return { ok: true as const, value: snap };
      }
      if (parsed && parsed.meta && parsed.data) {
        return { ok: true as const, value: parsed as Snapshot<T> };
      }
      // If something else, treat as invalid
      return { ok: false as const, error: new Error('Invalid snapshot data') };
    } catch (error) {
      return { ok: false as const, error };
    }
  }

  private async writeSnapshot(s: Snapshot<T>) {
    try {
      // Build payload in the legacy-friendly shape
      const payload: any = {
        metadata: { ...s.meta, timestamp: s.meta.createdAt },
        project: s.data,
      };

      // Compute size
      const initialRaw = JSON.stringify(payload);
      const sizeBytes =
        typeof Buffer !== 'undefined'
          ? Buffer.byteLength(initialRaw, 'utf8')
          : initialRaw.length * 2;

      // Reflect size in both meta & payload metadata
      s.meta.sizeBytes = sizeBytes;
      payload.metadata.sizeBytes = sizeBytes;

      const raw = JSON.stringify(payload);

      const result = await this.storage.safeSetItem(SNAP_KEY(s.meta.id), raw);
      if (!result.success) {
        if (result.error?.type === 'quota') {
          const cleanup = await this.emergencyCleanup(s.meta.projectId);
          if (cleanup > 0) {
            const retry = await this.storage.safeSetItem(SNAP_KEY(s.meta.id), raw);
            if (!retry.success) return { ok: false as const, error: retry.error };
            return { ok: true as const };
          }
        }
        return { ok: false as const, error: result.error };
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: new Error('Failed to write snapshot') };
    }
  }

  private removeSnapshot(id: string) {
    const result = this.storage.safeRemoveItem(SNAP_KEY(id));
    return result.success ? { ok: true as const } : { ok: false as const, error: result.error };
  }

  async createCustomSnapshot(
    projectId: string,
    projectData: T,
    opts: SnapshotCreateOptions<T> = {},
  ) {
    try {
      if (!projectId || typeof projectId !== 'string') {
        throw new Error('Invalid projectId');
      }
      if (opts.validate && !opts.validate(projectData)) {
        throw new Error('Invalid project data');
      }

      const anyProject = projectData as any;
      const created = now();
      const snap: Snapshot<T> = {
        meta: {
          id: uid(),
          projectId,
          createdAt: created,
          timestamp: created,
          label: opts.label,
          reason: opts.reason ?? 'custom',
          description: opts.description,
          isAutomatic: opts.isAutomatic ?? false,
          tags: opts.tags,
          version: anyProject?.version,
          wordCount: anyProject?.currentWordCount ?? anyProject?.wordCount,
        },
        data: projectData,
      };

      // First write snapshot
      const w = await this.writeSnapshot(snap);
      if (!w.ok) {
        // EXACT message expected by tests:
        throw new Error('Snapshot creation failed');
      }

      // Update index
      const index = this.readIndex();
      index[projectId] = index[projectId] ?? [];
      index[projectId].unshift(snap.meta.id); // newest first

      // Auto-clean older autos (best-effort, non-blocking)
      if (opts.isAutomatic) {
        const MAX_AUTO_SNAPSHOTS = 15;
        const autoIds = index[projectId].filter((id) => {
          const s = this.readSnapshot(id);
          return s.ok && s.value?.meta.isAutomatic;
        });
        if (autoIds.length > MAX_AUTO_SNAPSHOTS) {
          const toRemove = autoIds.slice(MAX_AUTO_SNAPSHOTS);
          index[projectId] = index[projectId].filter((id) => !toRemove.includes(id));
          for (const rid of toRemove) this.removeSnapshot(rid);
        }
      }

      const wi = await this.writeIndex(index);
      if (!wi.ok) {
        // keep the snapshot, but signal error consistent with tests that check creation failure path
        throw new Error('Snapshot creation failed');
      }

      console.log('Snapshot created:', snap.meta);
      return snap.meta;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      // EXACT message expected by tests:
      throw new Error('Snapshot creation failed');
    }
  }

  getSnapshot(id: string) {
    if (!id) return { ok: false as const, error: new Error('snapshotId required') };
    const r = this.readSnapshot(id);
    if (!r.ok) return r;
    return { ok: true as const, value: r.value };
  }

  listSnapshots(projectId: string) {
    const idx = this.readIndex();
    const ids = idx[projectId] ?? [];
    const out: Snapshot<T>[] = [];
    for (const id of ids) {
      const r = this.readSnapshot(id);
      if (r.ok && r.value) out.push(r.value);
    }
    return { ok: true as const, value: out };
  }

  async restoreSnapshot(id: string) {
    const r = this.readSnapshot(id);
    if (!r.ok || !r.value) throw new Error(`Snapshot ${id} not found`);

    const data = r.value.data;
    if (!data || typeof data !== 'object' || !('id' in (data as any))) {
      throw new Error('Invalid project data in snapshot');
    }

    // Checksum warning (best-effort)
    const raw = this.storage.safeGetItem(SNAP_KEY(id));
    if (raw.success && raw.data) {
      try {
        const parsed = JSON.parse(raw.data) as any;
        if (parsed && parsed.metadata && parsed.project) {
          const savedSize = parsed.metadata.sizeBytes;
          const currentSize =
            typeof Buffer !== 'undefined'
              ? Buffer.byteLength(JSON.stringify(parsed), 'utf8')
              : JSON.stringify(parsed).length * 2;
          if (typeof savedSize === 'number' && savedSize !== currentSize) {
            console.warn('Checksum mismatch');
          }
        }
      } catch {
        /* ignore */
      }
    }

    console.log(`Snapshot restored: ${id}`);
    return data;
  }

  async emergencyCleanup(projectId: string, maxToKeep = 5): Promise<number> {
    try {
      const snapshots = await this.getSnapshots(projectId);
      if (snapshots.length <= maxToKeep) return 0;

      snapshots.sort((a, b) => b.createdAt - a.createdAt);
      const toDelete = snapshots.slice(maxToKeep);
      let deletedCount = 0;

      for (const snapshot of toDelete) {
        try {
          const removeResult = this.removeSnapshot(snapshot.id);
          if (!removeResult.ok) {
            console.warn(`Failed to remove snapshot ${snapshot.id}:`, removeResult.error);
            continue;
          }

          const index = this.readIndex();
          if (index[projectId]) {
            index[projectId] = index[projectId].filter((id) => id !== snapshot.id);
            if (index[projectId].length === 0) delete index[projectId];
            await this.writeIndex(index);
          }

          deletedCount++;
        } catch (err) {
          console.warn(`Failed to clean up snapshot ${snapshot.id}:`, err);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      return 0;
    }
  }

  getSnapshotStorageUsage() {
    try {
      let totalSize = 0;
      const details: Array<{ id: string; size: number }> = [];
      const idx = this.readIndex();

      for (const ids of Object.values(idx)) {
        for (const id of ids) {
          const snap = this.readSnapshot(id);
          if (snap.ok) {
            const meta = snap.value?.meta;
            const size = typeof meta?.sizeBytes === 'number' ? meta.sizeBytes : 0;
            totalSize += size;
            details.push({ id: meta!.id, size });
          }
        }
      }

      return { totalSize, snapshotCount: details.length, details };
    } catch {
      return { totalSize: 0, snapshotCount: 0, details: [] };
    }
  }
}

// Default instance for convenience
const defaultSnapshotService = new SnapshotService<any>();
export default defaultSnapshotService;
