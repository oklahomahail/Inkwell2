// src/utils/quotaAwareStorage.ts
import { snapshotService } from '../services/snapshotService';

export interface StorageQuotaInfo {
  usage: number;
  quota: number;
  available: number;
  percentUsed: number;
  isNearLimit: boolean;
  isCritical: boolean;
}

export interface StorageError {
  type: 'quota' | 'generic' | 'corruption';
  message: string;
  canRecover: boolean;
  suggestedActions: string[];
}

class QuotaAwareStorage {
  private static readonly QUOTA_WARNING_THRESHOLD = 0.8; // 80%
  private static readonly QUOTA_CRITICAL_THRESHOLD = 0.95; // 95%
  private static readonly EMERGENCY_CLEANUP_SIZE = 1024 * 1024; // 1MB

  private quotaListeners: ((info: StorageQuotaInfo) => void)[] = [];
  private errorListeners: ((error: StorageError) => void)[] = [];

  /**
   * Safe localStorage.setItem with quota handling
   */
  async safeSetItem(
    key: string,
    value: string,
  ): Promise<{ success: boolean; error?: StorageError }> {
    try {
      // Check quota before writing
      const quotaInfo = await this.getQuotaInfo();
      const estimatedSize = value.length * 2; // Rough estimate (UTF-16)

      if (quotaInfo.available < estimatedSize) {
        return {
          success: false,
          error: {
            type: 'quota',
            message: 'Not enough storage space available',
            canRecover: true,
            suggestedActions: [
              'Clear old snapshots',
              'Download and remove old projects',
              'Export current work as backup',
            ],
          },
        };
      }

      // Attempt to write
      localStorage.setItem(key, value);

      // Update quota listeners if near limits
      const newQuotaInfo = await this.getQuotaInfo();
      if (newQuotaInfo.isNearLimit || newQuotaInfo.isCritical) {
        this.notifyQuotaListeners(newQuotaInfo);
      }

      return { success: true };
    } catch (error) {
      return this.handleStorageError(error, key, value);
    }
  }

  /**
   * Safe localStorage.getItem with error handling
   */
  safeGetItem(key: string): { success: boolean; data?: string; error?: StorageError } {
    try {
      const data = localStorage.getItem(key);
      return { success: true, data: data || undefined };
    } catch (error) {
      const storageError: StorageError = {
        type: 'corruption',
        message: `Failed to read ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canRecover: false,
        suggestedActions: [
          'Restart the application',
          'Clear browser data for this site',
          'Restore from backup if available',
        ],
      };

      this.notifyErrorListeners(storageError);
      return { success: false, error: storageError };
    }
  }

  /**
   * Safe localStorage.removeItem
   */
  safeRemoveItem(key: string): { success: boolean; error?: StorageError } {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const storageError: StorageError = {
        type: 'generic',
        message: `Failed to remove ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canRecover: true,
        suggestedActions: ['Try again', 'Restart the application'],
      };

      this.notifyErrorListeners(storageError);
      return { success: false, error: storageError };
    }
  }

  /**
   * Get current storage quota information
   */
  async getQuotaInfo(): Promise<StorageQuotaInfo> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - usage;
        const percentUsed = quota > 0 ? usage / quota : 0;

