/**
 * Cloud Sync Type Definitions
 *
 * Shared types for always-on cloud synchronization system.
 * Used by sync queue, merge engine, hydration, and realtime services.
 */

// ============================================================================
// Sync Queue Types
// ============================================================================

/**
 * Tables that support cloud sync
 */
export type SyncTable =
  | 'projects'
  | 'chapters'
  | 'sections'
  | 'characters'
  | 'notes'
  | 'project_settings';

/**
 * Sync operation types
 */
export type SyncOperationType = 'upsert' | 'delete';

/**
 * Sync operation status
 */
export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed';

/**
 * A single sync operation in the queue
 */
export interface SyncOperation {
  /** Unique operation ID */
  id: string;

  /** Type of operation */
  type: SyncOperationType;

  /** Target table */
  table: SyncTable;

  /** ID of record being synced */
  recordId: string;

  /** Project this operation belongs to (for scoping) */
  projectId: string;

  /** Data payload to sync */
  payload: any;

  /** Number of retry attempts */
  attempts: number;

  /** Current status */
  status: SyncStatus;

  /** When operation was created */
  createdAt: number;

  /** When last attempt was made */
  lastAttemptAt: number | null;

  /** Error message if failed */
  error: string | null;

  /** Priority (higher = process first) */
  priority?: number;
}

/**
 * Sync queue statistics
 */
export interface SyncQueueStats {
  /** Total operations in queue */
  total: number;

  /** Operations waiting to be processed */
  pending: number;

  /** Operations currently being processed */
  syncing: number;

  /** Successfully completed operations */
  success: number;

  /** Failed operations (max retries exceeded) */
  failed: number;

  /** Oldest pending operation timestamp */
  oldestPendingAt: number | null;
}

// ============================================================================
// Merge Engine Types
// ============================================================================

/**
 * Record as stored locally (IndexedDB)
 * Includes client-side metadata for conflict detection
 */
export interface LocalRecord {
  /** Record ID */
  id: string;

  /** Server timestamp from last sync (authoritative) */
  updated_at: number;

  /** When we last saw this record from cloud */
  last_synced_at: number;

  /** Local timestamp (client clock, unreliable) */
  local_updated_at?: number;

  /** Content hash for quick comparison */
  client_hash?: string;

  /** Actual record data */
  [key: string]: any;
}

/**
 * Record as received from cloud (Supabase)
 */
export interface CloudRecord {
  /** Record ID */
  id: string;

  /** Server timestamp (authoritative) */
  updated_at: number;

  /** Content hash if available */
  client_hash?: string;

  /** Actual record data */
  [key: string]: any;
}

/**
 * Merge decision result
 */
export type MergeDecision = 'keep-local' | 'take-cloud' | 'conflict-detected';

/**
 * Result of LWW merge operation
 */
export interface MergeResult {
  /** What action to take */
  decision: MergeDecision;

  /** Which version won (null if no change needed) */
  winner: 'local' | 'cloud' | null;

  /** Human-readable reason for decision */
  reason: string;

  /** Should we push local version to cloud? */
  shouldPushToCloud: boolean;

  /** Should we update local DB with cloud version? */
  shouldUpdateLocal: boolean;

  /** Merged record (if applicable) */
  mergedRecord?: any;
}

// ============================================================================
// Hydration Types
// ============================================================================

/**
 * Hydration request (cloud → local)
 */
export interface HydrationRequest {
  /** Project to hydrate */
  projectId: string;

  /** Tables to hydrate (default: all) */
  tables?: SyncTable[];

  /** Only fetch records updated after this timestamp */
  since?: number;

  /** Show progress updates */
  onProgress?: (progress: HydrationProgress) => void;
}

/**
 * Hydration progress update
 */
export interface HydrationProgress {
  /** Current table being hydrated */
  currentTable: SyncTable;

  /** Tables completed */
  completedTables: SyncTable[];

  /** Total records fetched so far */
  recordsFetched: number;

  /** Total records written to IndexedDB */
  recordsWritten: number;

  /** Percentage complete (0-100) */
  percentComplete: number;
}

/**
 * Hydration result
 */
export interface HydrationResult {
  /** Was hydration successful? */
  success: boolean;

  /** Total records synced */
  recordsSynced: number;

  /** Time taken in milliseconds */
  duration: number;

  /** Conflicts detected during merge */
  conflicts: MergeConflict[];

  /** Any errors encountered */
  errors: string[];

  /** Per-table breakdown */
  tableStats: Record<SyncTable, { fetched: number; written: number }>;
}

// ============================================================================
// Realtime Types
// ============================================================================

/**
 * Realtime event types
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Realtime change event
 */
export interface RealtimeChange {
  /** Event type */
  eventType: RealtimeEventType;

  /** Table where change occurred */
  table: SyncTable;

  /** New record state (for INSERT/UPDATE) */
  new: any;

  /** Old record state (for UPDATE/DELETE) */
  old: any;

  /** Change timestamp */
  timestamp: number;
}

/**
 * Realtime subscription status
 */
export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// ============================================================================
// Conflict Types
// ============================================================================

/**
 * Detected merge conflict
 */
export interface MergeConflict {
  /** Record ID with conflict */
  recordId: string;

  /** Table where conflict occurred */
  table: SyncTable;

  /** Local version timestamp */
  localUpdatedAt: number;

  /** Cloud version timestamp */
  cloudUpdatedAt: number;

  /** Resolution strategy used */
  resolution: 'local-wins' | 'cloud-wins' | 'manual-required';

  /** Human-readable reason */
  reason: string;

  /** When conflict was detected */
  detectedAt: number;
}

// ============================================================================
// Cloud Sync Status Types
// ============================================================================

/**
 * Overall cloud sync status
 */
export type CloudSyncStatus = 'online' | 'syncing' | 'offline' | 'error';

/**
 * Detailed sync state
 */
export interface SyncState {
  /** Overall status */
  status: CloudSyncStatus;

  /** Is sync queue processing? */
  isSyncing: boolean;

  /** Pending operations count */
  pendingOperations: number;

  /** Last successful sync timestamp */
  lastSyncAt: number | null;

  /** Last sync error (if any) */
  lastError: string | null;

  /** Is user online? */
  isOnline: boolean;

  /** Is authenticated with Supabase? */
  isAuthenticated: boolean;

  /** Realtime connection status */
  realtimeStatus: RealtimeStatus;

  /** Current retry backoff delay (ms) */
  retryDelay: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Callback for sync state changes
 */
export type SyncStateCallback = (state: SyncState) => void;

/**
 * Callback for conflicts
 */
export type ConflictCallback = (conflict: MergeConflict) => void;

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Initial retry delay in milliseconds */
  initialDelay: number;

  /** Maximum retry delay in milliseconds */
  maxDelay: number;

  /** Backoff multiplier (exponential) */
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 10,
  initialDelay: 1000, // 1 second
  maxDelay: 16000, // 16 seconds
  backoffMultiplier: 2, // double each time
};

/**
 * Batch configuration
 */
export interface BatchConfig {
  /** Maximum records per batch operation */
  maxBatchSize: number;

  /** Delay between batches in milliseconds */
  batchDelay: number;
}

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 50,
  batchDelay: 100, // 100ms between batches
};
