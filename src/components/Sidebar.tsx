// src/components/Sidebar.tsx
import {
  Home,
  Settings,
  BarChart3,
  Clock,
  PenTool,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React from 'react';

import { Brand } from '@/components/Brand/Brand';
import { useAppContext, View } from '@/context/AppContext';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/utils/cn';
import { focusWritingEditor } from '@/utils/focusUtils';

const sidebarLinks = [
  { view: View.Dashboard, label: 'Dashboard', icon: Home },
  { view: View.Writing, label: 'Writing', icon: PenTool },
  { view: View.Planning, label: 'Planning', icon: BookOpen }, // ✨ NEW: Added Planning
  { view: View.Timeline, label: 'Timeline', icon: Clock },
  { view: View.Analysis, label: 'Analytics', icon: BarChart3 },
  { view: View.Settings, label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { state, dispatch } = useAppContext();
  const { sidebarCollapsed, toggleSidebar } = useUI();

  const handleViewChange = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });

    if (view === View.Writing) {
      setTimeout(focusWritingEditor, 100);
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-[color:var(--ink-sidebar-bg)] transition-[width] duration-200 border-r border-gray-200 dark:border-gray-700 flex flex-col',
        sidebarCollapsed ? 'w-14' : 'w-64',
      )}
      aria-expanded={!sidebarCollapsed}
    >
      {/* Brand Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-hidden">
        <Brand collapsed={sidebarCollapsed} />

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-3 -right-3 h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>

      <nav className="p-4 flex-1 space-y-1">
        {sidebarLinks.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md w-full text-left transition',
              state.view === view
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
            )}
            title={sidebarCollapsed ? label : ''}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Debug info */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          Current: {state.view}
          <br />
          Project: {state.currentProjectId ?? 'None'}
        </div>
      )}
    </aside>
  );
}
