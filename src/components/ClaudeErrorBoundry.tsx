// src/components/ClaudeErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ClaudeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Claude Assistant Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 w-96 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Claude Assistant Error
            </h3>
          </div>

          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            The Claude assistant encountered an error and needs to be restarted.
          </p>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Restart Assistant
            </button>
            <button
              onClick={() => {
                console.log('Error details:', this.state.error);
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              View Details
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                Debug Info
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClaudeErrorBoundary;
