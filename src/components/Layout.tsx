// src/components/Layout.tsx
import React from 'react';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useUI } from '@/hooks/useUI';
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
  const { sidebarCollapsed } = useUI();

  return (
    <div
      className={cn(
        isFocusMode ? 'focus-mode' : '',
        'min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100',
      )}
    >
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar - rendered but positioned fixed */}
        {!isFocusMode && <Sidebar />}

        {/* Main column with responsive margin */}
        <main
          className={cn(
            'transition-[margin-left] duration-200 min-h-screen flex-1',
            !isFocusMode && (sidebarCollapsed ? 'ml-14' : 'ml-64'),
          )}
        >
          {/* Topbar */}
          <div className={cn('Topbar', isFocusMode && 'hidden')}>
            <Topbar
              projectName={projectName}
              _theme={theme}
              _onToggleTheme={onToggleTheme}
              _onToggleClaude={onToggleClaude}
              _onOpenNotifications={onOpenNotifications}
            />
          </div>

          {/* Content */}
          <div
            className={cn(
              'WritingArea relative flex-1 overflow-auto',
              // comfortable padding; reduced when chrome is hidden
              isFocusMode ? 'p-4 md:p-6 lg:p-8' : 'p-4 md:p-6',
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
