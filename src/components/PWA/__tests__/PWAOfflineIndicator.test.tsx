import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { pwaService } from '../../../services/pwaService';
import { PWAOfflineIndicator } from '../PWAOfflineIndicator';

// Mock data
let mockIsOffline = false;
const mockListeners: ((offline: boolean) => void)[] = [];
let mockStorageInfo = {
  quota: 100000000, // 100 MB
  usage: 25000000, // 25 MB
  percentUsed: 25,
};
let mockSyncQueue: any[] = [];

// Helper functions to update mock state
const setOffline = (offline: boolean) => {
  mockIsOffline = offline;
  mockListeners.forEach((listener) => listener(offline));
};

const setStorageInfo = (info: typeof mockStorageInfo) => {
  mockStorageInfo = { ...info };
};

const setSyncQueue = (queue: any[]) => {
  mockSyncQueue = [...queue];
};

// Mock the pwaService and OfflineStorageManager
vi.mock('../../../services/pwaService', () => {
  return {
    pwaService: {
      onOfflineStatusChange: vi.fn((callback) => {
        mockListeners.push(callback);
        // Call with initial state
        callback(mockIsOffline);
        // Return unsubscribe function
        return () => {
          const index = mockListeners.indexOf(callback);
          if (index !== -1) {
            mockListeners.splice(index, 1);
          }
        };
      }),
      getOfflineStatus: () => mockIsOffline,
      // Function to trigger offline status change for testing
      simulateOfflineChange: (offline: boolean) => {
        setOffline(offline);
      },
    },
    OfflineStorageManager: {
      getSyncQueue: vi.fn(() => [...mockSyncQueue]),
      getStorageInfo: vi.fn(() => Promise.resolve({ ...mockStorageInfo })),
    },
  };
});

