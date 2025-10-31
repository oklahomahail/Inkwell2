/**
 * Storage Manager Service
 *
 * Central service for managing storage persistence, quota, and health.
 * Eliminates "storage not persistent" warnings and provides unified API
 * for checking storage status across IndexedDB, LocalStorage, and potential cloud.
 */

import devLog from '@/utils/devLog';
import {
  quotaAwareStorage,
  type StorageQuotaInfo,
  type StorageError,
} from '@/utils/quotaAwareStorage';
import { ensurePersistentStorage, isStoragePersisted } from '@/utils/storage/persistence';

export interface StorageHealthStatus {
  /** Is storage marked as persistent */
  isPersistent: boolean;
  /** Persistence API supported */
  persistenceSupported: boolean;
  /** IndexedDB available */
  hasIndexedDB: boolean;
  /** LocalStorage available */
  hasLocalStorage: boolean;
  /** Storage quota info */
  quota: StorageQuotaInfo | null;
  /** Any critical errors */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Overall health score (0-100) */
  healthScore: number;
  /** Timestamp of last check */
  lastChecked: number;
}

export interface StoragePersistenceRequest {
  /** Was persistence requested */
  requested: boolean;
  /** Was it granted */
  granted: boolean;
  /** Error if request failed */
  error?: string;
}

