/**
 * Sync Status Dashboard Integration Tests
 *
 * Tests the real-time monitoring dashboard for sync system health
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CircuitState, ErrorCategory } from '@/sync/errorRecovery';
import { syncQueue } from '@/sync/syncQueue';

import { SyncStatusDashboard } from '../SyncStatusDashboard';

// Mock syncQueue
vi.mock('@/sync/syncQueue', () => ({
  syncQueue: {
    getHealth: vi.fn(),
    resetCircuitBreaker: vi.fn(),
    resetErrorRecovery: vi.fn(),
  },
}));

describe('SyncStatusDashboard', () => {
  const mockHealthData = {
    circuitBreaker: {
      state: CircuitState.CLOSED,
      isHealthy: true,
    },
    retryBudget: {
      retries: 5,
      limit: 100,
      percentUsed: 5,
      windowMs: 60000,
      windowResetIn: 45000,
    },
    deadLetters: {
      count: 0,
      items: [],
    },
    queue: {
      total: 10,
      pending: 3,
      syncing: 2,
      success: 5,
      failed: 0,
      oldestPendingAt: Date.now() - 5000,
    },
    metrics: {
      totalOperations: 100,
      successfulOperations: 95,
      failedOperations: 5,
      retriedOperations: 10,
      errorsByCategory: {
        [ErrorCategory.NETWORK]: 2,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.RATE_LIMIT]: 1,
        [ErrorCategory.CLIENT_ERROR]: 0,
        [ErrorCategory.SERVER_ERROR]: 2,
        [ErrorCategory.CONFLICT]: 0,
        [ErrorCategory.UNKNOWN]: 0,
      },
      averageRetryCount: 1.5,
      averageRetryDelay: 2500,
      circuitBreakerTrips: 0,
      retryBudgetExhaustion: 0,
      deadLetterCount: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (syncQueue.getHealth as any).mockReturnValue(mockHealthData);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('renders dashboard header', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/sync status dashboard/i)).toBeInTheDocument();
  });

  it('displays online status', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });

  it('displays offline status when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<SyncStatusDashboard />);

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('displays circuit breaker state', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/circuit breaker/i)).toBeInTheDocument();
    expect(screen.getByText(/CLOSED/i)).toBeInTheDocument();
    expect(screen.getByText(/operating normally/i)).toBeInTheDocument();
  });

  it('shows circuit breaker in OPEN state', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.OPEN,
        isHealthy: false,
      },
    });

    render(<SyncStatusDashboard />);

    expect(screen.getByText(/OPEN/i)).toBeInTheDocument();
    expect(screen.getByText(/sync paused/i)).toBeInTheDocument();
  });

  it('shows circuit breaker in HALF_OPEN state', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.HALF_OPEN,
        isHealthy: false,
      },
    });

    render(<SyncStatusDashboard />);

    expect(screen.getByText(/HALF_OPEN/i)).toBeInTheDocument();
  });

  it('displays retry budget usage', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/retry budget/i)).toBeInTheDocument();
    expect(screen.getByText(/5.*\/.*100/)).toBeInTheDocument();
  });

  it('displays retry budget progress bar', () => {
    render(<SyncStatusDashboard />);

    // Progress bar should be 5% wide
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '5%' });
  });

  it('displays dead letters count', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/dead letters/i)).toBeInTheDocument();
    expect(screen.getByText(/no failed operations/i)).toBeInTheDocument();
  });

  it('displays dead letters count when present', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      deadLetters: {
        count: 3,
        items: [],
      },
    });

    render(<SyncStatusDashboard />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/3 permanent failures/i)).toBeInTheDocument();
  });

  it('displays queue statistics', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/queue statistics/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // total
    expect(screen.getByText('3')).toBeInTheDocument(); // pending
    expect(screen.getByText('2')).toBeInTheDocument(); // syncing
    expect(screen.getByText('5')).toBeInTheDocument(); // success
  });

  it('displays error breakdown', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/error breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/total operations/i)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays errors by category', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/network/i)).toBeInTheDocument();
    expect(screen.getByText(/rate_limit/i)).toBeInTheDocument();
  });

  it('displays performance metrics', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/avg retry count/i)).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument(); // averageRetryCount

    expect(screen.getByText(/avg retry delay/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.50s/i)).toBeInTheDocument(); // 2500ms = 2.50s
  });

  it('shows reset button when circuit breaker is OPEN', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.OPEN,
        isHealthy: false,
      },
    });

    render(<SyncStatusDashboard />);

    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls resetCircuitBreaker when reset button clicked', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.OPEN,
        isHealthy: false,
      },
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SyncStatusDashboard />);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(syncQueue.resetCircuitBreaker).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('shows reset all systems button', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByRole('button', { name: /reset all systems/i })).toBeInTheDocument();
  });

  it('calls resetErrorRecovery when reset all clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SyncStatusDashboard />);

    const resetAllButton = screen.getByRole('button', { name: /reset all systems/i });
    fireEvent.click(resetAllButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(syncQueue.resetErrorRecovery).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('shows refresh button', () => {
    render(<SyncStatusDashboard />);

    // Refresh button is icon-only
    const refreshButtons = screen.getAllByRole('button');
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  it('updates automatically via interval', async () => {
    vi.useFakeTimers();

    let callCount = 0;
    (syncQueue.getHealth as any).mockImplementation(() => {
      callCount++;
      return mockHealthData;
    });

    render(<SyncStatusDashboard />);

    expect(callCount).toBe(1); // Initial load

    // Fast-forward 5 seconds (refresh interval)
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(callCount).toBe(2); // Auto-refresh
    });

    vi.useRealTimers();
  });

  it('listens for online/offline events', () => {
    render(<SyncStatusDashboard />);

    expect(screen.getByText(/online/i)).toBeInTheDocument();

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    fireEvent(window, new Event('offline'));

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    (syncQueue.getHealth as any).mockReturnValue(null);

    render(<SyncStatusDashboard />);

    expect(screen.getByText(/loading sync status/i)).toBeInTheDocument();
  });

  it('formats window reset countdown', () => {
    render(<SyncStatusDashboard />);

    // Should display "Resets in Xs"
    expect(screen.getByText(/resets in.*s/i)).toBeInTheDocument();
  });

  it('uses green color for healthy circuit breaker', () => {
    render(<SyncStatusDashboard />);

    const circuitBreakerCard = screen.getByText(/circuit breaker/i).closest('div');
    expect(circuitBreakerCard).toHaveClass('bg-green-50');
  });

  it('uses red color for open circuit breaker', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.OPEN,
        isHealthy: false,
      },
    });

    render(<SyncStatusDashboard />);

    const circuitBreakerCard = screen.getByText(/circuit breaker/i).closest('div');
    expect(circuitBreakerCard).toHaveClass('bg-red-50');
  });

  it('uses yellow color for half-open circuit breaker', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      circuitBreaker: {
        state: CircuitState.HALF_OPEN,
        isHealthy: false,
      },
    });

    render(<SyncStatusDashboard />);

    const circuitBreakerCard = screen.getByText(/circuit breaker/i).closest('div');
    expect(circuitBreakerCard).toHaveClass('bg-yellow-50');
  });

  it('uses green color for low retry budget usage', () => {
    render(<SyncStatusDashboard />);

    // 5% usage should be green
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('uses yellow color for medium retry budget usage', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      retryBudget: {
        ...mockHealthData.retryBudget,
        retries: 75,
        percentUsed: 75,
      },
    });

    render(<SyncStatusDashboard />);

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveClass('bg-yellow-500');
  });

  it('uses red color for high retry budget usage', () => {
    (syncQueue.getHealth as any).mockReturnValue({
      ...mockHealthData,
      retryBudget: {
        ...mockHealthData.retryBudget,
        retries: 95,
        percentUsed: 95,
      },
    });

    render(<SyncStatusDashboard />);

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveClass('bg-red-500');
  });
});
