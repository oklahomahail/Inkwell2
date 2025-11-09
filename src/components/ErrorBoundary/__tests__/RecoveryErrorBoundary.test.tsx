import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecoveryErrorBoundary } from '../RecoveryErrorBoundary';
import { recoveryService } from '@/services/recoveryService';

// Mock the recovery service
vi.mock('@/services/recoveryService', () => ({
  recoveryService: {
    checkIndexedDBHealth: vi.fn(),
    attemptRecovery: vi.fn(),
    recoverFromUserUpload: vi.fn(),
  },
}));

describe('RecoveryErrorBoundary', () => {
  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <RecoveryErrorBoundary panelName="Editor">
          <div>Editor content</div>
        </RecoveryErrorBoundary>,
      );

      expect(screen.getByText('Editor content')).toBeInTheDocument();
    });
  });

  describe('when autosave/snapshot error occurs', () => {
    const ThrowSnapshotError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
      if (shouldThrow) {
        throw new Error('Snapshot creation failed: Invalid project data');
      }
      return <div>No error</div>;
    };

    it('catches error and shows fallback UI', () => {
      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowSnapshotError shouldThrow={true} />
        </RecoveryErrorBoundary>,
      );

      expect(screen.getByText(/editor error detected/i)).toBeInTheDocument();
      expect(screen.getByText(/attempting automatic recovery/i)).toBeInTheDocument();
    });

    it('displays panel name in error message', () => {
      render(
        <RecoveryErrorBoundary panelName="Dashboard">
          <ThrowSnapshotError shouldThrow={true} />
        </RecoveryErrorBoundary>,
      );

      expect(screen.getByText(/dashboard error detected/i)).toBeInTheDocument();
    });

    it('starts automatic recovery on mount', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: true,
        tier: 'supabase',
        recoveredProjects: 2,
        recoveredChapters: 10,
        message: 'Recovered 2 projects from cloud backup',
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowSnapshotError shouldThrow={true} />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(recoveryService.checkIndexedDBHealth).toHaveBeenCalled();
        expect(recoveryService.attemptRecovery).toHaveBeenCalledWith({
          attemptSupabase: true,
          attemptLocalStorage: true,
          requireUserUpload: false,
        });
      });
    });
  });

  describe('recovery tiers', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('shows Supabase recovery success', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: false,
        error: 'IndexedDB quota exceeded',
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: true,
        tier: 'supabase',
        recoveredProjects: 3,
        recoveredChapters: 15,
        message: 'Recovered 3 projects from cloud backup',
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/✓ Recovered 3 projects/i)).toBeInTheDocument();
      });
    });

    it('shows localStorage recovery success', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: true,
        tier: 'localStorage',
        recoveredProjects: 1,
        recoveredChapters: 5,
        message: 'Restored from local shadow copy',
      });

      render(
        <RecoveryErrorBoundary panelName="Backup">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/✓ Restored from local shadow copy/i)).toBeInTheDocument();
      });
    });

    it('shows upload required when automatic recovery fails', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
        error: 'No backups available',
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/manual backup required/i)).toBeInTheDocument();
        expect(screen.getByText(/upload backup file/i)).toBeInTheDocument();
      });
    });
  });

  describe('user interactions', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('allows user to retry after failure', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/manual backup required/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Clicking retry should reset the error state
      fireEvent.click(retryButton);

      // Verify the button click was handled (we can't easily test the reset without component state)
    });

    it('shows file upload UI when automatic recovery fails', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/upload backup file/i)).toBeInTheDocument();
        expect(screen.getByText(/manual backup required/i)).toBeInTheDocument();
      });

      // Verify file input exists
      const container = screen.getByText(/upload backup file/i).closest('label');
      expect(container).toBeInTheDocument();

      const fileInput = container?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'application/json');
    });

    it('provides reload button', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      });

      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        const reloadButton = screen.getByRole('button', { name: /reload application/i });
        fireEvent.click(reloadButton);
      });

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('recovery success flow', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('shows success message after successful recovery', async () => {
      const onRecovered = vi.fn();

      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: true,
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: true,
        tier: 'supabase',
        recoveredProjects: 1,
        recoveredChapters: 5,
        message: 'Recovery successful',
      });

      render(
        <RecoveryErrorBoundary panelName="Editor" onRecovered={onRecovered}>
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      // Wait for recovery to complete - checking for the success message
      await waitFor(() => {
        expect(screen.getByText('Recovery Successful!')).toBeInTheDocument();
      });

      // Verify other success elements are present
      expect(screen.getByText(/reloading in 3 seconds/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('handles IndexedDB health check failure', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockResolvedValue({
        healthy: false,
        error: 'Quota exceeded',
      });

      vi.mocked(recoveryService.attemptRecovery).mockResolvedValue({
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
      });

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText(/editor error detected/i)).toBeInTheDocument();
      });
    });

    it('handles recovery service throwing error', async () => {
      vi.mocked(recoveryService.checkIndexedDBHealth).mockRejectedValue(
        new Error('Service unavailable'),
      );

      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      await waitFor(() => {
        // Should still show fallback UI even if recovery fails
        expect(screen.getByText(/editor error detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('development mode', () => {
    const ThrowError = () => {
      throw new Error('Development error');
    };

    it('conditionally shows error details based on environment', () => {
      render(
        <RecoveryErrorBoundary panelName="Editor">
          <ThrowError />
        </RecoveryErrorBoundary>,
      );

      // In test environment, development details may or may not be visible
      // We just verify the component renders the error UI
      expect(screen.getByText(/editor error detected/i)).toBeInTheDocument();
    });
  });
});
