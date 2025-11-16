/**
 * Dead Letter Queue Panel Integration Tests
 *
 * Tests the UI component that displays and manages permanently failed sync operations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ErrorCategory, type DeadLetter } from '@/sync/errorRecovery';
import { syncQueue } from '@/sync/syncQueue';

import { DeadLetterQueuePanel } from '../DeadLetterQueuePanel';

// Mock syncQueue
vi.mock('@/sync/syncQueue', () => ({
  syncQueue: {
    getDeadLetters: vi.fn(),
    retryDeadLetter: vi.fn(),
    clearDeadLetters: vi.fn(),
  },
}));

describe('DeadLetterQueuePanel', () => {
  const mockDeadLetter: DeadLetter = {
    operation: {
      id: 'op-1',
      table: 'chapters',
      recordId: 'chapter-1',
      projectId: 'project-1',
      action: 'upsert',
      payload: { title: 'Test Chapter' },
      status: 'failed',
      attempts: 5,
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 5000,
    },
    finalError: {
      category: ErrorCategory.AUTHENTICATION,
      isRetryable: false,
      originalError: new Error('Authentication failed'),
    },
    attemptHistory: [
      {
        attempt: 1,
        error: 'First attempt failed',
        category: ErrorCategory.NETWORK,
        delay: 1000,
        timestamp: Date.now() - 5000,
      },
      {
        attempt: 2,
        error: 'Second attempt failed',
        category: ErrorCategory.AUTHENTICATION,
        delay: 2000,
        timestamp: Date.now() - 3000,
      },
    ],
    deadAt: Date.now() - 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (syncQueue.getDeadLetters as any).mockReturnValue([]);
  });

  it('renders empty state when no dead letters', () => {
    render(<DeadLetterQueuePanel />);

    expect(screen.getByText(/dead letter queue/i)).toBeInTheDocument();
    expect(screen.getByText(/no permanently failed operations/i)).toBeInTheDocument();
  });

  it('displays dead letters when present', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    expect(screen.getByText('chapters')).toBeInTheDocument();
    expect(screen.getByText('chapter-1')).toBeInTheDocument();
    expect(screen.getByText(/auth/i)).toBeInTheDocument();
  });

  it('shows retry button for each dead letter', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    const retryButtons = screen.getAllByRole('button', { name: /retry/i });
    expect(retryButtons.length).toBeGreaterThan(0);
  });

  it('calls retryDeadLetter when retry button clicked', async () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);
    (syncQueue.retryDeadLetter as any).mockResolvedValue(true);

    render(<DeadLetterQueuePanel />);

    const retryButton = screen.getAllByRole('button', { name: /retry/i })[0];
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(syncQueue.retryDeadLetter).toHaveBeenCalledWith('op-1');
    });
  });

  it('expands attempt history when clicked', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    const expandButton = screen.getByText(/view 2 attempts/i);
    fireEvent.click(expandButton);

    expect(screen.getByText(/First attempt failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Second attempt failed/i)).toBeInTheDocument();
  });

  it('displays retry all button when multiple dead letters', () => {
    const secondDeadLetter: DeadLetter = {
      ...mockDeadLetter,
      operation: { ...mockDeadLetter.operation, id: 'op-2' },
    };

    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter, secondDeadLetter]);

    render(<DeadLetterQueuePanel />);

    expect(screen.getByRole('button', { name: /retry all/i })).toBeInTheDocument();
  });

  it('calls retryDeadLetter for all letters when retry all clicked', async () => {
    const secondDeadLetter: DeadLetter = {
      ...mockDeadLetter,
      operation: { ...mockDeadLetter.operation, id: 'op-2' },
    };

    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter, secondDeadLetter]);
    (syncQueue.retryDeadLetter as any).mockResolvedValue(true);

    render(<DeadLetterQueuePanel />);

    const retryAllButton = screen.getByRole('button', { name: /retry all/i });
    fireEvent.click(retryAllButton);

    await waitFor(() => {
      expect(syncQueue.retryDeadLetter).toHaveBeenCalledWith('op-1');
      expect(syncQueue.retryDeadLetter).toHaveBeenCalledWith('op-2');
    });
  });

  it('shows clear all button', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('calls clearDeadLetters with confirmation when clear all clicked', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DeadLetterQueuePanel />);

    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(syncQueue.clearDeadLetters).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not clear when confirmation cancelled', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<DeadLetterQueuePanel />);

    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(syncQueue.clearDeadLetters).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays error category badges', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    // Should show authentication category
    expect(screen.getByText(/auth/i)).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    render(<DeadLetterQueuePanel />);

    // Should display "Failed X ago"
    expect(screen.getByText(/failed.*ago/i)).toBeInTheDocument();
  });

  it('updates automatically via interval', async () => {
    vi.useFakeTimers();

    (syncQueue.getDeadLetters as any).mockReturnValue([]);

    render(<DeadLetterQueuePanel />);

    expect(screen.getByText(/no permanently failed operations/i)).toBeInTheDocument();

    // Update mock to return dead letter
    (syncQueue.getDeadLetters as any).mockReturnValue([mockDeadLetter]);

    // Fast-forward 30 seconds (refresh interval)
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(screen.getByText('chapters')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('shows refresh button', () => {
    render(<DeadLetterQueuePanel />);

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('reloads data when refresh button clicked', () => {
    (syncQueue.getDeadLetters as any).mockReturnValue([]);

    render(<DeadLetterQueuePanel />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });

    (syncQueue.getDeadLetters as any).mockClear();

    fireEvent.click(refreshButton);

    expect(syncQueue.getDeadLetters).toHaveBeenCalled();
  });
});
