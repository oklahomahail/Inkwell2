// src/components/Layout/MainLayout.tsx
import {
  Home,
  PenTool,
  BookOpen,
  Clock,
  BarChart3,
  Settings,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Command,
  Plus,
  Kanban,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { cn } from '@/utils/cn';
import { useFeatureFlag } from '@/utils/flags';

import { PWAOfflineIndicator } from '../PWA';

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
    icon: BookOpen,
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

const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const { state, dispatch } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    const savedDarkMode = localStorage.getItem('inkwell-dark-mode');

    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }

    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Default to system preference
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDarkMode);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleViewChange = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('inkwell-sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('inkwell-dark-mode', JSON.stringify(newDarkMode));
    dispatch({ type: 'SET_THEME', payload: newDarkMode ? 'dark' : 'light' });
  };

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  return (
    <div className={cn('main-layout', className)}>
      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar',
          'fixed left-0 top-0 h-full z-40',
          'transition-all duration-300 ease-in-out',
          'bg-white dark:bg-slate-800',
          'border-r border-slate-200 dark:border-slate-700',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <h1 className="text-heading-sm text-slate-900 dark:text-white font-semibold">
                    Inkwell
                  </h1>
                  <p className="text-caption text-slate-500 dark:text-slate-400 truncate">
                    {currentProject?.name || 'No project'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className={cn(
                'btn-ghost btn-sm',
                'w-8 h-8 p-0',
                'flex items-center justify-center',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus-ring',
              )}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search/Command Palette */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <button
              className={cn(
                'w-full flex items-center gap-3',
                'px-3 py-2 text-sm text-slate-600 dark:text-slate-400',
                'bg-slate-50 dark:bg-slate-700/50',
                'border border-slate-200 dark:border-slate-600',
                'rounded-md hover:bg-slate-100 dark:hover:bg-slate-700',
                'transition-colors focus-ring',
              )}
              aria-label="Open command palette"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search or command...</span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded">
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
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white',
                    sidebarCollapsed && 'justify-center',
                  )}
                  title={sidebarCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                >
                  <Icon className={cn('w-5 h-5', sidebarCollapsed ? 'mx-auto' : 'flex-shrink-0')} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <kbd className="text-xs text-slate-400 dark:text-slate-500 font-mono">
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <button
                className="w-full btn btn-primary btn-sm"
                onClick={() => {
                  // TODO: Implement create project
                  console.log('Create new project');
                }}
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="flex-1 btn btn-ghost btn-sm"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
                <button className="btn btn-ghost btn-sm p-2" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed mode quick actions */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
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
            <button
              onClick={toggleDarkMode}
              className="w-full btn btn-ghost btn-sm p-2"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'main-content',
          'min-h-screen transition-all duration-300',
          'bg-slate-50 dark:bg-slate-900',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-heading-lg text-slate-900 dark:text-white">
                  {navigationItems.find((item) => item.view === state.view)?.label || 'Dashboard'}
                </h2>
                {currentProject && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {currentProject.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <PWAOfflineIndicator variant="badge" />
                <button className="btn btn-ghost btn-sm" aria-label="Open command palette">
                  <Command className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-sm" aria-label="Search">
                  <Search className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-sm" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
