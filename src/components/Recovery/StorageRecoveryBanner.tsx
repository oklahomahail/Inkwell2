// src/components/Recovery/StorageRecoveryBanner.tsx
import { AlertTriangle, Download, Trash2, RefreshCw, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useToast } from '@/context/ToastContext';

import { exportService } from '../../services/exportService';
import { snapshotService } from '../../services/snapshotService';
import { quotaAwareStorage, StorageQuotaInfo, StorageError } from '../../utils/quotaAwareStorage';

interface StorageRecoveryBannerProps {
  onDismiss?: () => void;
}

export const StorageRecoveryBanner: React.FC<StorageRecoveryBannerProps> = ({ onDismiss }) => {
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Monitor quota changes
    const unsubscribeQuota = quotaAwareStorage.onQuotaUpdate((info) => {
      setQuotaInfo(info);
    });

    // Monitor storage errors
    const unsubscribeError = quotaAwareStorage.onStorageError((error) => {
      setStorageError(error);
    });

    // Initial quota check
    quotaAwareStorage.getQuotaInfo().then(setQuotaInfo);

    return () => {
      unsubscribeQuota();
      unsubscribeError();
    };
  }, []);

  const handleEmergencyCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await quotaAwareStorage.emergencyCleanup();
      showToast(`Cleanup complete! Freed ${(result.freedBytes / 1024).toFixed(1)}KB`, 'success');

      if (result.actions.length > 0) {
        console.log('Cleanup actions performed:', result.actions);
      }

      // Refresh quota info
      const newQuotaInfo = await quotaAwareStorage.getQuotaInfo();
      setQuotaInfo(newQuotaInfo);

      if (!newQuotaInfo.isCritical) {
        setStorageError(null);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      showToast('Cleanup failed. Please try manual backup.', 'error');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      // Export all projects as backup
      const projects = JSON.parse(localStorage.getItem('inkwell_enhanced_projects') || '[]');
      if (projects.length > 0) {
        for (const project of projects) {
          await exportService.exportProject(project.id, 'json');
        }
        showToast('Backup downloaded successfully', 'success');
      } else {
        showToast('No projects found to backup', 'warning');
      }
    } catch (error) {
      console.error('Backup download failed:', error);
      showToast('Backup download failed', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearSnapshots = async () => {
    try {
      const projects = JSON.parse(localStorage.getItem('inkwell_enhanced_projects') || '[]');
      let totalCleared = 0;

      for (const project of projects) {
        const cleared = await snapshotService.emergencyCleanup(project.id, 2);
        totalCleared += cleared;
      }

      showToast(`Cleared ${totalCleared} old snapshots`, 'success');

      // Refresh quota info
      const newQuotaInfo = await quotaAwareStorage.getQuotaInfo();
      setQuotaInfo(newQuotaInfo);
    } catch (error) {
      console.error('Failed to clear snapshots:', error);
      showToast('Failed to clear snapshots', 'error');
    }
  };

  // Don't show banner if no issues
  if (!quotaInfo || (!quotaInfo.isNearLimit && !storageError)) {
    return null;
  }
  const _isQuotaIssue = quotaInfo.isCritical || quotaInfo.isNearLimit;
  const _isStorageError = storageError !== null;

  return (
    <div
      className={`
      fixed top-0 left-0 right-0 z-50 
      ${quotaInfo.isCritical || storageError?.type === 'quota' ? 'bg-red-600' : 'bg-yellow-600'} 
      text-white shadow-lg border-b-2 border-opacity-20 border-white
    `}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">
                {storageError
                  ? storageError.type === 'quota'
                    ? 'Storage Full'
                    : 'Storage Error'
                  : quotaInfo.isCritical
                    ? 'Storage Critical'
                    : 'Storage Warning'}
              </div>
              <div className="text-sm opacity-90">
                {storageError
                  ? storageError.message
                  : quotaInfo.isCritical
                    ? `Storage is ${(quotaInfo.percentUsed * 100).toFixed(1)}% full. Save your work immediately.`
                    : `Storage is ${(quotaInfo.percentUsed * 100).toFixed(1)}% full. Consider cleaning up.`}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action buttons */}
            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 inline mr-1" />
                  Backup
                </>
              )}
            </button>

            <button
              onClick={handleEmergencyCleanup}
              disabled={isCleaningUp}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isCleaningUp ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Cleanup
                </>
              )}
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Detailed view */}
        {showDetails && quotaInfo && (
          <div className="mt-3 pt-3 border-t border-white border-opacity-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Storage Usage</div>
                <div className="opacity-90">
                  {(quotaInfo.usage / 1024 / 1024).toFixed(1)}MB /{' '}
                  {(quotaInfo.quota / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-1">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(quotaInfo.percentUsed * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="font-medium">Available Space</div>
                <div className="opacity-90">
                  {(quotaInfo.available / 1024 / 1024).toFixed(1)}MB remaining
                </div>
              </div>

              <div>
                <div className="font-medium">Suggested Actions</div>
                <div className="opacity-90">
                  {storageError?.suggestedActions ? (
                    <ul className="text-xs space-y-1">
                      {storageError.suggestedActions.slice(0, 2).map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={handleClearSnapshots}
                        className="block text-xs hover:underline"
                      >
                        • Clear old snapshots
                      </button>
                      <button
                        onClick={handleDownloadBackup}
                        className="block text-xs hover:underline"
                      >
                        • Download backup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Offline Banner Component
interface OfflineBannerProps {
  queuedOperations: number;
  onViewQueue?: () => void;
  onDismiss?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  queuedOperations,
  onViewQueue,
  onDismiss,
}) => {
  if (queuedOperations === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-orange-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            <div className="text-sm">
              <span className="font-medium">Offline Mode</span>
              <span className="opacity-90 ml-2">{queuedOperations} operations queued for sync</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onViewQueue && (
              <button
                onClick={onViewQueue}
                className="px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
              >
                View Queue
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for using storage recovery
export const useStorageRecovery = () => {
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(null);

  useEffect(() => {
    const unsubscribe = quotaAwareStorage.onQuotaUpdate((info) => {
      setQuotaInfo(info);
      setShowRecoveryBanner(info.isNearLimit || info.isCritical);
    });

    const unsubscribeError = quotaAwareStorage.onStorageError(() => {
      setShowRecoveryBanner(true);
    });

    // Initial check
    quotaAwareStorage.getQuotaInfo().then((info) => {
      setQuotaInfo(info);
      setShowRecoveryBanner(info.isNearLimit || info.isCritical);
    });

    return () => {
      unsubscribe();
      unsubscribeError();
    };
  }, []);

  return {
    showRecoveryBanner,
    quotaInfo,
    dismissRecoveryBanner: () => setShowRecoveryBanner(false),
  };
};
