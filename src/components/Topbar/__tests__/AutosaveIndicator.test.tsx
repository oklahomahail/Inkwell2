/**
 * AutosaveIndicator Tests
 *
 * Tests for the autosave status indicator UI component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { AutosaveService } from '@/services/autosaveService';

import AutosaveIndicator from '../AutosaveIndicator';

describe('AutosaveIndicator', () => {
  let mockSaveFn: ReturnType<typeof vi.fn>;
  let service: AutosaveService;
  let originalOnLine: boolean;

  beforeEach(() => {
    // Store original navigator.onLine
    originalOnLine = navigator.onLine;

    // Ensure online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    mockSaveFn = vi.fn().mockResolvedValue({ checksum: 'abc123' });
    service = new AutosaveService(mockSaveFn, 1000);
  });

  afterEach(() => {
    service.destroy();

    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
  });

  it('should not render anything in idle state', () => {
    const { container } = render(<AutosaveIndicator service={service} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render "Saving…" with spinner when saving', async () => {
    // Use slower save to catch saving state
    const slowSave = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ checksum: 'abc' }), 100)),
    );
    const savingService = new AutosaveService(slowSave, 1000);

    render(<AutosaveIndicator service={savingService} />);

    // Trigger saving state
    let savePromise: Promise<unknown>;
    await act(async () => {
      savePromise = savingService.flush('ch1', 'content');
    });

    // Wait for the indicator to appear and show saving state
    await waitFor(async () => {
      const indicator = await screen.findByTestId('autosave-indicator');
      expect(indicator).toHaveTextContent('Saving…');
      expect(indicator).toHaveAttribute('data-state', 'saving');
      expect(indicator.querySelector('.animate-spin')).toBeInTheDocument();
    });

    await act(async () => {
      await savePromise!;
    });
    savingService.destroy();
  });

  it('should render "Saved" with checkmark when saved', async () => {
    render(<AutosaveIndicator service={service} />);

    await act(async () => {
      await service.flush('ch1', 'content');
    });

    // Wait for the saved state to appear
    await waitFor(async () => {
      const indicator = await screen.findByTestId('autosave-indicator');
      expect(indicator).toHaveTextContent('Saved');
      expect(indicator).toHaveAttribute('data-state', 'saved');
    });
  });

  it('should render "Offline (saving locally)" when offline', async () => {
    // Use slower save to catch offline state
    const slowSave = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ checksum: 'abc' }), 100)),
    );
    const offlineService = new AutosaveService(slowSave, 1000);

    render(<AutosaveIndicator service={offlineService} />);

    // Mock offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    let savePromise: Promise<unknown>;
    await act(async () => {
      savePromise = offlineService.flush('ch1', 'content');
    });

    // Wait for the offline state to appear
    await waitFor(async () => {
      const indicator = await screen.findByTestId('autosave-indicator');
      expect(indicator).toHaveTextContent('Offline (saving locally)');
      expect(indicator).toHaveAttribute('data-state', 'offline');
    });

    await act(async () => {
      await savePromise!;
    });
    offlineService.destroy();
  });

  it('should render "Save error" when save fails', async () => {
    render(<AutosaveIndicator service={service} />);

    mockSaveFn.mockRejectedValueOnce(new Error('Save failed'));

    await act(async () => {
      try {
        await service.flush('ch1', 'content');
      } catch {
        // Expected
      }
    });

    // Wait for the error state to appear
    await waitFor(async () => {
      const indicator = await screen.findByTestId('autosave-indicator');
      expect(indicator).toHaveTextContent('Save error');
      expect(indicator).toHaveAttribute('data-state', 'error');
    });
  });

  it('should update when service state changes', async () => {
    // Use a slower mock to catch saving state
    const slowSave = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ checksum: 'abc' }), 100)),
    );
    const slowService = new AutosaveService(slowSave, 1000);

    render(<AutosaveIndicator service={slowService} />);

    // Initially idle (not rendered)
    expect(screen.queryByTestId('autosave-indicator')).not.toBeInTheDocument();

    // Trigger save
    let savePromise: Promise<unknown>;
    await act(async () => {
      savePromise = slowService.flush('ch1', 'content');
    });

    // Should show saving
    await waitFor(async () => {
      const indicator = await screen.findByTestId('autosave-indicator');
      expect(indicator).toHaveTextContent('Saving…');
    });

    await act(async () => {
      await savePromise!;
    });

    // Should show saved (wait for state update)
    await waitFor(async () => {
      const indicator = await screen.findByText('Saved');
      expect(indicator).toBeInTheDocument();
      expect(screen.getByTestId('autosave-indicator')).toHaveTextContent('Saved');
    });

    slowService.destroy();
  });

  it('should have aria-live="polite" for accessibility', async () => {
    render(<AutosaveIndicator service={service} />);

    await act(async () => {
      await service.flush('ch1', 'content');
    });

    const indicator = await screen.findByTestId('autosave-indicator');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
  });

  it('should apply custom className', async () => {
    render(<AutosaveIndicator service={service} className="custom-class" />);

    await act(async () => {
      await service.flush('ch1', 'content');
    });

    const indicator = await screen.findByTestId('autosave-indicator');
    expect(indicator).toHaveClass('custom-class');
  });

  it('should show appropriate colors for each state', async () => {
    const { rerender } = render(<AutosaveIndicator service={service} />);

    // Saved state - green
    await act(async () => {
      await service.flush('ch1', 'content');
    });
    let indicator = await screen.findByTestId('autosave-indicator');
    expect(indicator.className).toContain('text-green-600');

    // Error state - red (when online)
    const errorService = new AutosaveService(vi.fn().mockRejectedValue(new Error('fail')), 1000);
    rerender(<AutosaveIndicator service={errorService} />);

    // Ensure we're online for error state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    await act(async () => {
      try {
        await errorService.flush('ch1', 'content');
      } catch {
        // Expected
      }
    });

    indicator = await screen.findByTestId('autosave-indicator');
    expect(indicator.className).toContain('text-red-600');

    errorService.destroy();
  });
});
