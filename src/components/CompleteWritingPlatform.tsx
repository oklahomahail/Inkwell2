import React, { useState, Suspense, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Search,
  Menu,
  Sun,
  Moon,
  Edit3,
  Target,
  Clock,
  TrendingUp,
  Command as CommandIcon,
  HelpCircle,
  Trash2,
  Archive,
  MoreHorizontal,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteProvider';
import { useViewCommands } from '@/hooks/useViewCommands';
import { focusWritingEditor } from '@/utils/focusUtils';
import { useLoading, useSaveOperation } from '@/hooks/useLoading';

// Loading Components
import {
  LoadingButton,
  CardSkeleton,
  AnalyticsCardSkeleton,
  AutoSaveIndicator,
  PageLoader,
  OperationFeedback,
} from '@/components/ui/LoadingComponents';

// Error Boundaries
import ErrorBoundary from '@/components/Shared/ErrorBoundary';

// Keyboard Hint Components
import {
  KeyboardShortcut,
  ShortcutTooltip,
  CommandPaletteHint,
  KeyboardShortcutsHelp,
} from '@/components/ui/KeyboardHints';

// Empty State Components
import {
  NoProjectsEmptyState,
  NoChaptersEmptyState,
  NoCharactersEmptyState,
  NoAnalyticsEmptyState,
  SearchEmptyState,
  LoadingEmptyState,
} from '@/components/ui/EmptyStates';

// Confirmation Dialog Components
import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  SaveConfirmationDialog,
  ExportConfirmationDialog,
  useConfirmation,
} from '@/components/ui/ConfirmationDialog';

// Lazy load heavy components
const WritingAnalyticsView = React.lazy(
  () => import('@/components/Analytics/WritingAnalyticsView'),
);

// Simple preferences hook for basic state persistence
const useBasicPreferences = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inkwell-sidebar-collapsed') || 'false');
    } catch {
      return false;
    }
  });

  const [lastActiveTab, setLastActiveTab] = useState(() => {
    return localStorage.getItem('inkwell-last-tab') || 'dashboard';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('inkwell-dark-mode');
    if (saved) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const updateSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('inkwell-sidebar-collapsed', JSON.stringify(collapsed));
  };

  const updateLastActiveTab = (tab: string) => {
    setLastActiveTab(tab);
    localStorage.setItem('inkwell-last-tab', tab);
  };

  const updateDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('inkwell-dark-mode', JSON.stringify(dark));
  };

  return {
    sidebarCollapsed,
    lastActiveTab,
    isDarkMode,
    updateSidebarCollapsed,
    updateLastActiveTab,
    updateDarkMode,
  };
};

