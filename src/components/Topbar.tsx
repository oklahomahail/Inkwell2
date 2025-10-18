import React, { useCallback, useState } from 'react';

import { AccountMenu } from '@/components/Modals/AccountMenu';
import { NotificationsPanel } from '@/components/Modals/NotificationsPanel';
import { ShortcutsModal } from '@/components/Modals/ShortcutsModal';
import { Avatar } from '@/components/ui/Avatar';
import { useAppContext } from '@/context/AppContext';
import { useCurrentProject } from '@/context/AppContext';
import { useCommandPalette } from '@/context/CommandPaletteContext';
import { useFocusMode } from '@/hooks/useFocusMode';
import snapshotService from '@/services/snapshotAdapter';

// Modal components

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
  // Modal states
  const [openAccount, setOpenAccount] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  // Real auto-save state
  const { state } = useAppContext();
  const { autoSave } = state;
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const { project } = useCurrentProject();
  const { open: openPalette } = useCommandPalette();

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

      {/* Right: status pill, user account, buttons */}
      <div className="flex items-center gap-2">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-slate-600 dark:text-slate-300">{renderSaveStatus()}</span>
        </div>

        {/* Account Button */}
        <button onClick={() => setOpenAccount(true)} className="topbar-btn">
          <Avatar initials="D" />
          <span>Dave Hail</span>
        </button>

        {/* Keyboard shortcuts */}
        <button
          onClick={() => setOpenShortcuts(true)}
          className="topbar-icon"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (⌘K)"
        >
          ⌘
        </button>

        {/* Command Palette */}
        <button
          onClick={openPalette}
          className="topbar-icon"
          aria-label="Command Palette"
          title="Command Palette (⌘K)"
        >
          🔍
        </button>

        {/* Notifications */}
        <button
          onClick={() => setOpenNotifications(true)}
          className="topbar-icon"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
        </button>
      </div>

      {/* Modals */}
      {openAccount && <AccountMenu onClose={() => setOpenAccount(false)} />}
      {openShortcuts && <ShortcutsModal onClose={() => setOpenShortcuts(false)} />}
      {openNotifications && <NotificationsPanel onClose={() => setOpenNotifications(false)} />}
    </header>
  );
}
