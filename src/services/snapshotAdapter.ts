import { snapshotService as svc } from '@/services/snapshotService';

export type SnapshotMeta = {
  id: string;
  createdAt: number;
  description?: string;
  label?: string;
  stats?: { chapters: number; words: number };
};

// Adapter adds/aliases the methods your components expect.
export const snapshotAdapter = {
  // prefer existing names if present; otherwise alias/create
  listSnapshots: async (projectId: string): Promise<SnapshotMeta[]> => {
    if (typeof (svc as any).listSnapshots === 'function')
      return (svc as any).listSnapshots(projectId);
    if (typeof (svc as any).getSnapshots === 'function')
      return (svc as any).getSnapshots(projectId);
    return [];
  },
  restoreSnapshot: async (projectId: string, snapshotId: string): Promise<void> => {
    if (typeof (svc as any).restoreSnapshot === 'function') {
      // try 2-arg signature first, then 1-arg
      try {
        return await (svc as any).restoreSnapshot(projectId, snapshotId);
      } catch {
        /* fallthrough */
      }
      return (svc as any).restoreSnapshot(snapshotId);
    }
  },
  deleteSnapshot: async (projectId: string, snapshotId: string): Promise<void> => {
    if (typeof (svc as any).deleteSnapshot === 'function') {
      try {
        return await (svc as any).deleteSnapshot(projectId, snapshotId);
      } catch {
        /* fallthrough */
      }
      return (svc as any).deleteSnapshot(snapshotId);
    }
  },
  makeSnapshot: async (project: any, opts?: { label?: string; description?: string }) => {
    if (typeof (svc as any).makeSnapshot === 'function')
      return (svc as any).makeSnapshot(project, opts);
    if (typeof (svc as any).createSnapshot === 'function')
      return (svc as any).createSnapshot(project, opts);
  },
  replaceProject: async (projectId: string, project: any) => {
    if (typeof (svc as any).replaceProject === 'function')
      return (svc as any).replaceProject(projectId, project);
    // fallback to localStorage
    localStorage.setItem(`inkwell:project:${projectId}`, JSON.stringify(project));
  },
};
export default snapshotAdapter;
