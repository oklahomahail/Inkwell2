import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteProvider';
import { useViewCommands } from '@/hooks/useViewCommands';

// Button Component (same as before)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Card Components (same as before)
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
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

// Badge Component (same as before)
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

// Progress Component (same as before)
interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  showLabel = false,
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
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// Enhanced Sidebar Component
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
  const { openPalette } = useCommandPalette(); // Use the real command palette

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', shortcut: 'Cmd+1' },
    { id: 'writing', icon: Edit3, label: 'Writing', shortcut: 'Cmd+2' },
    { id: 'timeline', icon: Calendar, label: 'Timeline', shortcut: 'Cmd+3' },
    { id: 'analysis', icon: TrendingUp, label: 'Analysis', shortcut: 'Cmd+4' },
    { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'Cmd+,' },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
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
          <button onClick={onToggleCollapse} className="sidebar-toggle">
            <Menu className="toggle-icon" />
          </button>
        </div>
      </div>

      {/* Command Palette Trigger */}
      {!isCollapsed && (
        <div className="sidebar-command-palette">
          <button
            onClick={openPalette}
            className="command-palette-trigger"
            title="Open Command Palette (Cmd+K)"
          >
            <CommandIcon className="command-icon" />
            <span>Search commands...</span>
            <kbd className="keyboard-shortcut">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
            >
              <IconComponent className="nav-icon" />
              {!isCollapsed && (
                <div className="nav-item-content">
                  <span>{item.label}</span>
                  <kbd className="nav-shortcut">{item.shortcut}</kbd>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="sidebar-quick-actions">
          <div className="quick-actions-header">
            <h3>Quick Actions</h3>
          </div>
          <button className="quick-action-btn">
            <Plus className="quick-action-icon" />
            <span>New Chapter</span>
          </button>
          <button className="quick-action-btn">
            <Edit3 className="quick-action-icon" />
            <span>Continue Writing</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Dashboard Content
const DashboardContent: React.FC = () => {
  const { currentProject } = useAppContext();
  const { openPalette } = useCommandPalette(); // Use the real command palette

  const chapters = [
    { title: 'Chapter 1: The Beginning', words: 2500, target: 3000, status: 'complete' },
    { title: 'Chapter 2: Rising Action', words: 1200, target: 3000, status: 'in-progress' },
    { title: 'Chapter 3: Plot Twist', words: 0, target: 3000, status: 'planned' },
  ];

  const quickActions = [
    {
      icon: Edit3,
      label: 'Continue Writing',
      description: 'Resume your current chapter',
      command: 'nav-writing',
    },
    {
      icon: Calendar,
      label: 'View Timeline',
      description: 'Check your story progress',
      command: 'nav-timeline',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View writing analytics',
      command: 'nav-analysis',
    },
    {
      icon: CommandIcon,
      label: 'Command Palette',
      description: 'Quick access to all features',
      command: 'open-palette',
    },
  ];

  const handleQuickAction = (command: string) => {
    if (command === 'open-palette') {
      openPalette();
    }
    // Other commands would be handled by the command system
  };

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back to your writing journey
            {currentProject && ` - ${currentProject.name}`}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Button variant="ghost" onClick={openPalette}>
            <CommandIcon className="btn-icon" />
            Commands
          </Button>
          <Button variant="primary">
            <Plus className="btn-icon" />
            New Chapter
          </Button>
        </div>
      </div>

      {/* Command Palette Hint */}
      <div className="command-hint">
        <div className="command-hint-content">
          <CommandIcon className="command-hint-icon" />
          <span>
            Press <kbd>⌘K</kbd> to open the command palette for quick access to all features
          </span>
        </div>
      </div>

      {/* Rest of dashboard content (same as before) */}
      <div className="stats-grid">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="card-title">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.label}
                  className="quick-action"
                  onClick={() => handleQuickAction(action.command)}
                >
                  <div className="quick-action-content">
                    <IconComponent className="quick-action-icon" />
                    <div>
                      <p className="quick-action-title">{action.label}</p>
                      <p className="quick-action-description">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card>
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
                      <Badge variant={statusColors[chapter.status as keyof typeof statusColors]}>
                        {chapter.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <Progress
                      value={chapter.words}
                      max={chapter.target}
                      showLabel
                      className="chapter-progress"
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
      </Card>
    </div>
  );
};

// Main Component (Updated)
export default function CompleteWritingPlatform() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Register view commands and shortcuts
  useViewCommands();

  // Remove local command palette state - now handled by provider
  const { openPalette } = useCommandPalette();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'writing':
        return (
          <div className="placeholder-content">
            <BookOpen className="placeholder-icon" />
            <h2 className="placeholder-title">Writing Interface</h2>
            <p className="placeholder-text">Your existing writing components will go here</p>
            <Button onClick={openPalette} variant="outline">
              <CommandIcon className="btn-icon" />
              Open Command Palette
            </Button>
          </div>
        );
      case 'timeline':
        return (
          <div className="placeholder-content">
            <Calendar className="placeholder-icon" />
            <h2 className="placeholder-title">Timeline View</h2>
            <p className="placeholder-text">Your timeline components will go here</p>
          </div>
        );
      case 'analysis':
        return (
          <div className="placeholder-content">
            <BarChart3 className="placeholder-icon" />
            <h2 className="placeholder-title">Analytics</h2>
            <p className="placeholder-text">Your analytics components will go here</p>
          </div>
        );
      case 'settings':
        return (
          <div className="placeholder-content">
            <Settings className="placeholder-icon" />
            <h2 className="placeholder-title">Settings</h2>
            <p className="placeholder-text">Your settings components will go here</p>
          </div>
        );
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search... (or press ⌘K for commands)"
                  className="search-input"
                  onFocus={openPalette}
                  readOnly
                />
              </div>
            </div>

            <div className="header-right">
              <button onClick={openPalette} className="header-button" title="Command Palette (⌘K)">
                <CommandIcon className="header-button-icon" />
              </button>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className="header-button">
                {isDarkMode ? (
                  <Sun className="header-button-icon" />
                ) : (
                  <Moon className="header-button-icon" />
                )}
              </button>

              <div className="user-avatar">
                <span>U</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">{renderContent()}</main>
      </div>

      {/* Command Palette is now handled by CommandPaletteUI component */}
    </div>
  );
}
