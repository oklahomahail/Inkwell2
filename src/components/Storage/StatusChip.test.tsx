import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import StatusChip from './StatusChip';

// Mock the useStorageHealth hook
vi.mock('@/hooks/useStorageHealth');

import { useStorageHealth } from '@/hooks/useStorageHealth';

describe('StatusChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state when report is null', () => {
      vi.mocked(useStorageHealth).mockReturnValue(null);

      render(<StatusChip />);

      expect(screen.getByText('Checking storage…')).toBeInTheDocument();
      expect(screen.getByLabelText('Storage status loading')).toBeInTheDocument();
    });

    it('calls onClick when clicked during loading', () => {
      const onClick = vi.fn();
      vi.mocked(useStorageHealth).mockReturnValue(null);

      render(<StatusChip onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Healthy State', () => {
    it('shows healthy status when all conditions are good', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Local save active')).toBeInTheDocument();
      expect(screen.getByLabelText('Storage is healthy. Click for details')).toBeInTheDocument();
      expect(screen.getByText(/Persisted/)).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('calls onClick when healthy chip is clicked', () => {
      const onClick = vi.fn();
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Private Mode State', () => {
    it('shows private mode warning with red indicator', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: false,
        privateMode: true,
        percentUsed: 10,
        warnings: ['Running in private/incognito mode'],
        dbExists: true,
        restricted: false,
        usage: 10 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '10 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Private window')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Private window - data will be deleted. Click for details'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Ephemeral/)).toBeInTheDocument();
    });
  });

  describe('Warning States', () => {
    it('shows warning when storage has warnings', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: ['Database connection unstable'],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Storage warning')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Storage warning: Database connection unstable. Click for details'),
      ).toBeInTheDocument();
    });

    it('shows warning when quota is 80% or above', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: true,
        privateMode: false,
        percentUsed: 85,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 85 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '85 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Storage filling up')).toBeInTheDocument();
      expect(screen.getByLabelText('Storage 85% full. Click for details')).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });

    it('shows warning at exactly 80% quota', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: true,
        privateMode: false,
        percentUsed: 80,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 80 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '80 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Storage filling up')).toBeInTheDocument();
      expect(screen.getByText(/80%/)).toBeInTheDocument();
    });

    it('shows not persisted warning when storage is not persistent', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: false,
        privateMode: false,
        percentUsed: 50,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Not persisted')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Storage not persistent - may be cleared. Click for details'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Ephemeral/)).toBeInTheDocument();
    });
  });

  describe('Priority of Warning States', () => {
    it('private mode takes priority over other warnings', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: false,
        privateMode: true,
        percentUsed: 90,
        warnings: ['Multiple warnings'],
        dbExists: true,
        restricted: false,
        usage: 90 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '90 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      // Should show private mode, not storage filling or general warning
      expect(screen.getByText('Private window')).toBeInTheDocument();
    });

    it('warnings array takes priority over quota warning', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: true,
        privateMode: false,
        percentUsed: 85,
        warnings: ['Specific warning message'],
        dbExists: true,
        restricted: false,
        usage: 85 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '85 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      // Should show warnings message, not "Storage filling up"
      expect(screen.getByText('Storage warning')).toBeInTheDocument();
      expect(screen.queryByText('Storage filling up')).not.toBeInTheDocument();
    });

    it('quota warning takes priority over not persisted', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: false,
        persisted: false,
        privateMode: false,
        percentUsed: 85,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 85 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '85 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      // Should show "Storage filling up", not "Not persisted"
      expect(screen.getByText('Storage filling up')).toBeInTheDocument();
      expect(screen.queryByText('Not persisted')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      const { container } = render(<StatusChip className="custom-class" />);

      const button = container.querySelector('.custom-class');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing percentUsed', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: undefined,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Local save active')).toBeInTheDocument();
      // Should not crash and should show "Persisted" with default 0%
      expect(screen.getByText(/Persisted/)).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('handles null percentUsed', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: null as any,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Local save active')).toBeInTheDocument();
    });

    it('handles empty warnings array', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: [],
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Local save active')).toBeInTheDocument();
    });

    it('handles undefined warnings', () => {
      vi.mocked(useStorageHealth).mockReturnValue({
        healthy: true,
        persisted: true,
        privateMode: false,
        percentUsed: 50,
        warnings: undefined as any,
        dbExists: true,
        restricted: false,
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageFormatted: '50 MB',
        quotaFormatted: '100 MB',
      });

      render(<StatusChip />);

      expect(screen.getByText('Local save active')).toBeInTheDocument();
    });
  });
});