class StorageManager {
  private healthStatus: StorageHealthStatus | null = null;
  private healthListeners: Set<(status: StorageHealthStatus) => void> = new Set();
  private errorListeners: Set<(error: StorageError) => void> = new Set();
  private persistenceCheckInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  /**
   * Initialize storage manager
   * Call this once at app boot to request persistence and start monitoring
   */
  async initialize(): Promise<StoragePersistenceRequest> {
    if (this.initialized) {
      devLog.debug('[StorageManager] Already initialized');
      return {
        requested: true,
        granted: await isStoragePersisted(),
      };
    }

    devLog.log('[StorageManager] Initializing...');

    try {
      // Request persistent storage
      const result = await ensurePersistentStorage();

      // Perform initial health check
      await this.checkHealth();

      // Start periodic health monitoring (every 5 minutes)
      this.startHealthMonitoring();

      // Subscribe to quota updates
      quotaAwareStorage.onQuotaUpdate((info) => {
        this.handleQuotaUpdate(info);
      });

      // Subscribe to storage errors
      quotaAwareStorage.onStorageError((error) => {
        this.handleStorageError(error);
      });

      this.initialized = true;

      devLog.log('[StorageManager] Initialized successfully', {
        persisted: result.persisted,
        requested: result.requested,
        supported: result.supported,
      });

      return {
        requested: result.requested,
        granted: result.persisted,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[StorageManager] Initialization failed:', errorMessage);

      return {
        requested: true,
        granted: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current storage health status
   */
  async getHealthStatus(): Promise<StorageHealthStatus> {
    if (!this.healthStatus || Date.now() - this.healthStatus.lastChecked > 60000) {
      await this.checkHealth();
    }

    return this.healthStatus!;
  }

  /**
   * Check storage health
   */
  private async checkHealth(): Promise<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check persistence
    const isPersistent = await isStoragePersisted();
    const persistenceSupported = Boolean(navigator.storage?.persist);

    if (!isPersistent && persistenceSupported) {
      warnings.push('Storage is not persistent - data may be cleared under storage pressure');
    } else if (!persistenceSupported) {
      warnings.push('Browser does not support Storage Persistence API');
    }

    // Check IndexedDB
    const hasIndexedDB = 'indexedDB' in window;
    if (!hasIndexedDB) {
      errors.push('IndexedDB not available');
    }

    // Check LocalStorage
    const hasLocalStorage = this.checkLocalStorage();
    if (!hasLocalStorage) {
      errors.push('LocalStorage not available');
    }

    // Get quota info
    let quota: StorageQuotaInfo | null = null;
    try {
      quota = await quotaAwareStorage.getQuotaInfo();

      if (quota.isCritical) {
        errors.push(`Storage critically low: ${Math.round(quota.percentUsed * 100)}% used`);
      } else if (quota.isNearLimit) {
        warnings.push(`Storage usage high: ${Math.round(quota.percentUsed * 100)}% used`);
      }
    } catch (_error) {
      warnings.push('Could not estimate storage quota');
    }

    // Calculate health score (0-100)
    let healthScore = 100;
    if (!isPersistent) healthScore -= 20;
    if (!hasIndexedDB) healthScore -= 30;
    if (!hasLocalStorage) healthScore -= 20;
    if (quota?.isCritical) healthScore -= 30;
    else if (quota?.isNearLimit) healthScore -= 15;
    healthScore = Math.max(0, healthScore);

    this.healthStatus = {
      isPersistent,
      persistenceSupported,
      hasIndexedDB,
      hasLocalStorage,
      quota,
      errors,
      warnings,
      healthScore,
      lastChecked: Date.now(),
    };

    // Notify listeners
    this.notifyHealthListeners();

    // Log warnings and errors
    if (errors.length > 0) {
      devLog.error('[StorageManager] Health check errors:', errors);
    }
    if (warnings.length > 0) {
      devLog.warn('[StorageManager] Health check warnings:', warnings);
    }
  }

  /**
   * Request persistent storage (can be called again if initially denied)
   */
  async requestPersistence(): Promise<boolean> {
    if (!navigator.storage?.persist) {
      devLog.warn('[StorageManager] Persistence API not supported');
      return false;
    }

    try {
      const granted = await navigator.storage.persist();

      if (granted) {
        devLog.log('[StorageManager] Persistence granted');
        await this.checkHealth(); // Update status
      } else {
        devLog.warn('[StorageManager] Persistence request denied');
      }

      return granted;
    } catch (error) {
      devLog.error('[StorageManager] Failed to request persistence:', error);
      return false;
    }
  }

  /**
   * Perform emergency cleanup to free space
   */
  async emergencyCleanup(): Promise<{ freedBytes: number; actions: string[] }> {
    devLog.log('[StorageManager] Starting emergency cleanup');

    const result = await quotaAwareStorage.emergencyCleanup();

    // Re-check health after cleanup
    await this.checkHealth();

    devLog.log('[StorageManager] Emergency cleanup completed:', result);
    return result;
  }

  /**
   * Subscribe to health status updates
   */
  onHealthUpdate(callback: (status: StorageHealthStatus) => void): () => void {
    this.healthListeners.add(callback);

    // Immediately call with current status if available
    if (this.healthStatus) {
      callback(this.healthStatus);
    }

    return () => {
      this.healthListeners.delete(callback);
    };
  }

  /**
   * Subscribe to storage errors
   */
  onError(callback: (error: StorageError) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.persistenceCheckInterval) {
      return;
    }

    // Check every 5 minutes
    this.persistenceCheckInterval = setInterval(
      () => {
        void this.checkHealth();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
      this.persistenceCheckInterval = null;
    }
  }

  /**
   * Handle quota updates from quota-aware storage
   */
  private handleQuotaUpdate(info: StorageQuotaInfo): void {
    if (!this.healthStatus) return;

    // Update quota in current status
    this.healthStatus.quota = info;

    // Update warnings/errors based on quota
    const errors: string[] = this.healthStatus.errors.filter(
      (e) => !e.includes('Storage critically low'),
    );
    const warnings: string[] = this.healthStatus.warnings.filter(
      (w) => !w.includes('Storage usage high'),
    );

    if (info.isCritical) {
      errors.push(`Storage critically low: ${Math.round(info.percentUsed * 100)}% used`);
    } else if (info.isNearLimit) {
      warnings.push(`Storage usage high: ${Math.round(info.percentUsed * 100)}% used`);
    }

    this.healthStatus.errors = errors;
    this.healthStatus.warnings = warnings;
    this.healthStatus.lastChecked = Date.now();

    // Recalculate health score
    let healthScore = 100;
    if (!this.healthStatus.isPersistent) healthScore -= 20;
    if (!this.healthStatus.hasIndexedDB) healthScore -= 30;
    if (!this.healthStatus.hasLocalStorage) healthScore -= 20;
    if (info.isCritical) healthScore -= 30;
    else if (info.isNearLimit) healthScore -= 15;
    this.healthStatus.healthScore = Math.max(0, healthScore);

    this.notifyHealthListeners();
  }

  /**
   * Handle storage errors from quota-aware storage
   */
  private handleStorageError(error: StorageError): void {
    devLog.error('[StorageManager] Storage error:', error);

    // Update health status with error
    if (this.healthStatus) {
      if (!this.healthStatus.errors.includes(error.message)) {
        this.healthStatus.errors.push(error.message);
        this.healthStatus.lastChecked = Date.now();
        this.notifyHealthListeners();
      }
    }

    // Notify error listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (listenerError) {
        devLog.error('[StorageManager] Error listener failed:', listenerError);
      }
    });
  }

  /**
   * Notify health listeners
   */
  private notifyHealthListeners(): void {
    if (!this.healthStatus) return;

    this.healthListeners.forEach((listener) => {
      try {
        listener(this.healthStatus!);
      } catch (error) {
        devLog.error('[StorageManager] Health listener failed:', error);
      }
    });
  }

  /**
   * Check if LocalStorage is available
   */
  private checkLocalStorage(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.healthListeners.clear();
    this.errorListeners.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
export default storageManager;
