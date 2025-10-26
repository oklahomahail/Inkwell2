// File: src/components/Sidebar.tsx
import { PlusCircle } from 'lucide-react';
import React, { useMemo, useCallback, useRef } from 'react';

import { InkwellFeather } from '@/components/icons';
import { View } from '@/context/AppContext';
import { useAppContext } from '@/context/AppContext';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';
import { _focusWritingEditor } from '@/utils/focusUtils';
import { preload } from '@/utils/preload';
import { triggerOnProjectCreated } from '@/utils/tourTriggers';

export const Sidebar: React.FC = () => {
  const { state, setView, addProject, setCurrentProjectId } = useAppContext();
  const { view } = state;
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const createProjectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleCreateProject = useCallback(() => {
    // Debounce to prevent double creates on rapid clicks
    if (createProjectTimeoutRef.current) {
      return;
    }

    createProjectTimeoutRef.current = setTimeout(() => {
      createProjectTimeoutRef.current = null;
    }, 1000);

    const newProject = {
      id: `project-${Date.now()}`,
      name: `New Story ${state.projects.length + 1}`,
      description: 'A new fiction project',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addProject({ ...newProject, chapters: [], characters: [], beatSheet: [] });
    setCurrentProjectId(newProject.id);
    setView(View.Dashboard);

    // Fire tour trigger for project creation
    triggerOnProjectCreated(newProject.id);
  }, [state.projects.length, addProject, setCurrentProjectId, setView]);

  return (
    <aside
      data-testid="sidebar"
      data-tour-id="sidebar"
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
                  data-tour-id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm',
                    'text-text-2 hover:bg-ink-50 hover:text-ink-700',
                    isActive ? 'bg-ink-50 text-ink-700 font-medium' : '',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleChangeView(key as View)}
                  onMouseEnter={() => {
                    // Preload heavy panels on hover
                    if (key === View.Plot) {
                      preload(() => import('@/services/plotAnalysis/components/PlotAnalysisPanel'));
                    }
                  }}
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

      {/* New Project Button */}
      {!sidebarCollapsed && (
        <div className="mt-auto pt-4 border-t border-subtle">
          <button
            onClick={handleCreateProject}
            data-tour-id="sidebar-new-project"
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-2 hover:bg-ink-50 hover:text-ink-700"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span>New Project</span>
          </button>
        </div>
      )}
    </aside>
  );
};
