/**
 * Error Recovery System Tests
 *
 * Comprehensive test coverage for:
 * - Error classification
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Retry budget (rate limiting)
 * - Dead letter queue
 * - Error recovery stats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  classifyError,
  ErrorCategory,
  ExponentialBackoffStrategy,
  CircuitBreaker,
  CircuitState,
  RetryBudget,
  DeadLetterQueue,
  ErrorRecoveryStats,
  type ClassifiedError,
  type SyncOperation,
} from '../errorRecovery';

describe('Error Classification', () => {
  describe('classifyError', () => {
    it('classifies network errors as retryable', () => {
      const error = new Error('fetch failed');
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.isRetryable).toBe(true);
      expect(classified.suggestedDelay).toBe(1000);
    });

    it('classifies network error by code', () => {
      const error = { code: 'NETWORK_ERROR', message: 'Network failure' };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.isRetryable).toBe(true);
    });

    it('classifies 429 rate limit with retry-after header', () => {
      const error = {
        status: 429,
        headers: { 'retry-after': '60' },
      };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(classified.isRetryable).toBe(true);
      expect(classified.retryAfter).toBe(60000);
      expect(classified.suggestedDelay).toBe(60000);
    });

    it('classifies 429 without retry-after header', () => {
      const error = { status: 429 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(classified.isRetryable).toBe(true);
      expect(classified.retryAfter).toBe(60000); // Default 60s
    });

    it('classifies 401 as non-retryable authentication error', () => {
      const error = { status: 401 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies 403 as non-retryable authentication error', () => {
      const error = { status: 403 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies 500 as retryable server error', () => {
      const error = { status: 500 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(classified.isRetryable).toBe(true);
      expect(classified.suggestedDelay).toBe(5000);
    });

    it('classifies 503 as retryable server error', () => {
      const error = { status: 503 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(classified.isRetryable).toBe(true);
    });

    it('classifies 409 as retryable conflict', () => {
      const error = { status: 409 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.CONFLICT);
      expect(classified.isRetryable).toBe(true);
      expect(classified.suggestedDelay).toBe(2000);
    });

    it('classifies 400 as non-retryable client error', () => {
      const error = { status: 400 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies 404 as non-retryable client error', () => {
      const error = { status: 404 };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies unknown errors as retryable with conservative delay', () => {
      const error = new Error('Unknown error');
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.UNKNOWN);
      expect(classified.isRetryable).toBe(true);
      expect(classified.suggestedDelay).toBe(3000);
    });

    it('preserves original error in classified result', () => {
      const error = { status: 500, message: 'Server error' };
      const classified = classifyError(error);

      expect(classified.originalError).toBe(error);
    });
  });
});

describe('Exponential Backoff Strategy', () => {
  let strategy: ExponentialBackoffStrategy;
  const mockError: ClassifiedError = {
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    originalError: new Error('test'),
  };

  beforeEach(() => {
    strategy = new ExponentialBackoffStrategy();
  });

  it('calculates exponential delay for attempt 1', () => {
    const delay = strategy.calculateDelay(1, mockError);

    // Base delay is 1000ms, attempt 1 should be around 1000ms (with jitter)
    expect(delay).toBeGreaterThan(700); // 1000 - 30%
    expect(delay).toBeLessThan(1300); // 1000 + 30%
  });

  it('calculates exponential delay for attempt 2', () => {
    const delay = strategy.calculateDelay(2, mockError);

    // Base delay * 2^(attempt-1) = 1000 * 2^1 = 2000ms (with jitter)
    expect(delay).toBeGreaterThan(1400); // 2000 - 30%
    expect(delay).toBeLessThan(2600); // 2000 + 30%
  });

  it('calculates exponential delay for attempt 3', () => {
    const delay = strategy.calculateDelay(3, mockError);

    // Base delay * 2^(attempt-1) = 1000 * 2^2 = 4000ms (with jitter)
    expect(delay).toBeGreaterThan(2800); // 4000 - 30%
    expect(delay).toBeLessThan(5200); // 4000 + 30%
  });

  it('respects max delay cap', () => {
    const delay = strategy.calculateDelay(20, mockError); // Very high attempt

    // Should be capped at maxDelay (60000ms) with jitter
    expect(delay).toBeLessThanOrEqual(60000 * 1.3);
  });

  it('uses error-specific suggested delay', () => {
    const errorWithDelay: ClassifiedError = {
      ...mockError,
      suggestedDelay: 5000,
    };

    const delay = strategy.calculateDelay(1, errorWithDelay);

    // Should use suggestedDelay (5000ms) instead of base delay
    expect(delay).toBeGreaterThan(3500); // 5000 - 30%
    expect(delay).toBeLessThan(6500); // 5000 + 30%
  });

  it('applies jitter to prevent thundering herd', () => {
    const delays = Array.from({ length: 10 }, () => strategy.calculateDelay(1, mockError));

    // All delays should be different due to jitter
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(5); // At least some variation
  });

  it('never returns negative delay', () => {
    const delays = Array.from({ length: 100 }, () => strategy.calculateDelay(1, mockError));

    expect(delays.every((d) => d >= 0)).toBe(true);
  });

  it('supports custom configuration', () => {
    const customStrategy = new ExponentialBackoffStrategy(2000, 30000, 3, 0.5);

    const delay = customStrategy.calculateDelay(1, mockError);

    // Base delay is 2000ms with 50% jitter
    expect(delay).toBeGreaterThan(1000); // 2000 - 50%
    expect(delay).toBeLessThan(3000); // 2000 + 50%
  });
});

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(3, 2, 1000); // 3 failures to open, 2 successes to close, 1s timeout
  });

  it('starts in CLOSED state', () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('executes operations successfully when CLOSED', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await breaker.execute(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalled();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('opens circuit after threshold failures', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Fail 3 times to trip breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('rejects operations immediately when OPEN', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Trip the breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    // Now circuit is OPEN
    operation.mockClear();

    await expect(breaker.execute(operation)).rejects.toThrow('Circuit is OPEN');
    expect(operation).not.toHaveBeenCalled(); // Should not even try
  });

  it('transitions to HALF_OPEN after timeout', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Trip the breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1100));

    operation.mockResolvedValue('success');

    await breaker.execute(operation);
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it('closes circuit after successful attempts in HALF_OPEN', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Trip the breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1100));

    operation.mockResolvedValue('success');

    // 2 successes to close
    await breaker.execute(operation);
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    await breaker.execute(operation);
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('reopens circuit if HALF_OPEN attempt fails', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Trip the breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Fail in HALF_OPEN state
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('can be manually reset', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    // Trip the breaker
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    breaker.reset();

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('resets failure count on success in CLOSED state', async () => {
    const operation = vi.fn();

    // Fail twice (not enough to trip)
    operation.mockRejectedValue(new Error('fail'));
    await expect(breaker.execute(operation)).rejects.toThrow('fail');
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    // Succeed - should reset failure count
    operation.mockResolvedValue('success');
    await breaker.execute(operation);

    // Now would need 3 more failures to trip (not just 1)
    operation.mockRejectedValue(new Error('fail'));
    await expect(breaker.execute(operation)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });
});

describe('Retry Budget', () => {
  let budget: RetryBudget;

  beforeEach(() => {
    budget = new RetryBudget(10, 1000); // 10 retries per second
  });

  it('allows retries under budget', () => {
    expect(budget.canRetry()).toBe(true);

    budget.recordRetry();
    expect(budget.canRetry()).toBe(true);
  });

  it('blocks retries when budget exhausted', () => {
    // Use up the budget
    for (let i = 0; i < 10; i++) {
      budget.recordRetry();
    }

    expect(budget.canRetry()).toBe(false);
  });

  it('resets budget after window expires', async () => {
    // Exhaust budget
    for (let i = 0; i < 10; i++) {
      budget.recordRetry();
    }

    expect(budget.canRetry()).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(budget.canRetry()).toBe(true);
  });

  it('provides accurate stats', () => {
    budget.recordRetry();
    budget.recordRetry();
    budget.recordRetry();

    const stats = budget.getStats();

    expect(stats.retries).toBe(3);
    expect(stats.limit).toBe(10);
    expect(stats.percentUsed).toBe(30);
    expect(stats.windowMs).toBe(1000);
    expect(stats.windowResetIn).toBeLessThanOrEqual(1000);
    expect(stats.windowResetIn).toBeGreaterThan(0);
  });

  it('can be manually reset', () => {
    // Exhaust budget
    for (let i = 0; i < 10; i++) {
      budget.recordRetry();
    }

    expect(budget.canRetry()).toBe(false);

    budget.reset();

    expect(budget.canRetry()).toBe(true);
    const stats = budget.getStats();
    expect(stats.retries).toBe(0);
    expect(stats.percentUsed).toBe(0);
  });
});

describe('Dead Letter Queue', () => {
  let dlq: DeadLetterQueue;
  const mockOperation: SyncOperation = {
    id: 'op-1',
    table: 'chapters',
    recordId: 'chapter-1',
    projectId: 'project-1',
    action: 'upsert',
    payload: { title: 'Test' },
    status: 'failed',
    attempts: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockError: ClassifiedError = {
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    originalError: new Error('Auth failed'),
  };

  beforeEach(() => {
    dlq = new DeadLetterQueue();
  });

  it('adds operations to the queue', () => {
    dlq.add(mockOperation, mockError, []);

    expect(dlq.size()).toBe(1);
    const letter = dlq.get(mockOperation.id);
    expect(letter).toBeDefined();
    expect(letter?.operation.id).toBe(mockOperation.id);
  });

  it('stores full dead letter details', () => {
    const history = [
      {
        attempt: 1,
        error: 'First error',
        category: ErrorCategory.NETWORK,
        delay: 1000,
        timestamp: Date.now(),
      },
    ];

    dlq.add(mockOperation, mockError, history);

    const letter = dlq.get(mockOperation.id);
    expect(letter?.finalError).toBe(mockError);
    expect(letter?.attemptHistory).toBe(history);
    expect(letter?.deadAt).toBeGreaterThan(0);
  });

  it('retrieves operation by ID', () => {
    dlq.add(mockOperation, mockError, []);

    const letter = dlq.get(mockOperation.id);
    expect(letter?.operation.recordId).toBe('chapter-1');
  });

  it('returns undefined for non-existent ID', () => {
    const letter = dlq.get('non-existent');
    expect(letter).toBeUndefined();
  });

  it('removes operations from queue', () => {
    dlq.add(mockOperation, mockError, []);

    expect(dlq.size()).toBe(1);

    const removed = dlq.remove(mockOperation.id);
    expect(removed).toBe(true);
    expect(dlq.size()).toBe(0);
  });

  it('returns false when removing non-existent operation', () => {
    const removed = dlq.remove('non-existent');
    expect(removed).toBe(false);
  });

  it('lists all dead letters', () => {
    const op2 = { ...mockOperation, id: 'op-2' };

    dlq.add(mockOperation, mockError, []);
    dlq.add(op2, mockError, []);

    const list = dlq.list();
    expect(list).toHaveLength(2);
  });

  it('cleans up old dead letters', () => {
    // Add operation
    dlq.add(mockOperation, mockError, []);

    // Manually set deadAt to 8 days ago
    const letter = dlq.get(mockOperation.id);
    if (letter) {
      letter.deadAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
    }

    dlq.cleanup();

    expect(dlq.size()).toBe(0);
  });

  it('keeps recent dead letters during cleanup', () => {
    dlq.add(mockOperation, mockError, []);

    dlq.cleanup();

    expect(dlq.size()).toBe(1);
  });

  it('can be cleared entirely', () => {
    dlq.add(mockOperation, mockError, []);
    dlq.add({ ...mockOperation, id: 'op-2' }, mockError, []);

    expect(dlq.size()).toBe(2);

    dlq.clear();

    expect(dlq.size()).toBe(0);
  });
});

describe('Error Recovery Stats', () => {
  let stats: ErrorRecoveryStats;

  beforeEach(() => {
    stats = new ErrorRecoveryStats();
  });

  it('tracks total operations', () => {
    stats.recordOperation();
    stats.recordOperation();

    const metrics = stats.getMetrics(0);
    expect(metrics.totalOperations).toBe(2);
  });

  it('tracks successful operations', () => {
    stats.recordOperation();
    stats.recordSuccess();

    const metrics = stats.getMetrics(0);
    expect(metrics.successfulOperations).toBe(1);
  });

  it('tracks failed operations by category', () => {
    stats.recordFailure(ErrorCategory.NETWORK);
    stats.recordFailure(ErrorCategory.NETWORK);
    stats.recordFailure(ErrorCategory.SERVER_ERROR);

    const metrics = stats.getMetrics(0);
    expect(metrics.failedOperations).toBe(3);
    expect(metrics.errorsByCategory[ErrorCategory.NETWORK]).toBe(2);
    expect(metrics.errorsByCategory[ErrorCategory.SERVER_ERROR]).toBe(1);
  });

  it('tracks retried operations', () => {
    stats.recordRetry(1000);
    stats.recordRetry(2000);

    const metrics = stats.getMetrics(0);
    expect(metrics.retriedOperations).toBe(2);
  });

  it('calculates average retry count', () => {
    stats.recordRetry(1000);
    stats.recordRetry(2000);
    stats.recordRetry(3000);

    const metrics = stats.getMetrics(0);
    // 3 retries / 3 operations = 1 average
    expect(metrics.averageRetryCount).toBe(1);
  });

  it('calculates average retry delay', () => {
    stats.recordRetry(1000);
    stats.recordRetry(2000);
    stats.recordRetry(3000);

    const metrics = stats.getMetrics(0);
    // (1000 + 2000 + 3000) / 3 = 2000ms average
    expect(metrics.averageRetryDelay).toBe(2000);
  });

  it('tracks circuit breaker trips', () => {
    stats.recordCircuitBreakerTrip();
    stats.recordCircuitBreakerTrip();

    const metrics = stats.getMetrics(0);
    expect(metrics.circuitBreakerTrips).toBe(2);
  });

  it('tracks budget exhaustion', () => {
    stats.recordBudgetExhaustion();

    const metrics = stats.getMetrics(0);
    expect(metrics.retryBudgetExhaustion).toBe(1);
  });

  it('includes dead letter count in metrics', () => {
    const metrics = stats.getMetrics(5);
    expect(metrics.deadLetterCount).toBe(5);
  });

  it('initializes all error categories to zero', () => {
    const metrics = stats.getMetrics(0);

    expect(metrics.errorsByCategory[ErrorCategory.NETWORK]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.AUTHENTICATION]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.RATE_LIMIT]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.CLIENT_ERROR]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.SERVER_ERROR]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.CONFLICT]).toBe(0);
    expect(metrics.errorsByCategory[ErrorCategory.UNKNOWN]).toBe(0);
  });

  it('can be reset', () => {
    stats.recordOperation();
    stats.recordSuccess();
    stats.recordFailure(ErrorCategory.NETWORK);

    stats.reset();

    const metrics = stats.getMetrics(0);
    expect(metrics.totalOperations).toBe(0);
    expect(metrics.successfulOperations).toBe(0);
    expect(metrics.failedOperations).toBe(0);
  });

  it('handles zero operations gracefully', () => {
    const metrics = stats.getMetrics(0);

    expect(metrics.averageRetryCount).toBe(0);
    expect(metrics.averageRetryDelay).toBe(0);
  });
});
