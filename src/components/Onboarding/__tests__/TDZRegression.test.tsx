// TDZ (Temporal Dead Zone) Regression Tests
// These tests ensure that tour providers can mount without throwing ReferenceError exceptions
// due to accessing variables/functions before their declaration.

import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ProfileTourProvider, useTour as useProfileTour } from '../ProfileTourProvider';
import { TourProvider, useTour } from '../TourProvider';

// Mock ProfileContext for ProfileTourProvider
const mockProfileContext = {
  active: { id: 'test-profile-1', name: 'Test Profile' },
  profiles: [],
  createProfile: vi.fn(),
  switchProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
  isLoading: false,
};

vi.mock('../../../context/ProfileContext', () => ({
  useProfile: () => mockProfileContext,
}));

// Mock tutorialStorage for ProfileTourProvider
const mockTutorialStorage = {
  isProfileActive: true,
  getPreferences: vi.fn().mockResolvedValue(null),
  setPreferences: vi.fn().mockResolvedValue(void 0),
  getChecklist: vi.fn().mockResolvedValue(null),
  setChecklist: vi.fn().mockResolvedValue(void 0),
  getAllProgress: vi.fn().mockResolvedValue([]),
  getProgress: vi.fn().mockResolvedValue(null),
  setProgress: vi.fn().mockResolvedValue(void 0),
  clearProgress: vi.fn().mockResolvedValue(void 0),
  migrateFromLegacy: vi.fn().mockResolvedValue(void 0),
};

vi.mock('../../../services/tutorialStorage', () => ({
  useTutorialStorage: () => mockTutorialStorage,
}));

describe('TDZ Regression Tests', () => {
  describe('TourProvider', () => {
    it('should not throw ReferenceError on mount', () => {
      expect(() => {
        render(
          <TourProvider>
            <div>Test content</div>
          </TourProvider>,
        );
      }).not.toThrow();
    });

    it('should not throw when accessing logAnalytics during initialization', () => {
      let tourContext: any;

      function TestComponent() {
        const context = useTour();
        tourContext = context;
        return null;
      }

      expect(() => {
        render(
          <TourProvider>
            <TestComponent />
          </TourProvider>,
        );
      }).not.toThrow();

      // Verify logAnalytics is accessible
      expect(typeof tourContext?.logAnalytics).toBe('function');
    });

    it('should handle early logAnalytics calls without TDZ errors', () => {
      let tourContext: any;

      function TestComponent() {
        const context = useTour();
        tourContext = context;

        // This should not throw even if called immediately
        React.useEffect(() => {
          context.logAnalytics('test_event', { test: true });
        }, [context]);

        return null;
      }

      expect(() => {
        render(
          <TourProvider>
            <TestComponent />
          </TourProvider>,
        );
      }).not.toThrow();
    });
  });

  describe('ProfileTourProvider', () => {
    it('should not throw ReferenceError on mount', () => {
      expect(() => {
        render(
          <ProfileTourProvider>
            <div>Test content</div>
          </ProfileTourProvider>,
        );
      }).not.toThrow();
    });

    it('should not throw when accessing logAnalytics during initialization', async () => {
      let tourContext: any;

      function TestComponent() {
        const context = useProfileTour();
        tourContext = context;
        return null;
      }

      expect(() => {
        render(
          <ProfileTourProvider>
            <TestComponent />
          </ProfileTourProvider>,
        );
      }).not.toThrow();

      // Wait for async profile loading
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify logAnalytics is accessible
      expect(typeof tourContext?.logAnalytics).toBe('function');
    });

    it('should handle early logAnalytics calls without TDZ errors', async () => {
      let tourContext: any;

      function TestComponent() {
        const context = useProfileTour();
        tourContext = context;

        // This should not throw even if called immediately during profile loading
        React.useEffect(() => {
          if (context.logAnalytics) {
            context.logAnalytics('profile_test_event', { profileId: 'test' });
          }
        }, [context]);

        return null;
      }

      expect(() => {
        render(
          <ProfileTourProvider>
            <TestComponent />
          </ProfileTourProvider>,
        );
      }).not.toThrow();
    });

    it('should handle tour actions that depend on logAnalytics', async () => {
      let tourContext: any;

      function TestComponent() {
        const context = useProfileTour();
        tourContext = context;
        return null;
      }

      render(
        <ProfileTourProvider>
          <TestComponent />
        </ProfileTourProvider>,
      );

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      // These actions internally call logAnalytics and should not throw
      expect(() => {
        tourContext?.startTour('feature-tour');
        tourContext?.skipTour();
        tourContext?.completeTour();
        tourContext?.setNeverShowAgain();
        tourContext?.setRemindMeLater(24);
        tourContext?.updateChecklist('createProject');
      }).not.toThrow();
    });
  });

  describe('Cross-provider compatibility', () => {
    it('should allow nested providers without TDZ conflicts', () => {
      expect(() => {
        render(
          <TourProvider>
            <ProfileTourProvider>
              <div>Nested content</div>
            </ProfileTourProvider>
          </TourProvider>,
        );
      }).not.toThrow();
    });
  });
});
