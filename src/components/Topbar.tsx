import React, { useCallback } from 'react';

import { useFocusMode } from '@/hooks/useFocusMode';
import { useAppContext } from '@/context/AppContext';
import snapshotService from '@/services/snapshotAdapter';
import { useCurrentProject } from '@/context/AppContext';

export type TopbarProps = {
  onOpenNotifications?: () => void;
  onToggleTheme?: () => void;
  onToggleClaude?: () => void;
  theme?: 'light' | 'dark';
  projectName?: string;
};

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return formatTime(date);
}

export default function Topbar({
  onOpenNotifications,
  onToggleTheme,
  onToggleClaude,
  theme,
  projectName,
}: TopbarProps) {
  // Real auto-save state
  const { state } = useAppContext();
  const { autoSave } = state;
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const { project } = useCurrentProject();

  const effectiveName = projectName ?? project?.name ?? 'Inkwell';

  const handleSaveSnapshot = useCallback(async () => {
    if (!project) return;
    await snapshotService.makeSnapshot(project, { label: 'Manual Snapshot' });
    // Optionally trigger a toast if your app exposes one via context
    // toast({ title: 'Snapshot saved' });
  }, [project]);

  const renderSaveStatus = () => {
    if (autoSave.isSaving) {
      return (
        <div
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"
          aria-live="polite"
        >
          <div className="w-3 h-3 border border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Saving…</span>
        </div>
      );
    }

    if (autoSave.error) {
      return (
        <div
          className="text-xs text-red-600 dark:text-red-400"
          title={autoSave.error}
          aria-live="polite"
        >
          Save failed
        </div>
      );
    }

    if (autoSave.lastSaved) {
      return (
        <div
          className="text-xs text-green-600 dark:text-green-400"
          title={`Saved at ${formatTime(autoSave.lastSaved)}`}
          aria-live="polite"
        >
          Saved {getTimeAgo(autoSave.lastSaved)}
        </div>
      );
    }

    return <div className="text-xs text-slate-600 dark:text-slate-400">Ready</div>;
  };

  return (
    <header className="Topbar flex items-center justify-between h-12 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
      {/* Left: project name */}
      <div className="text-sm font-medium truncate" title={effectiveName}>
        {effectiveName}
      </div>

      {/* Right: save status, snapshot, focus toggle, theme/Claude/notifications */}
      <div className="flex items-center gap-3">
        {/* Enhanced save status */}
        <div className="min-w-[110px] text-right">{renderSaveStatus()}</div>

        {/* Save Snapshot */}
        <button
          onClick={handleSaveSnapshot}
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Save a manual snapshot"
        >
          Save Snapshot
        </button>

        {/* Focus toggle */}
        <button
          onClick={toggleFocusMode}
          className={`px-2 py-1 text-sm border rounded-lg transition-colors ${
            isFocusMode
              ? 'border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          aria-pressed={isFocusMode}
          title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </button>

        {/* Theme toggle */}
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        {/* Claude toggle */}
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onToggleClaude}
          title="Toggle Claude assistant"
        >
          Claude
        </button>

        {/* Notifications */}
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onOpenNotifications}
          title="Open notifications"
        >
          Notifications
        </button>
      </div>
    </header>
  );
}
