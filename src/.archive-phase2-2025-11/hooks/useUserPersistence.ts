/**
 * useUserPersistence Hook
 *
 * React hook for managing user-defined data persistence settings
 */

import { useState, useEffect } from 'react';

import { userPersistenceService } from '@/services/userPersistenceService';
import type {
  PersistenceMode,
  PersistenceSettings,
  PersistenceStatus,
  PersistenceCapabilities,
  DataSyncEvent,
} from '@/types/persistenceConfig';

export function useUserPersistence() {
  const [settings, setSettings] = useState<PersistenceSettings>(
    userPersistenceService.getSettings(),
  );
  const [status, setStatus] = useState<PersistenceStatus | null>(null);
  const [capabilities, setCapabilities] = useState<PersistenceCapabilities | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = userPersistenceService.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  // Load status and capabilities on mount
  useEffect(() => {
    loadStatus();
    loadCapabilities();
  }, []);

  const loadStatus = async () => {
    try {
      const newStatus = await userPersistenceService.getStatus();
      setStatus(newStatus);
    } catch (err) {
      console.error('Failed to load persistence status:', err);
    }
  };

  const loadCapabilities = async () => {
    try {
      const caps = await userPersistenceService.getCapabilities();
      setCapabilities(caps);
    } catch (err) {
      console.error('Failed to load persistence capabilities:', err);
    }
  };

  const updateSettings = async (updates: Partial<PersistenceSettings>) => {
    setLoading(true);
    setError(null);

    try {
      await userPersistenceService.updateSettings(updates);
      await loadStatus(); // Refresh status after update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (mode: PersistenceMode) => {
    await updateSettings({ mode });
  };

  const triggerSync = async () => {
    setLoading(true);
    setError(null);

    try {
      await userPersistenceService.triggerSync();
      await loadStatus(); // Refresh status after sync
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const triggerBackup = async () => {
    setLoading(true);
    setError(null);

    try {
      await userPersistenceService.triggerBackup();
      await loadStatus(); // Refresh status after backup
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to backup';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    status,
    capabilities,
    loading,
    error,
    updateSettings,
    setMode,
    triggerSync,
    triggerBackup,
    refreshStatus: loadStatus,
    refreshCapabilities: loadCapabilities,
  };
}

/**
 * Hook for subscribing to sync events
 */
export function useSyncEvents(callback: (event: DataSyncEvent) => void) {
  useEffect(() => {
    const unsubscribe = userPersistenceService.subscribeSyncEvents(callback);
    return unsubscribe;
  }, [callback]);
}

/**
 * Hook to check if a specific mode is available
 */
export function useIsModeAvailable(mode: PersistenceMode): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    userPersistenceService.getCapabilities().then((caps) => {
      switch (mode) {
        case 'local-only':
          setAvailable(caps.supportsLocalOnly);
          break;
        case 'cloud-sync':
          setAvailable(caps.supportsCloudSync);
          break;
        case 'hybrid':
          setAvailable(caps.supportsHybrid);
          break;
      }
    });
  }, [mode]);

  return available;
}
