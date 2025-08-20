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
  MoreHorizontal,
  Play,
  Pause,
  Square,
  VolumeX,
  Volume2,
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteProvider';
import { useViewCommands } from '@/hooks/useViewCommands';
import { focusWritingEditor } from '@/utils/focusUtils';
import { useSaveOperation } from '@/hooks/useSaveOperation';
import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';
import { FocusModeControls } from '@/components/Writing/FocusModeControls';
import { cn } from '@/utils/cn';

// Loading Components
import {
  LoadingButton,
  CardSkeleton,
  AnalyticsCardSkeleton,
  AutoSaveIndicator,
  PageLoader,
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
} from '@/components/ui/EmptyStates';

// Confirmation Dialog Components
import { ConfirmationDialog, useConfirmation } from '@/components/ui/ConfirmationDialog';

// Lazy load heavy components
const WritingAnalyticsView = React.lazy(
  () => import('@/components/Analytics/WritingAnalyticsView'),
);

/** ----------------------------------------------------------------
 * Basic preferences (sidebar collapsed, last tab, dark mode)
 * ---------------------------------------------------------------- */
const useBasicPreferences = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('inkwell-sidebar-collapsed') || 'false');
    } catch {
      return false;
    }
  });

  const [lastActiveTab, setLastActiveTab] = useState<string>(() => {
    return localStorage.getItem('inkwell-last-tab') || 'dashboard';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('inkwell-dark-mode');
    if (saved) return JSON.parse(saved);
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

/** ----------------------------------------------------------------
 * Small UI components (Button, Card, etc.)
 * ---------------------------------------------------------------- */
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
  if (loading) return <CardSkeleton />;
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

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}
const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

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

/** ----------------------------------------------------------------
 * Sidebar
 * ---------------------------------------------------------------- */
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

  const handleTabChange = async (tab: string) => {
    setIsNavigating(true);
    updateLastActiveTab(tab);

    if (tab === 'analysis' || tab === 'timeline') {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    onTabChange(tab);
    if (tab === 'writing') setTimeout(focusWritingEditor, 100);
    setIsNavigating(false);
  };

  const handleToggleCollapse = () => {
    updateSidebarCollapsed(!isCollapsed);
    onToggleCollapse();
  };

  const handleCreateChapter = () => {
    // TODO: hook up to your create flow
    // console.log('Creating new chapter...');
  };

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', shortcut: ['⌘', '1'] },
    { id: 'writing', icon: Edit3, label: 'Writing', shortcut: ['⌘', '2'] },
    { id: 'timeline', icon: Calendar, label: 'Timeline', shortcut: ['⌘', '3'] },
    { id: 'analysis', icon: TrendingUp, label: 'Analytics', shortcut: ['⌘', '4'] },
    { id: 'settings', icon: Settings, label: 'Settings', shortcut: ['⌘', ','] },
  ] as const;

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

      {/* Navigation */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          const isCurrentlyNavigating = isNavigating && isActive;

          return (
            <ShortcutTooltip
              key={item.id}
              content={item.label}
              shortcut={[...item.shortcut]}
              side="right"
            >
              <button
                onClick={() => handleTabChange(item.id)}
                className={`nav-item focus-ring ${isActive ? 'active' : ''} ${isCurrentlyNavigating ? 'loading' : ''}`}
                disabled={isNavigating}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} ${[...item.shortcut].join('+')}`}
              >
                <IconComponent className="nav-icon" />
                {!isCollapsed && (
                  <div className="nav-item-content">
                    <span>{item.label}</span>
                    <KeyboardShortcut keys={[...item.shortcut]} size="sm" variant="subtle" />
                  </div>
                )}
              </button>
            </ShortcutTooltip>
          );
        })}
      </nav>

      {/* Quick Actions */}
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

/** ----------------------------------------------------------------
 * DashboardContent
 * ---------------------------------------------------------------- */
const DashboardContent: React.FC = () => {
  const { currentProject } = useAppContext();
  const { openPalette } = useCommandPalette();
  const { isSaving, save, lastSaved } = useSaveOperation();
  const [isLoadingStats] = useState(false);
  const [hasProjects] = useState(!!currentProject);
  const [hasChapters] = useState(true);
  const deleteConfirmation = useConfirmation();

  const chapters = [
    { id: '1', title: 'Chapter 1: The Beginning', words: 2500, target: 3000, status: 'complete' },
    { id: '2', title: 'Chapter 2: Rising Action', words: 1200, target: 3000, status: 'in-progress' },
    { id: '3', title: 'Chapter 3: Plot Twist', words: 0, target: 3000, status: 'planned' },
  ] as const;

  const quickActions = [
    { icon: Edit3, label: 'Continue Writing', description: 'Resume your current chapter', shortcut: ['⌘', '2'], command: 'nav-writing' },
    { icon: Calendar, label: 'View Timeline', description: 'Check your story progress', shortcut: ['⌘', '3'], command: 'nav-timeline' },
    { icon: BarChart3, label: 'Analytics', description: 'View writing analytics', shortcut: ['⌘', '4'], command: 'nav-analysis' },
    { icon: CommandIcon, label: 'Command Palette', description: 'Quick access to all features', shortcut: ['⌘', 'K'], command: 'open-palette' },
  ] as const;

  const handleQuickAction = (command: string) => {
    if (command === 'open-palette') openPalette();
  };

  const handleNewChapter = async () => {
    await save(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    });
  };

  const handleCreateProject = () => {};
  const handleOpenHelp = () => {};
  const handleOpenPlanning = () => {};

  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    deleteConfirmation.open({
      title: 'Delete Chapter',
      message: `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      requiresTyping: 'DELETE',
      onConfirm: () => {
        // TODO: wire to deletion
        // console.log('Deleting chapter:', chapterId);
      },
      details: [
        'The chapter will be permanently removed',
        'All content will be lost',
        'This action cannot be undone',
      ],
    });
  };

  if (!hasProjects) {
    return <NoProjectsEmptyState onCreateProject={handleCreateProject} onOpenHelp={handleOpenHelp} />;
  }

  return (
    <div className="dashboard-content page-transition">
      <a href="#main-content" className="skip-link">Skip to main content</a>

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

      <div className="command-hint">
        <div className="command-hint-content">
          <CommandIcon className="command-hint-icon" />
          <span>
            Press <KeyboardShortcut keys={['⌘', 'K']} size="sm" /> to open the command palette for
            quick access to all features
          </span>
        </div>
      </div>

      {/* Stats */}
      <div id="main-content" className="stats-grid">
        <Card loading={isLoadingStats} hover animated>
          <CardContent>
            <div className="stat-item">
              <div className="stat-icon stat-icon-blue"><BookOpen className="icon" /></div>
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
              <div className="stat-icon stat-icon-green"><Target className="icon" /></div>
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
              <div className="stat-icon stat-icon-yellow"><Clock className="icon" /></div>
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
              <div className="stat-icon stat-icon-purple"><TrendingUp className="icon" /></div>
              <div className="stat-content">
                <p className="stat-label">Streak</p>
                <p className="stat-value">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapters */}
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
                  <Button variant="ghost" size="sm">View All</Button>
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
                              <Badge variant={statusColors[chapter.status as keyof typeof statusColors]}>
                                {chapter.status.replace('-', ' ')}
                              </Badge>

                              {/* Actions */}
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

      {/* Confirmations */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.close}
        onConfirm={() => {
          deleteConfirmation.config.onConfirm?.();
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

/** ----------------------------------------------------------------
 * FocusModeWritingInterface
 * ---------------------------------------------------------------- */
const FocusModeWritingInterface: React.FC = () => {
  const {
    settings,
    sprint,
    sprintProgress,
    wordsProgress,
    formatTime,
    disableFocusMode,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    isMuted,
    toggleMute,
  } = useAdvancedFocusMode();

  const [showControls, setShowControls] = useState(true);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!settings.zenMode) return;

    let timeout: number | undefined;

    const resetTimer = () => {
      setShowControls(true);
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setShowControls(false), 3000);
    };

    const handleActivity = () => resetTimer();

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    resetTimer();

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [settings.zenMode]);

  const wordsWritten = sprint.isActive ? wordCount - sprint.wordsAtStart : 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 focus-mode">
      {/* Ambient Sound Visualizer */}
      {!isMuted && settings.ambientSound !== 'none' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-30 animate-pulse" />
      )}

      {/* Top Controls */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-500',
          showControls || !settings.zenMode ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <div className="flex items-center justify-between p-4">
          {/* Sprint Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!sprint.isActive) {
                  startSprint(wordCount);
                } else if (sprint.isPaused) {
                  resumeSprint();
                } else {
                  pauseSprint();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors focus-ring"
            >
              {!sprint.isActive ? (
                <>
                  <Play className="w-4 h-4" />
                  Start Sprint
                </>
              ) : sprint.isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>

            {sprint.isActive && (
              <button
                onClick={stopSprint}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus-ring"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}

            <button
              onClick={toggleMute}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors focus-ring"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6 text-white">
            {sprint.isActive && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(sprint.remainingTime)}</span>
              </div>
            )}

            {settings.showWordCount && (
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span className="font-mono">
                  {sprint.isActive ? `+${wordsWritten} / ${sprint.target}` : wordCount}
                </span>
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            onClick={disableFocusMode}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors focus-ring"
          >
            Exit Focus
          </button>
        </div>

        {/* Sprint Progress */}
        {sprint.isActive && (
          <div className="px-4 pb-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 text-white">
                <span className="font-medium">Sprint Progress</span>
                <span className="text-sm opacity-75">
                  {Math.round(wordsProgress)}% words, {Math.round(sprintProgress)}% time
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(wordsProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex items-center justify-center h-full p-8 pt-32">
        <div
          className={cn('w-full max-w-4xl mx-auto', {
            'typewriter-container': settings.typewriterMode,
            'zen-mode-container': settings.zenMode,
          })}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden min-h-[600px]">
            {/* Your TipTap Editor Component goes here */}
            <div className="p-8 h-full">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h1>Focus Mode Editor</h1>
                <p>Your enhanced TipTap editor will be rendered here with focus mode capabilities.</p>
                <p>This is where your actual writing interface components will integrate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      {!settings.zenMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 backdrop-blur-sm p-3">
          <div className="flex items-center justify-center gap-8 text-white text-sm">
            <span>Focus Mode Active</span>
            {sprint.isActive && <span>Sprint: {formatTime(sprint.remainingTime)} remaining</span>}
            <span className="opacity-75">Press Esc to exit</span>
          </div>
        </div>
      )}
    </div>
  );
};

/** ----------------------------------------------------------------
 * CompleteWritingPlatform (main)
 * ---------------------------------------------------------------- */
export default function CompleteWritingPlatform() {
  const {
    sidebarCollapsed,
    lastActiveTab,
    isDarkMode,
    updateSidebarCollapsed,
    updateLastActiveTab,
    updateDarkMode,
  } = useBasicPreferences();

  const [activeTab, setActiveTab] = useState<string>(lastActiveTab);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  useViewCommands();
  const { openPalette } = useCommandPalette();
  const { isFocusMode } = useAdvancedFocusMode();

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateLastActiveTab(tab);
    if (tab === 'writing') setTimeout(focusWritingEditor, 100);
  };

  const handleToggleDarkMode = () => updateDarkMode(!isDarkMode);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowKeyboardHelp(true);
      }
      if (event.key === 'Escape' && showKeyboardHelp) setShowKeyboardHelp(false);

      // Tab nav
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case '1': event.preventDefault(); handleTabChange('dashboard'); break;
          case '2': event.preventDefault(); handleTabChange('writing'); break;
          case '3': event.preventDefault(); handleTabChange('timeline'); break;
          case '4': event.preventDefault(); handleTabChange('analysis'); break;
          case ',': event.preventDefault(); handleTabChange('settings'); break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showKeyboardHelp]);

  // Focus Mode takes over the whole screen
  if (isFocusMode) {
    return <FocusModeWritingInterface />;
  }

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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <BookOpen className="placeholder-icon" />
                  <h2 className="placeholder-title">Writing Interface</h2>
                  <p className="placeholder-text">
                    Your existing writing components will go here
                  </p>
                </div>

                {/* Add Focus Mode Controls here */}
                <FocusModeControls currentWordCount={3700} />
              </div>

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

      {/* Sidebar */}
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
        {/* Header */}
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

        {/* Content */}
        <main className="content" role="main">
          <Suspense fallback={<PageLoader message="Loading content..." />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
