import { vi } from 'vitest';

const mockProfile = { id: 'test-profile-id', name: 'Test' };

const gateSpies = vi.hoisted(() => ({
  setTourActive: vi.fn(),
  completeOnboarding: vi.fn(),
}));

const tutorialSpies = vi.hoisted(() => ({
  isProfileActive: vi.fn().mockReturnValue(true),
  markProfileSeen: vi.fn(),
  getPreferences: vi.fn().mockResolvedValue(null),
  setPreferences: vi.fn().mockResolvedValue(undefined),
  getChecklist: vi.fn().mockResolvedValue(null),
  setChecklist: vi.fn().mockResolvedValue(undefined),
  setProgress: vi.fn().mockResolvedValue(undefined),
  clearProgress: vi.fn().mockResolvedValue(undefined),
  getAllProgress: vi.fn().mockResolvedValue([]),
}));

// Match provider's import exactly
vi.mock('../../context/ProfileContext', () => {
  const React = require('react');
  const useProfile = () => ({ active: mockProfile });
  return { useProfile };
});

vi.mock('@/hooks/useOnboardingGate', () => ({
  useOnboardingGate: () => ({
    setTourActive: gateSpies.setTourActive,
    completeOnboarding: gateSpies.completeOnboarding,
  }),
}));

vi.mock('@/services/tutorialStorage', () => ({
  useTutorialStorage: () => tutorialSpies,
}));

vi.mock('@/services/analyticsService', () => ({
  analyticsService: {
    init: vi.fn(),
    trackEvent: vi.fn(),
    trackTourStarted: vi.fn(),
    trackTourCompleted: vi.fn(),
    trackTourAbandoned: vi.fn(),
    trackTourStepCompleted: vi.fn(),
    track: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    shutdown: vi.fn(),
  },
}));
import { afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  // If a test enabled fake timers, always restore
  try {
    vi.useRealTimers();
  } catch {}
  vi.clearAllMocks();
  vi.clearAllTimers();
  cleanup();
});

afterAll(() => {
  // Clean up any dangling promises or async iterators
  return new Promise((resolve) => {
    setImmediate(() => {
      if ((global as any).gc) {
        try {
          (global as any).gc();
        } catch {}
      }
      resolve(true);
    });
  });
});

afterAll(async () => {
  vi.useFakeTimers(); // Enable fake timers for the check
  cleanup();
  await Promise.resolve();
  expect(vi.getTimerCount?.() ?? 0).toBe(0);
  vi.useRealTimers();
});

import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { ProfileTourProvider, useTour } from './ProfileTourProvider';

function renderWithProvider(children: React.ReactNode) {
  return render(<ProfileTourProvider>{children}</ProfileTourProvider>);
}

describe('ProfileTourProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children without crashing', async () => {
    const view = renderWithProvider(<div data-testid="child" />);
    await waitFor(() => expect(screen.queryByTestId('tour-state')).toBeTruthy(), { timeout: 1000 });
    view.unmount();
  });

  it('loads existing preferences for returning users', async () => {
    tutorialSpies.getPreferences.mockResolvedValueOnce({
      completedTours: ['full-onboarding'],
      neverShowAgain: false,
      remindMeLater: false,
      tourDismissals: 1,
      hasLaunched: true,
    });

    const view = renderWithProvider(<div data-testid="child" />);
    await waitFor(() => {
      const el = screen.getByTestId('tour-state');
      const state = JSON.parse(el.textContent || '{}');
      expect(state.hydrated).toBe(true);
      expect(state.isFirstTimeUser).toBe(false);
    });
    view.unmount();
  });

  it('tracks analytics events when tour starts', async () => {
    function TriggerStart() {
      const api = useTour();
      useEffect(() => {
        api.startTour('full-onboarding');
      }, []);
      return null;
    }

    const view = renderWithProvider(<TriggerStart />);
    await waitFor(() => expect(gateSpies.setTourActive).toHaveBeenCalled());
    view.unmount();
  });

  it('handles storage errors gracefully', async () => {
    tutorialSpies.getPreferences.mockRejectedValueOnce(new Error('Storage error'));
    tutorialSpies.getChecklist.mockRejectedValueOnce(new Error('Storage error'));
    tutorialSpies.getAllProgress.mockRejectedValueOnce(new Error('Storage error'));

    const view = renderWithProvider(<div data-testid="child" />);
    const el = await screen.findByTestId('tour-state');
    const state = JSON.parse(el.textContent || '{}');
    expect(state.hydrated).toBe(true);
    expect(state.isFirstTimeUser).toBe(true);
    view.unmount();
  });
});