describe('PWAOfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOffline = false;
    mockSyncQueue = [];
    mockStorageInfo = {
      quota: 100000000, // 100 MB
      usage: 25000000, // 25 MB
      percentUsed: 25,
    };

    // Reset listeners array
    mockListeners.length = 0;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering variants', () => {
    it('renders minimal variant correctly in online state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator />);
      });

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders minimal variant correctly in offline state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator />);
        setOffline(true);
      });

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders detailed variant correctly in online state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
        expect(screen.getByText('All changes saved and synced')).toBeInTheDocument();
        expect(screen.getByText('Storage Used:')).toBeInTheDocument();
      });

      // Check that storage info is shown - using a regex to allow for formatting differences
      const storageInfoElement = screen.getByText(
        /(\d+(\.\d+)?\s*[KMGB]+\s*\/\s*\d+(\.\d+)?\s*[KMGB]+)|(\d+\s*[KMGB]+\s*\/\s*\d+\s*[KMGB]+)/i,
      );
      expect(storageInfoElement).toBeInTheDocument();
    });

    it('renders detailed variant correctly in offline state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
        setOffline(true);
      });

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
        expect(
          screen.getByText('Working offline - changes will sync when online'),
        ).toBeInTheDocument();
        expect(screen.getByText('Storage Used:')).toBeInTheDocument();
      });

      // Check that storage info is shown - using a regex to allow for formatting differences
      const storageInfoElement = screen.getByText(
        /(\d+(\.\d+)?\s*[KMGB]+\s*\/\s*\d+(\.\d+)?\s*[KMGB]+)|(\d+\s*[KMGB]+\s*\/\s*\d+\s*[KMGB]+)/i,
      );
      expect(storageInfoElement).toBeInTheDocument();
    });

    it('renders badge variant correctly in online state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator variant="badge" />);
      });

      // Badge variant doesn't have a role attribute, check for text and element classes instead
      const onlineText = screen.getByText('Online');
      expect(onlineText).toBeInTheDocument();
      expect(onlineText.closest('div')).toHaveClass('bg-green-100');
    });

    it('renders badge variant correctly in offline state', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator variant="badge" />);
        setOffline(true);
      });

      // Badge variant doesn't have a role attribute, check for text and element classes instead
      const offlineText = screen.getByText('Offline');
      expect(offlineText).toBeInTheDocument();
      expect(offlineText.closest('div')).toHaveClass('bg-orange-100');
    });
  });

  describe('Sync queue status', () => {
    it('shows sync queue count when items are pending in minimal variant', async () => {
      setSyncQueue([
        { id: '1', operation: 'save', key: 'item1' },
        { id: '2', operation: 'update', key: 'item2' },
      ]);

      await act(async () => {
        render(<PWAOfflineIndicator />);
        setOffline(true);
      });

      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });

    it('shows sync queue count when items are pending in badge variant', async () => {
      setSyncQueue([{ id: '1', operation: 'save', key: 'item1' }]);

      await act(async () => {
        render(<PWAOfflineIndicator variant="badge" />);
        setOffline(true);
      });

      // Find the badge with count
      const countElement = screen.getByText('1');
      expect(countElement).toBeInTheDocument();
      expect(countElement.closest('span')).toHaveClass('bg-orange-200');
    });

    it('shows detailed sync queue message in detailed variant', async () => {
      setSyncQueue([
        { id: '1', operation: 'save', key: 'item1' },
        { id: '2', operation: 'update', key: 'item2' },
        { id: '3', operation: 'delete', key: 'item3' },
      ]);

      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
        setOffline(true);
      });

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('3 changes queued for sync')).toBeInTheDocument();
      });
    });

    it('hides sync status when showSyncStatus is false', async () => {
      setSyncQueue([
        { id: '1', operation: 'save', key: 'item1' },
        { id: '2', operation: 'update', key: 'item2' },
      ]);

      await act(async () => {
        render(<PWAOfflineIndicator showSyncStatus={false} />);
        setOffline(true);
      });

      expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/queued for sync/i)).not.toBeInTheDocument();
    });
  });

  describe('Storage information', () => {
    it('shows storage information in detailed variant', async () => {
      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('Storage Used:')).toBeInTheDocument();
      });

      // Check that storage info is shown - using a regex to allow for formatting differences
      const storageInfoElement = screen.getByText(
        /(\d+(\.\d+)?\s*[KMGB]+\s*\/\s*\d+(\.\d+)?\s*[KMGB]+)|(\d+\s*[KMGB]+\s*\/\s*\d+\s*[KMGB]+)/i,
      );
      expect(storageInfoElement).toBeInTheDocument();
    });

    it('shows yellow progress bar when storage is between 60-80%', async () => {
      setStorageInfo({
        quota: 100000000, // 100 MB
        usage: 70000000, // 70 MB
        percentUsed: 70,
      });

      const { container } = render(<PWAOfflineIndicator variant="detailed" />);

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('Storage Used:')).toBeInTheDocument();
      });

      // Find the progress bar with yellow background
      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('h-1.5', 'rounded-full');
    });

    it('shows warning when storage is nearly full', async () => {
      setStorageInfo({
        quota: 100000000, // 100 MB
        usage: 95000000, // 95 MB
        percentUsed: 95,
      });

      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Wait for the storage info to be set
      await waitFor(() => {
        expect(screen.getByText('Storage almost full')).toBeInTheDocument();
      });
    });

    it('handles zero quota gracefully', async () => {
      // Set quota to zero, which should hide the storage info section
      setStorageInfo({
        quota: 0,
        usage: 0,
        percentUsed: 0,
      });

      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Storage info should not be displayed
      await waitFor(() => {
        expect(screen.queryByText('Storage Used:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cleanup and event handling', () => {
    it('unsubscribes from offline status changes on unmount', async () => {
      // Setup spy for the unsubscribe function
      const unsubscribeSpy = vi.fn();
      vi.spyOn(pwaService, 'onOfflineStatusChange').mockReturnValue(unsubscribeSpy);

      const { unmount } = render(<PWAOfflineIndicator />);

      // Unmount the component
      unmount();

      // Check that the unsubscribe function was called
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it('clears intervals on unmount', async () => {
      // Mock setInterval and clearInterval
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;
      const mockClearInterval = vi.fn();

      global.setInterval = vi.fn(() => 123) as any;
      global.clearInterval = mockClearInterval as any;

      const { unmount } = render(<PWAOfflineIndicator variant="detailed" />);

      // Unmount the component
      unmount();

      // Check clearInterval was called
      expect(mockClearInterval).toHaveBeenCalled();

      // Restore original functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });
  });

  describe('Format bytes utility function', () => {
    it('formats bytes correctly for different sizes', async () => {
      // This test verifies the formatBytes function indirectly through the component rendering
      setStorageInfo({
        quota: 1024,
        usage: 512,
        percentUsed: 50,
      });

      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Wait for the storage info to be set and check with regex
      await waitFor(() => {
        const storageTextPattern = /512\s*B\s*\/\s*1(\.\d+)?\s*KB/i;
        const storageElements = screen.getAllByText(storageTextPattern);
        expect(storageElements.length).toBeGreaterThan(0);
      });
    });

    it('handles zero bytes correctly', async () => {
      setStorageInfo({
        quota: 1024 * 1024,
        usage: 0,
        percentUsed: 0,
      });

      await act(async () => {
        render(<PWAOfflineIndicator variant="detailed" />);
      });

      // Wait for the storage info to be set and check with regex
      await waitFor(() => {
        const storageTextPattern = /0\s*B\s*\/\s*1(\.\d+)?\s*MB/i;
        const storageElements = screen.getAllByText(storageTextPattern);
        expect(storageElements.length).toBeGreaterThan(0);
      });
    });
  });
});
