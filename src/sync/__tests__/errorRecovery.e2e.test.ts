/**
 * Error Recovery End-to-End Tests
 *
 * Tests complete error recovery flows from classification through recovery
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
  type SyncOperation,
} from '../errorRecovery';

describe('Error Recovery E2E Flows', () => {
  describe('Complete Retry Flow with Backoff', () => {
    it('successfully retries after transient error', async () => {
      const breaker = new CircuitBreaker();
      const strategy = new ExponentialBackoffStrategy();
      const stats = new ErrorRecoveryStats();

      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient error');
        }
        return 'success';
      });

      stats.recordOperation();

      // First attempt fails
      try {
        await breaker.execute(operation);
      } catch (error) {
        const classified = classifyError(error);
        expect(classified.isRetryable).toBe(true);

        const delay = strategy.calculateDelay(1, classified);
        expect(delay).toBeGreaterThan(0);

        stats.recordRetry(delay);
      }

      // Second attempt fails
      try {
        await breaker.execute(operation);
      } catch (error) {
        const classified = classifyError(error);
        stats.recordRetry(strategy.calculateDelay(2, classified));
      }

      // Third attempt succeeds
      const result = await breaker.execute(operation);
      expect(result).toBe('success');
      stats.recordSuccess();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      const metrics = stats.getMetrics(0);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.retriedOperations).toBe(2);
    });
  });

  describe('Circuit Breaker Protection Flow', () => {
    it('opens circuit after repeated failures and recovers', async () => {
      const breaker = new CircuitBreaker(3, 2, 500); // 3 failures, 2 successes, 500ms timeout
      const stats = new ErrorRecoveryStats();

      const failingOp = vi.fn().mockRejectedValue(new Error('System down'));

      // Fail 3 times to trip breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingOp);
        } catch (error) {
          stats.recordFailure(ErrorCategory.SERVER_ERROR);
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      stats.recordCircuitBreakerTrip();

      // Circuit is open - should reject immediately
      await expect(breaker.execute(failingOp)).rejects.toThrow('Circuit is OPEN');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Fix the operation
      const successfulOp = vi.fn().mockResolvedValue('recovered');

      // First success in HALF_OPEN
      await breaker.execute(successfulOp);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      stats.recordSuccess();

      // Second success closes circuit
      await breaker.execute(successfulOp);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      stats.recordSuccess();

      const metrics = stats.getMetrics(0);
      expect(metrics.circuitBreakerTrips).toBe(1);
      expect(metrics.successfulOperations).toBe(2);
    });
  });

  describe('Retry Budget Exhaustion Flow', () => {
    it('stops retrying when budget exhausted', () => {
      const budget = new RetryBudget(5, 1000); // 5 retries per second
      const stats = new ErrorRecoveryStats();

      // Use up the budget
      for (let i = 0; i < 5; i++) {
        expect(budget.canRetry()).toBe(true);
        budget.recordRetry();
        stats.recordRetry(1000);
      }

      // Budget exhausted
      expect(budget.canRetry()).toBe(false);
      stats.recordBudgetExhaustion();

      const metrics = stats.getMetrics(0);
      expect(metrics.retryBudgetExhaustion).toBe(1);
      expect(metrics.retriedOperations).toBe(5);
    });
  });

  describe('Dead Letter Queue Flow', () => {
    it('moves non-retryable errors to dead letter queue', () => {
      const dlq = new DeadLetterQueue();
      const stats = new ErrorRecoveryStats();

      const operation: SyncOperation = {
        id: 'op-1',
        table: 'chapters',
        recordId: 'chapter-1',
        projectId: 'project-1',
        action: 'upsert',
        payload: { title: 'Test' },
        status: 'failed',
        attempts: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const error = { status: 401 }; // Authentication error - not retryable
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.isRetryable).toBe(false);

      stats.recordOperation();
      stats.recordFailure(classified.category);

      dlq.add(operation, classified, [
        {
          attempt: 1,
          error: 'Auth failed',
          category: ErrorCategory.AUTHENTICATION,
          delay: 0,
          timestamp: Date.now(),
        },
      ]);

      expect(dlq.size()).toBe(1);

      const metrics = stats.getMetrics(dlq.size());
      expect(metrics.deadLetterCount).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.AUTHENTICATION]).toBe(1);
    });
  });

  describe('Complete Error Recovery Lifecycle', () => {
    it('handles full lifecycle from error to recovery', async () => {
      const breaker = new CircuitBreaker(5, 2, 1000);
      const strategy = new ExponentialBackoffStrategy();
      const budget = new RetryBudget(100, 60000);
      const dlq = new DeadLetterQueue();
      const stats = new ErrorRecoveryStats();

      const operation: SyncOperation = {
        id: 'op-lifecycle',
        table: 'chapters',
        recordId: 'chapter-lifecycle',
        projectId: 'project-1',
        action: 'upsert',
        payload: { title: 'Lifecycle Test' },
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simulate network errors with eventual recovery
      let attempt = 0;
      const networkError = new Error('fetch failed');
      const classified = classifyError(networkError);

      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.isRetryable).toBe(true);

      stats.recordOperation();

      // Attempt 1-3: Network errors with backoff
      for (let i = 1; i <= 3; i++) {
        attempt++;

        if (!budget.canRetry()) {
          stats.recordBudgetExhaustion();
          break;
        }

        try {
          await breaker.execute(async () => {
            throw networkError;
          });
        } catch (error) {
          const delay = strategy.calculateDelay(attempt, classified);
          budget.recordRetry();
          stats.recordRetry(delay);
          stats.recordFailure(classified.category);

          // Simulate waiting for backoff
          await new Promise((resolve) => setTimeout(resolve, 10)); // Shortened for test
        }
      }

      // Circuit should still be closed (under threshold)
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Attempt 4: Success
      const result = await breaker.execute(async () => 'recovered');
      expect(result).toBe('recovered');
      stats.recordSuccess();

      // Verify final state
      const metrics = stats.getMetrics(dlq.size());

      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.failedOperations).toBe(3);
      expect(metrics.retriedOperations).toBe(3);
      expect(metrics.errorsByCategory[ErrorCategory.NETWORK]).toBe(3);
      expect(metrics.averageRetryCount).toBeGreaterThan(0);
      expect(metrics.deadLetterCount).toBe(0); // Not sent to DLQ
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('sends permanently failed operations to dead letter queue', () => {
      const dlq = new DeadLetterQueue();
      const stats = new ErrorRecoveryStats();

      const operation: SyncOperation = {
        id: 'op-permanent-fail',
        table: 'notes',
        recordId: 'note-1',
        projectId: 'project-1',
        action: 'upsert',
        payload: { content: 'Test note' },
        status: 'failed',
        attempts: 5,
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
      };

      // Client error - not retryable
      const error = { status: 400, message: 'Bad request' };
      const classified = classifyError(error);

      expect(classified.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(classified.isRetryable).toBe(false);

      stats.recordOperation();
      stats.recordFailure(classified.category);

      const history = [
        {
          attempt: 1,
          error: 'Validation error',
          category: ErrorCategory.CLIENT_ERROR,
          delay: 0,
          timestamp: Date.now() - 5000,
        },
      ];

      dlq.add(operation, classified, history);

      const deadLetter = dlq.get(operation.id);
      expect(deadLetter).toBeDefined();
      expect(deadLetter?.finalError.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(deadLetter?.attemptHistory.length).toBe(1);

      const metrics = stats.getMetrics(dlq.size());
      expect(metrics.deadLetterCount).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.CLIENT_ERROR]).toBe(1);
    });
  });

  describe('Rate Limiting Flow', () => {
    it('respects rate limit retry-after header', () => {
      const strategy = new ExponentialBackoffStrategy();

      const rateLimitError = {
        status: 429,
        headers: { 'retry-after': '30' },
      };

      const classified = classifyError(rateLimitError);

      expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(classified.isRetryable).toBe(true);
      expect(classified.retryAfter).toBe(30000); // 30 seconds

      // Strategy should respect the retry-after
      const delay = strategy.calculateDelay(1, classified);

      // Should be around 30000ms (with jitter)
      expect(delay).toBeGreaterThan(20000);
      expect(delay).toBeLessThan(40000);
    });
  });

  describe('Conflict Resolution Flow', () => {
    it('handles optimistic lock conflicts with quick retry', () => {
      const strategy = new ExponentialBackoffStrategy();

      const conflictError = { status: 409 };
      const classified = classifyError(conflictError);

      expect(classified.category).toBe(ErrorCategory.CONFLICT);
      expect(classified.isRetryable).toBe(true);
      expect(classified.suggestedDelay).toBe(2000); // Quick retry for conflicts

      const delay = strategy.calculateDelay(1, classified);

      // Should be around 2000ms (with jitter)
      expect(delay).toBeGreaterThan(1400);
      expect(delay).toBeLessThan(2600);
    });
  });
});
