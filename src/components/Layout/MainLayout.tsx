// src/components/Layout/MainLayout.tsx
import {
  Home,
  PenTool,
  Clock,
  BarChart3,
  Settings,
  Menu,
  Search,
  Bell,
  Command,
  Plus,
  Kanban,
  Palette,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { InkwellLogo } from '@/components/Brand';
import { InkwellFeather } from '@/components/icons/InkwellFeather';
import { useFeatureFlag } from '@/config/features';
import { useAppContext, View } from '@/context/AppContext';
import { useCommands } from '@/hooks/useCommands';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { cn } from '@/utils/cn';

import { CommandPalette } from '../CommandPalette/CommandPalette';
import NotificationsPanel from '../NotificationsPanel';
import { ProfileSwitcher } from '../ProfileSwitcher';
import { PWAOfflineIndicator } from '../PWA';
import { SmartSearchModal } from '../Search/SmartSearchModal';

import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const baseNavigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    view: View.Dashboard,
    shortcut: '⌘1',
    description: 'Overview and project management',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    view: View.Writing,
    shortcut: '⌘2',
    description: 'Text editor and writing tools',
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: InkwellFeather,
    view: View.Planning,
    shortcut: '⌘3',
    description: 'Story structure and outlines',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    view: View.Timeline,
    shortcut: '⌘4',
    description: 'Project timeline and milestones',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    view: View.Analysis,
    shortcut: '⌘5',
    description: 'Writing statistics and insights',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    view: View.Settings,
    shortcut: '⌘,',
    description: 'Application preferences',
  },
];

