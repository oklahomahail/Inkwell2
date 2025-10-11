import { useCallback } from 'react';

import { useProfile } from '../context/ProfileContext';
import { useMaybeDB, defineStores } from '../data/dbFactory';

export interface TutorialProgress {
  slug: string;
  progress: {
    currentStep: number;
    completedSteps: string[];
    tourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
    startedAt: number;
    completedAt?: number;
    isCompleted: boolean;
    totalSteps: number;
    lastActiveAt: number;
  };
  updatedAt: number;
}

export interface TutorialPreferences {
  neverShowAgain: boolean;
  remindMeLater: boolean;
  remindMeLaterUntil?: number;
  completedTours: string[];
  tourDismissals: number;
}

export interface CompletionChecklist {
  createProject: boolean;
  addChapter: boolean;
  addCharacter: boolean;
  writeContent: boolean;
  useTimeline: boolean;
  exportProject: boolean;
  useAI: boolean;
}

/**
 * Hook for managing tutorial progress, preferences, and checklist data.
 */
export function _useTutorialStorage() {
  const { active: activeProfile } = useProfile();
  const db = useMaybeDB();
  const stores = defineStores(db);

  const isProfileActive = Boolean(activeProfile?.id && db);

  const getProgress = useCallback(
    async (slug: string): Promise<TutorialProgress | null> => {
      if (!isProfileActive) return null;
      // TODO: implement IndexedDB get logic
      return null;
    },
    [db, activeProfile?.id, stores, isProfileActive],
  );

  const setProgress = useCallback(
    async (slug: string, _progress: TutorialProgress['progress']) => {
      if (!isProfileActive) return;
      // TODO: implement IndexedDB put logic
    },
    [db, activeProfile?.id, stores, isProfileActive],
  );

  const clearProgress = useCallback(
    async (slug?: string) => {
      if (!isProfileActive) return;
      // TODO: implement clear logic for one or all progress entries
    },
    [db, activeProfile?.id, stores, isProfileActive],
  );

  const getPreferences = useCallback(async (): Promise<TutorialPreferences | null> => {
    if (!isProfileActive) return null;
    // TODO: implement get preferences logic
    return null;
  }, [db, activeProfile?.id, stores, isProfileActive]);

  const setPreferences = useCallback(
    async (preferences: TutorialPreferences) => {
      if (!isProfileActive) return;
      // TODO: implement save preferences logic
    },
    [db, activeProfile?.id, stores, isProfileActive],
  );

  const getChecklist = useCallback(async (): Promise<CompletionChecklist | null> => {
    if (!isProfileActive) return null;
    // TODO: implement get checklist logic
    return null;
  }, [db, activeProfile?.id, stores, isProfileActive]);

  const setChecklist = useCallback(
    async (checklist: CompletionChecklist) => {
      if (!isProfileActive) return;
      // TODO: implement save checklist logic
    },
    [db, activeProfile?.id, stores, isProfileActive],
  );

  const getAllProgress = useCallback(async (): Promise<TutorialProgress[]> => {
    if (!isProfileActive) return [];
    // TODO: implement get all progress logic
    return [];
  }, [db, activeProfile?.id, stores, isProfileActive]);

  /**
   * Reset a tour's progress so it can be relaunched from step 0.
   * totalSteps is optional; if omitted we'll keep whatever was there (or default to 4).
   * tourType is optional; defaults to 'full-onboarding' to match first-run.
   */
  const resetProgress = useCallback(
    async (
      slug: string,
      _totalSteps?: number,
      _tourType: TutorialProgress['progress']['tourType'] = 'full-onboarding',
    ) => {
      if (!isProfileActive) return;
      const existing = await getProgress(slug);
      const now = Date.now();
      const currentTotal = _totalSteps ?? existing?.progress.totalSteps ?? 4;
      const payload: TutorialProgress = {
        slug,
        updatedAt: now,
        progress: {
          currentStep: 0,
          completedSteps: [],
          tourType: _tourType,
          startedAt: now,
          completedAt: undefined,
          isCompleted: false,
          totalSteps: currentTotal,
          lastActiveAt: now,
        },
      };
      await setProgress(slug, payload.progress);
    },
    [db, activeProfile?.id, getProgress, setProgress, isProfileActive],
  );

  return {
    // Core progress methods
    getProgress,
    setProgress,
    clearProgress,
    getAllProgress,

    // Reset utility
    resetProgress,

    // Preferences methods
    getPreferences,
    setPreferences,

    // Checklist methods
    getChecklist,
    setChecklist,

    // Profile context
    profileId: activeProfile?.id || null,
    isProfileActive,
  };
}

/**
 * Legacy localStorage-based storage (fallback for migration)
 */
export class LegacyTutorialStorage {
  private static getKey(suffix: string, profileId?: string): string {
    return profileId ? `inkwell:tutorial:${profileId}:${suffix}` : `inkwell:tutorial:${suffix}`;
  }

  static getProgress(slug: string, profileId?: string): TutorialProgress | null {
    try {
      const key = this.getKey(`progress:${slug}`, profileId);
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as TutorialProgress) : null;
    } catch {
      return null;
    }
  }

  static setProgress(slug: string, progress: TutorialProgress, profileId?: string): void {
    try {
      const key = this.getKey(`progress:${slug}`, profileId);
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      /* ignore */
    }
  }

  static getPreferences(profileId?: string): TutorialPreferences | null {
    try {
      const key = this.getKey('preferences', profileId);
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as TutorialPreferences) : null;
    } catch {
      return null;
    }
  }

  static getChecklist(profileId?: string): CompletionChecklist | null {
    try {
      const key = this.getKey('checklist', profileId);
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as CompletionChecklist) : null;
    } catch {
      return null;
    }
  }

  static getAllLegacyKeys(): string[] {
    return Object.keys(localStorage).filter((k) => k.startsWith('inkwell:tutorial:'));
  }

  static clearLegacyData(profileId?: string): void {
    const prefix = profileId ? `inkwell:tutorial:${profileId}:` : 'inkwell:tutorial:';
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
  }
}

/**
 * Migration helper – migrates old localStorage tutorial data into the new IndexedDB
 */
export async function _migrateLegacyTutorialData(
  profileId: string,
  db: any, // Replace with the correct ProfileStorageManager type
  isFirstProfile = false,
): Promise<void> {
  // TODO: implement migration logic from LegacyTutorialStorage to IndexedDB
  // Use `defineStores(db)` and upsert data into appropriate tables.
}

// Public alias for app code
export const useTutorialStorage = _useTutorialStorage;
