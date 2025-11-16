/**
 * Enhanced Error Recovery System
 *
 * Provides sophisticated retry strategies for sync operations:
 * - Error classification (network, auth, rate limit, etc.)
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Retry budget (rate limiting)
 * - Dead letter queue for persistent failures
 *
 * Architecture: Production-grade error handling for sync reliability
 */

import devLog from '@/utils/devLog';

import type { SyncOperation } from './types';

/**
 * Error Categories
 */
export enum ErrorCategory {
  NETWORK = 'network', // Timeout, connection refused, DNS
  AUTHENTICATION = 'auth', // 401, 403, expired token
  RATE_LIMIT = 'rate_limit', // 429, quota exceeded
  CLIENT_ERROR = 'client', // 400, 404, invalid data
  SERVER_ERROR = 'server', // 500, 503, database error
  CONFLICT = 'conflict', // 409, optimistic lock failure
  UNKNOWN = 'unknown',
}

/**
 * Classified Error with retry metadata
 */
export interface ClassifiedError {
  category: ErrorCategory;
  isRetryable: boolean;
  retryAfter?: number; // For 429 Retry-After header (ms)
  suggestedDelay?: number; // Suggested retry delay (ms)
  originalError: any;
}

/**
 * Error Classification
 * Analyzes errors to determine retry strategy
 */
export function classifyError(error: any): ClassifiedError {
  // Network errors - always retryable
  if (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'NetworkError'
  ) {
    return {
      category: ErrorCategory.NETWORK,
      isRetryable: true,
      suggestedDelay: 1000, // Start with 1s
      originalError: error,
    };
  }

  // HTTP status-based classification
  const status = error.status || error.response?.status;

  // Rate limiting
  if (status === 429) {
    const retryAfter = parseInt(error.headers?.['retry-after'] || '60');
    return {
      category: ErrorCategory.RATE_LIMIT,
      isRetryable: true,
      retryAfter: retryAfter * 1000,
      suggestedDelay: retryAfter * 1000,
      originalError: error,
    };
  }

  // Authentication errors - not retryable
  if (status === 401 || status === 403) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      isRetryable: false, // Requires user action
      originalError: error,
    };
  }

  // Server errors - retryable with backoff
  if (status >= 500) {
    return {
      category: ErrorCategory.SERVER_ERROR,
      isRetryable: true,
      suggestedDelay: 5000, // Start with 5s for server errors
      originalError: error,
    };
  }

  // Conflict errors - retryable with quick retry
  if (status === 409) {
    return {
      category: ErrorCategory.CONFLICT,
      isRetryable: true,
      suggestedDelay: 2000, // Quick retry for conflicts
      originalError: error,
    };
  }

  // Client errors - not retryable
  if (status >= 400 && status < 500) {
    return {
      category: ErrorCategory.CLIENT_ERROR,
      isRetryable: false, // Bad request, won't fix with retry
      originalError: error,
    };
  }

  // Unknown - retry conservatively
  return {
    category: ErrorCategory.UNKNOWN,
    isRetryable: true,
    suggestedDelay: 3000,
    originalError: error,
  };
}

/**
 * Retry Strategy Interface
 */
export interface RetryStrategy {
  calculateDelay(attempt: number, error: ClassifiedError): number;
}

/**
 * Exponential Backoff with Jitter
 * Prevents thundering herd problem
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  constructor(
    private baseDelay: number = 1000,
    private maxDelay: number = 60000,
    private multiplier: number = 2,
    private jitterFactor: number = 0.3,
  ) {}

  calculateDelay(attempt: number, error: ClassifiedError): number {
    // Use error-specific delay if provided
    const baseDelay = error.suggestedDelay || this.baseDelay;

    // Exponential: delay = base * (multiplier ^ attempt)
    let delay = baseDelay * Math.pow(this.multiplier, attempt - 1);

    // Cap at max
    delay = Math.min(delay, this.maxDelay);

    // Add jitter: ±30% randomization to prevent thundering herd
    const jitter = delay * this.jitterFactor * (Math.random() * 2 - 1);
    delay = Math.max(0, delay + jitter);

    return Math.floor(delay);
  }
}

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject immediately
  HALF_OPEN = 'half_open', // Testing if recovered
}

/**
 * Circuit Breaker Pattern
 * Fails fast when system is down
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  constructor(
    private failureThreshold: number = 5, // Open after 5 failures
    private successThreshold: number = 2, // Close after 2 successes
    private timeout: number = 60000, // Try again after 60s
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.timeout) {
        devLog.log('[CircuitBreaker] Attempting recovery (HALF_OPEN)');
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('[CircuitBreaker] Circuit is OPEN, rejecting operation');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        devLog.log('[CircuitBreaker] Circuit recovered (CLOSED)');
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      devLog.warn('[CircuitBreaker] Circuit tripped (OPEN)', {
        failures: this.failureCount,
      });
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Retry Budget (Rate Limiting)
 * Prevents infinite retry loops
 */
export class RetryBudget {
  private retryCount = 0;
  private windowStart = Date.now();

  constructor(
    private maxRetries: number = 100, // Max 100 retries
    private windowMs: number = 60000, // Per minute
  ) {}

  canRetry(): boolean {
    this.resetIfNeeded();
    return this.retryCount < this.maxRetries;
  }

  recordRetry(): void {
    this.resetIfNeeded();
    this.retryCount++;
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.retryCount = 0;
      this.windowStart = now;
    }
  }

  getStats() {
    return {
      retries: this.retryCount,
      limit: this.maxRetries,
      percentUsed: (this.retryCount / this.maxRetries) * 100,
      windowMs: this.windowMs,
      windowResetIn: this.windowMs - (Date.now() - this.windowStart),
    };
  }

  reset(): void {
    this.retryCount = 0;
    this.windowStart = Date.now();
  }
}

