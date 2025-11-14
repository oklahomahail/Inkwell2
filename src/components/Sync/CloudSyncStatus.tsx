/**
 * Cloud Sync Status Component
 *
 * Displays cloud sync status with visual indicators:
 * - Connection status (online, syncing, offline, error)
 * - Pending operations count
 * - Last sync timestamp
 * - Manual sync button
 * - Error display
 *
 * Integrates with Phase 3 cloud sync services:
 * - syncQueue for pending operations
 * - realtimeService for connection status
 * - Supabase auth for authentication
 */

import { CloudOff, Cloud, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { SyncState } from '@/sync/types';

interface CloudSyncStatusProps {
  /** Current sync state */
  syncState: SyncState;

  /** Trigger manual sync */
  onManualSync?: () => void;

  /** Show detailed status (for debugging) */
  showDetails?: boolean;

  /** Compact mode (smaller UI) */
  compact?: boolean;
}

/**
 * Cloud Sync Status Indicator
 */
export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  syncState,
  onManualSync,
  showDetails = false,
  compact = false,
}) => {
  const [showError, setShowError] = useState(false);

  // Auto-hide error after 10 seconds
  useEffect(() => {
    if (syncState.lastError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [syncState.lastError]);

  // Get status icon
  const getStatusIcon = (): React.JSX.Element => {
    if (syncState.isSyncing) {
      return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    }

    switch (syncState.status) {
      case 'online':
        return syncState.isOnline ? (
          <Cloud className="w-3.5 h-3.5" />
        ) : (
          <Wifi className="w-3.5 h-3.5" />
        );
      case 'offline':
        return syncState.isOnline ? (
          <CloudOff className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        );
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'syncing':
        return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
      default:
        return <CloudOff className="w-3.5 h-3.5" />;
    }
  };

  // Get status color
  const getStatusColor = (): string => {
    if (syncState.isSyncing) return 'text-blue-400';

    switch (syncState.status) {
      case 'online':
        return 'text-emerald-400';
      case 'offline':
        return 'text-slate-500';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-500';
    }
  };

  // Get status text
  const getStatusText = (): string => {
    if (syncState.isSyncing) {
      return syncState.pendingOperations > 0
        ? `Syncing ${syncState.pendingOperations}...`
        : 'Syncing...';
    }

    if (!syncState.isAuthenticated) {
      return 'Not signed in';
    }

    if (!syncState.isOnline) {
      return 'Offline';
    }

    switch (syncState.status) {
      case 'online':
        return syncState.pendingOperations > 0
          ? `${syncState.pendingOperations} pending`
          : 'Synced';
      case 'offline':
        return 'Cloud offline';
      case 'error':
        return 'Sync error';
      default:
        return 'Unknown';
    }
  };

  // Get status dot color for pulse animation
  const getStatusDotColor = (): string => {
    if (syncState.isSyncing) return 'bg-blue-500';

    switch (syncState.status) {
      case 'online':
        return 'bg-emerald-500';
      case 'offline':
        return 'bg-slate-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Format last sync time
  const formatLastSynced = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  // Get tooltip text
  const getTooltip = (): string => {
    const parts: string[] = [];

    parts.push(`Status: ${getStatusText()}`);

    if (syncState.lastSyncAt) {
      parts.push(`Last sync: ${formatLastSynced(syncState.lastSyncAt)}`);
    }

    if (syncState.realtimeStatus !== 'disconnected') {
      parts.push(`Realtime: ${syncState.realtimeStatus}`);
    }

    if (syncState.lastError) {
      parts.push(`Error: ${syncState.lastError}`);
    }

    return parts.join(' • ');
  };

  if (compact) {
    // Compact mode: just icon and status dot
    return (
      <div className="flex items-center gap-2" title={getTooltip()}>
        {/* Status dot with pulse */}
        <span className="relative flex h-2 w-2">
          {syncState.isSyncing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusDotColor()}`} />
        </span>

        {/* Icon */}
        <span className={getStatusColor()}>{getStatusIcon()}</span>
      </div>
    );
  }

  // Full mode
  return (
    <div className="flex flex-col gap-2">
      {/* Main status bar */}
      <div
        className="flex items-center gap-3 px-3 py-2 bg-slate-900 border-l border-slate-800 rounded-md"
        title={getTooltip()}
      >
        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-xs transition-colors ${getStatusColor()}`}>
          {/* Animated dot */}
          <span className="relative flex h-2.5 w-2.5">
            {syncState.isSyncing && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusDotColor()}`}
            />
          </span>

          {/* Icon */}
          {getStatusIcon()}

          {/* Status text */}
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {/* Manual sync button */}
        {onManualSync && (
          <button
            onClick={onManualSync}
            disabled={syncState.isSyncing || !syncState.isAuthenticated}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              syncState.isSyncing || !syncState.isAuthenticated
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'
            }`}
            title={
              !syncState.isAuthenticated
                ? 'Sign in to sync'
                : syncState.isSyncing
                  ? 'Sync in progress...'
                  : 'Manually sync with cloud'
            }
          >
            <RefreshCw className={`w-3 h-3 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {showError && syncState.lastError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-900/20 border border-red-800 rounded-md text-xs text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">Sync Error</div>
            <div className="text-red-300/80 mt-1">{syncState.lastError}</div>
          </div>
          <button
            onClick={() => setShowError(false)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Detailed status (debug mode) */}
      {showDetails && (
        <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-md text-xs text-slate-400 font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Online:</span> {syncState.isOnline ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="text-slate-500">Auth:</span>{' '}
              {syncState.isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="text-slate-500">Pending:</span> {syncState.pendingOperations}
            </div>
            <div>
              <span className="text-slate-500">Realtime:</span> {syncState.realtimeStatus}
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Last sync:</span>{' '}
              {formatLastSynced(syncState.lastSyncAt)}
            </div>
            {syncState.retryDelay > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Retry in:</span> {syncState.retryDelay}ms
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudSyncStatus;
