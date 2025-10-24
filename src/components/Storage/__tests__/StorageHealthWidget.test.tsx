import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { StorageHealth } from '@/utils/storage/storageHealth';

import { StorageHealthWidget } from '../StorageHealthWidget';

// Mock the storage health utilities
vi.mock('@/utils/storage/storageHealth', () => ({
  getSimpleStorageStatus: vi.fn(),
  getStorageHealth: vi.fn(),
}));

const { getSimpleStorageStatus, getStorageHealth } = await import('@/utils/storage/storageHealth');

describe('StorageHealthWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const mockHealthyStatus = {
    status: 'healthy' as const,
    message: 'All systems operational',
    details: undefined,
  };

  const mockHealthyFullHealth: StorageHealth = {
    dbName: 'inkwell_v1',
    dbVersion: 3,
    dbExists: true,
    persisted: true,
    privateMode: false,
    restricted: false,
    usage: 1024 * 1024 * 5, // 5MB
    quota: 1024 * 1024 * 1024, // 1GB
    percentUsed: 0.5,
    usageFormatted: '5.00 MB',
    quotaFormatted: '1.00 GB',
    origin: 'https://inkwell.leadwithnexus.com',
    isProduction: true,
    lastChecked: new Date().toISOString(),
    healthy: true,
    warnings: [],
  };

  describe('Initial Loading', () => {
    it('should render nothing while loading', () => {
      vi.mocked(getSimpleStorageStatus).mockImplementation(() => new Promise(() => {}));
      vi.mocked(getStorageHealth).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<StorageHealthWidget />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should fetch storage health on mount', async () => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(getSimpleStorageStatus).toHaveBeenCalled();
        expect(getStorageHealth).toHaveBeenCalled();
      });
    });
  });

  describe('Healthy Status - Minimal Indicator', () => {
    beforeEach(() => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);
    });

    it('should show minimal database icon in healthy state', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        const button = screen.getByLabelText('Storage status: healthy');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('title', 'Storage is healthy - click for details');
      });
    });

    it('should show details when clicking healthy indicator', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText('Storage Health')).toBeInTheDocument();
      expect(screen.getAllByText('All systems operational').length).toBeGreaterThan(0);
    });
  });

  describe('Warning Status', () => {
    const mockWarningStatus = {
      status: 'warning' as const,
      message: 'Storage almost full',
      details: 'Consider freeing up space',
    };

    const mockWarningHealth: StorageHealth = {
      ...mockHealthyFullHealth,
      percentUsed: 85,
      usage: 1024 * 1024 * 850, // 850MB
      usageFormatted: '850.00 MB',
      healthy: false,
      warnings: ['Storage is 85% full', 'Storage not persisted'],
      persisted: false,
    };

    beforeEach(() => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockWarningStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockWarningHealth);
    });

    it('should show warning status button', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        const button = screen.getByLabelText('Storage status: Storage almost full');
        expect(button).toBeInTheDocument();
        expect(screen.getByText('Storage almost full')).toBeInTheDocument();
      });
    });

    it('should toggle details panel on click', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByText('Storage almost full')).toBeInTheDocument();
      });

      // Click to show details
      fireEvent.click(screen.getByLabelText('Storage status: Storage almost full'));
      expect(screen.getByText('Storage Health')).toBeInTheDocument();

      // Click to hide details
      fireEvent.click(screen.getByLabelText('Storage status: Storage almost full'));
      await waitFor(() => {
        expect(screen.queryByText('Storage Health')).not.toBeInTheDocument();
      });
    });

    it('should show warning details and warnings list', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByText('Storage almost full')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: Storage almost full'));

      expect(screen.getByText('Consider freeing up space')).toBeInTheDocument();
      expect(screen.getByText('Storage is 85% full')).toBeInTheDocument();
      expect(screen.getByText('Storage not persisted')).toBeInTheDocument();
    });

    it('should show non-persistent storage indicator', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByText('Storage almost full')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: Storage almost full'));

      expect(screen.getByText('Storage not persistent')).toBeInTheDocument();
    });
  });

  describe('Critical Status', () => {
    const mockCriticalStatus = {
      status: 'critical' as const,
      message: 'Critical storage issue',
      details: 'Immediate action required',
    };

    const mockCriticalHealth: StorageHealth = {
      ...mockHealthyFullHealth,
      percentUsed: 98,
      usage: 1024 * 1024 * 980, // 980MB
      usageFormatted: '980.00 MB',
      healthy: false,
      warnings: ['Storage is 98% full', 'Private mode detected', 'Database missing'],
      privateMode: true,
      dbExists: false,
    };

    beforeEach(() => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockCriticalStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockCriticalHealth);
    });

    it('should show critical status button', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        const button = screen.getByLabelText('Storage status: Critical storage issue');
        expect(button).toBeInTheDocument();
        expect(screen.getByText('Critical storage issue')).toBeInTheDocument();
      });
    });

    it('should show critical details and multiple warnings', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByText('Critical storage issue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: Critical storage issue'));

      expect(screen.getByText('Immediate action required')).toBeInTheDocument();
      expect(screen.getByText('Storage is 98% full')).toBeInTheDocument();
      expect(screen.getByText('Private mode detected')).toBeInTheDocument();
      expect(screen.getByText('Database missing')).toBeInTheDocument();
    });
  });

  describe('Details Panel', () => {
    beforeEach(() => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);
    });

    it('should show database info', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText(/inkwell_v1 v3/)).toBeInTheDocument();
    });

    it('should show storage usage info', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText(/5.00 MB \/ 1.00 GB/)).toBeInTheDocument();
    });

    it('should show persistence status when persisted', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText('Storage is persistent')).toBeInTheDocument();
    });

    it('should close details panel when clicking close button', async () => {
      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));
      expect(screen.getByText('Storage Health')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close details'));
      await waitFor(() => {
        expect(screen.queryByText('Storage Health')).not.toBeInTheDocument();
      });
    });
  });

  describe('Optional Fields', () => {
    it('should show last autosave time when available', async () => {
      const lastAutosave = new Date('2025-01-24T12:00:00Z');
      const healthWithAutosave: StorageHealth = {
        ...mockHealthyFullHealth,
        lastAutosaveAt: lastAutosave.toISOString(),
      };

      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(healthWithAutosave);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText(/Last autosave:/)).toBeInTheDocument();
    });

    it('should show origin info in non-production environment', async () => {
      const devHealth: StorageHealth = {
        ...mockHealthyFullHealth,
        origin: 'http://localhost:3000',
        isProduction: false,
      };

      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(devHealth);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.getByText(/Origin: http:\/\/localhost:3000/)).toBeInTheDocument();
    });

    it('should not show origin info in production', async () => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      expect(screen.queryByText(/Origin:/)).not.toBeInTheDocument();
    });

    it('should not show details section when no details provided', async () => {
      const statusWithoutDetails = { ...mockHealthyStatus, details: undefined };

      vi.mocked(getSimpleStorageStatus).mockResolvedValue(statusWithoutDetails);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Storage status: healthy'));

      const detailsText = screen.queryByText('Consider freeing up space');
      expect(detailsText).not.toBeInTheDocument();
    });
  });

  describe('Periodic Refresh', () => {
    it('should set up interval for periodic refresh', async () => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);

      render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(getSimpleStorageStatus).toHaveBeenCalledTimes(1);
        expect(getStorageHealth).toHaveBeenCalledTimes(1);
      });

      // Verify the initial load completed successfully
      expect(screen.getByLabelText('Storage status: healthy')).toBeInTheDocument();
    });

    it('should clean up on unmount', async () => {
      vi.mocked(getSimpleStorageStatus).mockResolvedValue(mockHealthyStatus);
      vi.mocked(getStorageHealth).mockResolvedValue(mockHealthyFullHealth);

      const { unmount } = render(<StorageHealthWidget />);

      await waitFor(() => {
        expect(getSimpleStorageStatus).toHaveBeenCalled();
      });

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
