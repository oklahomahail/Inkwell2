import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  pwaService,
  type StorageQuotaWarning as StorageQuotaWarningType,
} from '@/services/pwaService';

/**
 * Storage Quota Warning Component
 *
 * Displays warnings when storage quota reaches critical levels:
 * - Info (60-70%): User should be aware
 * - Warning (70-90%): Suggests cleanup
 * - Critical (90%+): Urgent action needed
 */
export function StorageQuotaWarning() {
  const [warning, setWarning] = useState<StorageQuotaWarningType | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaService.onStorageQuotaWarning((newWarning) => {
      setWarning(newWarning);
      setDismissed(false); // Show warning again when level changes
    });

    return unsubscribe;
  }, []);

  if (!warning || dismissed) return null;

  const { level, percentUsed, usage, quota } = warning;

  // Format bytes to human-readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMessage = () => {
    switch (level) {
      case 'critical':
        return 'Storage critically low! Your data may not save properly.';
      case 'warning':
        return 'Storage running low. Consider cleaning up old data.';
      case 'info':
        return 'Storage usage is getting high.';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  const handleManageStorage = () => {
    // TODO: Navigate to settings or storage management page
    // For now, just dismiss the warning
    setDismissed(true);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md rounded-lg border-2 p-4 shadow-lg ${getStyles()}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">
            Storage {level === 'critical' ? 'Critical' : level === 'warning' ? 'Warning' : 'Notice'}
          </h3>
          <p className="text-sm mb-2">{getMessage()}</p>
          <p className="text-xs opacity-75">
            Using {percentUsed.toFixed(1)}% ({formatBytes(usage)} of {formatBytes(quota)})
          </p>
          <button
            onClick={handleManageStorage}
            className="mt-3 text-sm font-medium underline hover:no-underline"
          >
            Manage Storage
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 rounded p-1 hover:bg-black/10 transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
