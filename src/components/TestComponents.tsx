// src/components/TestComponents.tsx
import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Users as _Users,
  Calendar as _Calendar,
  BarChart3 as _BarChart3,
  Settings as _Settings,
  Search,
  AlertCircle,
  Info,
  Check,
} from 'lucide-react';

// Utility function to combine class names
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
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm text-gray-600 h-8',
    md: 'px-4 py-2 text-sm text-gray-600 h-10',
    lg: 'px-6 py-3 text-base leading-normal leading-normal leading-normal h-12',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-gray-600 font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 placeholder-gray-400 shadow-sm transition-colors duration-200',
          'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500 text-gray-500">{hint}</p>}
      {error && (
        <p className="text-xs text-gray-500 text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
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
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={cn('px-6 py-4 border-b border-gray-200', className)}>{children}</div>;

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={cn('px-6 py-4', className)}>{children}</div>;

const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl', className)}>
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
    danger: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs text-gray-500 font-medium',
        variants[variant],
        className,
      )}
    >
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

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  showLabel = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 text-gray-600">
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

// Alert Component
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const types = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: Check,
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
    },
  };

  const config = types[type];
  const IconComponent = config.icon;

  return (
    <div className={cn('rounded-lg border p-4', config.bg, config.border, className)}>
      <div className="flex">
        <IconComponent className={cn('w-5 h-5 mt-0.5 mr-3', config.iconColor)} />
        <div className="flex-1">
          {title && (
            <h3 className={cn('text-sm text-gray-600 font-medium mb-1', config.titleColor)}>
              {title}
            </h3>
          )}
          <div className={cn('text-sm text-gray-600', config.textColor)}>{children}</div>
        </div>
      </div>
    </div>
  );
};

// Main TestComponents Component
export const TestComponents: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold leading-tight font-extrabold leading-tight font-bold text-gray-900 mb-2">
            Inkwell Component Library Test
          </h1>
          <p className="text-gray-600">
            Testing modern, accessible components for your writing platform
          </p>
        </div>

        {/* Buttons Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-gray-900">
              Buttons
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3 items-center flex-wrap">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  With Icon
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-gray-900">
              Form Components
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Story Title"
                placeholder="Enter your story title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="Character Name"
                placeholder="Character name..."
                hint="This will be used throughout your story"
              />
              <Input
                label="Word Count Goal"
                type="number"
                placeholder="50000"
                error="Please enter a valid number"
              />
              <div className="relative">
                <Input label="Search Characters" placeholder="Search..." className="pl-10" />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-[34px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chapter 1</h3>
                <Badge variant="success">Complete</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm text-gray-600 mb-4">
                The opening chapter where our protagonist discovers the mysterious letter.
              </p>
              <Progress value={2500} max={3000} showLabel />
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gray-600 text-gray-500">2,500 words</span>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chapter 2</h3>
                <Badge variant="warning">In Progress</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm text-gray-600 mb-4">
                Character development and world building continue as tensions rise.
              </p>
              <Progress value={1200} max={3000} showLabel />
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gray-600 text-gray-500">1,200 words</span>
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chapter 3</h3>
                <Badge variant="default">Planned</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm text-gray-600 mb-4">
                The plot thickens as new characters are introduced to the story.
              </p>
              <Progress value={0} max={3000} showLabel />
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gray-600 text-gray-500">0 words</span>
                <Button variant="ghost" size="sm">
                  Start
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Alerts */}
        <div className="space-y-4 mb-8">
          <Alert type="success" title="Chapter Saved">
            Your progress has been automatically saved to local storage.
          </Alert>

          <Alert type="warning" title="Timeline Conflict Detected">
            Chapter 3 events occur before Chapter 2 timeline. Consider reviewing your story
            structure.
          </Alert>

          <Alert type="info">
            <strong>Pro tip:</strong> Use the Timeline view to visualize your story structure and
            catch potential plot holes.
          </Alert>
        </div>

        {/* Integration Instructions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-gray-900">
              Next Steps
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">These components are working! Now you can:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>
                  Create individual component files in{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">src/components/ui/</code>
                </li>
                <li>Replace existing buttons, inputs, and cards in your app</li>
                <li>Add more components like sidebars and navigation</li>
                <li>Customize colors and spacing to match your brand</li>
              </ul>
              <div className="flex gap-3 mt-4">
                <Button variant="primary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Writing
                </Button>
                <Button variant="secondary">View Documentation</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
