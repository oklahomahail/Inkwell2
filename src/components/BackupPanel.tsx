// src/components/BackupPanel.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';

import { ChapterGateway } from '@/model/chapters';
import { BackupManager } from '@/services/backupCore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getModelGateway() {
  return {
    async listProjects() {
      // Try to get projects from settings store or localStorage
      const settings = (useSettingsStore.getState ? useSettingsStore.getState() : {}) as {
        projects?: any[];
      };
      if (Array.isArray(settings.projects)) {
        return settings.projects;
      }
      // Fallback: try localStorage
      try {
        const raw = localStorage.getItem('projects');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    },
    async listChapters(projectId: string) {
      return ChapterGateway.getChapters ? ChapterGateway.getChapters(projectId) : [];
    },
    async getSettings() {
      return useSettingsStore.getState ? useSettingsStore.getState() : {};
    },
    async restore({ projects, chapters, settings }: any, { strategy }: any) {
      let restored = { projects: 0, chapters: 0, settings: 0, skipped: 0, conflicted: 0 };
      // Restore projects
      const existingProjects = await this.listProjects();
      let updatedProjects = [...existingProjects];
      for (const p of projects || []) {
        const idx = updatedProjects.findIndex((ep: any) => ep.id === p.id);
        if (idx !== -1) {
          restored.conflicted++;
          if (strategy === 'overwrite') {
            updatedProjects[idx] = p;
            restored.projects++;
          } else {
            restored.skipped++;
          }
        } else {
          updatedProjects.push(p);
          restored.projects++;
        }
      }
      // Save projects to localStorage
      try {
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      } catch (e) {}
      // Restore chapters
      if (chapters && Array.isArray(chapters)) {
        for (const c of chapters) {
          try {
            if (ChapterGateway.saveChapter) {
              await ChapterGateway.saveChapter(c.projectId, c);
            }
            restored.chapters++;
          } catch (err) {
            restored.skipped++;
          }
        }
      }
      // Restore settings (overwrite all except projects)
      if (settings && typeof settings === 'object') {
        const { projects: _ignore, ...restSettings } = settings;
        useSettingsStore.setState(restSettings);
        restored.settings++;
      }
      // Telemetry stub
      window.dispatchEvent(
        new CustomEvent('telemetry', { detail: { action: 'restore', restored } }),
      );
      return restored;
    },
  };
}

class ExtendedBackupManager extends BackupManager {
  constructor() {
    super(
      async () => {},
      () => {},
    );
    this.store = getModelGateway();
  }
  store: any;
  async createBackup() {
    const [projects, chapters, settings] = await Promise.all([
      this.store.listProjects(),
      this.store.listChapters('default'), // TODO: pass actual projectId
      this.store.getSettings(),
    ]);
    return {
      inkwellBackup: 1,
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      appVersion: 'v0.8.0',
      data: { projects, chapters, settings },
    };
  }
  async restoreBackup(payload: any, { strategy = 'prompt' } = {}) {
    if (payload?.inkwellBackup !== 1) throw new Error('Invalid backup file');
    const { projects, chapters, settings } = payload.data ?? {};
    return await this.store.restore({ projects, chapters, settings }, { strategy });
  }
}

export type BackupPanelProps = {
  performBackup?: () => Promise<void>;
};

export default function BackupPanel({ performBackup }: BackupPanelProps) {
  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: '',
    type: 'info',
  });
  const backupManagerRef = useRef<BackupManager | null>(null);
  const [backupStatus, setBackupStatus] = useState<
    'idle' | 'saving' | 'success' | 'error' | 'retrying'
  >('idle');
  const [status, setStatus] = useState<'Idle' | 'Exporting…' | 'Restoring…' | 'Done' | 'Error'>(
    'Idle',
  );
  const [restoreResults, setRestoreResults] = useState<null | {
    projects: number;
    chapters: number;
    settings: number;
    skipped: number;
    conflicted: number;
  }>(null);

  // Memoize BackupManager inside the component
  const mgr = useMemo(() => new ExtendedBackupManager(), []);

  // Notification callback for BackupManager
  const notify = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage({ text, type });

    // Update backup status for button state, etc.
    if (text.toLowerCase().includes('backup successful')) setBackupStatus('success');
    else if (text.toLowerCase().includes('backup failed')) setBackupStatus('error');
    else if (text.toLowerCase().includes('retrying')) setBackupStatus('retrying');
    else if (text.toLowerCase().includes('starting backup')) setBackupStatus('saving');
    else if (text.toLowerCase().includes('already in progress')) setBackupStatus('saving');
  };

  useEffect(() => {
    if (!backupManagerRef.current) {
      backupManagerRef.current = new BackupManager(performBackup ?? (async () => {}), notify);
    }
  }, [performBackup]);

  // Debounced auto-save trigger (e.g., on user typing)
  const debouncedBackup = useRef(
    // Replace lodash debounce with native implementation
    ((fn, delay) => {
      let timer: NodeJS.Timeout | null = null;
      return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fn, delay);
      };
    })(() => {
      backupManagerRef.current?.backup();
    }, 3000),
  ).current;

  // Call this in your text change handler:
  function onUserInputChange() {
    debouncedBackup();
  }

  const manualBackup = () => {
    backupManagerRef.current?.backup();
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Backup & Auto-Save</h2>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={async () => {
          setStatus('Exporting…');
          const b = await mgr.createBackup();
          downloadJson(
            b,
            `inkwell-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.json`,
          );
          setStatus('Done');
        }}
        disabled={status === 'Exporting…' || status === 'Restoring…'}
      >
        Back Up Now
      </button>
      <input
        type="file"
        accept="application/json"
        className="mt-2"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setStatus('Restoring…');
          const text = await file.text();
          try {
            // Use schema validation and error handling from ExtendedBackupManager
            const result = await mgr.restoreBackup(JSON.parse(text), { strategy: 'prompt' });
            setRestoreResults(result);
            setStatus('Done');
            setMessage({ text: 'Restore completed.', type: 'success' });
          } catch (err: any) {
            setStatus('Error');
            setMessage({ text: err.message || 'Restore failed.', type: 'error' });
          }
        }}
      />
      <p className="mt-3 font-medium" role="status" aria-live="polite">
        {status}
      </p>
      <p
        className={`mt-3 font-medium ${
          message.type === 'success'
            ? 'text-green-600'
            : message.type === 'error'
              ? 'text-red-600'
              : 'text-gray-700'
        }`}
        role="status"
        aria-live="polite"
      >
        {message.text}
      </p>
      {restoreResults && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <h3 className="font-semibold mb-1">Restore Summary</h3>
          <ul className="list-disc ml-5 text-sm">
            <li>Projects restored: {restoreResults.projects}</li>
            <li>Chapters restored: {restoreResults.chapters}</li>
            <li>Settings restored: {restoreResults.settings}</li>
            <li>Skipped: {restoreResults.skipped}</li>
            <li>Conflicts: {restoreResults.conflicted}</li>
          </ul>
        </div>
      )}
      {/* Example textarea to simulate user input */}
      <textarea
        className="w-full mt-4 p-2 border rounded"
        rows={4}
        placeholder="Type here to auto-save..."
        onChange={onUserInputChange}
        aria-label="Content editor with auto-save"
      />
    </div>
  );
}
