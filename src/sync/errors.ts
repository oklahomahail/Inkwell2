/**
 * Sync Error Classes
 *
 * Custom error types for cloud sync operations to enable proper
 * error classification and retry logic.
 */

/**
 * Base sync error class
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

/**
 * Error thrown when a sync operation references a record that doesn't exist locally
 *
 * This indicates an orphaned sync operation that should be permanently failed
 * and removed from the queue (not retried).
 */
export class OrphanedOperationError extends SyncError {
  constructor(
    message: string,
    public readonly recordType: string,
    public readonly recordId: string,
  ) {
    super(message, false); // Not retryable
    this.name = 'OrphanedOperationError';
  }
}

/**
 * Error thrown when RLS policies block access
 *
 * This could be retryable if it's a temporary auth issue, but not if
 * it's a permanent access denial.
 */
export class RLSError extends SyncError {
  constructor(
    message: string,
    public readonly code: string,
    retryable: boolean = false,
  ) {
    super(message, retryable);
    this.name = 'RLSError';
  }
}

/**
 * Error thrown when authentication is missing or expired
 *
 * This is retryable as the user might re-authenticate.
 */
export class AuthenticationError extends SyncError {
  constructor(message: string) {
    super(message, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when network is unavailable
 *
 * This is retryable as the network might come back.
 */
export class NetworkError extends SyncError {
  constructor(message: string) {
    super(message, true);
    this.name = 'NetworkError';
  }
}

/**
 * Check if an error is a non-retryable sync error
 */
export function isNonRetryableError(error: unknown): boolean {
  if (error instanceof SyncError) {
    return !error.retryable;
  }
  return false;
}

/**
 * Check if an error is an orphaned operation error
 */
export function isOrphanedOperationError(error: unknown): boolean {
  return error instanceof OrphanedOperationError;
}
