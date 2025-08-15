// src/components/Topbar.tsx - Updated with real auto-save status
import React from 'react';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useAppContext } from '@/context/AppContext';

type TopbarProps = {
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
  // 🆕 GET REAL AUTO-SAVE STATE
  const { state } = useAppContext();
  const { autoSave } = state;
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  // 🆕 RENDER SAVE STATUS WITH REAL DATA
  const renderSaveStatus = () => {
    if (autoSave.isSaving) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Saving...</span>
        </div>
      );
    }

    if (autoSave.error) {
      return (
        <div className="text-xs text-red-600 dark:text-red-400" title={autoSave.error}>
          Save failed
        </div>
      );
    }

    if (autoSave.lastSaved) {
      return (
        <div
          className="text-xs text-green-600 dark:text-green-400"
          title={`Saved at ${formatTime(autoSave.lastSaved)}`}
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
      <div className="text-sm font-medium truncate">{projectName ?? 'Inkwell'}</div>

      {/* Right: save status, focus toggle, existing controls */}
      <div className="flex items-center gap-3">
        {/* 🆕 ENHANCED SAVE STATUS */}
        <div className="min-w-[100px] text-right">{renderSaveStatus()}</div>

        {/* Focus toggle */}
        <button
          onClick={toggleFocusMode}
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-pressed={isFocusMode}
          title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </button>

        {/* Existing controls */}
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onToggleClaude}
        >
          Claude
        </button>
        <button
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={onOpenNotifications}
        >
          Notifications
        </button>
      </div>
    </header>
  );
}
