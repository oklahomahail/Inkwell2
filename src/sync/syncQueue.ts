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

import { isNonRetryableError, isOrphanedOperationError } from './errors';
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

  // Deduplication index for O(1) lookup
  // Key: "${table}:${recordId}" -> Value: operation.id
  private deduplicationIndex: Map<string, string> = new Map();

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

          // Rebuild deduplication index for pending operations
          if (op.status === 'pending') {
            const dedupeKey = `${op.table}:${op.recordId}`;
            this.deduplicationIndex.set(dedupeKey, op.id);
          }
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

    // Guard: validate projectId to prevent corrupted sync operations
    if (!projectId || typeof projectId !== 'string') {
      devLog.error('[SyncQueue] Skipping operation - invalid projectId', {
        projectId,
        type,
        table,
        recordId,
      });
      throw new Error(`Invalid projectId for sync operation: ${projectId}`);
    }

    // Additional check for corrupted IDs with query string junk
    if (projectId.includes('?') || projectId.includes('&') || projectId.includes('=')) {
      devLog.error('[SyncQueue] Skipping operation - projectId contains query string junk', {
        projectId,
        type,
        table,
        recordId,
      });
      throw new Error(`Corrupted projectId detected: ${projectId}`);
    }

    // Check for existing operation using deduplication index (O(1) lookup)
    const dedupeKey = `${table}:${recordId}`;
    const existingOpId = this.deduplicationIndex.get(dedupeKey);

    let operation: SyncOperation;

    if (existingOpId) {
      const existing = this.queue.get(existingOpId);
      if (existing && existing.status === 'pending') {
        // Update existing operation
        existing.payload = payload;
        existing.type = type;
        existing.priority = priority;
        existing.lastAttemptAt = null; // Reset retry timer

        operation = existing;

        devLog.debug('[SyncQueue] Updated existing operation', {
          id: operation.id,
          table,
          recordId,
        });
      } else {
        // Existing operation is no longer pending, create new one
        const opId = this.generateOperationId();
        operation = {
          id: opId,
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

        this.queue.set(opId, operation);
        this.deduplicationIndex.set(dedupeKey, opId);

        devLog.debug('[SyncQueue] Enqueued new operation (replaced non-pending)', {
          id: operation.id,
          table,
          recordId,
        });
      }
    } else {
      // Create new operation
      const opId = this.generateOperationId();
      operation = {
        id: opId,
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

      this.queue.set(opId, operation);
      this.deduplicationIndex.set(dedupeKey, opId);

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
   *
   * PERFORMANCE OPTIMIZATION: Batches operations by table for 25-50x throughput improvement
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

    // Filter out operations in backoff or max retry
    const readyOps: SyncOperation[] = [];
    for (const op of pendingOps) {
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

      readyOps.push(op);
    }

    if (readyOps.length === 0) {
      devLog.debug('[SyncQueue] No operations ready to process (backoff/max retries)');
      return;
    }

    // Group operations by table for batch processing
    const opsByTable = new Map<SyncTable, SyncOperation[]>();
    for (const op of readyOps) {
      if (!opsByTable.has(op.table)) {
        opsByTable.set(op.table, []);
      }
      opsByTable.get(op.table)!.push(op);
    }

    devLog.log('[SyncQueue] Processing batches', {
      tables: Array.from(opsByTable.keys()),
      totalOperations: readyOps.length,
    });

    // Process each table batch
    for (const [table, ops] of opsByTable) {
      await this.processBatch(table, ops);
    }

    devLog.log('[SyncQueue] Queue processing complete');
  }

  /**
   * Process a batch of operations for a single table
   */
  private async processBatch(table: SyncTable, ops: SyncOperation[]): Promise<void> {
    devLog.debug('[SyncQueue] Processing batch', {
      table,
      count: ops.length,
    });

    // Mark all operations as syncing
    for (const op of ops) {
      op.status = 'syncing';
      op.attempts += 1;
      op.lastAttemptAt = Date.now();
      await this.persistOperation(op);
    }

    try {
      // Execute batch cloud sync
      const payloads = ops.map((op) => op.payload);
      const { cloudUpsert } = await import('./cloudUpsert');
      const result = await cloudUpsert.upsertRecords(table, payloads);

      if (result.success) {
        // All operations succeeded - mark as success and remove
        for (const op of ops) {
          op.status = 'success';
          op.error = null;
          await this.persistOperation(op);

          devLog.debug('[SyncQueue] Operation completed', {
            id: op.id,
          });

          // Remove from queue after successful sync
          this.queue.delete(op.id);
          await this.removeOperation(op.id);
        }

        devLog.log('[SyncQueue] Batch completed successfully', {
          table,
          count: ops.length,
        });
      } else {
        // Batch failed - handle errors
        throw new Error(result.errors.join('; '));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      devLog.error('[SyncQueue] Batch failed', {
        table,
        count: ops.length,
        error: errorMessage,
      });

      // Handle each operation in the failed batch
      for (const op of ops) {
        // Check if this is a non-retryable error (e.g., orphaned operation)
        if (isNonRetryableError(error)) {
          devLog.error('[SyncQueue] Non-retryable error - permanently failing operation', {
            id: op.id,
            error: errorMessage,
            attempt: op.attempts,
          });

          // Mark as permanently failed
          op.status = 'failed';
          op.error = `[Non-retryable] ${errorMessage}`;
          await this.persistOperation(op);

          // If it's an orphaned operation, also log cleanup instructions
          if (isOrphanedOperationError(error)) {
            devLog.warn(
              `[SyncQueue] Orphaned operation detected. Run cleanupOrphanedSyncOperations() to clean up similar operations.`,
            );
          }
        } else {
          // Retryable error - mark as pending for retry
          devLog.error('[SyncQueue] Operation failed (will retry)', {
            id: op.id,
            error: errorMessage,
            attempt: op.attempts,
          });

          op.status = 'pending'; // Will retry
          op.error = errorMessage;
          await this.persistOperation(op);
        }
      }
    }

    // Notify listeners after batch processing
    this.notifyListeners();
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
   * Remove operation from IndexedDB and deduplication index
   */
  private async removeOperation(id: string): Promise<void> {
    // Remove from deduplication index
    const op = this.queue.get(id);
    if (op) {
      const dedupeKey = `${op.table}:${op.recordId}`;
      this.deduplicationIndex.delete(dedupeKey);
    }

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
   * Add a listener for sync state changes
   */
  addListener(callback: (stats: SyncQueueStats) => void): void {
    this.stateListeners.add(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback: (stats: SyncQueueStats) => void): void {
    this.stateListeners.delete(callback);
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
   * Remove orphaned operations (operations marked as non-retryable failures)
   *
   * This clears out operations that failed due to missing local data.
   * Safe to call periodically to clean up the queue.
   */
  async removeOrphanedOperations(): Promise<number> {
    const orphanedOps = Array.from(this.queue.values()).filter(
      (op) => op.status === 'failed' && op.error?.includes('[Non-retryable]'),
    );

    for (const op of orphanedOps) {
      this.queue.delete(op.id);
      await this.removeOperation(op.id);
    }

    devLog.log('[SyncQueue] Removed orphaned operations', {
      count: orphanedOps.length,
    });

    this.notifyListeners();

    return orphanedOps.length;
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
