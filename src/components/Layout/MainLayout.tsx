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

import Logo from '@/components/Logo';
import { useAppContext, View } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/utils/flags';

import { ProfileSwitcher } from '../ProfileSwitcher';
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
  const [isMobile, setIsMobile] = useState(false);

  // Modal states for header actions
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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

  // Load preferences and detect mobile
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('inkwell-sidebar-collapsed');
    const savedDarkMode = localStorage.getItem('inkwell-dark-mode');

    // Mobile detection
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
      // Auto-collapse on mobile
      if (isMobileSize && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

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

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Keyboard shortcuts for header actions
  useEffect(() => {
    const handleKeydown = (_e: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenCommandPalette();
      }
      // Command/Ctrl + Shift + F for search
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleOpenSearch();
      }
      // Command/Ctrl + , for settings
      else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        handleOpenSettings();
      }
      // ? for help
      else if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleOpenHelp();
      }
      // Command/Ctrl + E for export
      else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleViewChange = (_view: View) => {
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

  // Header action handlers
  const handleOpenCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleOpenSearch = () => {
    setIsSearchModalOpen(true);
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
  };

  const handleOpenSettings = () => {
    handleViewChange(View.Settings);
  };

  const handleOpenHelp = () => {
    setIsHelpModalOpen(true);
  };

  const handleExport = () => {
    // Trigger the global export button
    const exportButton = document.getElementById('global-export-trigger');
    if (exportButton) {
      exportButton.click();
    }
  };

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  return (
    <div className={cn('main-layout flex', className)}>
      {/* Mobile sidebar overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar',
          'fixed left-0 top-0 h-full z-40',
          'transition-all duration-300 ease-in-out',
          'bg-white dark:bg-slate-800',
          'border-r border-slate-200 dark:border-slate-700',
          'flex flex-col',
          // Desktop behavior
          !isMobile && (sidebarCollapsed ? 'w-16' : 'w-64'),
          // Mobile behavior - slide in/out
          isMobile && (sidebarCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64'),
        )}
        aria-hidden={isMobile && sidebarCollapsed}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
              <div className="flex-shrink-0">
                {sidebarCollapsed ? (
                  <Logo
                    variant="svg-feather-gold"
                    size={32}
                    className="transition-all duration-300"
                  />
                ) : (
                  <Logo
                    variant="svg-feather-gold"
                    size={32}
                    className="transition-all duration-300"
                  />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="text-heading-sm text-slate-900 dark:text-white font-semibold truncate">
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
              onKeyDown={(_e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
              className={cn(
                'btn-ghost btn-sm',
                'w-8 h-8 p-0 flex-shrink-0',
                'flex items-center justify-center',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800',
                'rounded-md',
                sidebarCollapsed ? 'ml-auto' : 'ml-2',
              )}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
              tabIndex={0}
            >
              <Menu
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  sidebarCollapsed && 'rotate-180',
                )}
              />
            </button>
          </div>
        </div>

        {/* Search/Command Palette */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <button
              onClick={handleOpenCommandPalette}
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
          'main-content flex-1 flex flex-col',
          'min-h-screen transition-all duration-300',
          'bg-slate-50 dark:bg-slate-900',
          // Desktop spacing
          !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64'),
          // Mobile - no margin (sidebar overlays)
          isMobile && 'ml-0',
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile hamburger menu */}
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="btn btn-ghost btn-sm p-2 md:hidden"
                    aria-label="Toggle navigation menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-heading-lg text-slate-900 dark:text-white truncate">
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

              <div className="flex items-center gap-3">
                <PWAOfflineIndicator variant="badge" />
                <ProfileSwitcher />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCommandPalette}
                    className="btn btn-ghost btn-sm"
                    aria-label="Open command palette (⌘K)"
                    title="Command Palette (⌘K)"
                  >
                    <Command className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenSearch}
                    className="btn btn-ghost btn-sm"
                    aria-label="Search (⌘⇧F)"
                    title="Search (⌘⇧F)"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenNotifications}
                    className="btn btn-ghost btn-sm"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  {/* Settings Button */}
                  <button
                    onClick={handleOpenSettings}
                    className="btn btn-ghost btn-sm"
                    aria-label="Settings (⌘,)"
                    title="Settings (⌘,)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {/* Export Button */}
                  {currentProject && (
                    <button
                      onClick={handleExport}
                      className="btn btn-ghost btn-sm"
                      aria-label="Export (⌘E)"
                      title="Export Project (⌘E)"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                  )}
                  {/* Help Button */}
                  <button
                    onClick={handleOpenHelp}
                    className="btn btn-ghost btn-sm"
                    aria-label="Help (?)"
                    title="Help & Support (?)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Logo variant="svg-feather-gold" size={18} className="opacity-80" />
                <span className="font-medium">Inkwell</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">by</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">Nexus Partners</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Modal Components */}

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Command Palette
                </h2>
                <button
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="btn btn-ghost btn-sm p-2"
                  aria-label="Close command palette"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400">
                Command palette coming soon! Use ⌘K to open.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Search</h2>
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="btn btn-ghost btn-sm p-2"
                  aria-label="Close search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <input
                type="text"
                placeholder="Search your projects and content..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Notifications
                </h2>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="btn btn-ghost btn-sm p-2"
                  aria-label="Close notifications"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400 text-center">No new notifications</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Help & Support
                </h2>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="btn btn-ghost btn-sm p-2"
                  aria-label="Close help"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded">
                    ⌘K
                  </kbd>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Command Palette</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded">
                    ⌘,
                  </kbd>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Settings</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded">
                    ⌘E
                  </kbd>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Export</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded">
                    ?
                  </kbd>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Help</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome to Inkwell! Use the keyboard shortcuts above to navigate quickly, or
                  explore the sidebar for all features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
