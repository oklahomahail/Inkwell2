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
  Kanban,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import Logo from '@/components/Logo';
import NewProjectDialog from '@/components/Projects/NewProjectDialog';
import { StorageStatusIndicator } from '@/components/Storage/StorageStatusIndicator';
import { BRAND_NAME, ORGANIZATION_NAME } from '@/constants/brand';
import { ALT_TAGLINE } from '@/constants/branding';
import { useAppContext, View } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCommandPalette } from '@/context/CommandPaletteContext';
import { FormattingProvider } from '@/context/FormattingContext';
import { ExportModal } from '@/features/export/ExportModal';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/utils/flags';

import { PWAOfflineIndicator } from '../PWA';

// Define auth routes that should not show the header/topbar
const AUTH_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/update-password',
];

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
  // IMPORTANT: React Rule of Hooks - All hooks must be called at the top level, before any conditional logic
  // First, get location to check auth route
  const location = useLocation();

  // We'll still determine if this is an auth route, but we'll move the early return later
  // after ALL hooks have been called
  const isAuthRoute = AUTH_ROUTES.some((route) => location.pathname.startsWith(route));

  // ✅ ALL hooks must be called unconditionally, before any returns
  const { state, dispatch } = useAppContext();
  const { user, signOut } = useAuth();
  const { newProjectDialogOpen, closeNewProjectDialog } = useUI();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(state.theme === 'dark');
  const [isMobile, setIsMobile] = useState(false);

  // Modal states for header actions
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Command Palette - must be called unconditionally
  const { open: openPalette } = useCommandPalette();

  // Feature flags - must be called unconditionally
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
      // Auto-collapse on mobile - use functional state update to avoid stale closure
      if (isMobileSize) {
        setSidebarCollapsed((prev) => (isMobileSize ? true : prev));
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
      // Check if index.html already set a theme preference
      const indexHtmlTheme = localStorage.getItem('theme');
      if (indexHtmlTheme) {
        // Use the theme set by index.html (defaults to 'light' for new users)
        const isDark = indexHtmlTheme === 'dark';
        setIsDarkMode(isDark);
        dispatch({ type: 'SET_THEME', payload: indexHtmlTheme as 'light' | 'dark' });
        // Sync to inkwell-dark-mode for consistency
        localStorage.setItem('inkwell-dark-mode', JSON.stringify(isDark));
      } else {
        // Fallback: Default to light mode (brand decision)
        setIsDarkMode(false);
        dispatch({ type: 'SET_THEME', payload: 'light' });
        localStorage.setItem('inkwell-dark-mode', JSON.stringify(false));
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const _handleThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('inkwell-dark-mode')) {
        setIsDarkMode(e.matches);
        dispatch({ type: 'SET_THEME', payload: e.matches ? 'dark' : 'light' });
      }
    };
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!localStorage.getItem('inkwell-dark-mode')) {
        setIsDarkMode(e.matches);
        dispatch({ type: 'SET_THEME', payload: e.matches ? 'dark' : 'light' });
      }
    };

    // Handle both modern and legacy browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      // Legacy support
      mediaQuery.addListener(handleMediaChange);
      // Initial check
      handleMediaChange(mediaQuery);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [dispatch]); // dispatch is stable from useReducer but good to include

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Header action handlers (Command Palette now uses CommandPaletteProvider via Cmd+K)
  const handleViewChange = useCallback(
    (view: View) => {
      dispatch({ type: 'SET_VIEW', payload: view });
    },
    [dispatch],
  );

  const handleOpenSearch = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    handleViewChange(View.Settings);
  }, [handleViewChange]);

  const handleOpenHelp = useCallback(() => {
    setIsHelpModalOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  // Keyboard shortcuts for header actions - only register if not on auth route
  useEffect(() => {
    // Skip registering keyboard shortcuts for auth routes
    if (isAuthRoute) return;

    const handleKeydown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
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
  }, [
    isAuthRoute,
    openPalette,
    handleOpenSearch,
    handleOpenSettings,
    handleOpenHelp,
    handleExport,
  ]);

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
    // Apply theme class
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const _handleResetPassword = () => {
    window.location.href = '/auth/forgot-password';
  };

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  // Don't render the layout for auth routes
  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

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

      {/* Sidebar - only show on non-auth routes */}
      {!isAuthRoute && (
        <aside
          className={cn(
            'sidebar ink-sidebar',
            'fixed left-0 top-0 h-full z-40',
            'transition-all duration-300 ease-in-out',
            'flex flex-col',
            // Desktop behavior
            !isMobile && (sidebarCollapsed ? 'w-16' : 'w-64'),
            // Mobile behavior - slide in/out
            isMobile && (sidebarCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64'),
          )}
          aria-hidden={isMobile && sidebarCollapsed}
        >
          {/* Sidebar Header */}
          <div
            className={cn(
              'sidebar-header p-4 border-b border-slate-200 dark:border-slate-700',
              'flex items-center transition-all duration-300',
              sidebarCollapsed ? 'flex-col gap-2 justify-center' : 'flex-row justify-between',
            )}
          >
            {/* Logo section */}
            <div
              className={cn(
                'flex items-center',
                sidebarCollapsed ? 'flex-col gap-0' : 'flex-row gap-3',
              )}
            >
              <div className="flex-shrink-0">
                <img
                  src="/brand/1.svg"
                  alt="Inkwell"
                  className="w-8 h-8 transition-all duration-300"
                />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="text-heading-sm text-text-1 font-semibold truncate">
                    {BRAND_NAME}
                  </h1>
                  <p className="text-caption text-text-2 truncate">
                    {currentProject?.name || 'No project'}
                  </p>
                </div>
              )}
            </div>

            {/* Hamburger toggle button - fixed size, no absolute positioning */}
            <button
              onClick={toggleSidebar}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
              className={cn(
                'btn-ghost btn-sm',
                'w-9 h-9 p-0 flex-shrink-0',
                'flex items-center justify-center',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800',
                'rounded-md',
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

          {/* Search/Command Palette */}
          {!sidebarCollapsed && (
            <div className="p-4">
              <button
                onClick={openPalette}
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
                      'ink-nav-item w-full',
                      'focus-ring',
                      isActive && 'ink-nav-item--active',
                      sidebarCollapsed && 'justify-center',
                    )}
                    title={sidebarCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                  >
                    <Icon
                      className={cn(
                        isActive ? 'ink-nav-icon--active' : 'ink-nav-icon',
                        sidebarCollapsed ? 'mx-auto' : 'flex-shrink-0',
                      )}
                    />
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
            <div className="p-4 border-t border-subtle">
              <div className="space-y-2">
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
            <div className="p-2 border-t border-subtle space-y-2">
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
      )}

      {/* Main Content */}
      <main
        data-tour-id="dashboard"
        className={cn(
          'main-content flex-1 flex flex-col relative',
          'min-h-screen transition-all duration-300',
          'bg-slate-50 dark:bg-slate-900',
          'z-40', // Above decorative layers, below tour (10000)
          // Desktop spacing
          !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64'),
          // Mobile - no margin (sidebar overlays)
          isMobile && 'ml-0',
        )}
      >
        {/* Top Bar - only show on non-auth routes */}
        {!isAuthRoute && (
          <header className="Topbar bg-white border-b border-ink-500 sticky top-0 z-30 backdrop-blur-sm">
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

                <div className="flex items-center gap-2 md:gap-3">
                  {/* PWA indicator - hide on small mobile screens */}
                  <div className="hidden sm:block">
                    <PWAOfflineIndicator variant="badge" className="shrink-0" />
                  </div>
                  {/* User info display - more compact on mobile */}
                  {user && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openPalette}
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
                        data-tour-id="export-open"
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
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className="p-6 flex-1">
          <div className="max-w-7xl mx-auto">
            {currentProject ? (
              <FormattingProvider projectId={currentProject.id}>{children}</FormattingProvider>
            ) : (
              children
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Logo variant="svg-feather-gold" size={18} className="opacity-80" />
                  <span className="font-medium">Inkwell</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">by</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {ORGANIZATION_NAME}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{ALT_TAGLINE}</span>
              </div>

              {/* Storage Status Indicator */}
              <div className="relative">
                <StorageStatusIndicator variant="compact" />
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Modal Components */}

      {/* Command Palette is handled by CommandPaletteProvider (Cmd+K) */}

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

      {/* Export Modal */}
      {isExportModalOpen &&
        state.currentProjectId &&
        (() => {
          const currentProject = state.projects.find((p) => p.id === state.currentProjectId);
          if (!currentProject) return null;

          return (
            <ExportModal
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              projectId={currentProject.id}
              bookData={{
                title: currentProject.name,
                author: undefined,
                chapters:
                  currentProject.chapters?.map((ch: any) => ({
                    title: ch.title || 'Untitled Chapter',
                    text: ch.content || '',
                  })) || [],
              }}
            />
          );
        })()}

      {/* New Project Dialog */}
      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={(open) => !open && closeNewProjectDialog()}
      />
    </div>
  );
};

export default MainLayout;