// Brand-specific navigation items (dev/admin only)
const _brandNavigationItems = [
  {
    id: 'brand',
    label: 'Brand System',
    icon: Palette,
    href: '/brand',
    shortcut: '⌘⇧B',
    description: 'Design system and brand showcase',
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const { state, dispatch } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Command Palette
  const commands = useCommands(undefined, (commandId) => {
    console.log(`Executed command: ${commandId}`);
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Smart Search
  const smartSearch = useSmartSearch({
    onNavigate: (result) => {
      console.log('Navigate to:', result);
      // Add navigation logic based on result type
    },
  });

  // Feature flags
  const isPlotBoardsEnabled = useFeatureFlag('plotBoards');

  // Dynamic navigation items based on feature flags
  const navigationItems = React.useMemo(() => {
    const items = [...baseNavigationItems];

    // Insert PlotBoards after Planning if enabled
    if (isPlotBoardsEnabled) {
      const planningIndex = items.findIndex((item) => item.id === 'planning');
      const plotBoardsItem = {
        id: 'plotboards',
        label: 'Plot Boards',
        icon: Kanban,
        view: View.PlotBoards,
        shortcut: '⌘6',
        description: 'Kanban-style plot and scene organization (Experimental)',
      };
      items.splice(planningIndex + 1, 0, plotBoardsItem);

      // Update shortcut numbers for items after Plot Boards
      items.forEach((item, _index) => {
        if (item.id === 'timeline') item.shortcut = '⌘7';
        else if (item.id === 'analytics') item.shortcut = '⌘8';
      });
    }

    return items;
  }, [isPlotBoardsEnabled]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('inkwell-sidebar-collapsed');
    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Command Palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Bell notifications with Cmd+Shift+N
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'n') {
        event.preventDefault();
        setShowNotifications((prev) => !prev);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest('[data-notifications-panel]') &&
        !target.closest('[data-notifications-trigger]')
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleViewChange = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('inkwell-sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  return (
    <div
      className={cn('main-layout', className)}
      style={{
        // 16rem = 256px expanded; 4rem = 64px rail
        ['--sidebar-w' as any]: sidebarCollapsed ? '4rem' : '16rem',
      }}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar',
          'fixed left-0 top-0 h-full z-40',
          'transition-[width] duration-300 ease-out',
          'bg-white',
          'border-r border-inkwell-gold/20',
          'overflow-x-hidden', // Prevent content overflow
        )}
        style={{ width: 'var(--sidebar-w)' }}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header relative p-4 border-b border-inkwell-gold/20 bg-inkwell-navy">
          <div className="flex items-center">
            {/* Brand icon - always visible */}
            <div className="flex-shrink-0">
              <InkwellLogo variant="mark" size="sm" className="text-inkwell-gold" />
            </div>

            {/* Wordmark - hidden when collapsed */}
            <div
              className={cn(
                'wordmark-transition',
                'ml-2 transition-all duration-300 ease-out overflow-hidden',
                sidebarCollapsed
                  ? 'w-0 opacity-0 pointer-events-none'
                  : 'w-auto opacity-100',
              )}
            >
              <span className="font-serif font-semibold tracking-wide text-white whitespace-nowrap">
                Inkwell
              </span>
              <div className="flex flex-col">
                <p className="text-xs text-inkwell-gold/80 truncate">
                  {currentProject?.name || 'Select a project'}
                </p>
              </div>
            </div>
          </div>

          {/* Always-visible hamburger, positioned outside the shrinking area */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'sidebar-toggle',
              'absolute -right-3 top-1/2 -translate-y-1/2',
              'w-8 h-8 rounded-full shadow-md border bg-white',
              'flex items-center justify-center z-50',
              'hover:bg-slate-50',
              'focus-ring border-inkwell-gold/30',
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* Search/Command Palette */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <button
              className={cn(
                'w-full flex items-center gap-3',
                'px-3 py-2 text-sm text-slate-600',
                'bg-slate-50',
                'border border-slate-200',
                'rounded-md hover:bg-slate-100',
                'transition-colors focus-ring',
              )}
              aria-label="Open command palette"
              onClick={() => setShowCommandPalette(true)}
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search or command...</span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-slate-300 rounded">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = state.view === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.view)}
                  className={cn(
                    'nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all',
                    'focus-ring',
                    isActive
                      ? 'bg-inkwell-gold/20 text-inkwell-gold border border-inkwell-gold/30'
                      : 'text-slate-700 hover:bg-inkwell-gold/10 hover:text-inkwell-gold',
                    sidebarCollapsed && 'justify-center',
                  )}
                  title={sidebarCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      sidebarCollapsed ? 'mx-auto' : 'flex-shrink-0',
                    )}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <kbd className="text-xs text-slate-400 font-mono">
                        {item.shortcut}
                      </kbd>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-inkwell-gold/20">
            <div className="space-y-2">
              <button
                className="w-full bg-inkwell-gold hover:bg-inkwell-gold/90 text-inkwell-navy font-medium px-4 py-2 rounded-md text-sm transition-colors"
                onClick={() => {
                  // TODO: Implement create project
                  console.log('Create new project');
                }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Project
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn btn-ghost btn-sm text-slate-700 hover:text-inkwell-gold"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>

              {/* Brand showcase link for developers */}
              {import.meta.env.DEV && (
                <a
                  href="./brand"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-inkwell-gold hover:bg-inkwell-gold/10 rounded-md transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Brand System
                </a>
              )}
            </div>
          </div>
        )}

        {/* Collapsed mode quick actions */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-slate-200 space-y-2">
            <button
              className="w-full btn btn-primary btn-sm p-2"
              onClick={() => {
                // TODO: Implement create project
                console.log('Create new project');
              }}
              title="New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'main-content',
          'min-h-screen transition-[margin] duration-300 ease-out',
          'bg-slate-50',
        )}
        style={{ marginLeft: 'var(--sidebar-w)' }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-inkwell-gold/20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-heading-lg text-slate-900">
                  {navigationItems.find((item) => item.view === state.view)?.label ||
                    'Dashboard'}
                </h2>
                {currentProject && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">{currentProject.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <PWAOfflineIndicator variant="badge" />
                <ProfileSwitcher />

                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    aria-label="Open command palette (⌘K)"
                    onClick={() => setShowCommandPalette(true)}
                  >
                    <Command className="w-4 h-4" />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    aria-label="Search (⌘⇧F)"
                    onClick={() => smartSearch.openSearch()}
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label="Notifications (⌘⇧N)"
                      onClick={() => setShowNotifications((prev) => !prev)}
                      data-notifications-trigger
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    {showNotifications && (
                      <div
                        className="absolute right-0 top-full mt-2 z-50"
                        data-notifications-panel
                      >
                        <NotificationsPanel
                          onClose={() => setShowNotifications(false)}
                          onMarkAsRead={(id) => console.log('Mark as read:', id)}
                          onMarkAllAsRead={() => console.log('Mark all as read')}
                          onNotificationClick={(notification) => {
                            console.log('Notification clicked:', notification);
                            setShowNotifications(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 pb-0">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Modals */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        placeholder="Search commands..."
      />

      <SmartSearchModal
        isOpen={smartSearch.isOpen}
        onClose={smartSearch.closeSearch}
        onNavigate={smartSearch.handleNavigate}
        initialQuery={smartSearch.query}
      />
    </div>
  );
};

export default MainLayout;