/**
 * StatusBar Component
 *
 * Minimal status indicator for sync/offline queue:
 * - Green dot: All synced
 * - Yellow dot: Operations pending
 * - Red dot: Sync error
 *
 * Tooltip shows:
 * - Last sync timestamp
 * - Queued operations count
 *
 * Manual retry button appears on error state
 *
 * Beta implementation for v0.9.0
 */

import { RefreshCw } from 'lucide-react';

import { useSync } from '@/hooks/useSync';

export interface StatusBarProps {
  className?: string;
}

export default function StatusBar({ className = '' }: StatusBarProps) {
  const { status, queuedOps, lastSync, retry, isRetrying } = useSync();

  // Format last sync time
  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never synced';

    const now = Date.now();
    const diff = now - date.getTime();

    // Less than 1 minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000));
      return `${mins}m ago`;
    }

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }

    // Format as date
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Status configuration
  const statusConfig = {
    synced: {
      color: 'bg-green-500',
      label: 'Synced',
      tooltip: `Last sync: ${formatLastSync(lastSync)}`,
    },
    pending: {
      color: 'bg-yellow-500',
      label: 'Syncing',
      tooltip: `${queuedOps} operation${queuedOps !== 1 ? 's' : ''} pending`,
    },
    error: {
      color: 'bg-red-500',
      label: 'Sync Error',
      tooltip: `${queuedOps} operation${queuedOps !== 1 ? 's' : ''} failed`,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      data-testid="status-bar"
      data-status={status}
    >
      {/* Status Dot with Tooltip */}
      <div className="group relative flex items-center">
        <div
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${config.color}
            ${status === 'pending' ? 'animate-pulse' : ''}
          `}
          data-testid="status-dot"
          aria-label={config.label}
        />

        {/* Tooltip */}
        <div
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
            text-xs rounded-lg shadow-lg whitespace-nowrap
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 pointer-events-none z-50
          "
          data-testid="status-tooltip"
        >
          <div className="font-medium">{config.label}</div>
          <div className="text-gray-300 dark:text-gray-600">{config.tooltip}</div>

          {/* Tooltip Arrow */}
          <div
            className="
              absolute top-full left-1/2 -translate-x-1/2
              w-0 h-0 border-4 border-transparent
              border-t-gray-900 dark:border-t-gray-100
            "
          />
        </div>
      </div>

      {/* Retry Button (only on error) */}
      {status === 'error' && (
        <button
          onClick={retry}
          disabled={isRetrying}
          className="
            flex items-center gap-1 px-2 py-1 text-xs
            text-red-600 dark:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            rounded transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          data-testid="retry-button"
          aria-label="Retry sync"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`}
            data-testid="retry-icon"
          />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
