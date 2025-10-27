import { describe, it, expect, beforeEach } from 'vitest';

import { LegacyTutorialStorage } from '../tutorialStorage';

import type {
  TutorialProgress,
  TutorialPreferences,
  CompletionChecklist,
} from '../tutorialStorage';

describe('LegacyTutorialStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getProgress', () => {
    it('returns null when no progress exists', () => {
      const progress = LegacyTutorialStorage.getProgress('test-tour');
      expect(progress).toBeNull();
    });

    it('returns stored progress for a tour', () => {
      const mockProgress: TutorialProgress = {
        slug: 'test-tour',
        progress: {
          currentStep: 2,
          completedSteps: ['step-1', 'step-2'],
          tourType: 'full-onboarding',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 5,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('test-tour', mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress('test-tour');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.slug).toBe('test-tour');
      expect(retrieved?.progress.currentStep).toBe(2);
      expect(retrieved?.progress.completedSteps).toEqual(['step-1', 'step-2']);
    });

    it('uses __default__ slug when not specified', () => {
      const mockProgress: TutorialProgress = {
        slug: '__default__',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'full-onboarding',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 4,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('__default__', mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.slug).toBe('__default__');
    });

    it('handles profile-specific progress', () => {
      const progress1: TutorialProgress = {
        slug: 'tour-1',
        progress: {
          currentStep: 1,
          completedSteps: ['step-1'],
          tourType: 'feature-tour',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 3,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      const progress2: TutorialProgress = {
        slug: 'tour-1',
        progress: {
          currentStep: 2,
          completedSteps: ['step-1', 'step-2'],
          tourType: 'feature-tour',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 3,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('tour-1', progress1, 'profile-1');
      LegacyTutorialStorage.setProgress('tour-1', progress2, 'profile-2');

      const retrieved1 = LegacyTutorialStorage.getProgress('tour-1', 'profile-1');
      const retrieved2 = LegacyTutorialStorage.getProgress('tour-1', 'profile-2');

      expect(retrieved1?.progress.currentStep).toBe(1);
      expect(retrieved2?.progress.currentStep).toBe(2);
    });

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('inkwell:tutorial:progress:broken', 'not valid json');
      const progress = LegacyTutorialStorage.getProgress('broken');
      expect(progress).toBeNull();
    });
  });

  describe('setProgress', () => {
    it('stores progress in localStorage', () => {
      const mockProgress: TutorialProgress = {
        slug: 'test',
        progress: {
          currentStep: 1,
          completedSteps: ['intro'],
          tourType: 'contextual-help',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 3,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('test', mockProgress);

      const key = 'inkwell:tutorial:progress:test';
      const stored = localStorage.getItem(key);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.slug).toBe('test');
    });

    it('updates existing progress', () => {
      const initial: TutorialProgress = {
        slug: 'tour',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'full-onboarding',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 4,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('tour', initial);

      const updated: TutorialProgress = {
        ...initial,
        progress: {
          ...initial.progress,
          currentStep: 2,
          completedSteps: ['step-1', 'step-2'],
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('tour', updated);

      const retrieved = LegacyTutorialStorage.getProgress('tour');
      expect(retrieved?.progress.currentStep).toBe(2);
      expect(retrieved?.progress.completedSteps).toHaveLength(2);
    });

    it('handles localStorage errors silently', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      const mockProgress: TutorialProgress = {
        slug: 'test',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'full-onboarding',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 4,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      // Should not throw
      expect(() => LegacyTutorialStorage.setProgress('test', mockProgress)).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('getPreferences', () => {
    it('returns null when no preferences exist', () => {
      const prefs = LegacyTutorialStorage.getPreferences();
      expect(prefs).toBeNull();
    });

    it('returns stored preferences', () => {
      const mockPrefs: TutorialPreferences = {
        neverShowAgain: true,
        remindMeLater: false,
        completedTours: ['tour-1', 'tour-2'],
        tourDismissals: 3,
        hasLaunched: true,
      };

      localStorage.setItem('inkwell:tutorial:preferences', JSON.stringify(mockPrefs));

      const retrieved = LegacyTutorialStorage.getPreferences();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.neverShowAgain).toBe(true);
      expect(retrieved?.completedTours).toEqual(['tour-1', 'tour-2']);
      expect(retrieved?.hasLaunched).toBe(true);
    });

    it('handles profile-specific preferences', () => {
      const prefs1: TutorialPreferences = {
        neverShowAgain: true,
        remindMeLater: false,
        completedTours: ['tour-a'],
        tourDismissals: 1,
      };

      const prefs2: TutorialPreferences = {
        neverShowAgain: false,
        remindMeLater: true,
        remindMeLaterUntil: Date.now() + 86400000,
        completedTours: ['tour-b', 'tour-c'],
        tourDismissals: 0,
      };

      localStorage.setItem('inkwell:tutorial:profile-1:preferences', JSON.stringify(prefs1));
      localStorage.setItem('inkwell:tutorial:profile-2:preferences', JSON.stringify(prefs2));

      const retrieved1 = LegacyTutorialStorage.getPreferences('profile-1');
      const retrieved2 = LegacyTutorialStorage.getPreferences('profile-2');

      expect(retrieved1?.neverShowAgain).toBe(true);
      expect(retrieved2?.neverShowAgain).toBe(false);
      expect(retrieved2?.remindMeLaterUntil).toBeDefined();
    });

    it('handles corrupted preferences gracefully', () => {
      localStorage.setItem('inkwell:tutorial:preferences', 'not json');
      const prefs = LegacyTutorialStorage.getPreferences();
      expect(prefs).toBeNull();
    });
  });

  describe('getChecklist', () => {
    it('returns null when no checklist exists', () => {
      const checklist = LegacyTutorialStorage.getChecklist();
      expect(checklist).toBeNull();
    });

    it('returns stored checklist', () => {
      const mockChecklist: CompletionChecklist = {
        createProject: true,
        addChapter: true,
        addCharacter: false,
        writeContent: true,
        useTimeline: false,
        exportProject: false,
        useAI: false,
      };

      localStorage.setItem('inkwell:tutorial:checklist', JSON.stringify(mockChecklist));

      const retrieved = LegacyTutorialStorage.getChecklist();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.createProject).toBe(true);
      expect(retrieved?.addCharacter).toBe(false);
    });

    it('handles profile-specific checklists', () => {
      const checklist1: CompletionChecklist = {
        createProject: true,
        addChapter: true,
        addCharacter: true,
        writeContent: false,
        useTimeline: false,
        exportProject: false,
        useAI: false,
      };

      const checklist2: CompletionChecklist = {
        createProject: true,
        addChapter: true,
        addCharacter: true,
        writeContent: true,
        useTimeline: true,
        exportProject: true,
        useAI: true,
      };

      localStorage.setItem('inkwell:tutorial:profile-1:checklist', JSON.stringify(checklist1));
      localStorage.setItem('inkwell:tutorial:profile-2:checklist', JSON.stringify(checklist2));

      const retrieved1 = LegacyTutorialStorage.getChecklist('profile-1');
      const retrieved2 = LegacyTutorialStorage.getChecklist('profile-2');

      expect(retrieved1?.writeContent).toBe(false);
      expect(retrieved2?.writeContent).toBe(true);
      expect(retrieved2?.useAI).toBe(true);
    });

    it('handles corrupted checklist gracefully', () => {
      localStorage.setItem('inkwell:tutorial:checklist', '{invalid json');
      const checklist = LegacyTutorialStorage.getChecklist();
      expect(checklist).toBeNull();
    });
  });

  describe('getAllLegacyKeys', () => {
    it('returns empty array when no legacy keys exist', () => {
      const keys = LegacyTutorialStorage.getAllLegacyKeys();
      expect(keys).toEqual([]);
    });

    it('finds all legacy tutorial keys', () => {
      localStorage.setItem('inkwell:tutorial:progress:tour-1', '{}');
      localStorage.setItem('inkwell:tutorial:preferences', '{}');
      localStorage.setItem('inkwell:tutorial:profile-1:checklist', '{}');
      localStorage.setItem('other:key', 'should not match');

      const keys = LegacyTutorialStorage.getAllLegacyKeys();

      expect(keys.length).toBe(3);
      expect(keys.every((k) => k.startsWith('inkwell:tutorial:'))).toBe(true);
    });

    it('includes profile-scoped keys', () => {
      localStorage.setItem('inkwell:tutorial:profile-123:progress:tour', '{}');
      localStorage.setItem('inkwell:tutorial:profile-456:preferences', '{}');

      const keys = LegacyTutorialStorage.getAllLegacyKeys();

      expect(keys).toContain('inkwell:tutorial:profile-123:progress:tour');
      expect(keys).toContain('inkwell:tutorial:profile-456:preferences');
    });
  });

  describe('clearLegacyData', () => {
    it('clears all tutorial keys when no profile specified', () => {
      localStorage.setItem('inkwell:tutorial:progress:tour-1', '{}');
      localStorage.setItem('inkwell:tutorial:preferences', '{}');
      localStorage.setItem('inkwell:tutorial:checklist', '{}');
      localStorage.setItem('other:key', 'keep this');

      LegacyTutorialStorage.clearLegacyData();

      expect(localStorage.getItem('inkwell:tutorial:progress:tour-1')).toBeNull();
      expect(localStorage.getItem('inkwell:tutorial:preferences')).toBeNull();
      expect(localStorage.getItem('inkwell:tutorial:checklist')).toBeNull();
      expect(localStorage.getItem('other:key')).toBe('keep this');
    });

    it('clears only specified profile keys', () => {
      localStorage.setItem('inkwell:tutorial:profile-1:progress:tour', '{}');
      localStorage.setItem('inkwell:tutorial:profile-1:preferences', '{}');
      localStorage.setItem('inkwell:tutorial:profile-2:progress:tour', '{}');
      localStorage.setItem('inkwell:tutorial:global:preferences', '{}');

      LegacyTutorialStorage.clearLegacyData('profile-1');

      expect(localStorage.getItem('inkwell:tutorial:profile-1:progress:tour')).toBeNull();
      expect(localStorage.getItem('inkwell:tutorial:profile-1:preferences')).toBeNull();
      expect(localStorage.getItem('inkwell:tutorial:profile-2:progress:tour')).not.toBeNull();
      expect(localStorage.getItem('inkwell:tutorial:global:preferences')).not.toBeNull();
    });

    it('handles empty localStorage gracefully', () => {
      expect(() => LegacyTutorialStorage.clearLegacyData()).not.toThrow();
    });
  });

  describe('Key Generation', () => {
    it('generates correct key for progress', () => {
      const mockProgress: TutorialProgress = {
        slug: 'my-tour',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'feature-tour',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 3,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('my-tour', mockProgress);

      const key = 'inkwell:tutorial:progress:my-tour';
      expect(localStorage.getItem(key)).toBeTruthy();
    });

    it('generates profile-scoped keys', () => {
      const mockProgress: TutorialProgress = {
        slug: 'tour',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'full-onboarding',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 4,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('tour', mockProgress, 'my-profile');

      const key = 'inkwell:tutorial:my-profile:progress:tour';
      expect(localStorage.getItem(key)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long tour slugs', () => {
      const longSlug = 'a'.repeat(500);
      const mockProgress: TutorialProgress = {
        slug: longSlug,
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'feature-tour',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 1,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress(longSlug, mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress(longSlug);

      expect(retrieved?.slug).toBe(longSlug);
    });

    it('handles special characters in slugs', () => {
      const specialSlug = 'tour-with-special-chars_@#$%';
      const mockProgress: TutorialProgress = {
        slug: specialSlug,
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'contextual-help',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 2,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress(specialSlug, mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress(specialSlug);

      expect(retrieved?.slug).toBe(specialSlug);
    });

    it('handles timestamps correctly', () => {
      const now = Date.now();
      const mockProgress: TutorialProgress = {
        slug: 'tour',
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: 'full-onboarding',
          startedAt: now,
          completedAt: now + 1000,
          isCompleted: true,
          totalSteps: 1,
          lastActiveAt: now + 2000,
        },
        updatedAt: now + 3000,
      };

      LegacyTutorialStorage.setProgress('tour', mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress('tour');

      expect(retrieved?.progress.startedAt).toBe(now);
      expect(retrieved?.progress.completedAt).toBe(now + 1000);
      expect(retrieved?.progress.lastActiveAt).toBe(now + 2000);
      expect(retrieved?.updatedAt).toBe(now + 3000);
    });

    it('preserves array order in completedSteps', () => {
      const steps = ['step-3', 'step-1', 'step-5', 'step-2', 'step-4'];
      const mockProgress: TutorialProgress = {
        slug: 'tour',
        progress: {
          currentStep: 5,
          completedSteps: steps,
          tourType: 'feature-tour',
          startedAt: Date.now(),
          isCompleted: false,
          totalSteps: 5,
          lastActiveAt: Date.now(),
        },
        updatedAt: Date.now(),
      };

      LegacyTutorialStorage.setProgress('tour', mockProgress);
      const retrieved = LegacyTutorialStorage.getProgress('tour');

      expect(retrieved?.progress.completedSteps).toEqual(steps);
    });
  });
});
