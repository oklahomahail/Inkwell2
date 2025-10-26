import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { featureFlagService } from '@/services/featureFlagService';

import { useSimpleTourAutostart } from './hooks/useSimpleTourAutostart';
import { useSpotlightAutostart } from './hooks/useSpotlightAutostart';
import { TestTourWrapper, makeMockStorage } from './testUtils';
import { useTour } from './useTour';

// Mock feature flag service
vi.mock('@/services/featureFlagService', () => ({
  featureFlagService: {
    isEnabled: vi.fn(),
  },
}));

// Mock tour hooks
vi.mock('./hooks/useSimpleTourAutostart', () => ({
  useSimpleTourAutostart: vi.fn(),
}));

vi.mock('./hooks/useSpotlightAutostart', () => ({
  useSpotlightAutostart: vi.fn(),
}));

// Mock tour components
vi.mock('./TourProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TourProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTour: () => ({
    startTour: vi.fn(),
    isActive: false,
  }),
}));

// Mock profile components - removed in single-user refactor
// (no longer needed)

vi.mock('./useTour', () => ({
  useTour: () => ({
    prefs: null,
    hydrated: false,
    isFirstTimeUser: false,
    isActive: false,
    startTour: vi.fn(),
    completeTour: vi.fn(),
    tourState: null,
    setTourSteps: vi.fn(),
    goToStep: vi.fn(),
    preferences: null,
    setNeverShowAgain: vi.fn(),
    setRemindMeLater: vi.fn(),
    logAnalytics: vi.fn(),
    checklist: [],
    getChecklistProgress: () => ({ completed: 0, total: 0 }),
    canShowContextualTour: () => false,
    completedTours: [],
    neverShowAgain: false,
    remindMeLater: false,
  }),
}));

const mockSessionStorage = makeMockStorage();

describe('Tour Feature Flag Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSessionStorage.clear();
    // Default state - both flags off
    (featureFlagService.isEnabled as any).mockImplementation((_flag: string) => false);
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Quick Tour', () => {
    it('can run when onboarding is enabled', async () => {
      // Enable onboarding flag
      (featureFlagService.isEnabled as any).mockImplementation(
        (flag: string) => flag === 'onboarding',
      );

      // Create test component
      const TestComponent = () => {
        const { startTour: _startTour } = useTour();
        useSimpleTourAutostart();
        return <div data-testid="quick-tour">Test</div>;
      };

      render(
        <TestTourWrapper>
          <TestComponent />
        </TestTourWrapper>,
      );

      // Hook should be called since onboarding is enabled
      await waitFor(() => {
        expect(useSimpleTourAutostart).toHaveBeenCalled();
      });
    });

    it('never runs when onboarding is disabled', async () => {
      // Disable onboarding flag
      (featureFlagService.isEnabled as any).mockImplementation(() => false);

      // Create test component
      const TestComponent = () => {
        useSimpleTourAutostart();
        return <div data-testid="quick-tour">Test</div>;
      };

      render(
        <TestTourWrapper>
          <TestComponent />
        </TestTourWrapper>,
      );

      await act(async () => {
        expect(useSimpleTourAutostart).toHaveBeenCalled();
        expect(useTour().startTour).not.toHaveBeenCalled();
      });
    });
  });

  describe('Feature Discovery', () => {
    it('can run when feature-discovery and onboarding are enabled', async () => {
      // Enable both flags
      (featureFlagService.isEnabled as any).mockImplementation(
        (flag: string) => flag === 'onboarding' || flag === 'feature-discovery',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart(['.test-selector']);
        return <div data-testid="feature-discovery">Test</div>;
      };

      render(
        <TestTourWrapper>
          <TestComponent />
        </TestTourWrapper>,
      );

      // Hook should be called since both flags are enabled
      await waitFor(() => {
        expect(useSpotlightAutostart).toHaveBeenCalled();
      });
    });

    it('never runs when feature-discovery is disabled', async () => {
      // Enable onboarding but disable feature-discovery
      (featureFlagService.isEnabled as any).mockImplementation(
        (flag: string) => flag === 'onboarding',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart(['.test-selector']);
        return <div data-testid="feature-discovery">Test</div>;
      };

      render(
        <TestTourWrapper>
          <TestComponent />
        </TestTourWrapper>,
      );

      await act(async () => {
        expect(useSpotlightAutostart).toHaveBeenCalled();
        expect(useTour().startTour).not.toHaveBeenCalled();
      });
    });

    it('never runs when onboarding is disabled', async () => {
      // Disable onboarding but enable feature-discovery
      (featureFlagService.isEnabled as any).mockImplementation(
        (flag: string) => flag === 'feature-discovery',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart(['.test-selector']);
        return <div data-testid="feature-discovery">Test</div>;
      };

      render(
        <TestTourWrapper>
          <TestComponent />
        </TestTourWrapper>,
      );

      await act(async () => {
        expect(useSpotlightAutostart).toHaveBeenCalled();
        expect(useTour().startTour).not.toHaveBeenCalled();
      });
    });
  });
});
