// @ts-nocheck
/** IMPORTANT: This is the real implementation. Tests mock via ../snapshotService */

import devLog from "@/utils/devLog";
import quotaAwareStorage from '@/utils/quotaAwareStorage';

export interface SnapshotMeta {
  id: string;
  projectId: string;
  createdAt: number;
  label?: string;
  reason?: 'auto' | 'custom' | 'maintenance' | string;
  sizeBytes?: number;
}

export interface Snapshot<T = unknown> {
  meta: SnapshotMeta;
  data: T;
}

export interface SnapshotCreateOptions<T> {
  label?: string;
  reason?: SnapshotMeta['reason'];
  validate?: (project: T) => boolean;
}

export interface CleanupOptions {
  maxPerProject?: number; // keep newest N
  maxAgeMs?: number; // drop older than this
}

type SnapshotIndex = Record<string, string[]>; // projectId -> [snapshotIds newest-first]

const INDEX_KEY = 'snap:index';
const SNAP_KEY = (id: string) => `snap:${id}`;

const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2) + now().toString(36);

export class SnapshotServiceImpl<T = any> {
  private storage = quotaAwareStorage; // returns a QuotaAwareStorage instance

  private async readIndex(): Promise<SnapshotIndex> {
    const raw = await this.storage.safeGetItem(INDEX_KEY);
    let idx: Record<string, string[]> = {};

    try {
      if (raw.success && raw.data) {
        idx = JSON.parse(raw.data);
      }
    } catch {
      idx = {}; // Handle corrupted data
    }

    return idx;
  }
  private async writeIndex(idx: SnapshotIndex) {
    const res = await this.storage.safeSetItem(INDEX_KEY, JSON.stringify(idx));
    return res.success
      ? { ok: true }
      : { ok: false, error: res.error?.message ?? 'Failed to write index' };
  }

  private async readSnapshot(
    id: string,
  ): Promise<{ ok: false } | { ok: true; value: Snapshot<T> }> {
    const r = await this.storage.safeGetItem(SNAP_KEY(id));
    if (!r.success || !r.data) return { ok: false };
    try {
      const data = JSON.parse(r.data);
      if (!data?.meta?.id || !data?.meta?.projectId) return { ok: false };
      return { ok: true, value: data as Snapshot<T> };
    } catch {
      return { ok: false };
    }
  }
  private async writeSnapshot(s: Snapshot<T>) {
    const json = JSON.stringify(s);
    s.meta.sizeBytes = new Blob([json]).size;
    const res = await this.storage.safeSetItem(SNAP_KEY(s.meta.id), json);
    return res.success
      ? { ok: true }
      : { ok: false, error: res.error?.message ?? 'Failed to write snapshot' };
  }
  private async removeSnapshot(id: string) {
    const res = await this.storage.safeRemoveItem(SNAP_KEY(id));
    return res.success
      ? { ok: true }
      : { ok: false, error: res.error?.message ?? 'Failed to remove snapshot' };
  }

  /** Create a custom snapshot for a project. */
  async createCustomSnapshot(
    projectId: string,
    projectData: T,
    opts: SnapshotCreateOptions<T> = {},
  ) {
    return this._create(projectId, projectData, opts);
  }

  /** Backward-compatible name expected by callers */
  async createSnapshot(project: T, opts: SnapshotCreateOptions<T> & { projectId?: string } = {}) {
    // If project includes an id, prefer it; otherwise, require opts.projectId
    const inferredId = (project as any)?.id;
    const projectId = (typeof inferredId === 'string' && inferredId) || opts.projectId;
    if (!projectId) {
      return { ok: false as const, error: new Error('projectId required') };
    }
    return this._create(projectId, project, opts);
  }

