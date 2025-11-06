/**
 * StatusBar Component Tests
 *
 * Verifies:
 * - Status dot colors (green/yellow/red)
 * - Tooltip content
 * - Retry button behavior
 * - Visual states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBar from '../StatusBar';
import * as useSyncModule from '@/hooks/useSync';

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Dot Colors', () => {
    it('should show green dot when synced', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      const statusDot = screen.getByTestId('status-dot');

      expect(statusBar).toHaveAttribute('data-status', 'synced');
      expect(statusDot).toHaveClass('bg-green-500');
    });

    it('should show yellow pulsing dot when pending', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'pending',
        isOnline: true,
        queuedOps: 3,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const statusDot = screen.getByTestId('status-dot');

      expect(statusDot).toHaveClass('bg-yellow-500');
      expect(statusDot).toHaveClass('animate-pulse');
    });

    it('should show red dot when error', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const statusDot = screen.getByTestId('status-dot');

      expect(statusDot).toHaveClass('bg-red-500');
    });
  });

  describe('Tooltip Content', () => {
    it('should show "Synced" label and last sync time', () => {
      const lastSync = new Date();
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('Synced');
      expect(tooltip).toHaveTextContent('Just now');
    });

    it('should show queued operations count when pending', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'pending',
        isOnline: true,
        queuedOps: 3,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('Syncing');
      expect(tooltip).toHaveTextContent('3 operations pending');
    });

    it('should show singular operation when count is 1', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'pending',
        isOnline: true,
        queuedOps: 1,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('1 operation pending');
    });

    it('should show failed operations count when error', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('Sync Error');
      expect(tooltip).toHaveTextContent('2 operations failed');
    });
  });

  describe('Retry Button', () => {
    it('should show retry button only on error status', () => {
      // Test synced - no retry button
      const { rerender } = render(<StatusBar />);

      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender(<StatusBar />);
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();

      // Test pending - no retry button
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'pending',
        isOnline: true,
        queuedOps: 3,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender(<StatusBar />);
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();

      // Test error - should show retry button
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender(<StatusBar />);
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should call retry function when clicked', () => {
      const mockRetry = vi.fn();

      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: mockRetry,
        isRetrying: false,
      });

      render(<StatusBar />);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should disable retry button when retrying', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: true,
      });

      render(<StatusBar />);

      const retryButton = screen.getByTestId('retry-button');

      expect(retryButton).toBeDisabled();
    });

    it('should show spinning icon when retrying', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'error',
        isOnline: true,
        queuedOps: 2,
        lastSync: new Date(),
        retry: vi.fn(),
        isRetrying: true,
      });

      render(<StatusBar />);

      const retryIcon = screen.getByTestId('retry-icon');

      expect(retryIcon).toHaveClass('animate-spin');
    });
  });

  describe('Time Formatting', () => {
    it('should show "Never synced" when lastSync is null', () => {
      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('Never synced');
    });

    it('should format recent sync as relative time (minutes)', () => {
      // 30 minutes ago
      const lastSync = new Date(Date.now() - 30 * 60 * 1000);

      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('30m ago');
    });

    it('should format sync as hours ago when less than 24 hours', () => {
      // 5 hours ago
      const lastSync = new Date(Date.now() - 5 * 60 * 60 * 1000);

      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      expect(tooltip).toHaveTextContent('5h ago');
    });

    it('should format sync as date when more than 24 hours ago', () => {
      // 2 days ago
      const lastSync = new Date(Date.now() - 48 * 60 * 60 * 1000);

      vi.spyOn(useSyncModule, 'useSync').mockReturnValue({
        status: 'synced',
        isOnline: true,
        queuedOps: 0,
        lastSync,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<StatusBar />);

      const tooltip = screen.getByTestId('status-tooltip');

      // Should contain month and day (formatted as date)
      // The exact format depends on locale, so we just check it's not showing relative time
      expect(tooltip).not.toHaveTextContent('ago');
      expect(tooltip.textContent).toMatch(/\w+\s+\d+/); // e.g., "Jan 1" or similar
    });
  });
});
