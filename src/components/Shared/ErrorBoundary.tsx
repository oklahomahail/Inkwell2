// src/components/Shared/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 p-8">
          <h1 className="text-3xl font-extrabold leading-tight font-extrabold leading-tight font-bold mb-4">
            Something went wrong.
          </h1>
          <p className="text-lg font-semibold font-semibold font-semibold font-semibold font-medium mb-2">
            {this.state.error?.message}
          </p>
          <p className="text-sm text-gray-600">
            Please refresh the page or contact support if the issue continues.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