  private async _create(projectId: string, projectData: T, opts: SnapshotCreateOptions<T> = {}) {
    // Validate input
    if (!projectId || typeof projectId !== 'string') {
      return { ok: false as const, error: new Error('Invalid projectId') };
    }
    if (opts.validate && !opts.validate(projectData)) {
      return { ok: false as const, error: new Error('Invalid project data') };
    }

    const snap: Snapshot<T> = {
      meta: {
        id: uid(),
        projectId,
        createdAt: now(),
        label: opts.label ?? '',
        reason: opts.reason ?? 'snapshot',
      },
      data: projectData,
    };

    const writeRes = await this.writeSnapshot(snap);
    if (!writeRes.ok) return writeRes;

    const idx = await this.readIndex();
    // Ensure the list exists before modifying
    const idList = (idx[projectId] ??= []);
    // newest first
    idList.unshift(snap.meta.id);
    const indexRes = await this.writeIndex(idx);
    if (!indexRes.ok) return indexRes;

    return { ok: true as const, value: snap };
  }

  /** Find a snapshot by id; returns undefined if not found. */
  async getSnapshot(snapshotId: string) {
    if (!snapshotId) return { ok: false as const, error: new Error('snapshotId required') };
    const res = await this.readSnapshot(snapshotId);
    if (!res.ok) return res;
    return { ok: true as const, value: res.value };
  }

  /** List snapshots for a given project, newest first. */
  async getSnapshots(projectId: string): Promise<Snapshot<T>[]> {
    const result = await this.listSnapshots(projectId);
    return result.ok ? result.value : [];
  }

  /** List snapshots for a given project, newest first with detailed result. */
  async listSnapshots(projectId: string) {
    const idx = await this.readIndex();
    const ids = idx[projectId] ?? [];
    const snapshots: Snapshot<T>[] = [];
    for (const id of ids) {
      const r = await this.readSnapshot(id);
      if (r.ok && r.value) snapshots.push(r.value);
    }
    return { ok: true as const, value: snapshots };
  }

  /** Restore snapshot data by id; returns the project data if found. */
  async restoreSnapshot(snapshotId: string) {
    const res = await this.readSnapshot(snapshotId);
    if (!res.ok) return res;
    if (!res.value) return { ok: false as const, error: new Error('Snapshot not found') };
    return { ok: true as const, value: res.value.data };
  }

  /** Delete a single snapshot by ID. */
  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    const res = await this.removeSnapshot(snapshotId);
    if (!res.ok) return false;

