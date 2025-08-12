// src/components/Layout.tsx
import React from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useFocusMode } from '@/hooks/useFocusMode';
import { cn } from '@/utils/cn';

type LayoutProps = {
  children: React.ReactNode;
  projectName?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onToggleClaude?: () => void;
  onOpenNotifications?: () => void;
};

export default function Layout({
  children,
  projectName,
  theme,
  onToggleTheme,
  onToggleClaude,
  onOpenNotifications,
}: LayoutProps) {
  const { isFocusMode } = useFocusMode();

  return (
    <div
      className={cn(
        isFocusMode ? 'focus-mode' : '',
        'min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100',
      )}
    >
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'Sidebar h-full w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur',
            isFocusMode && 'hidden',
          )}
        >
          <Sidebar />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <div className={cn('Topbar', isFocusMode && 'hidden')}>
            <Topbar
              projectName={projectName}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onToggleClaude={onToggleClaude}
              onOpenNotifications={onOpenNotifications}
            />
          </div>

          {/* Content */}
          <main
            className={cn(
              'WritingArea relative flex-1 overflow-auto',
              // comfortable padding; reduced when chrome is hidden
              isFocusMode ? 'p-4 md:p-6 lg:p-8' : 'p-4 md:p-6',
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
