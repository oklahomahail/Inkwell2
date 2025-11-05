/**
 * Recovery Error Boundary
 *
 * Enhanced error boundary that wraps critical panels (EditorPanel, DashboardPanel, BackupPanel)
 * with automatic recovery sequence on catastrophic failures.
 *
 * Recovery Sequence:
 * 1. Attempt Supabase pull (latest cloud backup)
 * 2. Attempt localStorage shadow copy restore
 * 3. Prompt user to upload JSON backup file
 */

import {
  AlertTriangle,
  RefreshCw,
  Cloud,
  HardDrive,
  Upload,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { recoveryService, type RecoveryResult } from '@/services/recoveryService';

interface Props {
  children: ReactNode;
  panelName: 'Editor' | 'Dashboard' | 'Backup';
  onRecovered?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryState: 'idle' | 'detecting' | 'recovering' | 'success' | 'failed' | 'uploadRequired';
  recoveryResult: RecoveryResult | null;
  isRetrying: boolean;
}

export class RecoveryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryState: 'idle',
      recoveryResult: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      recoveryState: 'detecting',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[RecoveryErrorBoundary] ${this.props.panelName} error:`, error, errorInfo);
    this.setState({ error, errorInfo });

    // Start automatic recovery sequence
    this.attemptRecovery();
  }

  private async attemptRecovery(): Promise<void> {
    this.setState({ recoveryState: 'recovering' });

    try {
      // Check IndexedDB health first
      const healthCheck = await recoveryService.checkIndexedDBHealth();
      if (!healthCheck.healthy) {
        console.warn('[RecoveryErrorBoundary] IndexedDB unhealthy:', healthCheck.error);
      }

      // Attempt 3-tier recovery
      const result = await recoveryService.attemptRecovery({
        attemptSupabase: true,
        attemptLocalStorage: true,
        requireUserUpload: false,
      });

      this.setState({
        recoveryResult: result,
        recoveryState: result.success ? 'success' : 'uploadRequired',
      });

      // If successful, notify parent and reset after delay
      if (result.success) {
        setTimeout(() => {
          this.props.onRecovered?.();
          this.handleReset();
        }, 3000);
      }
    } catch (error) {
      console.error('[RecoveryErrorBoundary] Recovery failed:', error);
      this.setState({
        recoveryState: 'failed',
        recoveryResult: {
          success: false,
          tier: 'none',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryState: 'idle',
      recoveryResult: null,
      isRetrying: false,
    });
  };

  private handleRetry = (): void => {
    this.setState({ isRetrying: true });
    setTimeout(() => {
      this.handleReset();
      this.setState({ isRetrying: false });
    }, 500);
  };

  private handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    this.setState({ recoveryState: 'recovering' });

    try {
      const text = await file.text();
      const result = await recoveryService.recoverFromUserUpload(text);

      this.setState({
        recoveryResult: result,
        recoveryState: result.success ? 'success' : 'failed',
      });

      if (result.success) {
        setTimeout(() => {
          this.props.onRecovered?.();
          this.handleReset();
        }, 3000);
      }
    } catch (error) {
      this.setState({
        recoveryState: 'failed',
        recoveryResult: {
          success: false,
          tier: 'userUpload',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: error instanceof Error ? error.message : 'Failed to upload backup',
        },
      });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-8">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {this.props.panelName} Error Detected
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Attempting automatic recovery...
              </p>
            </div>
          </div>

          {/* Error Details (Development Only) */}
          {import.meta.env.MODE === 'development' && this.state.error && (
            <details className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
                {this.state.error.message}
                {this.state.errorInfo &&
                  `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
              </pre>
            </details>
          )}

          {/* Recovery Status */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recovery Progress
            </h2>

            {/* Tier 1: Supabase */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Cloud
                className={`w-5 h-5 ${
                  this.state.recoveryResult?.tier === 'supabase' &&
                  this.state.recoveryResult.success
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Cloud Backup (Supabase)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {this.state.recoveryState === 'recovering' && !this.state.recoveryResult
                    ? 'Checking...'
                    : this.state.recoveryResult?.tier === 'supabase'
                      ? this.state.recoveryResult.success
                        ? `✓ Recovered ${this.state.recoveryResult.recoveredProjects} projects`
                        : `✗ ${this.state.recoveryResult.error}`
                      : 'Pending'}
                </p>
              </div>
              {this.state.recoveryResult?.tier === 'supabase' &&
                (this.state.recoveryResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                ))}
            </div>

            {/* Tier 2: localStorage Shadow Copy */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <HardDrive
                className={`w-5 h-5 ${
                  this.state.recoveryResult?.tier === 'localStorage' &&
                  this.state.recoveryResult.success
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Local Shadow Copy</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {this.state.recoveryState === 'recovering' &&
                  this.state.recoveryResult?.tier !== 'supabase'
                    ? 'Checking...'
                    : this.state.recoveryResult?.tier === 'localStorage'
                      ? this.state.recoveryResult.success
                        ? `✓ ${this.state.recoveryResult.message}`
                        : `✗ ${this.state.recoveryResult.error}`
                      : 'Pending'}
                </p>
              </div>
              {this.state.recoveryResult?.tier === 'localStorage' &&
                (this.state.recoveryResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                ))}
            </div>

            {/* Tier 3: User Upload */}
            {this.state.recoveryState === 'uploadRequired' && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Upload className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Manual Backup Required
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please upload your backup file to restore data
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {this.state.recoveryState === 'success' && this.state.recoveryResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Recovery Successful!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {this.state.recoveryResult.message}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Reloading in 3 seconds...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {this.state.recoveryState === 'uploadRequired' && (
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="application/json"
                  onChange={this.handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Backup File
                </div>
              </label>
            )}

            {this.state.recoveryState !== 'success' && (
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying || this.state.recoveryState === 'recovering'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                Try Again
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-navy text-white rounded-lg hover:bg-inkwell-navy-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default RecoveryErrorBoundary;
