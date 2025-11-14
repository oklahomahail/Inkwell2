/**
 * Sync Queue Service
 *
 * Manages pending cloud sync operations with:
 * - IndexedDB persistence (survives page reload)
 * - Retry logic with exponential backoff
 * - Offline detection and queuing
 * - Deduplication (same record = single operation)
 * - Batch processing for performance
 *
 * Architecture:
 * - In-memory queue for fast access
 * - IndexedDB backing for persistence
 * - Automatic recovery on service init
 */

import devLog from '@/utils/devLog';

import { DEFAULT_RETRY_CONFIG } from './types';

import type {
  SyncOperation,
  SyncOperationType,
  SyncTable,
  SyncQueueStats,
  RetryConfig,
} from './types';

const DB_NAME = 'inkwell-sync-queue';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

/**
 * Sync Queue Service
 * Singleton pattern for global queue management
 */
class SyncQueueService {
  private static instance: SyncQueueService | null = null;

  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private pendingTransactions = 0;

  // In-memory queue for fast access
  private queue: Map<string, SyncOperation> = new Map();

  // Processing state
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  // Retry configuration
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  // Listeners for queue changes
  private stateListeners: Set<(stats: SyncQueueStats) => void> = new Set();

  private constructor() {
    this.setupOnlineListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  /**
   * Initialize IndexedDB and recover persisted operations
   */
  async init(): Promise<void> {
    if (this.db) return;

    if (!this.initPromise) {
      this.initPromise = this.openDatabase();
    }

    await this.initPromise;
    await this.recoverQueue();

    devLog.log('[SyncQueue] Initialized', {
      queueSize: this.queue.size,
    });
  }

  /**
   * Open IndexedDB connection
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        devLog.error('[SyncQueue] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        devLog.debug('[SyncQueue] Database opened');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create operations store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Indexes for querying
          store.createIndex('status', 'status');
          store.createIndex('table', 'table');
          store.createIndex('projectId', 'projectId');
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('priority', 'priority');

          devLog.debug('[SyncQueue] Object store created');
        }
      };
    });
  }

  /**
   * Recover persisted operations into memory queue
   */
  private async recoverQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(STORE_NAME, 'readonly');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result as SyncOperation[];

        for (const op of operations) {
          // Reset syncing operations to pending (they were interrupted)
          if (op.status === 'syncing') {
            op.status = 'pending';
          }

          this.queue.set(op.id, op);
        }

        devLog.log('[SyncQueue] Recovered operations', {
          count: operations.length,
        });

        resolve();
      };