// Enhanced Button Component with perfect focus states
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <LoadingButton
      variant={variant}
      size={size}
      loading={loading}
      loadingText={loadingText}
      className={`focus-ring ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </LoadingButton>
  );
};

// Enhanced Card Component with hover animations
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  loading?: boolean;
  empty?: boolean;
  emptyState?: React.ReactNode;
  animated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  loading = false,
  empty = false,
  emptyState,
  animated = true,
  ...props
}) => {
  if (loading) {
    return <CardSkeleton />;
  }

  if (empty && emptyState) {
    return (
      <div className={`card ${animated ? 'page-transition' : ''} ${className}`} {...props}>
        {emptyState}
      </div>
    );
  }

  const cardClasses = `
    card 
    ${hover ? 'card-hover' : ''} 
    ${animated ? 'page-transition' : ''} 
    ${className}
  `;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`card-header ${className}`}>{children}</div>;

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`card-content ${className}`}>{children}</div>;

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

// Enhanced Progress Component with animations
interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  showLabel = false,
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-container ${className}`}>
      {showLabel && (
        <div className="progress-label">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className={`progress-fill ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Enhanced Sidebar Component with preferences integration
interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
}) => {
  const { currentProject } = useAppContext();
  const { openPalette } = useCommandPalette();
  const [isNavigating, setIsNavigating] = useState(false);
  const { updateSidebarCollapsed, updateLastActiveTab } = useBasicPreferences();

  // Enhanced tab change with preferences and animations
  const handleTabChange = async (tab: string) => {
    setIsNavigating(true);

    // Save last active tab to preferences
    updateLastActiveTab(tab);

    if (tab === 'analysis' || tab === 'timeline') {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    onTabChange(tab);

    if (tab === 'writing') {
      setTimeout(focusWritingEditor, 100);
    }

    setIsNavigating(false);
  };

  // Enhanced toggle with preference saving
  const handleToggleCollapse = () => {
    updateSidebarCollapsed(!isCollapsed);
    onToggleCollapse();
  };

  const handleCreateChapter = () => {
    console.log('Creating new chapter...');
  };

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', shortcut: ['⌘', '1'] },
    { id: 'writing', icon: Edit3, label: 'Writing', shortcut: ['⌘', '2'] },
    { id: 'timeline', icon: Calendar, label: 'Timeline', shortcut: ['⌘', '3'] },
    { id: 'analysis', icon: TrendingUp, label: 'Analytics', shortcut: ['⌘', '4'] },
    { id: 'settings', icon: Settings, label: 'Settings', shortcut: ['⌘', ','] },
  ];

  return (
    <div className={`sidebar page-transition ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-content">
          <div className="sidebar-logo">
            <BookOpen className="logo-icon" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-title">
              <h1>Inkwell</h1>
              <p>{currentProject?.name || 'No Project Selected'}</p>
            </div>
          )}
          <button
            onClick={handleToggleCollapse}
            className="sidebar-toggle focus-ring"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="toggle-icon" />
          </button>
        </div>
      </div>

      {/* Command Palette Trigger with Hint */}
      {!isCollapsed && (
        <div className="sidebar-command-palette">
          <CommandPaletteHint onClick={openPalette} variant="button" />
        </div>
      )}

      {/* Navigation with Keyboard Hints and Focus States */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          const isCurrentlyNavigating = isNavigating && isActive;

          return (
            <ShortcutTooltip
              key={item.id}
              content={item.label}
              shortcut={item.shortcut}
              side="right"
            >
              <button
                onClick={() => handleTabChange(item.id)}
                className={`nav-item focus-ring ${isActive ? 'active' : ''} ${isCurrentlyNavigating ? 'loading' : ''}`}
                disabled={isNavigating}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} ${item.shortcut.join('+')}`}
              >
                <IconComponent className="nav-icon" />
                {!isCollapsed && (
                  <div className="nav-item-content">
                    <span>{item.label}</span>
                    <KeyboardShortcut keys={item.shortcut} size="sm" variant="subtle" />
                  </div>
                )}
              </button>
            </ShortcutTooltip>
          );
        })}
      </nav>

      {/* Quick Actions with Enhanced Focus */}
      {!isCollapsed && (
        <div className="sidebar-quick-actions">
          <div className="quick-actions-header">
            <h3>Quick Actions</h3>
          </div>

          <ShortcutTooltip content="New Chapter" shortcut={['⌘', 'N']} side="right">
            <LoadingButton
              variant="ghost"
              size="sm"
              className="quick-action-btn w-full focus-ring"
              onClick={handleCreateChapter}
              aria-label="Create new chapter (Cmd+N)"
            >
              <Plus className="quick-action-icon" />
              <span>New Chapter</span>
            </LoadingButton>
          </ShortcutTooltip>

          <ShortcutTooltip content="Continue Writing" shortcut={['⌘', '2']} side="right">
            <LoadingButton
              variant="ghost"
              size="sm"
              className="quick-action-btn w-full focus-ring"
              onClick={() => handleTabChange('writing')}
              aria-label="Continue writing (Cmd+2)"
            >
              <Edit3 className="quick-action-icon" />
              <span>Continue Writing</span>
            </LoadingButton>
          </ShortcutTooltip>
        </div>
      )}
    </div>
  );
};

// Enhanced Dashboard Content with all micro-polish features
const DashboardContent: React.FC = () => {
  const { currentProject } = useAppContext();
  const { openPalette } = useCommandPalette();
  const { isSaving, save, lastSaved } = useSaveOperation();
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [hasProjects] = useState(!!currentProject);
  const [hasChapters] = useState(true);
  const deleteConfirmation = useConfirmation();

  const chapters = [
    { id: '1', title: 'Chapter 1: The Beginning', words: 2500, target: 3000, status: 'complete' },
    {
      id: '2',
      title: 'Chapter 2: Rising Action',
      words: 1200,
      target: 3000,
      status: 'in-progress',
    },
    { id: '3', title: 'Chapter 3: Plot Twist', words: 0, target: 3000, status: 'planned' },
  ];

  const quickActions = [
    {
      icon: Edit3,
      label: 'Continue Writing',
      description: 'Resume your current chapter',
      shortcut: ['⌘', '2'],
      command: 'nav-writing',
    },
    {
      icon: Calendar,
      label: 'View Timeline',
      description: 'Check your story progress',
      shortcut: ['⌘', '3'],
      command: 'nav-timeline',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View writing analytics',
      shortcut: ['⌘', '4'],
      command: 'nav-analysis',
    },
    {
      icon: CommandIcon,
      label: 'Command Palette',
      description: 'Quick access to all features',
      shortcut: ['⌘', 'K'],
      command: 'open-palette',
    },
  ];

  const handleQuickAction = (command: string) => {
    if (command === 'open-palette') {
      openPalette();
    }
  };

  const handleNewChapter = async () => {
    await save(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    });
  };

  const handleCreateProject = () => {
    console.log('Creating project...');
  };

  const handleOpenHelp = () => {
    console.log('Opening help...');
  };

  const handleOpenPlanning = () => {
    console.log('Opening planning...');
  };

  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    deleteConfirmation.open({
      title: 'Delete Chapter',
      message: `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      requiresTyping: 'DELETE',
      onConfirm: () => {
        console.log('Deleting chapter:', chapterId);
      },
      details: [
        'The chapter will be permanently removed',
        'All content will be lost',
        'This action cannot be undone',
      ],
    });
  };

  // Show empty state if no projects
  if (!hasProjects) {
    return (
      <NoProjectsEmptyState onCreateProject={handleCreateProject} onOpenHelp={handleOpenHelp} />
    );
  }

  return (
    <div className="dashboard-content page-transition">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header with auto-save indicator and shortcuts */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="dashboard-subtitle">
              Welcome back to your writing journey
              {currentProject && ` - ${currentProject.name}`}
            </p>
            <AutoSaveIndicator status={isSaving ? 'saving' : 'saved'} lastSaved={lastSaved} />
          </div>
        </div>
        <div className="dashboard-header-actions">
          <ShortcutTooltip content="Command Palette" shortcut={['⌘', 'K']}>
            <Button variant="ghost" onClick={openPalette}>
              <CommandIcon className="btn-icon" />
              Commands
            </Button>
          </ShortcutTooltip>

          <ShortcutTooltip content="New Chapter" shortcut={['⌘', 'N']}>
            <Button
              variant="primary"
              loading={isSaving}
              loadingText="Creating..."
              onClick={handleNewChapter}
            >
              <Plus className="btn-icon" />
              New Chapter
            </Button>
          </ShortcutTooltip>
        </div>
      </div>

      {/* Command Palette Hint */}
      <div className="command-hint">
        <div className="command-hint-content">
          <CommandIcon className="command-hint-icon" />
          <span>
            Press <KeyboardShortcut keys={['⌘', 'K']} size="sm" /> to open the command palette for
            quick access to all features
          </span>
        </div>
      </div>

      {/* Stats Grid with enhanced hover animations */}
      <div id="main-content" className="stats-grid">
        <Card loading={isLoadingStats} hover animated>
          <CardContent>
            <div className="stat-item">
              <div className="stat-icon stat-icon-blue">
                <BookOpen className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Words</p>
                <p className="stat-value">3,700</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card loading={isLoadingStats} hover animated>
          <CardContent>
            <div className="stat-item">
              <div className="stat-icon stat-icon-green">
                <Target className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Goal Progress</p>
                <p className="stat-value">37%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card loading={isLoadingStats} hover animated>
          <CardContent>
            <div className="stat-item">
              <div className="stat-icon stat-icon-yellow">
                <Clock className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Chapters</p>
                <p className="stat-value">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card loading={isLoadingStats} hover animated>
          <CardContent>
            <div className="stat-item">
              <div className="stat-icon stat-icon-purple">
                <TrendingUp className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Streak</p>
                <p className="stat-value">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions with Enhanced Hover Effects */}
      <ErrorBoundary level="component">
        <Card hover animated>
          <CardHeader>
            <h2 className="card-title">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="quick-actions-grid">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <ShortcutTooltip
                    key={action.label}
                    content={action.label}
                    shortcut={action.shortcut}
                  >
                    <button
                      className="quick-action focus-ring"
                      onClick={() => handleQuickAction(action.command)}
                      aria-label={`${action.label} (${action.shortcut.join('+')})`}
                    >
                      <div className="quick-action-content">
                        <IconComponent className="quick-action-icon" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="quick-action-title">{action.label}</p>
                            <KeyboardShortcut keys={action.shortcut} size="sm" variant="subtle" />
                          </div>
                          <p className="quick-action-description">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  </ShortcutTooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Chapters with Enhanced Animations and Focus */}
      <ErrorBoundary level="component">
        <Card
          empty={!hasChapters}
          emptyState={
            <NoChaptersEmptyState
              onCreateChapter={handleNewChapter}
              onOpenPlanning={handleOpenPlanning}
            />
          }
          hover
          animated
        >
          {hasChapters && (
            <>
              <CardHeader>
                <div className="card-header-row">
                  <h2 className="card-title">Recent Chapters</h2>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="chapters-list">
                  {chapters.map((chapter, index) => {
                    const statusColors = {
                      complete: 'success',
                      'in-progress': 'warning',
                      planned: 'default',
                    } as const;

                    return (
                      <div key={index} className="chapter-item">
                        <div className="chapter-info">
                          <div className="chapter-header">
                            <h3 className="chapter-title">{chapter.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={statusColors[chapter.status as keyof typeof statusColors]}
                              >
                                {chapter.status.replace('-', ' ')}
                              </Badge>

                              {/* Chapter Actions with Enhanced Focus */}
                              <div className="relative group">
                                <button
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 focus-ring"
                                  aria-label={`Chapter actions for ${chapter.title}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <button
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus-ring"
                                    onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                                    aria-label={`Delete ${chapter.title}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Progress
                            value={chapter.words}
                            max={chapter.target}
                            showLabel
                            className="chapter-progress"
                            animated
                          />
                        </div>
                        <div className="chapter-stats">
                          <p className="chapter-word-count">
                            {chapter.words.toLocaleString()} / {chapter.target.toLocaleString()}
                          </p>
                          <p className="chapter-word-label">words</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </ErrorBoundary>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.close}
        onConfirm={() => {
          deleteConfirmation.config.onConfirm();
          deleteConfirmation.close();
        }}
        title={deleteConfirmation.config.title}
        message={deleteConfirmation.config.message}
        confirmText={deleteConfirmation.config.confirmText}
        cancelText={deleteConfirmation.config.cancelText}
        variant={deleteConfirmation.config.variant}
        requiresTyping={deleteConfirmation.config.requiresTyping}
        details={deleteConfirmation.config.details}
      />
    </div>
  );
};

// Main Ultra-Polished Component
export default function CompleteWritingPlatform() {
  const {
    sidebarCollapsed,
    lastActiveTab,
    isDarkMode,
    updateSidebarCollapsed,
    updateLastActiveTab,
    updateDarkMode,
  } = useBasicPreferences();

  const [activeTab, setActiveTab] = useState(lastActiveTab);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  useViewCommands();
  const { openPalette } = useCommandPalette();

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateLastActiveTab(tab);

    if (tab === 'writing') {
      setTimeout(focusWritingEditor, 100);
    }
  };

  const handleToggleDarkMode = () => {
    updateDarkMode(!isDarkMode);
  };

  const handleStartWriting = () => {
    setActiveTab('writing');
    updateLastActiveTab('writing');
  };

  // Keyboard shortcut handler with accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Help shortcut
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowKeyboardHelp(true);
      }

      // Close help with Escape
      if (event.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false);
      }

      // Tab navigation shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleTabChange('dashboard');
            break;
          case '2':
            event.preventDefault();
            handleTabChange('writing');
            break;
          case '3':
            event.preventDefault();
            handleTabChange('timeline');
            break;
          case '4':
            event.preventDefault();
            handleTabChange('analysis');
            break;
          case ',':
            event.preventDefault();
            handleTabChange('settings');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showKeyboardHelp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ErrorBoundary level="page">
            <DashboardContent />
          </ErrorBoundary>
        );
      case 'writing':
        return (
          <ErrorBoundary level="feature">
            <div className="placeholder-content page-transition">
              <BookOpen className="placeholder-icon" />
              <h2 className="placeholder-title">Writing Interface</h2>
              <p className="placeholder-text">Your existing writing components will go here</p>
              <div className="flex items-center gap-4">
                <Button onClick={openPalette} variant="outline">
                  <CommandIcon className="btn-icon" />
                  Open Command Palette
                </Button>
                <KeyboardShortcut keys={['⌘', 'K']} size="sm" />
              </div>
            </div>
          </ErrorBoundary>
        );
      case 'timeline':
        return (
          <ErrorBoundary level="feature">
            <div className="placeholder-content page-transition">
              <Calendar className="placeholder-icon" />
              <h2 className="placeholder-title">Timeline View</h2>
              <p className="placeholder-text">Your timeline components will go here</p>
            </div>
          </ErrorBoundary>
        );
      case 'analysis':
        return (
          <ErrorBoundary level="feature">
            <Suspense
              fallback={
                <div className="p-6 space-y-6 page-transition">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                      <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <AnalyticsCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              <div className="page-transition">
                <WritingAnalyticsView />
              </div>
            </Suspense>
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary level="feature">
            <div className="placeholder-content page-transition">
              <Settings className="placeholder-icon" />
              <h2 className="placeholder-title">Settings</h2>
              <p className="placeholder-text">Your settings components will go here</p>
            </div>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary level="page">
            <DashboardContent />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Keyboard Shortcuts Help Overlay */}
      <KeyboardShortcutsHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />

      {/* Sidebar with enhanced preferences integration */}
      <ErrorBoundary level="component">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => updateSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <div className="main-content">
        {/* Header with enhanced focus states */}
        <ErrorBoundary level="component">
          <header className="header">
            <div className="header-content">
              <div className="header-left">
                <div className="search-container">
                  <Search className="search-icon" />
                  <CommandPaletteHint onClick={openPalette} variant="input" />
                </div>
              </div>

              <div className="header-right">
                <ShortcutTooltip content="Command Palette" shortcut={['⌘', 'K']}>
                  <button
                    onClick={openPalette}
                    className="header-button focus-ring"
                    aria-label="Open command palette (Cmd+K)"
                  >
                    <CommandIcon className="header-button-icon" />
                  </button>
                </ShortcutTooltip>

                <ShortcutTooltip content="Keyboard Shortcuts" shortcut={['?']}>
                  <button
                    onClick={() => setShowKeyboardHelp(true)}
                    className="header-button focus-ring"
                    aria-label="Show keyboard shortcuts (?)"
                  >
                    <HelpCircle className="header-button-icon" />
                  </button>
                </ShortcutTooltip>

                <ShortcutTooltip content="Toggle Dark Mode">
                  <button
                    onClick={handleToggleDarkMode}
                    className="header-button focus-ring"
                    aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                  >
                    {isDarkMode ? (
                      <Sun className="header-button-icon" />
                    ) : (
                      <Moon className="header-button-icon" />
                    )}
                  </button>
                </ShortcutTooltip>

                <div className="user-avatar" role="img" aria-label="User avatar">
                  <span>U</span>
                </div>
              </div>
            </div>
          </header>
        </ErrorBoundary>

        {/* Content with enhanced transitions */}
        <main className="content" role="main">
          <Suspense fallback={<PageLoader message="Loading content..." />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