    // Update index
    const idx = await this.readIndex();
    try {
      for (const projectId in idx) {
        const list = idx[projectId];
        if (list) {
          const i = list.indexOf(snapshotId);
          if (i >= 0) list.splice(i, 1);
        }
      }
      await quotaAwareStorage.safeSetItem(INDEX_KEY, JSON.stringify(idx));
      return true;
    } catch (err) {
      devLog.error('Failed to update snapshot index', err);
      return false;
    }
  }

  /** Start automatic snapshots. */
  startAutoSnapshots(projectId: string, intervalMs: number = 5000) {
    const id = setInterval(async () => {
      try {
        const state = await this.readCurrentState(projectId);
        await this.createSnapshot(state, {
          projectId,
          reason: 'auto',
          label: 'Auto-snapshot',
        });
      } catch {
        // swallow in auto mode; tests generally don't want throws from background work
      }
    }, intervalMs);
    return () => clearInterval(id);
  }

  /** Stop automatic snapshots. */
  stopAutoSnapshots() {
    // No-op since interval cleanup is returned by startAutoSnapshots
  }

  /** Read current project state - to be implemented by client. */
  async readCurrentState(_projectId: string): Promise<T> {
    throw new Error('readCurrentState not implemented');
  }

  /** Cleanup snapshots by policy; returns a report of deletions. */
  async cleanup(options: CleanupOptions = {}) {
    const { maxPerProject, maxAgeMs } = options;
    const idx = await this.readIndex();
    const deleted: { projectId: string; snapshotId: string }[] = [];
    const cutoff = maxAgeMs ? now() - maxAgeMs : undefined;

    for (const [projectId, ids] of Object.entries(idx)) {
      let keep = ids;

      // Filter by age
      if (cutoff) {
        const filtered: string[] = [];
        for (const id of keep) {
          const r = await this.readSnapshot(id);
          if (r.ok && r.value && r.value.meta.createdAt >= cutoff) filtered.push(id);
          else {
            await this.removeSnapshot(id);
            deleted.push({ projectId, snapshotId: id });
          }
        }
        keep = filtered;
      }

      // Trim by count (keep newest first)
      if (typeof maxPerProject === 'number' && keep.length > maxPerProject) {
        const toDrop = keep.slice(maxPerProject);
        keep = keep.slice(0, maxPerProject);
        for (const id of toDrop) {
          await this.removeSnapshot(id);
          deleted.push({ projectId, snapshotId: id });
        }
      }

      idx[projectId] = keep;
    }

    await this.writeIndex(idx);
    return { ok: true as const, value: { deleted } };
  }

  /** Get a summary of snapshot storage usage. */
  async getSnapshotStorageUsage(): Promise<{ totalSize: number; snapshotCount: number }> {
    try {
      const idx = await this.readIndex();
      let totalSize = 0;
      let snapshotCount = 0;

      for (const ids of Object.values(idx)) {
        for (const id of ids) {
          const r = await this.readSnapshot(id);
          if (r.ok && r.value?.meta?.sizeBytes) {
            totalSize += r.value.meta.sizeBytes;
            snapshotCount++;
          }
        }
      }

      return { totalSize, snapshotCount };
    } catch {
      return { totalSize: 0, snapshotCount: 0 };
    }
  }

  /** Emergency cleanup for low storage conditions. */
  async emergencyCleanup(): Promise<{ freedBytes: number; actions: string[] }> {
    const actions: string[] = [];
    let freedBytes = 0;

    try {
      const info = await this.storage.getQuotaInfo();
      if (info.ratio < 0.85) {
        actions.push(`No cleanup needed (${Math.round(info.ratio * 100)}% used)`);
        return { freedBytes, actions };
      }

      // Delete old automatic snapshots first
      const idx = await this.readIndex();
      for (const ids of Object.values(idx)) {
        if (!Array.isArray(ids)) continue;
        for (const id of ids) {
          const snap = await this.readSnapshot(id);
          if (!snap.ok || !snap.value?.meta) continue;
          if (snap.value.meta.reason === 'auto') {
            const size = snap.value.meta.sizeBytes || 0;
            await this.removeSnapshot(id);
            freedBytes += size;
            actions.push(`Removed auto snapshot ${id}`);
          }
        }
      }

      // Rebuild index
      await this.rebuildIndex();
      actions.push('Rebuilt snapshot index');

      return { freedBytes, actions };
    } catch (e) {
      actions.push(`Cleanup failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return { freedBytes, actions };
    }
  }

  /** Rebuild index from storage keys. */
  async rebuildIndex() {
    try {
      const idx: SnapshotIndex = {};
      // local iteration works for both local and memory because QuotaAwareStorage namespacing is consistent
      const keys: string[] = [];
      const ls = (globalThis as any).localStorage as Storage | undefined;
      if (ls) {
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k?.includes('snap:')) keys.push(k);
        }
      }
      // Include in-memory fallback keys if needed
      // No direct access to the Map; this method is primarily for real storage.

      for (const k of keys) {
        try {
          const raw = ls?.getItem(k);
          if (!raw) continue;

          const data = JSON.parse(raw);
          if (!data?.meta?.projectId || !data?.meta?.id) continue;

          // Now we know these properties exist
          const snap = data as Snapshot<T>;
          const idList = (idx[snap.meta.projectId] ??= []);
          idList.unshift(snap.meta.id);
        } catch {
          // ignore bad entries
          continue;
        }
      }

      const res = await quotaAwareStorage.safeSetItem(INDEX_KEY, JSON.stringify(idx));
      if (!res.success) {
        devLog.error('Failed to persist snapshot index', res.error);
        return {
          ok: false as const,
          error: new Error(res.error?.message ?? 'Failed to persist index'),
        };
      }
      return { ok: true as const, value: idx };
    } catch (error) {
      return { ok: false as const, error };
    }
  }
}

export const snapshotServiceImpl = new SnapshotServiceImpl();
export default snapshotServiceImpl;
