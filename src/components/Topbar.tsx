// src/components/Topbar.tsx
import React from 'react';

type TopbarProps = {
  onOpenNotifications?: () => void;
  onToggleTheme?: () => void;
  onToggleClaude?: () => void;
  theme?: 'light' | 'dark';
  projectName?: string;
};

export default function Topbar({
  onOpenNotifications,
  onToggleTheme,
  onToggleClaude,
  theme,
  projectName,
}: TopbarProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
      <div className="text-sm font-medium truncate">{projectName ?? 'Inkwell'}</div>
      <div className="flex items-center gap-2">
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
