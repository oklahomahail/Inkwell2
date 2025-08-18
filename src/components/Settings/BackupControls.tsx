// src/components/Settings/BackupControls.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCurrentProject } from '@/context/AppContext';
import { performBackup, performImport } from '@/services/backupExport';

export default function BackupControls() {
  const { project } = useCurrentProject();
  const [busy, setBusy] = useState<'backup' | 'import' | null>(null);
  const pid = project?.id ?? 'default';

  const onBackup = async () => {
    if (!project) return;
    setBusy('backup');
    try {
      await performBackup(project);
    } finally {
      setBusy(null);
    }
  };

  const onImport = async () => {
    setBusy('import');
    try {
      await performImport(pid);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
      <h3 className="text-lg font-semibold">Backups</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Export a full JSON backup or restore from a backup file.
      </p>
      <div className="flex gap-2">
        <Button onClick={onBackup} disabled={busy !== null}>
          {busy === 'backup' ? 'Exporting…' : 'Export JSON Backup'}
        </Button>
        <Button variant="secondary" onClick={onImport} disabled={busy !== null}>
          {busy === 'import' ? 'Importing…' : 'Import Backup'}
        </Button>
      </div>
    </div>
  );
}
