import React, { useState } from 'react';
import { 
  BookOpen, Users, Calendar, BarChart3, Settings, 
  Plus, Search, Menu, X, Sun, Moon, 
  Edit3, Target, Clock, TrendingUp
} from 'lucide-react';

// Button Component
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

// Card Components
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`card-content ${className}`}>
    {children}
  </div>
);

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

// Progress Component
interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

const Progress: React.FC<ProgressProps> = ({ value = 0, max = 100, className = '', showLabel = false }) => {
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
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Sidebar Component
interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'writing', icon: Edit3, label: 'Writing' },
    { id: 'timeline', icon: Calendar, label: 'Timeline' },
    { id: 'analysis', icon: TrendingUp, label: 'Analysis' },
    { id: 'settings', icon: Settings, label: 'Settings' }
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
              <p>My First Project</p>
            </div>
          )}
          <button onClick={onToggleCollapse} className="sidebar-toggle">
            <Menu className="toggle-icon" />
          </button>
        </div>
      </div>
      
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
            >
              <IconComponent className="nav-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// Dashboard Content
const DashboardContent: React.FC = () => {
  const chapters = [
    { title: 'Chapter 1: The Beginning', words: 2500, target: 3000, status: 'complete' },
    { title: 'Chapter 2: Rising Action', words: 1200, target: 3000, status: 'in-progress' },
    { title: 'Chapter 3: Plot Twist', words: 0, target: 3000, status: 'planned' }
  ];

  const quickActions = [
    { icon: Edit3, label: 'Continue Writing', description: 'Resume your current chapter' },
    { icon: Calendar, label: 'View Timeline', description: 'Check your story progress' },
    { icon: BarChart3, label: 'Analytics', description: 'View writing analytics' }
  ];

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back to your writing journey</p>
        </div>
        <Button variant="primary">
          <Plus className="btn-icon" />
          New Chapter
        </Button>
      </div>

      {/* Stats Overview */}
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
                <button key={action.label} className="quick-action">
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
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="chapters-list">
            {chapters.map((chapter, index) => {
              const statusColors = {
                complete: 'success',
                'in-progress': 'warning',
                planned: 'default'
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

// Main Component
export default function CompleteWritingPlatform() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

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
                  placeholder="Search..."
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="header-right">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="header-button"
              >
                {isDarkMode ? <Sun className="header-button-icon" /> : <Moon className="header-button-icon" />}
              </button>
              
              <div className="user-avatar">
                <span>U</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}