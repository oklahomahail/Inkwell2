// Top-level application error boundary with error reporting
import { AlertTriangle, RefreshCw, Bug, Mail, Copy } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { InkwellLogo } from '@/components/Brand';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  level?: 'app' | 'feature' | 'component' | undefined;
  featureName?: string | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null | undefined;
  errorInfo: ErrorInfo | null | undefined;
  errorId: string | null | undefined;
  showDetails: boolean;
}

interface ErrorReport {
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string | undefined;
  featureName?: string | undefined;
  level: string;
  error: {
    message: string;
    stack?: string | undefined;
    name: string;
  };
  componentStack?: string | undefined;
  buildInfo: {
    version: string;
    environment: string;
  };
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Report error in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }

    // Log to performance API for monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      performance.mark(`error-boundary-${this.props.level || 'unknown'}`);
    }
  }

  private generateErrorReport(error: Error, errorInfo: ErrorInfo): ErrorReport {
    const errorId = this.state.errorId || 'unknown';

    return {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      featureName: this.props.featureName,
      level: this.props.level || 'component',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      componentStack: errorInfo.componentStack || undefined,
      buildInfo: {
        version: process.env.REACT_APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
      },
    };
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = this.generateErrorReport(error, errorInfo);

      // Store error locally for user to report
      localStorage.setItem(`inkwell_error_${errorReport.errorId}`, JSON.stringify(errorReport));

      // In a real app, you'd send this to your error reporting service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    });
  };

  private handleReportIssue = () => {
    const errorReport =
      this.state.error && this.state.errorInfo
        ? this.generateErrorReport(this.state.error, this.state.errorInfo)
        : null;

    if (errorReport) {
      const subject = `Inkwell Error Report: ${errorReport.errorId}`;
      const body = `Error ID: ${errorReport.errorId}
Timestamp: ${errorReport.timestamp}
Feature: ${errorReport.featureName || 'Unknown'}
Level: ${errorReport.level}

Error Message: ${errorReport.error.message}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${JSON.stringify(errorReport, null, 2)}`;

      const mailtoLink = `mailto:support@inkwell.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
    }
  };

  private handleCopyDetails = async () => {
    const errorReport =
      this.state.error && this.state.errorInfo
        ? this.generateErrorReport(this.state.error, this.state.errorInfo)
        : null;

    if (errorReport) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
        // Show success feedback (you might want to use a toast here)
        alert('Error details copied to clipboard');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', featureName } = this.props;
      const { error, errorId, showDetails } = this.state;

      // Feature-level error UI
      if (level === 'feature') {
        return (
          <div className="min-h-[400px] flex items-center justify-center p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-serif font-semibold text-red-900 dark:text-red-100 mb-2">
                  {featureName || 'Feature'} Error
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm font-serif">
                  This feature encountered an error and couldn't load. You can try again or continue
                  using other parts of Inkwell.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-gold hover:bg-inkwell-gold/90 text-inkwell-navy rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReportIssue}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Report Issue
                </button>
              </div>

              {errorId && (
                <div className="mt-4 text-xs text-red-600 dark:text-red-400 font-mono">
                  Error ID: {errorId}
                </div>
              )}
            </div>
          </div>
        );
      }

      // App-level error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-inkwell-charcoal dark:to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-inkwell-charcoal rounded-xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-inkwell-gold/20">
            <div className="text-center mb-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                <div className="relative">
                  <InkwellLogo variant="icon" size="lg" className="mx-auto mb-4 text-red-500" />
                </div>
              </div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-serif">
                Inkwell encountered an unexpected error. We apologize for the inconvenience.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Error Message:</div>
                <div className="text-sm text-gray-900 font-mono">{error.message}</div>
                {errorId && <div className="mt-2 text-xs text-gray-500">ID: {errorId}</div>}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-inkwell-gold hover:bg-inkwell-gold/90 text-inkwell-navy rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Inkwell
              </button>

              <div className="flex gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-inkwell-gold/30 dark:border-inkwell-gold/30 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-inkwell-gold/10 dark:hover:bg-inkwell-gold/20 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReportIssue}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-inkwell-gold/30 dark:border-inkwell-gold/30 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-inkwell-gold/10 dark:hover:bg-inkwell-gold/20 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Report
                </button>
              </div>

              <button
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </button>

              {showDetails && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Technical Details</span>
                    <button
                      onClick={this.handleCopyDetails}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
                    {error?.stack || 'No stack trace available'}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact{' '}
                <a href="mailto:support@inkwell.app" className="text-blue-600 hover:text-blue-800">
                  support@inkwell.app
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <AppErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AppErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specialized error boundaries for common scenarios
export const FeatureErrorBoundary: React.FC<{
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
}> = ({ children, featureName, fallback }) => (
  <AppErrorBoundary level="feature" featureName={featureName} fallback={fallback}>
    {children}
  </AppErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <AppErrorBoundary level="component" fallback={fallback}>
    {children}
  </AppErrorBoundary>
);
