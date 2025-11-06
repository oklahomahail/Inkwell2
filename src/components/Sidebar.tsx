// File: src/components/Sidebar.tsx
import React from 'react';

import { InkwellFeather } from '@/components/icons/InkwellFeather';
import { useAppContext } from '@/context/AppContext';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { state, setView } = useAppContext();
  const activeView = state.view;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'writing', label: 'Writing', icon: 'writing' },
    { key: 'planning', label: 'Planning', icon: 'planning' },
    { key: 'timeline', label: 'Timeline', icon: 'timeline' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-slate-900 flex flex-col',
        sidebarCollapsed ? 'w-14' : 'w-64',
      )}
      data-tour="sidebar"
      data-testid="sidebar"
      data-collapsed={sidebarCollapsed}
    >
      <div className="p-4 flex items-center space-x-2" data-spotlight-id="sidebar.logo">
        {/* Logo and title */}
        <img src="/brand/inkwell-icon.svg" alt="Inkwell" className="h-8 w-8" />
        {!sidebarCollapsed && <span className="text-slate-100 font-semibold text-lg">Inkwell</span>}
      </div>
      <button
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggleSidebar}
        className={cn(
          'mx-2 mb-2 p-2 rounded hover:bg-slate-800 text-slate-300',
          sidebarCollapsed ? 'self-center' : 'self-end',
        )}
      >
        <InkwellFeather name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size="sm" />
      </button>
      <nav className="flex-1 px-3 space-y-1 mt-4" role="navigation">
        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            data-tour={key === 'settings' ? 'settings' : `${key}-nav`}
            className={cn(
              'nav-item flex items-center gap-2',
              activeView === key && 'bg-ink-50 text-ink-700 font-medium',
              sidebarCollapsed && 'justify-center',
            )}
            onClick={() => setView(key as any)}
          >
            <InkwellFeather name={icon} size="sm" data-testid={`icon-${key}`} data-size="sm" />
            {!sidebarCollapsed ? label : null}
          </button>
        ))}
      </nav>
    </aside>
  );
};
