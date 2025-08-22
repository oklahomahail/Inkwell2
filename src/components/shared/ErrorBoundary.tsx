// src/components/Shared/ErrorBoundary.tsx - Fixed Version
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText, Settings } from 'lucide-react';

// ==========================================
// ENHANCED PROPS & STATE INTERFACES
// ==========================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'feature';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ==========================================
// MAIN ERROR BOUNDARY CLASS (Enhanced)
// ==========================================

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    if (import.meta.env.MODE === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'page' } = this.props;

    switch (level) {
      case 'page':
        return this.renderPageError();
      case 'feature':
        return this.renderFeatureError();
      case 'component':
        return this.renderComponentError();
      default:
        return this.renderPageError();
    }
  }

  // Your original error UI (preserved and enhanced)
  private renderPageError() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold leading-tight mb-4">Something went wrong.</h1>
            <p className="text-lg font-semibold mb-2">{this.state.error?.message}</p>
            <p className="text-sm text-gray-600">
              Please refresh the page or contact support if the issue continues.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="text-left bg-red-100 dark:bg-red-800 rounded-lg p-4 text-sm mt-4">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-200 dark:bg-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-300 dark:hover:bg-red-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Feature-level error (within a section)
  private renderFeatureError() {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Feature Unavailable
        </h3>
        <p className="text-red-700 dark:text-red-300 text-sm mb-4">
          This feature encountered an error and couldn't load properly.
        </p>
        <button
          onClick={this.handleRetry}
          className="flex items-center justify-center gap-2 mx-auto px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Component-level error (small inline)
  private renderComponentError() {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Component Error
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Unable to render this section
            </div>
          </div>
          <button
            onClick={this.handleRetry}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
}

// ==========================================
// SPECIALIZED ERROR BOUNDARIES
// ==========================================

// For writing editor
export const WritingEditorErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    fallback={
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Editor Unavailable
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
          The writing editor encountered an error. Your work is auto-saved.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reload Editor
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// For Claude AI features
export const ClaudeErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    fallback={
      <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
              AI Assistant Unavailable
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Claude AI features are temporarily unavailable. Try again in a moment.
            </div>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// For analytics/charts
export const AnalyticsErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    fallback={
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Analytics Unavailable
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          Unable to load analytics data. Your writing progress is still being tracked.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Export the enhanced ErrorBoundary as default to maintain compatibility
export default ErrorBoundary;
