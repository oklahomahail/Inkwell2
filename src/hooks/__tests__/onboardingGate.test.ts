import { describe, it, expect } from 'vitest';

import { shouldShowOnboarding } from '@/hooks/onboardingGate';

describe('shouldShowOnboarding', () => {
  it('shows onboarding when user is new and gate not dismissed', () => {
    const res = shouldShowOnboarding({
      isNewUser: true,
      hasCompletedTour: false,
      gateDismissedAt: null,
    });
    expect(res).toBe(true);
  });

  it('does not show when tour completed or gate dismissed', () => {
    expect(
      shouldShowOnboarding({
        isNewUser: true,
        hasCompletedTour: true,
        gateDismissedAt: null,
      }),
    ).toBe(false);

    expect(
      shouldShowOnboarding({
        isNewUser: true,
        hasCompletedTour: false,
        gateDismissedAt: Date.now(),
      }),
    ).toBe(false);
  });
});
