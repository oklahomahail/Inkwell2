// File: src/components/Sidebar.tsx
import { ChevronDown, ChevronRight, Plus, Settings2 } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { InkwellFeather } from '@/components/icons/InkwellFeather';
import BookBuilderModal from '@/components/Sections/BookBuilderModal';
import { Logo } from '@/components/ui/Logo';
import {
  VirtualizedSectionList,
  useSectionKeyboardNavigation,
} from '@/components/Writing/VirtualizedSectionList';
import { useAppContext } from '@/context/AppContext';
import { useSections } from '@/hooks/useSections';
import { useUI } from '@/hooks/useUI';
import { getSectionIcon, getSectionIconColor } from '@/lib/sectionIcons';
import { cn } from '@/lib/utils';
import type { Section } from '@/types/section';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { state, setView, currentProject } = useAppContext();
  const activeView = state.view;
  const [sectionsExpanded, setSectionsExpanded] = useState(true);
  const [showBookBuilder, setShowBookBuilder] = useState(false);

  // Get sections for the current project
  const { sections, activeId, setActive, createSection } = useSections(currentProject?.id || '');

  // Enable keyboard navigation for sections
  const handleSetActive = useCallback(
    (sectionId: string) => {
      setActive(sectionId);
      setView('writing' as any);
    },
    [setActive, setView],
  );

  useSectionKeyboardNavigation(sections, activeId, handleSetActive);

  // Render individual section item
  const renderSectionItem = useCallback(
    (section: Section) => {
      const SectionIcon = getSectionIcon(section.type);
      const iconColor = getSectionIconColor(section.type);

      return (
        <button
          key={section.id}
          onClick={() => handleSetActive(section.id)}
          className={cn(
            'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm transition-colors group',
            section.id === activeId
              ? 'bg-primary-500 text-white font-medium'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          )}
          title={section.title}
        >
          <SectionIcon
            className={cn(
              'w-3 h-3 flex-shrink-0',
              section.id === activeId ? 'text-white' : iconColor,
            )}
          />
          <span className="truncate flex-1">{section.title}</span>
        </button>
      );
    },
    [activeId, handleSetActive],
  );

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'writing', label: 'Writing', icon: 'writing' },
    { key: 'planning', label: 'Planning', icon: 'planning' },
    { key: 'timeline', label: 'Timeline', icon: 'timeline' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
    { key: 'formatting', label: 'Formatting', icon: 'type' }, // v0.10.0 - Document Formatting
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
      <div className="p-4 flex items-center justify-center" data-spotlight-id="sidebar.logo">
        {/* Brand Logo */}
        {sidebarCollapsed ? (
          <Logo size={32} className="shrink-0" />
        ) : (
          <img src="/brand/2.svg" alt="Inkwell" className="h-10 w-auto max-w-[200px]" />
        )}
      </div>
      <button
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggleSidebar}
        className={cn(
          'mx-2 mb-2 p-2 rounded hover:bg-slate-800 text-slate-300',
          sidebarCollapsed ? 'self-center' : 'self-end',
        )}
      >
        <InkwellFeather
          name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'}
          size="sm"
          className="shrink-0"
        />
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
              <InkwellFeather
                name={icon}
                size="sm"
                data-testid={`icon-${key}`}
                data-size="sm"
                className="shrink-0"
              />
              {!sidebarCollapsed ? label : null}
              {key === 'writing' && !sidebarCollapsed && sections.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSectionsExpanded(!sectionsExpanded);
                  }}
                  className="ml-auto p-1 hover:bg-slate-800 rounded"
                >
                  {sectionsExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
            </button>

            {/* Section list under Writing tab */}
            {key === 'writing' && !sidebarCollapsed && sectionsExpanded && (
              <div className="ml-6 mt-1">
                {sections.length === 0 ? (
                  <div className="text-xs text-slate-500 px-2 py-1">No sections yet</div>
                ) : (
                  <VirtualizedSectionList
                    sections={sections}
                    activeId={activeId}
                    renderItem={renderSectionItem}
                    itemHeight={36} // Matches py-1.5 + text size
                    virtualizationThreshold={50}
                    className="space-y-1 max-h-[calc(100vh-400px)] pr-2"
                    onActiveChange={handleSetActive}
                  />
                )}

                {/* Section Management Actions */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => createSection('New Chapter', 'chapter')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                    title="Add new chapter"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                  <button
                    onClick={() => setShowBookBuilder(true)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                    title="Open Book Builder"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Book Builder Modal */}
      {currentProject && (
        <BookBuilderModal
          isOpen={showBookBuilder}
          onClose={() => setShowBookBuilder(false)}
          projectId={currentProject.id}
        />
      )}
    </aside>
  );
};
