// File: src/components/Sidebar.tsx
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { InkwellFeather } from '@/components/icons/InkwellFeather';
import { useAppContext } from '@/context/AppContext';
import { useChaptersHybrid } from '@/hooks/useChaptersHybrid';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { state, setView, currentProject } = useAppContext();
  const activeView = state.view;
  const [chaptersExpanded, setChaptersExpanded] = useState(true);

  // Get chapters for the current project
  const { chapters, activeId, setActive } = useChaptersHybrid(currentProject?.id || '');

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
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto" role="navigation">
        {navItems.map(({ key, label, icon }) => (
          <div key={key}>
            <button
              data-tour={key === 'settings' ? 'settings' : `${key}-nav`}
              className={cn(
                'nav-item flex items-center gap-2 w-full',
                activeView === key && 'bg-ink-50 text-ink-700 font-medium',
                sidebarCollapsed && 'justify-center',
              )}
              onClick={() => setView(key as any)}
            >
              <InkwellFeather name={icon} size="sm" data-testid={`icon-${key}`} data-size="sm" />
              {!sidebarCollapsed ? label : null}
              {key === 'writing' && !sidebarCollapsed && chapters.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChaptersExpanded(!chaptersExpanded);
                  }}
                  className="ml-auto p-1 hover:bg-slate-800 rounded"
                >
                  {chaptersExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
            </button>

            {/* Chapter list under Writing tab */}
            {key === 'writing' && !sidebarCollapsed && chaptersExpanded && chapters.length > 0 && (
              <div className="ml-8 mt-1 space-y-1">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setActive(chapter.id);
                      setView('writing' as any);
                    }}
                    className={cn(
                      'block w-full text-left px-2 py-1.5 rounded text-sm truncate transition-colors',
                      chapter.id === activeId
                        ? 'bg-primary-500 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    )}
                    title={chapter.title || 'Untitled Chapter'}
                  >
                    {chapter.title || 'Untitled Chapter'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
