// src/services/connectivityService.ts
import { quotaAwareStorage } from '../utils/quotaAwareStorage';

export interface QueuedWrite {
  id: string;
  timestamp: number;
  operation: 'save' | 'delete' | 'update';
  key: string;
  data?: string;
  retryCount: number;
}

export interface ConnectivityStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  queuedWrites: number;
  connectionType?: string;
}

class ConnectivityService {
  private static readonly QUEUE_KEY = 'inkwell_offline_queue';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // ms

  private isOnline: boolean = navigator.onLine;
  private lastOnline: Date | null = null;
  private lastOffline: Date | null = null;
  private queue: QueuedWrite[] = [];
  private listeners: ((status: ConnectivityStatus) => void)[] = [];
  private processingQueue: boolean = false;

  constructor() {
    this.initializeListeners();
    this.loadQueue();
    this.updateConnectionStatus();
  }

  /**
   * Get current connectivity status
   */
  getStatus(): ConnectivityStatus {
    // Prefer the runtime navigator.onLine value when available so tests that
    // stub navigator reflect the current environment. Fall back to the
    // internal `isOnline` state when navigator isn't present (e.g., Node).
    const currentOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : this.isOnline;

    // Update lastOnline/lastOffline if runtime value differs from internal
    if (currentOnline !== this.isOnline) {
      this.isOnline = currentOnline;
      if (currentOnline) {
        this.lastOnline = new Date();
      } else {
        this.lastOffline = new Date();
      }
    }

    return {
      isOnline: this.isOnline,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      queuedWrites: this.queue.length,
      connectionType: this.getConnectionType(),
    };
  }

  /**
   * Queue a write operation for when online
   */
  async queueWrite(
    operation: 'save' | 'delete' | 'update',
    key: string,
    data?: string,
  ): Promise<void> {
    const queuedWrite: QueuedWrite = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation,
      key,
      data,
      retryCount: 0,
    };

    this.queue.push(queuedWrite);
    await this.saveQueue();
    this.notifyListeners();

    console.log(`Queued ${operation} operation for ${key}`, queuedWrite);

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Process queued writes
   */
  async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;
    console.log(`Processing ${this.queue.length} queued operations`);

    const processedItems: string[] = [];
    const failedItems: QueuedWrite[] = [];

    for (const item of this.queue) {
      try {
        const success = await this.executeQueuedWrite(item);
        if (success) {
          processedItems.push(item.id);
          console.log(`Successfully processed queued ${item.operation} for ${item.key}`);
        } else {
          item.retryCount++;
          if (item.retryCount >= ConnectivityService.MAX_RETRIES) {
            console.error(
              `Failed to process ${item.operation} for ${item.key} after ${item.retryCount} retries`,
            );
            processedItems.push(item.id); // Remove from queue
          } else {
            failedItems.push(item);
            console.warn(
              `Retry ${item.retryCount}/${ConnectivityService.MAX_RETRIES} for ${item.operation} on ${item.key}`,
            );
          }
        }
      } catch (_error) {
        console.error(`Error processing queued ${item.operation} for ${item.key}:`, _error);
        item.retryCount++;
        if (item.retryCount < ConnectivityService.MAX_RETRIES) {
          failedItems.push(item);
        } else {
          processedItems.push(item.id); // Remove from queue after max retries
        }
      }

      // Small delay between operations to avoid overwhelming
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update queue with failed items only
    this.queue = failedItems;
    await this.saveQueue();
    this.notifyListeners();

    this.processingQueue = false;

    if (processedItems.length > 0) {
      console.log(`Processed ${processedItems.length} queued operations successfully`);
    }

    // Schedule retry for failed items
    if (failedItems.length > 0) {
      setTimeout(
        () => {
          if (this.isOnline) {
            this.processQueue();
          }
        },
        ConnectivityService.RETRY_DELAY * Math.min(failedItems[0]?.retryCount || 1, 5),
      );
    }
  }

  /**
   * Clear the offline queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log('Offline queue cleared');
  }

  /**
   * Get queued operations for display
   */
  getQueuedOperations(): QueuedWrite[] {
    return [...this.queue].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Subscribe to connectivity changes
   */
  onStatusChange(callback: (status: ConnectivityStatus) => void): () => void {
    if (typeof callback !== 'function') {
      console.error('Invalid callback provided to onStatusChange');
      return () => {};
    }

    this.listeners.push(callback);

    // Immediately call with current status
    try {
      callback(this.getStatus());
    } catch (_error) {
      console.error('Error in status change callback:', _error);
      // Remove the callback if it errors on first call
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Force connectivity check
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Try a simple fetch to a reliable endpoint
      const _response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      return true;
    } catch {
      // Also check navigator.onLine as fallback
      return navigator.onLine;
    }
  }

  // Private methods

  private initializeListeners(): void {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private cleanupListeners(): void {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.lastOnline = new Date();
    this.notifyListeners();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.lastOffline = new Date();
    this.notifyListeners();
  };

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public teardown(): void {
    this.cleanupListeners();
    this.listeners = [];
    this.processingQueue = false;
  }

  private updateConnectionStatus(): void {
    const currentOnline = navigator.onLine;
    if (currentOnline !== this.isOnline) {
      this.isOnline = currentOnline;
      if (currentOnline) {
        this.lastOnline = new Date();
      } else {
        this.lastOffline = new Date();
      }
    }
  }

  private getConnectionType(): string | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type;
    }
    return undefined;
  }

  private async executeQueuedWrite(item: QueuedWrite): Promise<boolean> {
    try {
      switch (item.operation) {
        case 'save':
        case 'update':
          if (item.data) {
            const result = await quotaAwareStorage.safeSetItem(item.key, item.data);
            return result.success;
          }
          return false;

        case 'delete': {
          const result = await quotaAwareStorage.safeRemoveItem(item.key);
          return result.success;
        }

        default:
          console.error(`Unknown queued operation: ${item.operation}`);
          return false;
      }
    } catch (_error) {
      console.error(`Failed to execute queued ${item.operation} for ${item.key}:`, _error);
      return false;
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const result = quotaAwareStorage.safeGetItem(ConnectivityService.QUEUE_KEY);
      if (result.success && result.data) {
        this.queue = JSON.parse(result.data);
        console.log(`Loaded ${this.queue.length} queued operations from storage`);
      }
    } catch (_error) {
      console.error('Failed to load offline queue:', _error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const result = await quotaAwareStorage.safeSetItem(
        ConnectivityService.QUEUE_KEY,
        JSON.stringify(this.queue),
      );
      if (!result.success) {
        console.error('Failed to save offline queue:', result.error);
      }
    } catch (_error) {
      console.error('Failed to save offline queue:', _error);
    }
  }
}

// Export singleton instance
export const connectivityService = new ConnectivityService();
export default connectivityService;
