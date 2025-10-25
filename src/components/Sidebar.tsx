// File: src/components/Sidebar.tsx
import React, { useMemo } from 'react';

import { InkwellFeather } from '@/components/icons';
import { View } from '@/context/AppContext';
import { useAppContext } from '@/context/AppContext';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';
import { _focusWritingEditor } from '@/utils/focusUtils';

export const Sidebar: React.FC = () => {
  const { state, setView } = useAppContext();
  const { view } = state;
  const { sidebarCollapsed, toggleSidebar } = useUI();

  const navLinks = useMemo(() => {
    return [
      { key: View.Dashboard, label: 'Dashboard', iconName: 'dashboard' },
      { key: View.Writing, label: 'Writing', iconName: 'writing' },
      { key: View.Planning, label: 'Planning', iconName: 'planning' },
      { key: View.Timeline, label: 'Timeline', iconName: 'timeline' },
      { key: View.Plot, label: 'Plot Analysis', iconName: 'analytics' },
      { key: View.Analytics, label: 'Analytics', iconName: 'analytics' },
      { key: View.Settings, label: 'Settings', iconName: 'settings' },
    ];
  }, []);

  const handleChangeView = (view: View) => {
    setView(view);
    if (view === View.Writing) _focusWritingEditor();
  };

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'flex h-full flex-col border-r border-subtle bg-surface-2 text-text-2 px-2 pb-4 pt-8',
        sidebarCollapsed ? 'w-14' : 'w-64',
      )}
      data-collapsed={sidebarCollapsed}
    >
      <button
        onClick={toggleSidebar}
        aria-label="Collapse sidebar"
        className="mb-8 self-end rounded-md p-2 hover:bg-gray-100"
      >
        <InkwellFeather name="sidebar-collapse" size="sm" className="shrink-0" />
      </button>
      <nav aria-label="Primary" className="flex-1 space-y-1 pt-1">
        <ul>
          {navLinks.map(({ key, label, iconName }) => {
            const isActive = view === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm',
                    'text-text-2 hover:bg-ink-50 hover:text-ink-700',
                    isActive ? 'bg-ink-50 text-ink-700 font-medium' : '',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleChangeView(key as View)}
                >
                  <InkwellFeather
                    name={iconName}
                    size={iconName === 'planning' ? 'sm' : 'md'}
                    className={cn('shrink-0', isActive ? 'text-ink-700' : 'text-ink-600')}
                  />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
