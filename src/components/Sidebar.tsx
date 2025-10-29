// File: src/components/Sidebar.tsx
import React from 'react';

import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, openNewProjectDialog } = useUI();

  return (
    <aside
      className={cn('fixed left-0 top-0 z-40 h-full w-64 bg-slate-900 flex flex-col')}
      data-spotlight-id="sidebar.container"
      data-testid="sidebar"
      data-tour-id="sidebar"
      data-collapsed={sidebarCollapsed}
    >
      <div className="p-4 flex items-center space-x-2" data-spotlight-id="sidebar.logo">
        {/* Logo and title */}
        <img src="/inkwell-logo-icon-64.png" alt="Inkwell" className="h-8 w-8" />
        <span className="text-slate-100 font-semibold text-lg">Inkwell</span>
      </div>
      <nav className="flex-1 px-3 space-y-1 mt-4">
        <button data-spotlight-id="sidebar.dashboard" className="nav-item">
          Dashboard
        </button>
        <button data-spotlight-id="sidebar.writing" className="nav-item">
          Writing
        </button>
        <button data-spotlight-id="sidebar.planning" className="nav-item">
          Planning
        </button>
        <button data-spotlight-id="sidebar.timeline" className="nav-item">
          Timeline
        </button>
        <button data-spotlight-id="sidebar.analytics" className="nav-item">
          Analytics
        </button>
        <button data-spotlight-id="sidebar.settings" className="nav-item">
          Settings
        </button>
      </nav>
      <div className="p-3 border-t border-slate-700">
        <button
          data-spotlight-id="sidebar.newProject"
          onClick={openNewProjectDialog}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          + New Project
        </button>
      </div>
    </aside>
  );
};
