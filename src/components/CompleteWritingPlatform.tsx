// src/components/CompleteWritingPlatform.tsx - CLEANED VERSION
import {
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Menu,
  Sun,
  Moon,
  Edit3,
  Target,
  Clock,
  TrendingUp,
  Command as CommandIcon,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Shield,
} from 'lucide-react';
import React, { useState, Suspense, useEffect, useCallback, JSX } from 'react';

import WritingPanel from '@/components/Panels/WritingPanel';
import ViewRouter from '@/components/Platform/ViewRouter';
import { SmartSearchModal, SmartSearchTrigger } from '@/components/Search';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/ConfirmationDialog';
import { NoProjectsEmptyState, NoChaptersEmptyState } from '@/components/ui/EmptyStates';
import {
  KeyboardShortcut,
  ShortcutTooltip,
  CommandPaletteHint,
  KeyboardShortcutsHelp,
} from '@/components/ui/KeyboardHints';
import {
  LoadingButton,
  CardSkeleton,
  AutoSaveIndicator,
  PageLoader,
} from '@/components/ui/LoadingComponents';
import { FocusModeControls } from '@/components/Writing/FocusModeControls';
import { useAppContext } from '@/context/AppContext';
import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useSaveOperation } from '@/hooks/useSaveOperation';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { useViewCommands } from '@/hooks/useViewCommands';
import { cn } from '@/utils/cn';
import { focusWritingEditor } from '@/utils/focusUtils';

import { ConsistencyGuardianPanel } from './Claude/ConsistencyGuardianPanel';
// Loading Components

// Keyboard Hint Components

// Empty State Components

// Confirmation Dialog Components

/** ----------------------------------------------------------------
 * Basic preferences hook
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
 * UI Components
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

const _Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

const _Progress: React.FC<ProgressProps> = ({
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
 * Sidebar Component
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
  const { open: openPalette } = useCommandPalette();
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

      {/* Command Palette Trigger */}
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
    </div>
  );
};

/** ----------------------------------------------------------------
 * AI Panel Component
 * ---------------------------------------------------------------- */
interface AIPanelProps {
  activeTab: 'chat' | 'analysis' | 'consistency';
  onTabChange: (tab: 'chat' | 'analysis' | 'consistency') => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ activeTab, onTabChange }) => {
  const aiTabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'analysis' as const, label: 'Analysis', icon: Lightbulb },
    { id: 'consistency' as const, label: 'Guardian', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {aiTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full p-4 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chat with Claude</p>
              <p className="text-xs opacity-75">Your existing chat panel goes here</p>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="h-full p-4 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Writing Analysis</p>
              <p className="text-xs opacity-75">Your existing analysis panel goes here</p>
            </div>
          </div>
        )}

        {activeTab === 'consistency' && <ConsistencyGuardianPanel className="h-full" />}
      </div>
    </div>
  );
};

/** ----------------------------------------------------------------
 * Dashboard Content
 * ---------------------------------------------------------------- */
const _DashboardContent: React.FC = () => {
  const { currentProject } = useAppContext();
  const { open: openPalette } = useCommandPalette();
  const { isSaving, save, lastSaved } = useSaveOperation();
  const [isLoadingStats] = useState(false);
  const [hasProjects] = useState(!!currentProject);
  const [_hasChapters] = useState(true);
  const deleteConfirmation = useConfirmation();

  const _chapters = [
    { id: '1', title: 'Chapter 1: The Beginning', words: 2500, target: 3000, status: 'complete' },
    {
      id: '2',
      title: 'Chapter 2: Rising Action',
      words: 1200,
      target: 3000,
      status: 'in-progress',
    },
    { id: '3', title: 'Chapter 3: Plot Twist', words: 0, target: 3000, status: 'planned' },
  ] as const;

  const handleNewChapter = async () => {
    await save(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    });
  };

  const handleCreateProject = () => {};
  const handleOpenHelp = () => {};
  const handleOpenPlanning = () => {};

  const _handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
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

  if (!hasProjects) {
    return (
      <NoProjectsEmptyState onCreateProject={handleCreateProject} onOpenHelp={handleOpenHelp} />
    );
  }

  return (
    <div className="dashboard-content page-transition">
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

      {/* Stats Grid */}
      <div className="stats-grid">
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

      {/* Chapters */}
      <ErrorBoundary level="component">
        <Card
          empty={!true /* replace with real chapter check when wired */}
          emptyState={
            <NoChaptersEmptyState
              onCreateChapter={handleNewChapter}
              onOpenPlanning={handleOpenPlanning}
            />
          }
          hover
          animated
        >
          {/* Replace placeholder with real chapter list when wired */}
          <CardHeader>
            <div className="card-header-row">
              <h2 className="card-title">Recent Chapters</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-slate-500 text-sm">Chapter list placeholder</div>
          </CardContent>
        </Card>
      </ErrorBoundary>

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
 * Writing Interface with AI Panel
 * ---------------------------------------------------------------- */
const _WritingInterface: React.FC = () => {
  const [activeAITab, setActiveAITab] = useState<'chat' | 'analysis' | 'consistency'>('chat');

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Main Writing Area */}
      <div className="flex-1">
        <div className="placeholder-content page-transition h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <BookOpen className="placeholder-icon" />
              <h2 className="placeholder-title">Writing Interface</h2>
              <p className="placeholder-text">Your existing writing components will go here</p>
            </div>
            <FocusModeControls currentWordCount={3700} />
          </div>

          <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <p className="text-gray-500">TipTap Editor Component</p>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <div className="w-96">
        <AIPanel activeTab={activeAITab} onTabChange={setActiveAITab} />
      </div>
    </div>
  );
};

