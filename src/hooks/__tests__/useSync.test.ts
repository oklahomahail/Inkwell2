/**
 * useSync Hook Tests
 *
 * Verifies:
 * - Status updates based on connectivity
 * - Queue count tracking
 * - Last sync timestamp
 * - Retry functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSync } from '../useSync';
import { connectivityService } from '@/services/connectivityService';
import type { ConnectivityStatus } from '@/services/connectivityService';

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Calculation', () => {
    it('should return "synced" when online with no queued operations', () => {
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
        connectionType: 'wifi',
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.status).toBe('synced');
      expect(result.current.isOnline).toBe(true);
      expect(result.current.queuedOps).toBe(0);
    });

    it('should return "pending" when online with queued operations', () => {
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 3,
        connectionType: 'wifi',
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.status).toBe('pending');
      expect(result.current.queuedOps).toBe(3);
    });

    it('should return "pending" when offline with queued operations', () => {
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: false,
        lastOnline: new Date(Date.now() - 60000),
        lastOffline: new Date(),
        queuedWrites: 5,
        connectionType: undefined,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.status).toBe('pending');
      expect(result.current.isOnline).toBe(false);
      expect(result.current.queuedOps).toBe(5);
    });

    it('should return "synced" when offline with no queued operations', () => {
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: false,
        lastOnline: new Date(Date.now() - 60000),
        lastOffline: new Date(),
        queuedWrites: 0,
        connectionType: undefined,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.status).toBe('synced');
    });

    it('should return "error" when last offline is recent without successful sync', () => {
      const now = Date.now();
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(now - 10 * 60 * 1000), // 10 min ago
        lastOffline: new Date(now - 2 * 60 * 1000), // 2 min ago (more recent)
        queuedWrites: 0,
        connectionType: 'wifi',
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.status).toBe('error');
    });
  });

  describe('Connectivity Updates', () => {
    it('should subscribe to connectivity changes', async () => {
      const mockSubscribe = vi.spyOn(connectivityService, 'subscribe');

      const initialStatus: ConnectivityStatus = {
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      };

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue(initialStatus);

      const { result, unmount } = renderHook(() => useSync());

      expect(mockSubscribe).toHaveBeenCalled();
      expect(result.current.isOnline).toBe(true);

      unmount();
    });

    it('should update status when connectivity changes', async () => {
      let statusCallback: ((status: ConnectivityStatus) => void) | null = null;

      vi.spyOn(connectivityService, 'subscribe').mockImplementation((callback) => {
        statusCallback = callback;
        return () => {};
      });

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.queuedOps).toBe(0);

      // Simulate connectivity update
      act(() => {
        statusCallback?.({
          isOnline: true,
          lastOnline: new Date(),
          lastOffline: null,
          queuedWrites: 2,
        });
      });

      await waitFor(() => {
        expect(result.current.queuedOps).toBe(2);
        expect(result.current.status).toBe('pending');
      });
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn();
      vi.spyOn(connectivityService, 'subscribe').mockReturnValue(mockUnsubscribe);
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { unmount } = renderHook(() => useSync());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Retry Functionality', () => {
    it('should call processQueue when retry is invoked', async () => {
      const mockProcessQueue = vi.spyOn(connectivityService, 'processQueue').mockResolvedValue();

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.retry();
      });

      expect(mockProcessQueue).toHaveBeenCalled();
    });

    it('should set isRetrying to true during retry', async () => {
      vi.spyOn(connectivityService, 'processQueue').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.isRetrying).toBe(false);

      act(() => {
        result.current.retry();
      });

      expect(result.current.isRetrying).toBe(true);

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });
    });

    it('should handle retry errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(connectivityService, 'processQueue').mockRejectedValue(new Error('Network error'));

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.retry();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to retry sync:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should not retry if already retrying', async () => {
      const mockProcessQueue = vi
        .spyOn(connectivityService, 'processQueue')
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: new Date(),
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      act(() => {
        result.current.retry();
        result.current.retry(); // Call twice
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });

      // Should only be called once
      expect(mockProcessQueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Last Sync Timestamp', () => {
    it('should return lastSync from connectivity status', () => {
      const lastSyncDate = new Date('2025-01-01T12:00:00Z');

      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: lastSyncDate,
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.lastSync).toEqual(lastSyncDate);
    });

    it('should return null if never synced', () => {
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: true,
        lastOnline: null,
        lastOffline: null,
        queuedWrites: 0,
      });

      const { result } = renderHook(() => useSync());

      expect(result.current.lastSync).toBeNull();
    });
  });
});
