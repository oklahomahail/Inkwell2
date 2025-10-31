/**
 * Storage Status Indicator Component
 *
 * Displays real-time storage health in the footer/settings.
 * Shows persistence status, quota usage, and actionable warnings.
 */

import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { storageManager, type StorageHealthStatus } from '@/services/storageManager';
import { cn } from '@/utils/cn';
import { formatBytes } from '@/utils/storage/persistence';

export interface StorageStatusIndicatorProps {
  /** Show in compact mode (footer) or expanded mode (settings) */
  variant?: 'compact' | 'expanded';
  /** Additional CSS classes */
  className?: string;
}

export function StorageStatusIndicator({
  variant = 'compact',
  className,
}: StorageStatusIndicatorProps) {
  const [status, setStatus] = useState<StorageHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Load initial status
    const loadStatus = async () => {
      try {
        const healthStatus = await storageManager.getHealthStatus();
        if (mounted) {
          setStatus(healthStatus);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load storage status:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadStatus();

    // Subscribe to updates
    const unsubscribe = storageManager.onHealthUpdate((healthStatus) => {
      if (mounted) {
        setStatus(healthStatus);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleRequestPersistence = async () => {
    setRequesting(true);
    try {
      const granted = await storageManager.requestPersistence();
      if (!granted) {
        console.warn('[StorageStatus] Persistence denied by browser');
      }
    } catch (error) {
      console.error('[StorageStatus] Failed to request persistence:', error);
    } finally {
      setRequesting(false);
    }
  };

  const handleEmergencyCleanup = async () => {
    if (!confirm('This will clear old snapshots and temporary data. Continue?')) {
      return;
    }

    try {
      const result = await storageManager.emergencyCleanup();
      alert(`Freed ${formatBytes(result.freedBytes)}\n\nActions:\n${result.actions.join('\n')}`);
    } catch (error) {
      console.error('[StorageStatus] Cleanup failed:', error);
      alert('Cleanup failed. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-gray-500',
          variant === 'compact' ? 'px-3 py-1.5' : 'p-4',
          className,
        )}
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Checking storage...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Determine status color and icon
  const getStatusIcon = () => {
    if (status.healthScore >= 80) {
      return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    } else if (status.healthScore >= 60) {
      return { Icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const { Icon: StatusIcon, color, bg } = getStatusIcon();

  // Compact variant (for footer)
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            'hover:bg-gray-100',
            expanded && 'bg-gray-100',
          )}
        >
          <StatusIcon className={cn('w-4 h-4', color)} />
          <span className="text-gray-700">{status.isPersistent ? 'Persisted' : 'Temporary'}</span>
          {status.quota && (
            <span className="text-gray-500">{Math.round(status.quota.percentUsed * 100)}%</span>
          )}
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          )}
        </button>

        {expanded && (
          <div className="absolute bottom-full mb-2 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
            <StorageDetailPanel
              status={status}
              onRequestPersistence={handleRequestPersistence}
              onEmergencyCleanup={handleEmergencyCleanup}
              requesting={requesting}
            />
          </div>
        )}
      </div>
    );
  }

  // Expanded variant (for settings page)
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', bg)}>
              <Database className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Storage Health</h3>
              <p className="text-sm text-gray-600">Health Score: {status.healthScore}/100</p>
            </div>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-xs font-medium', bg, color)}>
            {status.isPersistent ? 'Persistent' : 'Temporary'}
          </div>
        </div>

        <StorageDetailPanel
          status={status}
          onRequestPersistence={handleRequestPersistence}
          onEmergencyCleanup={handleEmergencyCleanup}
          requesting={requesting}
        />
      </div>
    </div>
  );
}

/**
 * Detail panel showing storage health details
 */
interface StorageDetailPanelProps {
  status: StorageHealthStatus;
  onRequestPersistence: () => void;
  onEmergencyCleanup: () => void;
  requesting: boolean;
}

function StorageDetailPanel({
  status,
  onRequestPersistence,
  onEmergencyCleanup,
  requesting,
}: StorageDetailPanelProps) {
  return (
    <div className="space-y-4">
      {/* Quota */}
      {status.quota && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-700">Storage Usage</span>
            <span className="font-medium text-gray-900">
              {Math.round(status.quota.percentUsed * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                status.quota.isCritical
                  ? 'bg-red-500'
                  : status.quota.isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-green-500',
              )}
              style={{ width: `${Math.round(status.quota.percentUsed * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{formatBytes(status.quota.usage)} used</span>
            <span>{formatBytes(status.quota.quota)} total</span>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {status.hasIndexedDB ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-gray-700">IndexedDB</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {status.hasLocalStorage ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-gray-700">LocalStorage</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {status.isPersistent ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          )}
          <span className="text-gray-700">Persistent Storage</span>
        </div>
      </div>

      {/* Errors */}
      {status.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 mb-1">Errors</p>
              <ul className="text-xs text-red-700 space-y-1">
                {status.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {status.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-900 mb-1">Warnings</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                {status.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
        {!status.isPersistent && status.persistenceSupported && (
          <button
            onClick={onRequestPersistence}
            disabled={requesting}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {requesting ? 'Requesting...' : 'Request Persistent Storage'}
          </button>
        )}

        {status.quota && (status.quota.isNearLimit || status.quota.isCritical) && (
          <button
            onClick={onEmergencyCleanup}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Free Up Space
          </button>
        )}
      </div>
    </div>
  );
}
