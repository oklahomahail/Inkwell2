// src/components/Sidebar.tsx
import React from 'react';
import { Home, Book as _Book, Settings, BarChart3, Clock, PenTool, BookOpen } from 'lucide-react';
import { useAppContext, View } from '@/context/AppContext';
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

  const handleViewChange = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });

    if (view === View.Writing) {
      setTimeout(focusWritingEditor, 100);
    }
  };

  return (
    <aside className="h-full w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white text-lg font-semibold">
        Navigation
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
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Debug info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        Current: {state.view}
        <br />
        Project: {state.currentProjectId ?? 'None'}
      </div>
    </aside>
  );
}
