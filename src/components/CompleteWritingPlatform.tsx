import React, { useState } from 'react';
import { 
  BookOpen, Users, Calendar, BarChart3, Settings, 
  Plus, Search, Menu, X, Sun, Moon, 
  Edit3, Target, Clock, TrendingUp
} from 'lucide-react';

// Import your UI components (you'll need to create these files)
// For now, I'll include them inline, but you should move these to separate files

// Utility function
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

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
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border-transparent',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12'
  };
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
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
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : '',
        className
      )}
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
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={cn('px-6 py-4', className)}>
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
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
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
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
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
    <div className={cn(
      'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Inkwell</h1>
              <p className="text-xs text-gray-500">My First Project</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back to your writing journey</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Chapter
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Words</p>
                <p className="text-2xl font-bold text-gray-900">3,700</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Goal Progress</p>
                <p className="text-2xl font-bold text-gray-900">37%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chapters</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-gray-900">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.label}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">{action.label}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Chapters</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chapters.map((chapter, index) => {
              const statusColors = {
                complete: 'success',
                'in-progress': 'warning',
                planned: 'default'
              } as const;

              return (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                      <Badge variant={statusColors[chapter.status as keyof typeof statusColors]}>
                        {chapter.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <Progress 
                      value={chapter.words} 
                      max={chapter.target} 
                      showLabel 
                      className="max-w-xs"
                    />
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {chapter.words.toLocaleString()} / {chapter.target.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">words</p>
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
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Writing Interface</h2>
            <p className="text-gray-600">Your existing writing components will go here</p>
          </div>
        );
      case 'timeline':
        return (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Timeline View</h2>
            <p className="text-gray-600">Your timeline components will go here</p>
          </div>
        );
      case 'analysis':
        return (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">Your analytics components will go here</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600">Your settings components will go here</p>
          </div>
        );
      default:
        return <DashboardContent />;
    }
  };

  return (
   <div className="min-h-screen bg-red-500 text-white flex">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}