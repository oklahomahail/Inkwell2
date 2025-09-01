// src/components/ui/LoadingComponents.tsx
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import React from 'react';

// ==========================================
// LOADING SPINNER COMPONENTS
// ==========================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600 dark:text-blue-400 ${sizeClasses[size]} ${className}`}
    />
  );
};

export const LoadingSpinner: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  text = 'Loading...',
  size = 'md',
}) => (
  <div className="flex items-center justify-center gap-3 p-4">
    <Spinner size={size} />
    <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
  </div>
);

// ==========================================
// BUTTON LOADING STATES
// ==========================================

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary:
      'bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 focus:ring-slate-500',
    ghost:
      'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 focus:ring-slate-500',
    outline:
      'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {loading ? loadingText || 'Loading...' : children}
    </button>
  );
};

// ==========================================
// SKELETON LOADERS
// ==========================================

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
}) => (
  <div
    className={`${width} ${height} bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className}`}
  />
);

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
    <Skeleton width="w-3/4" height="h-6" />
    <Skeleton width="w-full" height="h-4" />
    <Skeleton width="w-5/6" height="h-4" />
    <div className="flex justify-between items-center pt-2">
      <Skeleton width="w-20" height="h-4" />
      <Skeleton width="w-16" height="h-4" />
    </div>
  </div>
);

// Analytics Card Skeleton
export const AnalyticsCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton width="w-10" height="h-10" className="rounded-lg" />
      <Skeleton width="w-24" height="h-4" />
    </div>
    <Skeleton width="w-20" height="h-8" />
  </div>
);

// Chapter List Skeleton
export const ChapterListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
      >
        <div className="flex justify-between items-start mb-3">
          <Skeleton width="w-48" height="h-5" />
          <Skeleton width="w-16" height="h-5" className="rounded-full" />
        </div>
        <Skeleton width="w-full" height="h-2" className="rounded-full mb-2" />
        <div className="flex justify-between">
          <Skeleton width="w-24" height="h-4" />
          <Skeleton width="w-16" height="h-4" />
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// FULL PAGE LOADING
// ==========================================

export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading your writing workspace...',
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="text-center space-y-4">
      <Spinner size="xl" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Inkwell</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{message}</p>
      </div>
    </div>
  </div>
);

// ==========================================
// OPERATION FEEDBACK
// ==========================================

interface OperationFeedbackProps {
  type: 'loading' | 'success' | 'error' | 'info';
  message: string;
  details?: string;
  className?: string;
}

export const OperationFeedback: React.FC<OperationFeedbackProps> = ({
  type,
  message,
  details,
  className = '',
}) => {
  const config = {
    loading: {
      icon: Loader2,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400',
      animate: 'animate-spin',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400',
      animate: '',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100',
      iconColor: 'text-red-600 dark:text-red-400',
      animate: '',
    },
    info: {
      icon: Info,
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
      borderColor: 'border-slate-200 dark:border-slate-800',
      textColor: 'text-slate-900 dark:text-slate-100',
      iconColor: 'text-slate-600 dark:text-slate-400',
      animate: '',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor, animate } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} ${animate} mt-0.5 shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium ${textColor}`}>{message}</div>
          {details && <div className={`text-sm ${textColor} opacity-75 mt-1`}>{details}</div>}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// AUTO-SAVE INDICATOR
// ==========================================

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600 dark:text-blue-400',
          animate: 'animate-spin',
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved',
          className: 'text-green-600 dark:text-green-400',
          animate: '',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'text-red-600 dark:text-red-400',
          animate: '',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const { icon: Icon, text, className: statusClassName, animate } = config;

  return (
    <div className={`flex items-center gap-2 text-xs ${statusClassName} ${className}`}>
      <Icon className={`w-3 h-3 ${animate}`} />
      <span>{text}</span>
    </div>
  );
};

// ==========================================
// PROGRESS INDICATORS
// ==========================================

interface ProgressIndicatorProps {
  progress: number; // 0-100
  text?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  text,
  showPercentage = true,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {(text || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {text && <span className="text-slate-700 dark:text-slate-300">{text}</span>}
          {showPercentage && (
            <span className="text-slate-600 dark:text-slate-400">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
