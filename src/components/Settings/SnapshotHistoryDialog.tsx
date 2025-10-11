// File: src/components/Settings/SnapshotHistoryDialog.tsx
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentProject } from '@/context/AppContext';
import { snapshotAdapter as snapshotService, SnapshotMeta } from '@/services/snapshotAdapter';

interface SnapshotHistoryDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

export default function _SnapshotHistoryDialog({ open, onOpenChange }: SnapshotHistoryDialogProps) {
  const { project } = useCurrentProject();
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const projectId = project?.id ?? 'default';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    snapshotService
      .listSnapshots(projectId)
      .then((list: React.SetStateAction<SnapshotMeta[]>) => setSnapshots(list))
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const totalWords = useMemo(() => {
    return (
      project?.chapters?.reduce(
        (acc: any, _ch: { wordCount: any }) => acc + (ch.wordCount || 0),
        0,
      ) ?? 0
    );
  }, [project]);

  const handleRestore = async (_id: string) => {
    if (!projectId) return;
    if (!confirm('Restore this snapshot? Your current project state will be replaced.')) return;
    setRestoringId(id);
    try {
      await snapshotService.restoreSnapshot(projectId, id);
      // Optional: force reload or publish an app-wide event so views refresh
      window.location.reload();
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (_id: string) => {
    if (!confirm('Delete this snapshot permanently?')) return;
    const next = snapshots.filter((s) => s.id !== id);
    setSnapshots(next);
    await snapshotService.deleteSnapshot(projectId, id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 bg-black/20" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 shadow-xl">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold">Snapshots & Version History</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Project: {project?.name ?? 'Untitled'} · Current words: {totalWords}
            </p>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-sm">Loading snapshots…</div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <ul className="space-y-3">
                  {snapshots.length === 0 && (
                    <li className="text-sm text-neutral-600">
                      No snapshots yet. Create one from the top bar or enable auto-snapshots in
                      Settings.
                    </li>
                  )}
                  {snapshots.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.label || 'Snapshot'}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            Saved {formatDistanceToNow(new Date(s.createdAt))} ago ·{' '}
                            {s.stats?.chapters ?? 0} chapters · {s.stats?.words ?? 0} words
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRestore(s.id)}
                            disabled={!!restoringId}
                            title="Restore snapshot"
                          >
                            {restoringId === s.id ? 'Restoring…' : 'Restore'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(s.id)}
                            title="Delete snapshot"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      {s.description && (
                        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                          {s.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
