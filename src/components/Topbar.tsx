import React, { useCallback, useState } from 'react';

import { AccountMenu } from '@/components/Modals/AccountMenu';
import { ShortcutsModal } from '@/components/Modals/ShortcutsModal';
import { NotificationsPanel } from '@/components/NotificationsPanel';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenNotifications,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleTheme,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleClaude,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const { isFocusMode: _isFocusMode, toggleFocusMode: _toggleFocusMode } = useFocusMode();
  const { project } = useCurrentProject();
  const { open: openPalette } = useCommandPalette();

  const effectiveName = projectName ?? project?.name ?? 'Inkwell';

  const _handleSaveSnapshot = useCallback(async () => {
    if (!project) return;
    await snapshotService.makeSnapshot(project, { label: 'Manual Snapshot' });
    // Optionally trigger a toast if your app exposes one via context
    // toast({ title: 'Snapshot saved' });
  }, [project]);

  const renderSaveStatus = () => {
    if (autoSave.isSaving) {
      return (
        <div className="flex items-center gap-1 text-xs text-white/90" aria-live="polite">
          <div className="w-3 h-3 border border-white/90 border-t-transparent rounded-full animate-spin" />
          <span>Saving…</span>
        </div>
      );
    }

    if (autoSave.error) {
      return (
        <div className="text-xs text-red-300" title={autoSave.error} aria-live="polite">
          Save failed
        </div>
      );
    }

    if (autoSave.lastSaved) {
      return (
        <div
          className="text-xs text-[#CDAA47]"
          title={`Saved at ${formatTime(autoSave.lastSaved)}`}
          aria-live="polite"
        >
          Saved {getTimeAgo(autoSave.lastSaved)}
        </div>
      );
    }

    return <div className="text-xs text-white/70">Ready</div>;
  };

  return (
    <header
      data-tour-id="topbar"
      className="Topbar sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-[#1C3A63] bg-[#0F2D52]/95 backdrop-blur text-white"
    >
      {/* Left: project name */}
      <div className="text-sm font-medium truncate text-white" title={effectiveName}>
        {effectiveName}
      </div>

      {/* Right: status pill, user account, buttons */}
      <div className="flex items-center gap-2">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
          <div className="w-2 h-2 bg-[#CDAA47] rounded-full"></div>
          <span className="text-xs text-white/90">{renderSaveStatus()}</span>
        </div>

        {/* Account Button */}
        <button
          onClick={() => setOpenAccount(true)}
          className="topbar-btn text-white hover:bg-white/10 px-3 py-1 rounded-md transition-colors"
        >
          <Avatar initials="D" />
          <span>Dave Hail</span>
        </button>

        {/* Keyboard shortcuts */}
        <button
          onClick={() => setOpenShortcuts(true)}
          className="topbar-icon text-white hover:bg-white/10 p-2 rounded-md transition-colors"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (⌘K)"
          data-tour-id="help-tour-button"
        >
          ⌘
        </button>

        {/* Command Palette */}
        <button
          onClick={openPalette}
          className="topbar-icon text-white hover:bg-white/10 p-2 rounded-md transition-colors"
          aria-label="Command Palette"
          title="Command Palette (⌘K)"
        >
          🔍
        </button>

        {/* Notifications */}
        <button
          onClick={() => setOpenNotifications(true)}
          className="topbar-icon text-white hover:bg-white/10 p-2 rounded-md transition-colors"
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
