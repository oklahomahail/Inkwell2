// PWA Offline Status Indicator
import { Wifi, WifiOff, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { pwaService, OfflineStorageManager } from '../../services/pwaService';

interface PWAOfflineIndicatorProps {
  className?: string;
  variant?: 'minimal' | 'detailed' | 'badge';
  showSyncStatus?: boolean;
}

export const PWAOfflineIndicator: React.FC<PWAOfflineIndicatorProps> = ({
  className = '',
  variant = 'minimal',
  showSyncStatus = true,
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    quota: number;
    usage: number;
    percentUsed: number;
  }>({ quota: 0, usage: 0, percentUsed: 0 });

  useEffect(() => {
    // Listen for offline status changes
    const unsubscribeOffline = pwaService.onOfflineStatusChange((offline) => {
      setIsOffline(offline);
    });

    // Check sync queue periodically
    const checkSyncQueue = () => {
      if (showSyncStatus) {
        const queue = OfflineStorageManager.getSyncQueue();
        setSyncQueue(queue);
      }
    };

    // Get storage info periodically
    const checkStorageInfo = async () => {
      const info = await OfflineStorageManager.getStorageInfo();
      setStorageInfo(info);
    };

    checkSyncQueue();
    checkStorageInfo();

    const syncInterval = setInterval(checkSyncQueue, 5000); // Check every 5 seconds
    const storageInterval = setInterval(checkStorageInfo, 30000); // Check every 30 seconds

    return () => {
      unsubscribeOffline();
      clearInterval(syncInterval);
      clearInterval(storageInterval);
    };
  }, [showSyncStatus]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Badge variant - minimal indicator
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {isOffline ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
            {syncQueue.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-200 rounded-full text-xs">
                {syncQueue.length}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </div>
        )}
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">Offline</span>
            {syncQueue.length > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                {syncQueue.length} pending
              </span>
            )}
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Online</span>
          </>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-5 h-5 text-orange-600" />
          ) : (
            <Wifi className="w-5 h-5 text-green-600" />
          )}
          <span className="font-medium text-gray-900">{isOffline ? 'Offline Mode' : 'Online'}</span>
        </div>

        {showSyncStatus && (
          <div className="flex items-center gap-2">
            {isOffline ? (
              <CloudOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Cloud className="w-4 h-4 text-blue-600" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {isOffline ? (
          <>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>Working offline - changes will sync when online</span>
            </div>
            {syncQueue.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <span className="text-orange-800 font-medium">
                  {syncQueue.length} change{syncQueue.length !== 1 ? 's' : ''} queued for sync
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>All changes saved and synced</span>
          </div>
        )}

        {/* Storage info */}
        {storageInfo.quota > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs">
              <span>Storage Used:</span>
              <span>
                {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  storageInfo.percentUsed > 80
                    ? 'bg-red-500'
                    : storageInfo.percentUsed > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
              />
            </div>
            {storageInfo.percentUsed > 90 && (
              <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Storage almost full</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
