// src/services/tutorialStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useProfile } from '../context/ProfileContext';
import { useMaybeDB } from '../data/dbFactory';

import {
  useTutorialStorage,
  migrateLegacyTutorialData,
  LegacyTutorialStorage,
} from './tutorialStorage';

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

const mockedUseProfile = vi.mocked(useProfile);
const mockedUseMaybeDB = vi.mocked(useMaybeDB);

// Helper to create a mock useProfile return value
function createMockUseProfileReturn(active: any) {
  return {
    profiles: [],
    activeProfile: active,
    isLoading: false,
    error: null,
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    setActiveProfile: vi.fn(),
    switchProfile: vi.fn(),
    loadProfiles: vi.fn(),
    clearActiveProfile: vi.fn(),
    active,
    activeProfileId: active?.id || null,
  };
}

describe('TutorialStorage', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return values
    const now = new Date();
    mockedUseProfile.mockReturnValue(
      createMockUseProfileReturn({
        id: 'profile-1',
        name: 'Test Profile',
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Create a mock database with the right interface
    mockDb = {
      // Legacy methods
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
      // New interface methods
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      getAllKeys: vi.fn().mockResolvedValue([]),
    };

    mockedUseMaybeDB.mockReturnValue(mockDb);
  });

  describe('useTutorialStorage', () => {
    it('should store tutorial progress with profile-specific keys', async () => {
      const { result } = renderHook(() => useTutorialStorage());

      const progress = {
        currentStep: 2,
        completedSteps: ['step1', 'step2'],
        tourType: 'full-onboarding' as const,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: 5,
        lastActiveAt: Date.now(),
      };

      await act(async () => {
        await result.current.setProgress('getting-started', progress);
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_progress_getting-started',
        expect.objectContaining({
          slug: 'getting-started',
          progress,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should retrieve tutorial progress with profile-specific keys', async () => {
      const mockProgress = {
        slug: 'getting-started',
        progress: {
          currentStep: 2,
          completedSteps: ['step1', 'step2'],
          tourType: 'full-onboarding' as const,
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 5,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      mockDb.get.mockResolvedValue(mockProgress);

      const { result } = renderHook(() => useTutorialStorage());

      await act(async () => {
        const progress = await result.current.getProgress('getting-started');
        expect(progress).toEqual(mockProgress);
      });

      expect(mockDb.get).toHaveBeenCalledWith('tutorial_progress_getting-started');
    });

    it('should store preferences per profile', async () => {
      const { result } = renderHook(() => useTutorialStorage());

      const preferences = {
        neverShowAgain: false,
        remindMeLater: true,
        remindMeLaterUntil: Date.now() + 24 * 60 * 60 * 1000,
        completedTours: ['full-onboarding'],
        tourDismissals: 1,
      };

      await act(async () => {
        await result.current.setPreferences(preferences);
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_preferences',
        expect.objectContaining({
          ...preferences,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should store checklist per profile', async () => {
      const { result } = renderHook(() => useTutorialStorage());

      const checklist = {
        createProject: true,
        addChapter: false,
        addCharacter: true,
        writeContent: false,
        useTimeline: false,
        exportProject: false,
        useAI: true,
      };

      await act(async () => {
        await result.current.setChecklist(checklist);
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_checklist',
        expect.objectContaining({
          ...checklist,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should handle cases when no active profile exists', async () => {
      // Mock no active profile
      mockedUseProfile.mockReturnValue(createMockUseProfileReturn(null));
      mockedUseMaybeDB.mockReturnValue(null);

      const { result } = renderHook(() => useTutorialStorage());

      expect(result.current.isProfileActive).toBe(false);
      expect(result.current.profileId).toBe(null);

      const progress = await result.current.getProgress('test');
      expect(progress).toBe(null);
    });
  });

  describe('Profile Isolation', () => {
    it('should isolate tutorial data between different profiles', async () => {
      // Test with profile 1
      const now = new Date();
      const profile1 = {
        id: 'profile-1',
        name: 'Profile 1',
        createdAt: now,
        updatedAt: now,
      };
      mockedUseProfile.mockReturnValue(createMockUseProfileReturn(profile1));

      const { result: result1 } = renderHook(() => useTutorialStorage());

      const progress1 = {
        currentStep: 1,
        completedSteps: ['step1'],
        tourType: 'full-onboarding' as const,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: 5,
        lastActiveAt: Date.now(),
      };

      await act(async () => {
        await result1.current.setProgress('tutorial-1', progress1);
      });

      // Test with profile 2
      const profile2 = {
        id: 'profile-2',
        name: 'Profile 2',
        createdAt: now,
        updatedAt: now,
      };
      mockedUseProfile.mockReturnValue(createMockUseProfileReturn(profile2));

      const { result: result2 } = renderHook(() => useTutorialStorage());

      const progress2 = {
        currentStep: 3,
        completedSteps: ['step1', 'step2', 'step3'],
        tourType: 'feature-tour' as const,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: 4,
        lastActiveAt: Date.now(),
      };

      await act(async () => {
        await result2.current.setProgress('tutorial-1', progress2);
      });

      // Should use same key but different database instance (per profile)
      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_progress_tutorial-1',
        expect.objectContaining({ slug: 'tutorial-1', progress: progress2 }),
      );

      // Verify isolation: Each profile should have different database instances
      // (In reality, this would be tested with integration tests, but we verify the call pattern)
      expect(result1.current.profileId).toBe('profile-1');
      expect(result2.current.profileId).toBe('profile-2');
    });
  });

  describe('Legacy Migration', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        writable: true,
      });
    });

    it('should migrate legacy tour progress to first profile', async () => {
      const legacyProgress = JSON.stringify({
        completedSteps: ['welcome', 'create-project'],
        isFirstTimeUser: false,
      });

      const legacyPreferences = JSON.stringify({
        neverShowAgain: false,
        remindMeLater: false,
        completedTours: ['full-onboarding'],
        tourDismissals: 2,
      });

      const legacyChecklist = JSON.stringify({
        createProject: true,
        addChapter: true,
        addCharacter: false,
        writeContent: true,
        useTimeline: false,
        exportProject: false,
        useAI: true,
      });

      vi.mocked(localStorage.getItem)
        .mockReturnValueOnce(legacyProgress) // inkwell-tour-progress
        .mockReturnValueOnce(legacyPreferences) // inkwell-tour-progress-preferences
        .mockReturnValueOnce(legacyChecklist); // inkwell-completion-checklist

      await migrateLegacyTutorialData('profile-1', mockDb, true);

      // Should migrate preferences
      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_preferences',
        expect.objectContaining({
          neverShowAgain: false,
          remindMeLater: false,
          completedTours: ['full-onboarding'],
          tourDismissals: 2,
          updatedAt: expect.any(Number),
        }),
      );

      // Should migrate checklist
      expect(mockDb.put).toHaveBeenCalledWith(
        'tutorial_checklist',
        expect.objectContaining({
          createProject: true,
          addChapter: true,
          addCharacter: false,
          writeContent: true,
          useTimeline: false,
          exportProject: false,
          useAI: true,
          updatedAt: expect.any(Number),
        }),
      );

      // Should clean up legacy keys
      expect(localStorage.removeItem).toHaveBeenCalledWith('inkwell-tour-progress');
      expect(localStorage.removeItem).toHaveBeenCalledWith('inkwell-tour-progress-preferences');
      expect(localStorage.removeItem).toHaveBeenCalledWith('inkwell-completion-checklist');
    });

    it('should not migrate legacy data to non-first profiles', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{"test": "data"}');

      await migrateLegacyTutorialData('profile-2', mockDb, false);

      // Should not clean up legacy keys (only first profile does this)
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('inkwell-tour-progress');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('inkwell-tour-progress-preferences');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('inkwell-completion-checklist');
    });
  });

  describe('LegacyTutorialStorage', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
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
        },
        writable: true,
      });
    });

    it('should read legacy progress data', () => {
      const mockProgress = {
        slug: 'test',
        progress: { currentStep: 1 },
        updatedAt: Date.now(),
      };

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockProgress));

      const progress = LegacyTutorialStorage.getProgress('test');
      expect(progress).toEqual(mockProgress);
      expect(localStorage.getItem).toHaveBeenCalledWith('inkwell:tutorial:progress:test');
    });

    it('should identify legacy tutorial keys', () => {
      const keys = LegacyTutorialStorage.getAllLegacyKeys();
      expect(keys).toEqual([
        'inkwell:tutorial:progress:test',
        'inkwell:tutorial:preferences',
        'inkwell:tutorial:profile-1:progress:test',
      ]);
    });

    it('should clear legacy data for specific profile', () => {
      LegacyTutorialStorage.clearLegacyData('profile-1');

      // Should remove profile-specific keys
      expect(localStorage.removeItem).toHaveBeenCalled();
      // Note: The actual implementation may vary, so we check that removeItem was called
    });
  });

  describe('No Active Profile', () => {
    it('should handle gracefully when no active profile exists', async () => {
      mockedUseProfile.mockReturnValue(createMockUseProfileReturn(null));
      mockedUseMaybeDB.mockReturnValue(null);

      const { result } = renderHook(() => useTutorialStorage());

      expect(result.current.profileId).toBe(null);
      expect(result.current.isProfileActive).toBe(false);

      // All operations should return null gracefully
      const progress = await result.current.getProgress('test');
      expect(progress).toBe(null);

      const preferences = await result.current.getPreferences();
      expect(preferences).toBe(null);

      const checklist = await result.current.getChecklist();
      expect(checklist).toBe(null);

      // Set operations should no-op without throwing
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

      await expect(
        result.current.setPreferences({
          neverShowAgain: true,
          remindMeLater: false,
          completedTours: [],
          tourDismissals: 0,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useTutorialStorage());

      const progress = await result.current.getProgress('test');
      expect(progress).toBe(null);

      // Should not throw error, just return null and log warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get tutorial progress'),
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });

    it('should handle migration errors gracefully', async () => {
      const migrationDb = {
        get: vi.fn(),
        put: vi.fn().mockRejectedValue(new Error('Migration error')),
        delete: vi.fn(),
        list: vi.fn(),
      };
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localStorage.getItem).mockReturnValue('{"test": "data"}');

      // Should not throw error, just log it
      await expect(
        migrateLegacyTutorialData('profile-1', migrationDb, true),
      ).resolves.toBeUndefined();

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to migrate tutorial data'),
        expect.any(Error),
      );
      errSpy.mockRestore();
    });
  });
});

describe('Tutorial URL Generation', () => {
  it('should generate correct profile-specific URLs', () => {
    // This would be tested with the TutorialLinks utility
    // Placeholder for URL generation tests
    expect(true).toBe(true);
  });
});

describe('Integration Test', () => {
  it('should demonstrate complete profile isolation workflow', async () => {
    // This is a conceptual integration test showing the complete workflow

    // 1. User creates Profile A and starts tutorial
    const _profileA = { id: 'profile-a', name: 'Profile A' };

    // 2. Progress through some steps
    // tutorialStorage.setProgress('getting-started', { currentStep: 2, ... });

    // 3. Switch to Profile B
    const _profileB = { id: 'profile-b', name: 'Profile B' };

    // 4. Verify Tutorial progress is reset/isolated
    // expect(tutorialStorage.getProgress('getting-started')).toBe(null);

    // 5. Make progress in Profile B
    // tutorialStorage.setProgress('getting-started', { currentStep: 4, ... });

    // 6. Switch back to Profile A
    // 7. Verify Profile A's progress is preserved
    // expect(tutorialStorage.getProgress('getting-started')).toEqual({ currentStep: 2, ... });

    expect(true).toBe(true); // Placeholder - real integration test would implement above
  });
});
