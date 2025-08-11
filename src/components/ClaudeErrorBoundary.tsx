// src/components/ClaudeErrorBoundary.tsx
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Optional: called when user clicks "Restart Assistant" */
  onReset?: () => void;
  /** Optional: called when an error is captured */
  onReport?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error?: Error;
  info?: ErrorInfo;
  showDetails: boolean;
};

class ClaudeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report upstream if provided
    if (this.props.onReport) {
      this.props.onReport(error, info);
    }
    // Dev-only console for debugging (no process.env usage)
    if (import.meta.env.DEV) {
      console.error('Claude Assistant Error:', error, info);
    }
    this.setState({ info });
  }

  private handleRestart = () => {
    this.setState({ hasError: false, error: undefined, info: undefined, showDetails: false });
    this.props.onReset?.();
  };

  private toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info, showDetails } = this.state;

    return (
      <div
        className="fixed bottom-6 right-6 z-50 w-96 rounded-xl border border-red-200 bg-red-50 p-4 shadow-2xl dark:border-red-700 dark:bg-red-900"
        role="alert"
        aria-live="assertive"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          <h3 className="text-lg font-semibold font-semibold text-red-800 dark:text-red-200">
            Claude Assistant Error
          </h3>
        </div>

        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          The Claude assistant encountered an error and needs to be restarted.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.handleRestart}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
          >
            Restart Assistant
          </button>

          <button
            type="button"
            onClick={this.toggleDetails}
            className="rounded bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700"
            aria-expanded={showDetails}
            aria-controls="claude-error-details"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {(showDetails || import.meta.env.DEV) && error && (
          <details
            id="claude-error-details"
            className="mt-3"
            open={showDetails || import.meta.env.DEV}
          >
            <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">
              Debug Info
            </summary>
            <pre className="mt-2 max-h-40 whitespace-pre-wrap overflow-auto text-xs text-red-700 dark:text-red-300">
              {error.stack ?? String(error)}
              {info ? `\n\nComponent stack:\n${info.componentStack}` : ''}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

export default ClaudeErrorBoundary;
