/**
 * Storage Error Logger
 *
 * Centralized logging and notification system for storage failures.
 * Logs to console and optionally shows user notifications.
 */

import devLog from '@/utils/devLog';
import type { StorageError } from '@/utils/quotaAwareStorage';

export interface StorageErrorEvent {
  type: 'save' | 'load' | 'delete' | 'quota' | 'corruption' | 'sync';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  canRecover: boolean;
  suggestedActions: string[];
}

export interface ErrorLogEntry {
  id: string;
  event: StorageErrorEvent;
  acknowledged: boolean;
}

class StorageErrorLogger {
  private errorLog: ErrorLogEntry[] = [];
  private errorListeners: Set<(entry: ErrorLogEntry) => void> = new Set();
  private maxLogSize = 100; // Keep last 100 errors

  /**
   * Log a storage error
   */
  logError(event: Omit<StorageErrorEvent, 'timestamp'>): void {
    const fullEvent: StorageErrorEvent = {
      ...event,
      timestamp: Date.now(),
    };

    const entry: ErrorLogEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      event: fullEvent,
      acknowledged: false,
    };

    // Add to log (keep only last maxLogSize entries)
    this.errorLog.push(entry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console with appropriate level
    this.logToConsole(fullEvent);

    // Notify listeners
    this.notifyListeners(entry);

    // Store in localStorage for persistence across sessions
    this.persistErrorLog();
  }

  /**
   * Log a save failure
   */
  logSaveFailure(key: string, error: Error | StorageError): void {
    const storageError = this.toStorageError(error);

    this.logError({
      type: 'save',
      severity: storageError.type === 'quota' ? 'critical' : 'error',
      message: `Failed to save ${key}: ${storageError.message}`,
      details: { key, errorType: storageError.type },
      canRecover: storageError.canRecover,
      suggestedActions: storageError.suggestedActions || ['Try again', 'Check storage quota'],
    });
  }

  /**
   * Log a load failure
   */
  logLoadFailure(key: string, error: Error | StorageError): void {
    const storageError = this.toStorageError(error);

    this.logError({
      type: 'load',
      severity: storageError.type === 'corruption' ? 'critical' : 'error',
      message: `Failed to load ${key}: ${storageError.message}`,
      details: { key, errorType: storageError.type },
      canRecover: storageError.canRecover,
      suggestedActions: storageError.suggestedActions || [
        'Refresh the page',
        'Restore from backup',
      ],
    });
  }

  /**
   * Log a quota warning
   */
  logQuotaWarning(percentUsed: number, usage: number, quota: number): void {
    this.logError({
      type: 'quota',
      severity: percentUsed >= 0.95 ? 'critical' : 'warning',
      message: `Storage ${percentUsed >= 0.95 ? 'critically low' : 'usage high'}: ${Math.round(percentUsed * 100)}% used`,
      details: { percentUsed, usage, quota },
      canRecover: true,
      suggestedActions: [
        'Clear old snapshots',
        'Export and delete old projects',
        'Free up browser storage',
      ],
    });
  }

  /**
   * Log a sync failure
   */
  logSyncFailure(direction: 'push' | 'pull', error: Error): void {
    this.logError({
      type: 'sync',
      severity: 'error',
      message: `Failed to ${direction === 'push' ? 'upload to' : 'download from'} cloud: ${error.message}`,
      details: { direction },
      canRecover: true,
      suggestedActions: ['Check internet connection', 'Verify authentication', 'Try again later'],
    });
  }

  /**
   * Get all error log entries
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Get unacknowledged errors
   */
  getUnacknowledgedErrors(): ErrorLogEntry[] {
    return this.errorLog.filter((entry) => !entry.acknowledged);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: StorageErrorEvent['severity']): ErrorLogEntry[] {
    return this.errorLog.filter((entry) => entry.event.severity === severity);
  }

  /**
   * Acknowledge an error
   */
  acknowledgeError(id: string): void {
    const entry = this.errorLog.find((e) => e.id === id);
    if (entry) {
      entry.acknowledged = true;
      this.persistErrorLog();
    }
  }

  /**
   * Acknowledge all errors
   */
  acknowledgeAllErrors(): void {
    this.errorLog.forEach((entry) => {
      entry.acknowledged = true;
    });
    this.persistErrorLog();
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.persistErrorLog();
  }

  /**
   * Subscribe to error events
   */
  onError(callback: (entry: ErrorLogEntry) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Initialize logger (load persisted errors)
   */
  initialize(): void {
    try {
      const stored = localStorage.getItem('inkwell_storage_error_log');
      if (stored) {
        this.errorLog = JSON.parse(stored);
        devLog.log(`[StorageErrorLogger] Loaded ${this.errorLog.length} persisted error entries`);
      }
    } catch (error) {
      devLog.warn('[StorageErrorLogger] Failed to load persisted error log:', error);
    }
  }

  // Private methods

  /**
   * Convert error to StorageError format
   */
  private toStorageError(error: Error | StorageError): StorageError {
    if ('type' in error && 'canRecover' in error) {
      return error;
    }

    return {
      type: 'generic',
      message: error.message,
      canRecover: true,
      suggestedActions: ['Try again', 'Restart the application'],
    };
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(event: StorageErrorEvent): void {
    const prefix = '[StorageError]';
    const timestamp = new Date(event.timestamp).toISOString();
    const logMessage = `${prefix} [${event.severity.toUpperCase()}] ${event.message}`;

    switch (event.severity) {
      case 'critical':
      case 'error':
        console.error(logMessage, {
          timestamp,
          type: event.type,
          details: event.details,
          suggestedActions: event.suggestedActions,
        });
        break;
      case 'warning':
        console.warn(logMessage, {
          timestamp,
          type: event.type,
          details: event.details,
          suggestedActions: event.suggestedActions,
        });
        break;
      case 'info':
        // Info-level events are only logged to the error log, not console
        // to avoid cluttering console output
        break;
    }
  }

  /**
   * Persist error log to localStorage
   */
  private persistErrorLog(): void {
    try {
      localStorage.setItem('inkwell_storage_error_log', JSON.stringify(this.errorLog));
    } catch (_error) {
      // Don't log this error (would cause infinite loop)
      console.warn('[StorageErrorLogger] Failed to persist error log');
    }
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(entry: ErrorLogEntry): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (error) {
        console.error('[StorageErrorLogger] Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const storageErrorLogger = new StorageErrorLogger();
export default storageErrorLogger;