        return {
          usage,
          quota,
          available,
          percentUsed,
          isNearLimit: percentUsed >= QuotaAwareStorage.QUOTA_WARNING_THRESHOLD,
          isCritical: percentUsed >= QuotaAwareStorage.QUOTA_CRITICAL_THRESHOLD,
        };
      } else {
        // Fallback for browsers without Storage API
        return this.estimateQuotaFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to get quota info:', error);
      return this.estimateQuotaFromLocalStorage();
    }
  }

  /**
   * Attempt emergency cleanup to free space
   */
  async emergencyCleanup(): Promise<{ freedBytes: number; actions: string[] }> {
    const actions: string[] = [];
    let freedBytes = 0;

    try {
      // 1. Clean up old snapshots
      const allProjects = await this.getAllProjectIds();
      for (const projectId of allProjects) {
        const cleaned = await snapshotService.emergencyCleanup(projectId, 3);
        if (cleaned > 0) {
          actions.push(`Removed ${cleaned} old snapshots for project ${projectId}`);
          freedBytes += this.estimateSnapshotSize() * cleaned;
        }
      }

      // 2. Clear temporary data
      const tempKeys = this.getTempDataKeys();
      for (const key of tempKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          freedBytes += item.length * 2; // UTF-16 estimate
          localStorage.removeItem(key);
          actions.push(`Cleared temporary data: ${key}`);
        }
      }

      // 3. Compress project data if needed
      // This would involve re-saving projects with minimal formatting

      console.log(`Emergency cleanup freed approximately ${freedBytes} bytes`);
      return { freedBytes, actions };
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      return { freedBytes: 0, actions: ['Emergency cleanup failed'] };
    }
  }

  /**
   * Check if we need to perform maintenance
   */
  async needsMaintenance(): Promise<boolean> {
    const quotaInfo = await this.getQuotaInfo();
    return quotaInfo.isNearLimit;
  }

  /**
   * Subscribe to quota updates
   */
  onQuotaUpdate(callback: (info: StorageQuotaInfo) => void): () => void {
    if (typeof callback !== 'function') {
      console.warn('Invalid quota listener provided');
      return () => {};
    }
    this.quotaListeners.push(callback);
    return () => {
      const index = this.quotaListeners.indexOf(callback);
      if (index > -1) {
        this.quotaListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to storage errors
   */
  onStorageError(callback: (error: StorageError) => void): () => void {
    if (typeof callback !== 'function') {
      console.warn('Invalid error listener provided');
      return () => {};
    }
    this.errorListeners.push(callback);
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Private methods

  private handleStorageError(
    error: any,
    key: string,
    _value: string,
  ): { success: false; error: StorageError } {
    let storageError: StorageError;

    // Check if it's a quota error
    if (this.isQuotaError(error)) {
      storageError = {
        type: 'quota',
        message: 'Storage quota exceeded',
        canRecover: true,
        suggestedActions: [
          'Download current work as backup',
          'Clear old snapshots and projects',
          'Free up browser storage',
          'Try again after cleanup',
        ],
      };
    } else {
      storageError = {
        type: 'generic',
        message: `Failed to save ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canRecover: true,
        suggestedActions: [
          'Try again',
          'Restart the application',
          'Check browser storage permissions',
        ],
      };
    }

    this.notifyErrorListeners(storageError);
    return { success: false, error: storageError };
  }

  private isQuotaError(error: any): boolean {
    if (!error) return false;

    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    return (
      errorName.includes('quota') ||
      errorName.includes('exceeded') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('exceeded') ||
      errorMessage.includes('storage is full')
    );
  }

  private estimateQuotaFromLocalStorage(): StorageQuotaInfo {
    try {
      let usage = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            usage += (key.length + value.length) * 2; // UTF-16 estimate
          }
        }
      }

      // Conservative estimate of 5MB quota for localStorage
      const quota = 5 * 1024 * 1024;
      const available = quota - usage;
      const percentUsed = usage / quota;

      return {
        usage,
        quota,
        available,
        percentUsed,
        isNearLimit: percentUsed >= QuotaAwareStorage.QUOTA_WARNING_THRESHOLD,
        isCritical: percentUsed >= QuotaAwareStorage.QUOTA_CRITICAL_THRESHOLD,
      };
    } catch (error) {
      console.error('Failed to estimate quota from localStorage:', error);
      return {
        usage: 0,
        quota: 5 * 1024 * 1024,
        available: 5 * 1024 * 1024,
        percentUsed: 0,
        isNearLimit: false,
        isCritical: false,
      };
    }
  }

  private async getAllProjectIds(): Promise<string[]> {
    try {
      const projectsData = localStorage.getItem('inkwell_enhanced_projects');
      if (!projectsData) return [];

      const projects = JSON.parse(projectsData);
      return projects.map((p: any) => p.id);
    } catch (error) {
      console.error('Failed to get project IDs:', error);
      return [];
    }
  }

  private getTempDataKeys(): string[] {
    const tempKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('temp_') ||
          key.includes('cache_') ||
          key.includes('draft_') ||
          key.endsWith('_backup'))
      ) {
        tempKeys.push(key);
      }
    }
    return tempKeys;
  }

  private estimateSnapshotSize(): number {
    // Conservative estimate of average snapshot size
    return 50 * 1024; // 50KB
  }

  private notifyQuotaListeners(info: StorageQuotaInfo): void {
    for (const listener of this.quotaListeners) {
      try {
        listener(info);
      } catch (error) {
        console.error('Quota listener error:', error);
      }
    }
  }

  private notifyErrorListeners(error: StorageError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (error) {
        console.error('Error listener error:', error);
      }
    }
  }
}

// Export singleton instance
export const quotaAwareStorage = new QuotaAwareStorage();
export default quotaAwareStorage;
