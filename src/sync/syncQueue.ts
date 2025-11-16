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

import { cloudUpsert } from './cloudUpsert';
import {
  classifyError,
  CircuitBreaker,
  DeadLetterQueue,
  ErrorRecoveryStats,
  ExponentialBackoffStrategy,
  RetryBudget,
} from './errorRecovery';
import { isNonRetryableError, isOrphanedOperationError } from './errors';
import { DEFAULT_RETRY_CONFIG } from './types';

import type { AttemptHistoryEntry, EnhancedSyncOperation } from './errorRecovery';
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
  private queue: Map<string, EnhancedSyncOperation> = new Map();

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

  // Multi-tab coordination via BroadcastChannel
  private broadcastChannel: BroadcastChannel | null = null;

  // Auto-cleanup interval for orphaned operations
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Enhanced Error Recovery
  private retryStrategy = new ExponentialBackoffStrategy();
  private circuitBreaker = new CircuitBreaker();
  private retryBudget = new RetryBudget();
  private deadLetterQueue = new DeadLetterQueue();
  private recoveryStats = new ErrorRecoveryStats();

  private constructor() {
    this.setupOnlineListener();
    this.setupCrossTabCoordination();
    this.startAutoCleanup();
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

          // Ensure attemptHistory exists for enhanced operations
          const enhancedOp: EnhancedSyncOperation = {
            ...op,
            attemptHistory: (op as any).attemptHistory || [],
          };

          this.queue.set(enhancedOp.id, enhancedOp);

          // Rebuild deduplication index for pending operations
          if (enhancedOp.status === 'pending') {
            const dedupeKey = `${enhancedOp.table}:${enhancedOp.recordId}`;
            this.deduplicationIndex.set(dedupeKey, enhancedOp.id);
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

    let operation: EnhancedSyncOperation;

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
          attemptHistory: [],
        } as EnhancedSyncOperation;

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
        attemptHistory: [],
      } as EnhancedSyncOperation;

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

    // Broadcast to other tabs
    this.broadcastOperation('operation-enqueued', operation);

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
    const readyOps: EnhancedSyncOperation[] = [];
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
    const opsByTable = new Map<SyncTable, EnhancedSyncOperation[]>();
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
  private async processBatch(table: SyncTable, ops: EnhancedSyncOperation[]): Promise<void> {
    devLog.debug('[SyncQueue] Processing batch', {
      table,
      count: ops.length,
    });

    // Record operation attempt
    this.recoveryStats.recordOperation();

    // Check circuit breaker
    if (this.circuitBreaker.getState() === 'open') {
      devLog.warn('[SyncQueue] Circuit breaker is OPEN, skipping batch');
      this.recoveryStats.recordCircuitBreakerTrip();
      return;
    }

    // Check retry budget
    if (!this.retryBudget.canRetry()) {
      devLog.warn('[SyncQueue] Retry budget exhausted, delaying batch');
      this.recoveryStats.recordBudgetExhaustion();
      return;
    }

    // Mark all operations as syncing
    for (const op of ops) {
      op.status = 'syncing';
      op.attempts += 1;
      op.lastAttemptAt = Date.now();
      await this.persistOperation(op);
    }

    try {
      // Execute batch cloud sync through circuit breaker
      await this.circuitBreaker.execute(async () => {
        const payloads = ops.map((op) => op.payload);
        const result = await cloudUpsert.upsertRecords(table, payloads);

        if (!result.success) {
          throw new Error(result.errors.join('; '));
        }
      });

      // Success! Mark all operations as completed
      for (const op of ops) {
        op.status = 'success';
        op.error = null;
        await this.persistOperation(op);

        devLog.debug('[SyncQueue] Operation completed', {
          id: op.id,
        });

        // Broadcast completion to other tabs
        this.broadcastOperation('operation-completed', op);

        // Remove from queue after successful sync
        this.queue.delete(op.id);
        await this.removeOperation(op.id);
      }

      this.recoveryStats.recordSuccess();

      devLog.log('[SyncQueue] Batch completed successfully', {
        table,
        count: ops.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Classify the error
      const classified = classifyError(error);

      devLog.error('[SyncQueue] Batch failed', {
        table,
        count: ops.length,
        error: errorMessage,
        category: classified.category,
      });

      // Handle each operation in the failed batch
      for (const op of ops) {
        // Add attempt to history
        const attemptEntry: AttemptHistoryEntry = {
          attempt: op.attempts,
          error: errorMessage,
          category: classified.category,
          delay: 0, // Will be set if retry is scheduled
          timestamp: Date.now(),
        };

        op.attemptHistory.push(attemptEntry);
        op.errorCategory = classified.category;

        // Check if error is retryable
        if (!classified.isRetryable || isNonRetryableError(error)) {
          devLog.error('[SyncQueue] Non-retryable error - permanently failing operation', {
            id: op.id,
            error: errorMessage,
            category: classified.category,
            attempt: op.attempts,
          });

          // Mark as permanently failed
          op.status = 'failed';
          op.error = `[Non-retryable] ${errorMessage}`;
          await this.persistOperation(op);

          // Add to dead letter queue
          this.deadLetterQueue.add(op, classified, op.attemptHistory);

          // Broadcast failure to other tabs
          this.broadcastOperation('operation-failed', op, op.error);

          // Record failure
          this.recoveryStats.recordFailure(classified.category);

          // If it's an orphaned operation, also log cleanup instructions
          if (isOrphanedOperationError(error)) {
            devLog.warn(
              `[SyncQueue] Orphaned operation detected. Run cleanupOrphanedSyncOperations() to clean up similar operations.`,
            );
          }

          continue;
        }

        // Check retry limit
        if (op.attempts >= this.retryConfig.maxAttempts) {
          devLog.error('[SyncQueue] Max retries exceeded', {
            id: op.id,
            attempts: op.attempts,
            maxAttempts: this.retryConfig.maxAttempts,
          });

          // Mark as permanently failed
          op.status = 'failed';
          op.error = `[Max retries] ${errorMessage}`;
          await this.persistOperation(op);

          // Add to dead letter queue
          this.deadLetterQueue.add(op, classified, op.attemptHistory);

          // Broadcast failure
          this.broadcastOperation('operation-failed', op, op.error);

          // Record failure
          this.recoveryStats.recordFailure(classified.category);

          continue;
        }

        // Calculate retry delay using enhanced strategy
        const delay = this.retryStrategy.calculateDelay(op.attempts + 1, classified);

        // Update attempt history with delay
        attemptEntry.delay = delay;

        // Record retry in budget
        this.retryBudget.recordRetry();

        // Record retry metrics
        this.recoveryStats.recordRetry(delay);

        // Mark as pending for retry
        op.status = 'pending';
        op.error = errorMessage;
        await this.persistOperation(op);

        devLog.log('[SyncQueue] Scheduling retry', {
          id: op.id,
          attempt: op.attempts,
          nextAttempt: op.attempts + 1,
          delay,
          category: classified.category,
        });
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
   * Setup cross-tab coordination via BroadcastChannel
   * Prevents duplicate operations across multiple tabs
   */
  private setupCrossTabCoordination(): void {
    // Check BroadcastChannel support (not available in all browsers)
    if (typeof BroadcastChannel === 'undefined') {
      devLog.debug('[SyncQueue] BroadcastChannel not supported - cross-tab coordination disabled');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('inkwell-sync-queue');

      this.broadcastChannel.onmessage = (event: MessageEvent) => {
        const { type, operationId, recordId, table, timestamp } = event.data;

        if (type === 'operation-enqueued') {
          // Another tab enqueued this operation - check for duplicates
          const dedupeKey = `${table}:${recordId}`;
          const existingOpId = this.deduplicationIndex.get(dedupeKey);

          if (existingOpId && existingOpId !== operationId) {
            const existing = this.queue.get(existingOpId);

            // Remove our duplicate if it was created after the broadcast operation
            if (existing && existing.createdAt > timestamp) {
              devLog.log('[SyncQueue] Removing duplicate operation (other tab has it)', {
                ourOpId: existingOpId,
                theirOpId: operationId,
                table,
                recordId,
              });
              void this.removeOperation(existingOpId);
            }
          }
        } else if (type === 'operation-completed') {
          // Another tab completed this operation - remove it from our queue
          const dedupeKey = `${table}:${recordId}`;
          const existingOpId = this.deduplicationIndex.get(dedupeKey);

          if (existingOpId === operationId) {
            devLog.log('[SyncQueue] Removing operation (completed in other tab)', {
              operationId,
              table,
              recordId,
            });
            void this.removeOperation(operationId);
          }
        } else if (type === 'operation-failed') {
          // Another tab marked operation as failed - sync the status
          const op = this.queue.get(operationId);
          if (op && op.status !== 'failed') {
            devLog.log('[SyncQueue] Marking operation as failed (failed in other tab)', {
              operationId,
            });
            op.status = 'failed';
            op.error = event.data.error || 'Failed in another tab';
            void this.persistOperation(op);
            this.notifyListeners();
          }
        }
      };

      devLog.debug('[SyncQueue] Cross-tab coordination enabled via BroadcastChannel');
    } catch (error) {
      devLog.error('[SyncQueue] Failed to setup BroadcastChannel:', error);
    }
  }

  /**
   * Broadcast operation event to other tabs
   */
  private broadcastOperation(
    type: 'operation-enqueued' | 'operation-completed' | 'operation-failed',
    operation: SyncOperation,
    error?: string,
  ): void {
    if (!this.broadcastChannel) return;

    try {
      this.broadcastChannel.postMessage({
        type,
        operationId: operation.id,
        recordId: operation.recordId,
        table: operation.table,
        timestamp: operation.createdAt,
        error,
      });
    } catch (err) {
      devLog.error('[SyncQueue] Failed to broadcast operation:', err);
    }
  }

  /**
   * Start background cleanup of orphaned operations
   * Runs every hour to remove old failed operations
   */
  private startAutoCleanup(): void {
    // Clean up immediately on start
    void this.autoCleanupOrphanedOperations();

    // Then clean up every hour
    this.cleanupInterval = setInterval(
      () => {
        void this.autoCleanupOrphanedOperations();
      },
      60 * 60 * 1000,
    ); // 1 hour

    devLog.debug('[SyncQueue] Auto-cleanup enabled (runs every hour)');
  }

  /**
   * Auto-cleanup orphaned operations
   * Removes failed operations older than 24 hours
   */
  private async autoCleanupOrphanedOperations(): Promise<void> {
    const orphanedOps: SyncOperation[] = [];
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    for (const op of this.queue.values()) {
      if (op.status === 'failed' && op.error?.includes('[Non-retryable]')) {
        // Failed with non-retryable error

        // Only remove if older than 24 hours (give user time to see error)
        if (now - op.createdAt > TWENTY_FOUR_HOURS) {
          orphanedOps.push(op);
        }
      }
    }

    // Remove old orphaned operations
    for (const op of orphanedOps) {
      await this.removeOperation(op.id);
    }

    if (orphanedOps.length > 0) {
      devLog.log(`[SyncQueue] Auto-cleaned ${orphanedOps.length} orphaned operations`, {
        operations: orphanedOps.map((op) => ({
          id: op.id,
          table: op.table,
          recordId: op.recordId,
          ageHours: Math.round((now - op.createdAt) / (60 * 60 * 1000)),
        })),
      });
    }
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

    // Close BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
      devLog.debug('[SyncQueue] BroadcastChannel closed');
    }

    // Stop auto-cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      devLog.debug('[SyncQueue] Auto-cleanup stopped');
    }

    // Clean up dead letter queue
    this.deadLetterQueue.cleanup();
  }

  /**
   * Get system health status
   * Includes circuit breaker, retry budget, and dead letter queue status
   */
  getHealth() {
    return {
      circuitBreaker: {
        state: this.circuitBreaker.getState(),
        isHealthy: this.circuitBreaker.getState() !== 'open',
      },
      retryBudget: this.retryBudget.getStats(),
      deadLetters: {
        count: this.deadLetterQueue.size(),
        items: this.deadLetterQueue.list().map((dl) => ({
          operationId: dl.operation.id,
          table: dl.operation.table,
          recordId: dl.operation.recordId,
          errorCategory: dl.finalError.category,
          attempts: dl.attemptHistory.length,
          deadAt: dl.deadAt,
        })),
      },
      metrics: this.recoveryStats.getMetrics(this.deadLetterQueue.size()),
      queue: this.getStats(),
    };
  }

  /**
   * Get error recovery metrics
   */
  getRecoveryMetrics() {
    return this.recoveryStats.getMetrics(this.deadLetterQueue.size());
  }

  /**
   * Get dead letter queue items
   */
  getDeadLetters() {
    return this.deadLetterQueue.list();
  }

  /**
   * Retry a specific dead letter operation
   * Removes it from dead letter queue and re-enqueues
   */
  async retryDeadLetter(operationId: string): Promise<boolean> {
    const deadLetter = this.deadLetterQueue.get(operationId);
    if (!deadLetter) {
      devLog.warn('[SyncQueue] Dead letter not found:', operationId);
      return false;
    }

    // Remove from dead letter queue
    this.deadLetterQueue.remove(operationId);

    // Reset operation and re-enqueue
    const op = deadLetter.operation as EnhancedSyncOperation;
    op.status = 'pending';
    op.attempts = 0;
    op.error = null;
    op.lastAttemptAt = null;
    op.attemptHistory = []; // Clear history for fresh start

    // Add back to queue
    this.queue.set(op.id, op);
    const dedupeKey = `${op.table}:${op.recordId}`;
    this.deduplicationIndex.set(dedupeKey, op.id);

    await this.persistOperation(op);

    devLog.log('[SyncQueue] Dead letter retried:', {
      operationId,
      table: op.table,
      recordId: op.recordId,
    });

    this.notifyListeners();

    // Process queue if online
    if (navigator.onLine) {
      await this.processQueue();
    }

    return true;
  }

  /**
   * Clear all dead letters
   */
  clearDeadLetters(): void {
    this.deadLetterQueue.clear();
    devLog.log('[SyncQueue] Dead letter queue cleared');
  }

  /**
   * Reset circuit breaker (for manual recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    devLog.log('[SyncQueue] Circuit breaker reset');
  }

  /**
   * Reset retry budget (for manual recovery)
   */
  resetRetryBudget(): void {
    this.retryBudget.reset();
    devLog.log('[SyncQueue] Retry budget reset');
  }

  /**
   * Reset all error recovery systems
   */
  resetErrorRecovery(): void {
    this.circuitBreaker.reset();
    this.retryBudget.reset();
    this.recoveryStats.reset();
    devLog.log('[SyncQueue] Error recovery systems reset');
  }
}

// Export singleton instance
export const syncQueue = SyncQueueService.getInstance();
export default syncQueue;
