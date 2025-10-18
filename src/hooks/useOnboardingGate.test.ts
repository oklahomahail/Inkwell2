import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

import { useOnboardingGate } from './useOnboardingGate';

// Mock console for error path testing
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('useOnboardingGate', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('disables modal when tour is active', () => {
    const { result } = renderHook(() => useOnboardingGate());

    // Set tour active
    act(() => {
      result.current.setTourActive(true);
    });

    expect(result.current.getTourActive()).toBe(true);
    expect(result.current.shouldShowModal()).toBe(false);
  });

  it('tracks analytics call exactly once', () => {
    const analyticsSpy = vi.fn();
    let callCount = 0;
    const mockStorage = {
      getItem: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          analyticsSpy();
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    // Replace localStorage temporarily
    const originalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    const { result } = renderHook(() => useOnboardingGate());

    // Multiple calls to readGate
    act(() => {
      result.current.readGate();
      result.current.readGate();
      result.current.readGate();
    });

    expect(analyticsSpy).toHaveBeenCalledTimes(1);

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalStorage,
      writable: true,
    });
  });

  it('handles storage error gracefully', () => {
    // Mock localStorage to throw
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new Error('Storage error');
      }),
      setItem: vi.fn(() => {
        throw new Error('Storage error');
      }),
      removeItem: vi.fn(),
    };

    // Replace localStorage temporarily
    const originalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    const { result } = renderHook(() => useOnboardingGate());

    // Should return default state on read error
    expect(result.current.readGate()).toEqual({ status: 'pending' });

    // Should log warning on write error
    act(() => {
      result.current.writeGate({ status: 'dismissed' });
    });

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Failed to save onboarding gate:',
      expect.any(Error),
    );

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalStorage,
      writable: true,
    });
  });

  it('handles various gate statuses correctly', () => {
    const { result } = renderHook(() => useOnboardingGate());

    // Initial state
    expect(result.current.getGateStatus()).toBe('pending');
    expect(result.current.shouldShowModal()).toBe(true);

    // Dismissed state
    act(() => {
      result.current.dismissModal();
    });
    expect(result.current.getGateStatus()).toBe('dismissed');
    expect(result.current.shouldShowModal()).toBe(false);

    // Snoozed state
    act(() => {
      result.current.snoozeModal(1); // 1 hour
    });
    expect(result.current.getGateStatus()).toBe('snoozed');
    expect(result.current.shouldShowModal()).toBe(false);

    // Completed state
    act(() => {
      result.current.completeOnboarding();
    });
    expect(result.current.getGateStatus()).toBe('completed');
    expect(result.current.shouldShowModal()).toBe(false);

    // Reset state
    act(() => {
      result.current.resetGate();
    });
    expect(result.current.getGateStatus()).toBe('pending');
    expect(result.current.shouldShowModal()).toBe(true);
  });
});
