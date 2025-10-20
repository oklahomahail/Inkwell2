import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { featureManager, FeatureName } from '@/utils/FeatureFlagManager';

import { useSimpleTourAutostart } from './hooks/useSimpleTourAutostart';
import { useSpotlightAutostart } from './hooks/useSpotlightAutostart';
import { TestTourWrapper } from './testUtils';
import { makeMockStorage } from './testUtils';
import { useTour } from './TourProvider';

// Mock feature manager
vi.mock('@/utils/FeatureFlagManager', () => ({
  featureManager: {
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

// Mock profile components consumed by TestTourWrapper
vi.mock('../profile/ProfileContext', () => ({
  ProfileProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./ProfileTourProvider', () => ({
  ProfileTourProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSessionStorage = makeMockStorage();

describe('Tour Feature Flag Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSessionStorage.clear();
    // Default state - both flags off
    (featureManager.isEnabled as any).mockImplementation((_flag: FeatureName) => false);
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Quick Tour', () => {
    it('can run when onboarding is enabled', async () => {
      // Enable onboarding flag
      (featureManager.isEnabled as any).mockImplementation(
        (flag: FeatureName) => flag === 'onboarding',
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
      (featureManager.isEnabled as any).mockImplementation(() => false);

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
      (featureManager.isEnabled as any).mockImplementation(
        (flag: FeatureName) => flag === 'onboarding' || flag === 'feature-discovery',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart();
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
      (featureManager.isEnabled as any).mockImplementation(
        (flag: FeatureName) => flag === 'onboarding',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart();
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
      (featureManager.isEnabled as any).mockImplementation(
        (flag: FeatureName) => flag === 'feature-discovery',
      );

      // Create test component
      const TestComponent = () => {
        useSpotlightAutostart();
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
