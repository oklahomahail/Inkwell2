// src/services/aiRetryService.ts
import devLog from "src/utils/devLogger";

import { analyticsService } from './analyticsService';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, blocking requests
  HALF_OPEN = 'half_open', // Testing if service recovered
}

interface RequestAttempt {
  timestamp: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  recentAttempts: RequestAttempt[];
}

class AIRetryService {
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  };

  private readonly DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
    monitoringWindowMs: 300000, // 5 minutes
  };

  private retryConfig: RetryConfig;
  private circuitConfig: CircuitBreakerConfig;
  private circuitState: CircuitState = CircuitState.CLOSED;
  private stats: CircuitBreakerStats;

  constructor(retryConfig?: Partial<RetryConfig>, circuitConfig?: Partial<CircuitBreakerConfig>) {
    this.retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.circuitConfig = { ...this.DEFAULT_CIRCUIT_CONFIG, ...circuitConfig };
    this.stats = this.initializeStats();
  }

  /**
   * Execute a request with retry logic and circuit breaker protection
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'ai_request',
  ): Promise<T> {
    // Check circuit breaker first
    if (this.circuitState === CircuitState.OPEN) {
      if (!this.shouldAttemptReset()) {
        const error = new Error(`Circuit breaker is OPEN. Service unavailable for ${context}.`);
        this.recordAttempt(false, error.message, 0);
        throw error;
      }
      // Transition to HALF_OPEN to test service
      this.circuitState = CircuitState.HALF_OPEN;
      devLog.debug('🔄 Circuit breaker: Transitioning to HALF_OPEN state');
    }

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        // Success - update circuit breaker
        this.recordSuccess(duration);
        this.recordAttempt(true, undefined, attempt);

        if (this.circuitState === CircuitState.HALF_OPEN) {
          this.circuitState = CircuitState.CLOSED;
          devLog.debug('✅ Circuit breaker: Service recovered, state is now CLOSED');
        }

        // Track successful retry if this wasn't the first attempt
        if (attempt > 0) {
          analyticsService.track('ai_request_retry_success', {
            context,
            attempts: attempt + 1,
            duration,
          });
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        const _duration = Date.now();

        // Record failure
        this.recordFailure(lastError.message);
        this.recordAttempt(false, lastError.message, attempt);

        // Check if we should break the circuit
        if (this.shouldOpenCircuit()) {
          this.circuitState = CircuitState.OPEN;
          console.warn('⚠️ Circuit breaker: Opening circuit due to repeated failures');

          analyticsService.track('ai_circuit_breaker_opened', {
            context,
            failureCount: this.stats.failureCount,
            lastError: lastError.message,
          });
        }

        // Don't retry if this was the last attempt
        if (attempt >= this.retryConfig.maxRetries) {
          break;
        }

        // Don't retry certain error types
        if (!this.isRetryableError(lastError)) {
          devLog.debug(`Non-retryable error for ${context}:`, lastError.message);
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        devLog.debug(`Retry attempt ${attempt + 1} for ${context} in ${delay}ms`);

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    analyticsService.track('ai_request_retry_exhausted', {
      context,
      attempts: this.retryConfig.maxRetries + 1,
      lastError: lastError.message,
    });

    throw new Error(
      `Request failed after ${this.retryConfig.maxRetries + 1} attempts. Last error: ${lastError.message}`,
    );
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): CircuitBreakerStats & {
    config: RetryConfig & CircuitBreakerConfig;
    isHealthy: boolean;
    nextResetTime?: number;
  } {
    const isHealthy =
      this.circuitState === CircuitState.CLOSED ||
      (this.circuitState === CircuitState.HALF_OPEN && this.stats.recentAttempts.length === 0);

    const result: CircuitBreakerStats & {
      config: RetryConfig & CircuitBreakerConfig;
      isHealthy: boolean;
      nextResetTime?: number;
    } = {
      ...this.stats,
      config: { ...this.retryConfig, ...this.circuitConfig },
      isHealthy,
    };

    if (this.circuitState === CircuitState.OPEN) {
      result.nextResetTime = this.stats.lastFailureTime + this.circuitConfig.resetTimeoutMs;
    }

    return result;
  }

  /**
   * Manually reset the circuit breaker
   */
  resetCircuit(): void {
    this.circuitState = CircuitState.CLOSED;
    this.stats.failureCount = 0;
    devLog.debug('🔄 Circuit breaker manually reset to CLOSED state');

    analyticsService.track('ai_circuit_breaker_manual_reset', {
      previousFailureCount: this.stats.failureCount,
      state: 'closed',
    });
  }

  /**
   * Update configuration
   */
  updateConfig(
    retryConfig?: Partial<RetryConfig>,
    circuitConfig?: Partial<CircuitBreakerConfig>,
  ): void {
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
    if (circuitConfig) {
      this.circuitConfig = { ...this.circuitConfig, ...circuitConfig };
    }
  }

  /**
   * Get recent failure patterns for analysis
   */
  getFailureAnalysis(): {
    recentFailureRate: number;
    commonErrors: Array<{ error: string; count: number }>;
    averageResponseTime: number;
  } {
    const recentAttempts = this.getRecentAttempts();
    const failures = recentAttempts.filter((a) => !a.success);
    const recentFailureRate =
      recentAttempts.length > 0 ? failures.length / recentAttempts.length : 0;

    // Group errors by message
    const errorCounts = failures.reduce(
      (acc, attempt) => {
        if (attempt.error) {
          acc[attempt.error] = (acc[attempt.error] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average response time (mock calculation for now)
    const averageResponseTime =
      recentAttempts.length > 0
        ? recentAttempts.reduce((sum, a) => sum + (1000 + a.retryCount * 500), 0) /
          recentAttempts.length
        : 0;

    return {
      recentFailureRate,
      commonErrors,
      averageResponseTime,
    };
  }

  // Private methods

  private initializeStats(): CircuitBreakerStats {
    return {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      totalRequests: 0,
      recentAttempts: [],
    };
  }

  private recordSuccess(duration: number): void {
    this.stats.successCount++;
    this.stats.lastSuccessTime = Date.now();
    this.stats.totalRequests++;

    // Reset failure count on success
    if (this.circuitState !== CircuitState.OPEN) {
      this.stats.failureCount = 0;
    }
  }

  private recordFailure(error: string): void {
    this.stats.failureCount++;
    this.stats.lastFailureTime = Date.now();
    this.stats.totalRequests++;
  }

  private recordAttempt(success: boolean, error?: string, retryCount: number = 0): void {
    const attempt: RequestAttempt = {
      timestamp: Date.now(),
      success,
      error,
      retryCount,
    };

    this.stats.recentAttempts.push(attempt);

    // Keep only recent attempts within monitoring window
    const cutoffTime = Date.now() - this.circuitConfig.monitoringWindowMs;
    this.stats.recentAttempts = this.stats.recentAttempts.filter((a) => a.timestamp > cutoffTime);
  }

  private shouldOpenCircuit(): boolean {
    if (this.circuitState === CircuitState.OPEN) return false;

    const recentFailures = this.getRecentAttempts().filter((a) => !a.success);
    return recentFailures.length >= this.circuitConfig.failureThreshold;
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.stats.lastFailureTime >= this.circuitConfig.resetTimeoutMs;
  }

  private getRecentAttempts(): RequestAttempt[] {
    const cutoffTime = Date.now() - this.circuitConfig.monitoringWindowMs;
    return this.stats.recentAttempts.filter((a) => a.timestamp > cutoffTime);
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay =
      this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt);

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.retryConfig.jitterFactor * (Math.random() - 0.5);

    const delayWithJitter = exponentialDelay + jitter;

    return Math.min(delayWithJitter, this.retryConfig.maxDelayMs);
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Don't retry authentication errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return false;
    }

    // Don't retry invalid request errors
    if (message.includes('invalid') || message.includes('bad request')) {
      return false;
    }

    // Retry network errors, timeouts, and server errors
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('service unavailable') ||
      message.includes('internal server error') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const aiRetryService = new AIRetryService();

// Create specialized instance for different use cases
export const createAIRetryService = (
  retryConfig?: Partial<RetryConfig>,
  circuitConfig?: Partial<CircuitBreakerConfig>,
): AIRetryService => {
  return new AIRetryService(retryConfig, circuitConfig);
};

export default aiRetryService;