/** ----------------------------------------------------------------
 * Focus Mode Interface
 * ---------------------------------------------------------------- */
const FocusModeWritingInterface: React.FC = () => {
  const {
    settings,
    sprint,
    sprintProgress: _sprintProgress,
    wordsProgress: _wordsProgress,
    formatTime,
    disableFocusMode: _disableFocusMode,
    startSprint: _startSprint,
    pauseSprint: _pauseSprint,
    resumeSprint: _resumeSprint,
    stopSprint: _stopSprint,
    isMuted,
    toggleMute: _toggleMute,
  } = useAdvancedFocusMode();

  const [showControls, setShowControls] = useState(true);
  const [wordCount, _setWordCount] = useState(0);

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

  const _wordsWritten = sprint.isActive ? wordCount - sprint.wordsAtStart : 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 focus-mode">
      {!isMuted && settings.ambientSound !== 'none' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-30 animate-pulse" />
      )}

      {/* Top Controls */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-500',
          showControls || !settings.zenMode
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0',
        )}
      >
        {/* ... controls omitted for brevity (unchanged) ... */}
        {/* Keep your existing focus-mode controls block here */}
      </div>

      {/* Main Editor Area (placeholder) */}
      <div className="flex items-center justify-center h-full p-8 pt-32">
        <div
          className={cn('w-full max-w-4xl mx-auto', {
            'typewriter-container': settings.typewriterMode,
            'zen-mode-container': settings.zenMode,
          })}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden min-h-[600px]">
            <div className="p-8 h-full">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h1>Focus Mode Editor</h1>
                <p>
                  Your enhanced TipTap editor will be rendered here with focus mode capabilities.
                </p>
                <p>This is where your actual writing interface components will integrate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
 * Main Complete Writing Platform Component
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
  const { open: openPalette } = useCommandPalette();
  const { isFocusMode } = useAdvancedFocusMode();

  // Smart Search integration
  const smartSearch = useSmartSearch({
    onNavigate: (result) => {
      // Handle navigation based on search result type
      switch (result.type) {
        case 'scene':
        case 'chapter':
          handleTabChange('writing');
          break;
        case 'character':
          handleTabChange('timeline'); // or character view if you have one
          break;
        default:
          break;
      }
    },
  });

  // WritingPanel state + handlers (minimal, satisfies required props)
  const [draftText, setDraftText] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');

  const handleChangeText = useCallback((text: string) => {
    setDraftText(text);
  }, []);

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  // Provide a renderer that returns a JSX element, as ViewRouter expects
  const renderWriting = useCallback<() => JSX.Element>(
    () => (
      <WritingPanel
        draftText={draftText}
        onChangeText={handleChangeText as any}
        _onTextSelect={handleTextSelect as any}
        selectedText={selectedText}
      />
    ),
    [draftText, selectedText, handleChangeText, handleTextSelect],
  );

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
  useEffect(() => {
    const handleKeyDown = (_event: KeyboardEvent) => {
      // ... your existing logic ...
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange, showKeyboardHelp]);
  const handleToggleDarkMode = () => updateDarkMode(!isDarkMode);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowKeyboardHelp(true);
      }
      if (event.key === 'Escape' && showKeyboardHelp) setShowKeyboardHelp(false);

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

  // Focus Mode takes over the whole screen
  if (isFocusMode) {
    return <FocusModeWritingInterface />;
  }

  return (
    <div className="app-container">
      {/* Keyboard Shortcuts Help Overlay */}
      <KeyboardShortcutsHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />

      {/* Smart Search Modal */}
      <SmartSearchModal
        isOpen={smartSearch.isOpen}
        onClose={smartSearch.closeSearch}
        onNavigate={smartSearch.handleNavigate}
        initialQuery={smartSearch.query}
        focusMode={smartSearch.focusMode}
      />

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
                  <SmartSearchTrigger
                    onClick={smartSearch.openSearch}
                    placeholder={`Search ${smartSearch.currentProject?.name || 'your project'}...`}
                    disabled={!smartSearch.isAvailable}
                    className="max-w-md"
                  />
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
            <ViewRouter activeTab={activeTab} renderWriting={renderWriting} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