      request.onerror = () => {
        devLog.error('[SyncQueue] Failed to recover queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Enqueue a sync operation
   *
   * Deduplicates: If same recordId + table exists, updates payload instead of creating new operation
   */
  async enqueue(
    type: SyncOperationType,
    table: SyncTable,
    recordId: string,
    projectId: string,
    payload: any,
    priority: number = 0,
  ): Promise<string> {
    await this.init();

    // Check for existing operation for this record
    const existingKey = `${table}:${recordId}`;
    let operation: SyncOperation | undefined;

    for (const op of this.queue.values()) {
      if (op.table === table && op.recordId === recordId && op.status === 'pending') {
        operation = op;
        break;
      }
    }

    if (operation) {
      // Update existing operation
      operation.payload = payload;
      operation.type = type;
      operation.priority = priority;
      operation.lastAttemptAt = null; // Reset retry timer

      devLog.debug('[SyncQueue] Updated existing operation', {
        id: operation.id,
        table,
        recordId,
      });
    } else {
      // Create new operation
      operation = {
        id: this.generateOperationId(),
        type,
        table,
        recordId,
        projectId,
        payload,
        attempts: 0,
        status: 'pending',
        createdAt: Date.now(),
        lastAttemptAt: null,
        error: null,
        priority,
      };

      this.queue.set(operation.id, operation);

      devLog.debug('[SyncQueue] Enqueued new operation', {
        id: operation.id,
        table,
        recordId,
      });
    }

    // Persist to IndexedDB
    await this.persistOperation(operation);

    // Notify listeners
    this.notifyListeners();

    // Trigger processing if not already running
    if (!this.isProcessing && navigator.onLine) {
      void this.processQueue();
    }

    return operation.id;
  }

  /**
   * Process pending operations
   *
   * Batches operations by table for efficiency
   * Implements exponential backoff retry
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return this.processingPromise || Promise.resolve();
    }

    if (!navigator.onLine) {
      devLog.debug('[SyncQueue] Offline - skipping processing');
      return;
    }

    this.isProcessing = true;
    this.processingPromise = this._processQueue();

    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  /**
   * Internal queue processing logic
   */
  private async _processQueue(): Promise<void> {
    devLog.log('[SyncQueue] Processing queue', {
      queueSize: this.queue.size,
    });

    const pendingOps = Array.from(this.queue.values())
      .filter((op) => op.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time (older first)
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.createdAt - b.createdAt;
      });

    if (pendingOps.length === 0) {
      devLog.debug('[SyncQueue] No pending operations');
      return;
    }

    // Process operations
    // In Phase 1, we just mark them as success (actual cloud upsert in Phase 2)
    for (const op of pendingOps) {
      try {
        // Check if should retry (exponential backoff)
        if (op.lastAttemptAt !== null) {
          const backoffDelay = this.calculateBackoff(op.attempts);
          const timeSinceLastAttempt = Date.now() - op.lastAttemptAt;

          if (timeSinceLastAttempt < backoffDelay) {
            devLog.debug('[SyncQueue] Skipping operation (backoff)', {
              id: op.id,
              backoffDelay,
              timeSinceLastAttempt,
            });
            continue;
          }
        }

        // Check max attempts
        if (op.attempts >= this.retryConfig.maxAttempts) {
          devLog.warn('[SyncQueue] Max retries exceeded', {
            id: op.id,
            attempts: op.attempts,
          });

          op.status = 'failed';
          op.error = 'Max retry attempts exceeded';
          await this.persistOperation(op);
          continue;
        }

        // Mark as syncing
        op.status = 'syncing';
        op.attempts += 1;
        op.lastAttemptAt = Date.now();
        await this.persistOperation(op);

        // Execute cloud sync
        devLog.debug('[SyncQueue] Processing operation', {
          id: op.id,
          table: op.table,
          recordId: op.recordId,
          attempt: op.attempts,
        });

        await this.executeCloudSync(op);

        // Mark as success
        op.status = 'success';
        op.error = null;
        await this.persistOperation(op);

        devLog.debug('[SyncQueue] Operation completed', {
          id: op.id,
        });

        // Remove from queue after successful sync
        this.queue.delete(op.id);
        await this.removeOperation(op.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        devLog.error('[SyncQueue] Operation failed', {
          id: op.id,
          error: errorMessage,
          attempt: op.attempts,
        });

        op.status = 'pending'; // Will retry
        op.error = errorMessage;
        await this.persistOperation(op);
      }

      // Notify listeners after each operation
      this.notifyListeners();
    }

    devLog.log('[SyncQueue] Queue processing complete');
  }

  /**
   * Execute cloud sync operation
   * Calls actual Supabase upsert
   */
  private async executeCloudSync(operation: SyncOperation): Promise<void> {
    const { cloudUpsert } = await import('./cloudUpsert');

    // Upsert single record
    const result = await cloudUpsert.upsertRecords(operation.table, [operation.payload]);

    if (!result.success) {
      throw new Error(result.errors.join('; '));
    }

    devLog.debug('[SyncQueue] Cloud sync successful', {
      operationId: operation.id,
      table: operation.table,
      recordId: operation.recordId,
    });
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempts: number): number {
    const delay =
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempts - 1);

    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Persist operation to IndexedDB
   */
  private async persistOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        devLog.error('[SyncQueue] Failed to persist operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove operation from IndexedDB
   */
  private async removeOperation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    this.trackTransaction(tx);
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        devLog.error('[SyncQueue] Failed to remove operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queue statistics
   */
  getStats(): SyncQueueStats {
    const ops = Array.from(this.queue.values());

    const pending = ops.filter((op) => op.status === 'pending');
    const oldestPending =
      pending.length > 0 ? Math.min(...pending.map((op) => op.createdAt)) : null;

    return {
      total: ops.length,
      pending: pending.length,
      syncing: ops.filter((op) => op.status === 'syncing').length,
      success: ops.filter((op) => op.status === 'success').length,
      failed: ops.filter((op) => op.status === 'failed').length,
      oldestPendingAt: oldestPending,
    };
  }

  /**
   * Clear completed and failed operations
   */
  async clearCompleted(): Promise<void> {
    const toRemove: string[] = [];

    for (const [id, op] of this.queue.entries()) {
      if (op.status === 'success' || op.status === 'failed') {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.queue.delete(id);
      await this.removeOperation(id);
    }

    devLog.log('[SyncQueue] Cleared completed operations', {
      count: toRemove.length,
    });

    this.notifyListeners();
  }

  /**
   * Subscribe to queue state changes
   */
  onStateChange(callback: (stats: SyncQueueStats) => void): () => void {
    this.stateListeners.add(callback);

    // Immediately call with current state
    callback(this.getStats());

    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.stateListeners.forEach((listener) => {
      try {
        listener(stats);
      } catch (error) {
        devLog.error('[SyncQueue] Listener error:', error);
      }
    });
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      devLog.log('[SyncQueue] Back online - processing queue');
      void this.processQueue();
    });

    window.addEventListener('offline', () => {
      devLog.log('[SyncQueue] Offline - pausing queue');
    });
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `sync-op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Force retry of failed operations
   */
  async retryFailed(): Promise<void> {
    const failedOps = Array.from(this.queue.values()).filter((op) => op.status === 'failed');

    for (const op of failedOps) {
      op.status = 'pending';
      op.attempts = 0;
      op.error = null;
      op.lastAttemptAt = null;
      await this.persistOperation(op);
    }

    devLog.log('[SyncQueue] Retrying failed operations', {
      count: failedOps.length,
    });

    this.notifyListeners();

    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  /**
   * Track transaction lifecycle for safe shutdown
   */
  private trackTransaction(tx: IDBTransaction): void {
    this.pendingTransactions++;
    const cleanup = () => {
      this.pendingTransactions--;
    };
    tx.addEventListener('complete', cleanup);
    tx.addEventListener('error', cleanup);
    tx.addEventListener('abort', cleanup);
  }

  /**
   * Close IndexedDB connection and wait for pending transactions
   * Should be called on app unmount to prevent connection leaks
   */
  async closeAndWait(): Promise<void> {
    if (!this.db) return;

    devLog.log('[SyncQueue] Closing database connection (waiting for pending transactions)');

    // Wait for all pending transactions to complete
    const maxWaitTime = 5000; // 5 seconds max
    const startTime = Date.now();
    while (this.pendingTransactions > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (this.pendingTransactions > 0) {
      devLog.warn(
        `[SyncQueue] Closing with ${this.pendingTransactions} pending transactions after timeout`,
      );
    }

    this.db.close();
    this.db = null;
    this.initPromise = null;
  }
}

// Export singleton instance
export const syncQueue = SyncQueueService.getInstance();
export default syncQueue;
