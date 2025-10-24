import { AlertCircle, CheckCircle, Database, HardDrive } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { StorageHealth } from '@/utils/storage/storageHealth';
import { getSimpleStorageStatus, getStorageHealth } from '@/utils/storage/storageHealth';

interface SimpleStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: string;
}

/**
 * Compact widget showing storage health status
 * Displays in the top-right corner of the app
 */
export function StorageHealthWidget() {
  const [simpleStatus, setSimpleStatus] = useState<SimpleStatus | null>(null);
  const [fullHealth, setFullHealth] = useState<StorageHealth | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initial check
    const checkHealth = async () => {
      const [simple, full] = await Promise.all([getSimpleStorageStatus(), getStorageHealth()]);
      setSimpleStatus(simple);
      setFullHealth(full);
    };

    checkHealth();

    // Re-check every minute
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!simpleStatus || !fullHealth) {
    return null;
  }

  // Only show widget if there's something to report
  if (simpleStatus.status === 'healthy' && !showDetails) {
    // Show a minimal indicator in healthy state
    return (
      <button
        onClick={() => setShowDetails(true)}
        className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
        aria-label="Storage status: healthy"
        title="Storage is healthy - click for details"
      >
        <Database className="h-4 w-4" />
      </button>
    );
  }

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
    },
    critical: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
    },
  };

  const config = statusConfig[simpleStatus.status];
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 rounded-lg border ${config.border} ${config.bg} px-3 py-2 text-sm transition-colors hover:opacity-80`}
        aria-label={`Storage status: ${simpleStatus.message}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={config.color}>{simpleStatus.message}</span>
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Storage Health</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-gray-900 dark:text-gray-100">{simpleStatus.message}</span>
            </div>

            {simpleStatus.details && (
              <p className="text-gray-600 dark:text-gray-400">{simpleStatus.details}</p>
            )}

            {/* Database Info */}
            <div className="space-y-1 border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Database className="h-4 w-4" />
                <span>
                  {fullHealth.dbName} v{fullHealth.dbVersion}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <HardDrive className="h-4 w-4" />
                <span>
                  {fullHealth.usageFormatted} / {fullHealth.quotaFormatted}
                </span>
              </div>
            </div>

            {/* Persistence Status */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {fullHealth.persisted ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Storage is persistent</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Storage not persistent</span>
                </>
              )}
            </div>

            {/* Warnings */}
            {fullHealth.warnings.length > 0 && (
              <div className="space-y-1 border-t border-gray-200 pt-2 dark:border-gray-700">
                {fullHealth.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400"
                  >
                    <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Last Autosave */}
            {fullHealth.lastAutosaveAt && (
              <div className="border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Last autosave: {new Date(fullHealth.lastAutosaveAt).toLocaleString()}
              </div>
            )}

            {/* Origin Info */}
            {!fullHealth.isProduction && (
              <div className="border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Origin: {fullHealth.origin}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
