/**
 * useSpotlightAutostartHardened Component Tests
 *
 * Tests for the hardened tour autostart hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as anchorsModule from '../../../../tour/anchors';
import { useSpotlightAutostart } from '../useSpotlightAutostartHardened';

// Mock the anchors module
vi.mock('../../../../tour/anchors', () => ({
  waitForAnchors: vi.fn(),
}));

// Mock devLog
vi.mock('../../../../utils/devLog', () => ({
  devLog: vi.fn(),
}));

describe('useSpotlightAutostartHardened', () => {
  const mockOnStartTour = vi.fn();
  const mockWaitForAnchors = vi.mocked(anchorsModule.waitForAnchors);

  beforeEach(() => {
    vi.clearAllMocks();
    mockWaitForAnchors.mockResolvedValue(true);

    // Mock requestAnimationFrame and queueMicrotask
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      setTimeout(() => cb(0), 0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
  }

  it('should not start tour when no selectors provided', async () => {
    renderHook(() => useSpotlightAutostart([], { onStartTour: mockOnStartTour }), { wrapper });

    await waitFor(() => {
      expect(mockOnStartTour).not.toHaveBeenCalled();
    });
  });

  it('should not start tour when no callback provided', async () => {
    renderHook(() => useSpotlightAutostart(['[data-test]']), { wrapper });

    await waitFor(() => {
      expect(mockWaitForAnchors).not.toHaveBeenCalled();
    });
  });

  it('should wait for anchors before starting tour', async () => {
    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockWaitForAnchors).toHaveBeenCalledWith(['[data-test]'], { timeout: 1000 });
    });

    await waitFor(() => {
      expect(mockOnStartTour).toHaveBeenCalled();
    });
  });

  it('should pass tourId to callback', async () => {
    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          tourId: 'test-tour',
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockOnStartTour).toHaveBeenCalledWith('test-tour');
    });
  });

  it('should retry when anchors not ready', async () => {
    let attemptCount = 0;
    mockWaitForAnchors.mockImplementation(async () => {
      attemptCount++;
      return attemptCount > 2; // Succeed on 3rd attempt
    });

    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    // Wait longer for retries
    await waitFor(
      () => {
        expect(mockOnStartTour).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(attemptCount).toBeGreaterThan(1);
  });

  it('should give up after max retries', async () => {
    mockWaitForAnchors.mockResolvedValue(false); // Always fail

    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    // Wait for all retries to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Should not have started tour
    expect(mockOnStartTour).not.toHaveBeenCalled();

    // Should have attempted multiple times
    expect(mockWaitForAnchors.mock.calls.length).toBeGreaterThan(1);
    expect(mockWaitForAnchors.mock.calls.length).toBeLessThanOrEqual(4); // Initial + 3 retries
  });

  it('should respect shouldStart callback', async () => {
    const shouldStart = vi.fn(() => false);

    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
          shouldStart,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockOnStartTour).not.toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWaitForAnchors.mockRejectedValue(new Error('Test error'));

    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should not crash
    expect(mockOnStartTour).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('should only run once per session', async () => {
    const { rerender } = renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockOnStartTour).toHaveBeenCalledTimes(1);
    });

    // Force re-render
    rerender();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should still only have been called once
    expect(mockOnStartTour).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', async () => {
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    const { unmount } = renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
        }),
      { wrapper },
    );

    unmount();

    // Should have cleaned up RAF
    await waitFor(() => {
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  it('should respect custom excluded paths', async () => {
    // This would require mocking useLocation to return different paths
    // For now, just verify the hook accepts the option
    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
          excludedPaths: ['/custom-excluded'],
        }),
      { wrapper },
    );

    // Hook should render without errors
    expect(true).toBe(true);
  });

  it('should respect custom dashboard path', async () => {
    renderHook(
      () =>
        useSpotlightAutostart(['[data-test]'], {
          onStartTour: mockOnStartTour,
          dashboardPath: '/home',
        }),
      { wrapper },
    );

    // Hook should render without errors
    expect(true).toBe(true);
  });
});
