/**
 * useSync Hook
 *
 * React hook for accessing sync/connectivity status:
 * - Online/offline state
 * - Queued operations count
 * - Last sync timestamp
 * - Manual retry function
 *
 * Minimal beta implementation for v0.9.0
 */

import { useState, useEffect } from 'react';

import { connectivityService } from '@/services/connectivityService';
import type { ConnectivityStatus } from '@/services/connectivityService';

export interface SyncStatus {
  /** Whether device is currently online */
  isOnline: boolean;

  /** Number of pending operations in offline queue */
  queuedOps: number;

  /** Timestamp of last successful sync (null if never synced) */
  lastSync: Date | null;

  /** Status indicator: 'synced' | 'pending' | 'error' */
  status: 'synced' | 'pending' | 'error';

  /** Manual retry function for failed operations */
  retry: () => Promise<void>;

  /** Whether retry is currently in progress */
  isRetrying: boolean;
}

/**
 * Hook for accessing sync status
 */
export function useSync(): SyncStatus {
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(() =>
    connectivityService.getStatus(),
  );
  const [isRetrying, setIsRetrying] = useState(false);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((status) => {
      setConnectivityStatus(status);
    });

    return unsubscribe;
  }, []);

  // Determine overall status
  const status: SyncStatus['status'] = (() => {
    if (!connectivityStatus.isOnline) {
      return connectivityStatus.queuedWrites > 0 ? 'pending' : 'synced';
    }

    if (connectivityStatus.queuedWrites > 0) {
      return 'pending';
    }

    // Check if last offline was recent (within 5 minutes) without successful sync
    const now = Date.now();
    const lastOfflineTime = connectivityStatus.lastOffline?.getTime() ?? 0;
    const lastOnlineTime = connectivityStatus.lastOnline?.getTime() ?? 0;

    if (lastOfflineTime > lastOnlineTime && now - lastOfflineTime < 5 * 60 * 1000) {
      return 'error';
    }

    return 'synced';
  })();

  // Manual retry function
  const retry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      await connectivityService.processQueue();
    } catch (error) {
      console.error('Failed to retry sync:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    isOnline: connectivityStatus.isOnline,
    queuedOps: connectivityStatus.queuedWrites,
    lastSync: connectivityStatus.lastOnline,
    status,
    retry,
    isRetrying,
  };
}
