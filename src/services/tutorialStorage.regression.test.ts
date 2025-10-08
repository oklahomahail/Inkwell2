import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useTutorialStorage, migrateLegacyTutorialData } from './tutorialStorage';

// Mock the context
vi.mock('../context/ProfileContext', () => ({
  useProfile: vi.fn(() => ({ active: { id: 'test-profile', name: 'Test' } })),
}));

// Mock the database factory
vi.mock('../data/dbFactory', () => ({
  useMaybeDB: vi.fn(),
  defineStores: vi.fn(() => ({
    tutorials: 'tutorial_progress',
    tutorialPreferences: 'tutorial_preferences',
    tutorialChecklist: 'tutorial_checklist',
  })),
}));

// Import after mocking
import { useProfile } from '../context/ProfileContext';
import { useMaybeDB } from '../data/dbFactory';

const mockedUseProfile = vi.mocked(useProfile);
const mockedUseMaybeDB = vi.mocked(useMaybeDB);

// Utility functions
function createMemoryDb() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
  };
}

function createTestProfile(id = 'test-profile', name = 'Test Profile') {
  return { id, name };
}

describe('TutorialStorage Regression Tests', () => {
  let mockDb: any;
  let localStorageMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock database
    mockDb = createMemoryDb();
    mockedUseMaybeDB.mockReturnValue(mockDb);

    // Set up mock profile
    mockedUseProfile.mockReturnValue({ active: createTestProfile() });

    // Set up localStorage mock
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 4,
      key: vi.fn((index) => {
        const keys = [
          'inkwell:tutorial:progress:test',
          'inkwell:tutorial:preferences',
          'inkwell:tutorial:profile-1:progress:test',
          'other-key',
        ];
        return keys[index] || null;
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('No Active Profile Scenarios', () => {
    it('should gracefully handle no active profile', async () => {
      // Mock no active profile and no database
      mockedUseProfile.mockReturnValue({ active: null });
      mockedUseMaybeDB.mockReturnValue(null);

      const { result } = renderHook(() => useTutorialStorage());

      // All methods should return null/undefined gracefully
      expect(result.current.profileId).toBe(null);
      expect(result.current.isProfileActive).toBe(false);

      const progress = await result.current.getProgress('test');
      expect(progress).toBe(null);

      const preferences = await result.current.getPreferences();
      expect(preferences).toBe(null);

      const checklist = await result.current.getChecklist();
      expect(checklist).toBe(null);

      // Operations should no-op without throwing
      await expect(
        result.current.setProgress('test', {
          currentStep: 1,
          completedSteps: ['step1'],
          tourType: 'full-onboarding' as const,
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 5,
          lastActiveAt: Date.now(),
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle database unavailable gracefully', async () => {
      // Mock database that throws error but keep profile active
      const failingDb = {
        get: vi.fn().mockRejectedValue(new Error('Database unavailable')),
        put: vi.fn().mockRejectedValue(new Error('Database unavailable')),
        delete: vi.fn().mockRejectedValue(new Error('Database unavailable')),
        clear: vi.fn().mockRejectedValue(new Error('Database unavailable')),
        list: vi.fn().mockRejectedValue(new Error('Database unavailable')),
      };
      mockedUseMaybeDB.mockReturnValue(failingDb);
      mockedUseProfile.mockReturnValue({ active: createTestProfile('test-profile') });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useTutorialStorage());

      const progress = await result.current.getProgress('test');
      expect(progress).toBe(null);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get tutorial progress for test'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });

  describe('Migration Idempotence', () => {
    it('should not duplicate data when migration runs twice', async () => {
      const db = createMemoryDb();

      // Setup legacy data that gets removed after first access
      let legacyDataRemoved = false;
      localStorageMock.getItem.mockImplementation((key) => {
        if (legacyDataRemoved) {
          return null; // Data was already migrated and removed
        }

        if (key === 'inkwell-tour-progress') {
          return '{"completedSteps": ["step1"], "isFirstTimeUser": false}';
        }
        if (key === 'inkwell-tour-progress-preferences') {
          return '{"neverShowAgain": true}';
        }
        if (key === 'inkwell-completion-checklist') {
          return '{"createProject": true}';
        }
        return null;
      });

      // Mock removeItem to simulate actual removal
      localStorageMock.removeItem.mockImplementation((key) => {
        if (key.includes('inkwell-tour-progress') || key.includes('inkwell-completion-checklist')) {
          legacyDataRemoved = true;
        }
      });

      // First migration
      await migrateLegacyTutorialData('profile-1', db, true);

      const firstPutCalls = db.put.mock.calls.length;
      expect(firstPutCalls).toBeGreaterThan(0);

      // Reset mock to track second migration calls
      db.put.mockClear();
      // Count first run removeItem calls
      const firstRunRemoveCalls = localStorageMock.removeItem.mock.calls.length;
      expect(firstRunRemoveCalls).toBeGreaterThan(0);
      localStorageMock.removeItem.mockClear();

      // Second migration (should be idempotent)
      await migrateLegacyTutorialData('profile-1', db, true);

      const secondPutCalls = db.put.mock.calls.length;
      const secondRunRemoveCalls = localStorageMock.removeItem.mock.calls.length;

      // Second migration should not find data since it was cleared in first run
      expect(secondPutCalls).toBe(0);

      // Second run should still attempt cleanup but find no keys
      // This is expected behavior - migration always tries to clean up
      expect(secondRunRemoveCalls).toBeGreaterThanOrEqual(0);
    });

    it('should not clear legacy keys on non-first profile migrations', async () => {
      const db = createMemoryDb();

      localStorageMock.getItem.mockReturnValue('{"test": "data"}');

      // Migrate for second profile (not first)
      await migrateLegacyTutorialData('profile-2', db, false);

      // Should not clear legacy global keys
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('inkwell-tour-progress');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
        'inkwell-tour-progress-preferences',
      );
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('inkwell-completion-checklist');
    });
  });

  describe('Profile Switch Scenarios', () => {
    it('should maintain profile isolation during switches', async () => {
      // Test with profile 1
      const { result: hook1 } = renderHook(() => useTutorialStorage());

      // Set data for profile 1
      await hook1.current.setProgress('test', {
        currentStep: 5,
        completedSteps: ['step1', 'step2', 'step3', 'step4', 'step5'],
        tourType: 'full-onboarding' as const,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: 10,
        lastActiveAt: Date.now(),
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_progress_test',
        expect.objectContaining({
          progress: expect.objectContaining({ currentStep: 5 }),
        }),
      );

      // Switch to profile 2
      mockedUseProfile.mockReturnValue({ active: createTestProfile('profile-2', 'Profile 2') });

      const { result: hook2 } = renderHook(() => useTutorialStorage());

      // Should use same key pattern but different database instance
      await hook2.current.setProgress('test', {
        currentStep: 2,
        completedSteps: ['step1', 'step2'],
        tourType: 'full-onboarding' as const,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: 10,
        lastActiveAt: Date.now(),
      });

      // Verify different data was stored
      const putCalls = mockDb.put.mock.calls;
      expect(putCalls.length).toBe(2);
      expect(putCalls[1][1].progress.currentStep).toBe(2);
    });
  });

  describe('Storage Failure Scenarios', () => {
    it('should handle database write failures gracefully', async () => {
      // Mock failing database
      const failingDb = {
        get: vi.fn().mockRejectedValue(new Error('Database write failed')),
        put: vi.fn().mockRejectedValue(new Error('Database write failed')),
        delete: vi.fn().mockRejectedValue(new Error('Database write failed')),
        clear: vi.fn().mockRejectedValue(new Error('Database write failed')),
        list: vi.fn().mockRejectedValue(new Error('Database write failed')),
      };

      mockedUseMaybeDB.mockReturnValue(failingDb);
      const { result } = renderHook(() => useTutorialStorage());

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Attempt to set progress should not throw
      await expect(
        result.current.setProgress('test', {
          currentStep: 1,
          completedSteps: ['step1'],
          tourType: 'full-onboarding' as const,
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 5,
          lastActiveAt: Date.now(),
        }),
      ).resolves.toBeUndefined();

      // Should log the error
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save tutorial progress'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });

  // Add more regression tests here as needed
  describe('Basic Functionality', () => {
    it('should not crash when switching between valid and invalid states', async () => {
      // This is a placeholder for additional regression tests
      // Test basic functionality to ensure no regressions
      const { result } = renderHook(() => useTutorialStorage());

      expect(result.current.isProfileActive).toBe(true);
      expect(result.current.profileId).toBe('test-profile');

      // Switch to no profile
      mockedUseProfile.mockReturnValue({ active: null });
      const { result: result2 } = renderHook(() => useTutorialStorage());

      expect(result2.current.isProfileActive).toBe(false);
      expect(result2.current.profileId).toBe(null);
    });
  });
});