/**
 * Attempt History Entry
 */
export interface AttemptHistoryEntry {
  attempt: number;
  error: string;
  category: ErrorCategory;
  delay: number;
  timestamp: number;
}

/**
 * Dead Letter
 * Represents a permanently failed operation
 */
export interface DeadLetter {
  operation: SyncOperation;
  finalError: ClassifiedError;
  attemptHistory: AttemptHistoryEntry[];
  deadAt: number;
}

/**
 * Dead Letter Queue
 * Stores operations that failed permanently
 */
export class DeadLetterQueue {
  private queue: Map<string, DeadLetter> = new Map();

  add(operation: SyncOperation, error: ClassifiedError, history: AttemptHistoryEntry[]): void {
    this.queue.set(operation.id, {
      operation,
      finalError: error,
      attemptHistory: history,
      deadAt: Date.now(),
    });

    devLog.error('[DeadLetterQueue] Operation failed permanently', {
      operationId: operation.id,
      table: operation.table,
      recordId: operation.recordId,
      category: error.category,
      attempts: history.length,
    });
  }

  get(operationId: string): DeadLetter | undefined {
    return this.queue.get(operationId);
  }

  remove(operationId: string): boolean {
    return this.queue.delete(operationId);
  }

  list(): DeadLetter[] {
    return Array.from(this.queue.values());
  }

  // Purge old dead letters (after 7 days)
  cleanup(): void {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let removed = 0;
    for (const [id, letter] of this.queue.entries()) {
      if (now - letter.deadAt > SEVEN_DAYS) {
        this.queue.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      devLog.log(`[DeadLetterQueue] Cleaned up ${removed} old dead letters`);
    }
  }

  size(): number {
    return this.queue.size;
  }

  clear(): void {
    this.queue.clear();
  }
}

/**
 * Enhanced Sync Operation
 * Extends base SyncOperation with error recovery metadata
 */
export interface EnhancedSyncOperation extends SyncOperation {
  // Error tracking
  errorCategory?: ErrorCategory;
  attemptHistory: AttemptHistoryEntry[];

  // Circuit breaker state
  circuitBreakerTripped?: boolean;

  // Retry budget
  retryBudgetExhausted?: boolean;
}

/**
 * Error Recovery Metrics
 */
export interface ErrorRecoveryMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  retriedOperations: number;

  errorsByCategory: Record<ErrorCategory, number>;

  averageRetryCount: number;
  averageRetryDelay: number;

  circuitBreakerTrips: number;
  retryBudgetExhaustion: number;
  deadLetterCount: number;
}

/**
 * Error Recovery Stats Tracker
 */
export class ErrorRecoveryStats {
  private totalOps = 0;
  private successfulOps = 0;
  private failedOps = 0;
  private retriedOps = 0;

  private errorsByCategory: Map<ErrorCategory, number> = new Map();

  private totalRetries = 0;
  private totalRetryDelay = 0;

  private circuitBreakerTrips = 0;
  private budgetExhaustion = 0;

  recordOperation(): void {
    this.totalOps++;
  }

  recordSuccess(): void {
    this.successfulOps++;
  }

  recordFailure(category: ErrorCategory): void {
    this.failedOps++;
    const count = this.errorsByCategory.get(category) || 0;
    this.errorsByCategory.set(category, count + 1);
  }

  recordRetry(delay: number): void {
    this.retriedOps++;
    this.totalRetries++;
    this.totalRetryDelay += delay;
  }

  recordCircuitBreakerTrip(): void {
    this.circuitBreakerTrips++;
  }

  recordBudgetExhaustion(): void {
    this.budgetExhaustion++;
  }

  getMetrics(deadLetterCount: number): ErrorRecoveryMetrics {
    return {
      totalOperations: this.totalOps,
      successfulOperations: this.successfulOps,
      failedOperations: this.failedOps,
      retriedOperations: this.retriedOps,

      errorsByCategory: {
        [ErrorCategory.NETWORK]: this.errorsByCategory.get(ErrorCategory.NETWORK) || 0,
        [ErrorCategory.AUTHENTICATION]:
          this.errorsByCategory.get(ErrorCategory.AUTHENTICATION) || 0,
        [ErrorCategory.RATE_LIMIT]: this.errorsByCategory.get(ErrorCategory.RATE_LIMIT) || 0,
        [ErrorCategory.CLIENT_ERROR]: this.errorsByCategory.get(ErrorCategory.CLIENT_ERROR) || 0,
        [ErrorCategory.SERVER_ERROR]: this.errorsByCategory.get(ErrorCategory.SERVER_ERROR) || 0,
        [ErrorCategory.CONFLICT]: this.errorsByCategory.get(ErrorCategory.CONFLICT) || 0,
        [ErrorCategory.UNKNOWN]: this.errorsByCategory.get(ErrorCategory.UNKNOWN) || 0,
      },

      averageRetryCount: this.retriedOps > 0 ? this.totalRetries / this.retriedOps : 0,
      averageRetryDelay: this.totalRetries > 0 ? this.totalRetryDelay / this.totalRetries : 0,

      circuitBreakerTrips: this.circuitBreakerTrips,
      retryBudgetExhaustion: this.budgetExhaustion,
      deadLetterCount,
    };
  }

  reset(): void {
    this.totalOps = 0;
    this.successfulOps = 0;
    this.failedOps = 0;
    this.retriedOps = 0;
    this.errorsByCategory.clear();
    this.totalRetries = 0;
    this.totalRetryDelay = 0;
    this.circuitBreakerTrips = 0;
    this.budgetExhaustion = 0;
  }
}
