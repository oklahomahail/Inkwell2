// src/components/Topbar.tsx
import React from 'react';
import { useFocusMode } from '@/hooks/useFocusMode';

type TopbarProps = {
  onOpenNotifications?: () => void;
  onToggleTheme?: () => void;
  onToggleClaude?: () => void;
  theme?: 'light' | 'dark';
  projectName?: string;
};

function formatTime(ts?: number | string | Date) {
  if (!ts) return '';
  const d = typeof ts === 'number' || typeof ts === 'string' ? new Date(ts) : ts;
  try {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function Topbar({
  onOpenNotifications,
  onToggleTheme,
  onToggleClaude,
  theme,
  projectName,
}: TopbarProps) {
  // TEMP: Replace with real save tracking when available
  const isSaving = false;
  const lastSavedAt = Date.now();

  const { isFocusMode, toggleFocusMode } = useFocusMode();

  return (
    <header className="Topbar flex items-center justify-between h-12 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
      {/* Left: project name */}
      <div className="text-sm font-medium truncate">{projectName ?? 'Inkwell'}</div>

      {/* Right: save status, focus toggle, existing controls */}
      <div className="flex items-center gap-2">
        {/* Save status */}
        <div className="text-xs text-slate-600 dark:text-slate-400 mr-2 min-w-[110px] text-right">
          {isSaving ? 'Saving…' : lastSavedAt ? `Saved ${formatTime(lastSavedAt)}` : '—'}
        </div>

        {/* Focus toggle */}
        <button
          onClick={toggleFocusMode}
          className="px-2 py-1 text-sm border rounded-lg"
          aria-pressed={isFocusMode}
          title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </button>

        {/* Existing controls */}
        <button className="px-2 py-1 text-sm border rounded-lg" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className="px-2 py-1 text-sm border rounded-lg" onClick={onToggleClaude}>
          Claude
        </button>
        <button className="px-2 py-1 text-sm border rounded-lg" onClick={onOpenNotifications}>
          Notifications
        </button>
      </div>
    </header>
  );
}
