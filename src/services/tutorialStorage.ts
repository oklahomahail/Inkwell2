// src/services/tutorialStorage.ts
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
 * Hook for managing tutorial storage per profile
 * Integrates with the per-profile database system for complete data isolation
 */
export function useTutorialStorage() {
  const { active: activeProfile } = useProfile();
  const db = useMaybeDB(); // Lenient DB access for global providers
  const stores = defineStores();
  
  // Flag to indicate if profile is active and DB is available
  const isProfileActive = !!(activeProfile?.id && db);

  const getProgress = useCallback(
    async (slug: string): Promise<TutorialProgress | null> => {
      if (!db || !activeProfile?.id) return null;

      try {
        const progressKey = `${stores.tutorials}_${slug}`;
        const result = await db.get<TutorialProgress>(progressKey);
        return result || null;
      } catch (error) {
        console.warn(`Failed to get tutorial progress for ${slug}:`, error);
        return null;
      }
    },
    [db, activeProfile?.id, stores],
  );

  const setProgress = useCallback(
    async (slug: string, progress: TutorialProgress['progress']) => {
      if (!db || !activeProfile?.id) return;

      try {
        const tutorialProgress: TutorialProgress = {
          slug,
          progress,
          updatedAt: Date.now(),
        };

        const progressKey = `${stores.tutorials}_${slug}`;
        await db.put(progressKey, tutorialProgress);
      } catch (error) {
        console.warn(`Failed to save tutorial progress for ${slug}:`, error);
      }
    },
    [db, activeProfile?.id, stores],
  );

  const clearProgress = useCallback(
    async (slug?: string) => {
      if (!db || !activeProfile?.id) return;

      try {
        if (slug) {
          const progressKey = `${stores.tutorials}_${slug}`;
          await db.delete(progressKey);
        } else {
          // Clear all tutorial progress by listing keys and deleting them
          const keys = await db.list(stores.tutorials);
          for (const key of keys) {
            await db.delete(key);
          }
        }
      } catch (error) {
        console.warn(`Failed to clear tutorial progress:`, error);
      }
    },
    [db, activeProfile?.id, stores],
  );

  const getPreferences = useCallback(async (): Promise<TutorialPreferences | null> => {
    if (!db || !activeProfile?.id) return null;

    try {
      const result = await db.get<TutorialPreferences>(stores.tutorialPreferences);
      return result || null;
    } catch (error) {
      console.warn('Failed to get tutorial preferences:', error);
      return null;
    }
  }, [db, activeProfile?.id, stores]);

  const setPreferences = useCallback(
    async (preferences: TutorialPreferences) => {
      if (!db || !activeProfile?.id) return;

      try {
        const data = {
          ...preferences,
          updatedAt: Date.now(),
        };
        await db.put(stores.tutorialPreferences, data);
      } catch (error) {
        console.warn('Failed to save tutorial preferences:', error);
      }
    },
    [db, activeProfile?.id, stores],
  );

  const getChecklist = useCallback(async (): Promise<CompletionChecklist | null> => {
    if (!db || !activeProfile?.id) return null;

    try {
      const result = await db.get<CompletionChecklist>(stores.tutorialChecklist);
      return result || null;
    } catch (error) {
      console.warn('Failed to get completion checklist:', error);
      return null;
    }
  }, [db, activeProfile?.id, stores]);

  const setChecklist = useCallback(
    async (checklist: CompletionChecklist) => {
      if (!db || !activeProfile?.id) return;

      try {
        const data = {
          ...checklist,
          updatedAt: Date.now(),
        };
        await db.put(stores.tutorialChecklist, data);
      } catch (error) {
        console.warn('Failed to save completion checklist:', error);
      }
    },
    [db, activeProfile?.id, stores],
  );

  const getAllProgress = useCallback(async (): Promise<TutorialProgress[]> => {
    if (!db || !activeProfile?.id) return [];

    try {
      const keys = await db.list(stores.tutorials);
      const progressData: TutorialProgress[] = [];

      for (const key of keys) {
        const data = await db.get<TutorialProgress>(key);
        if (data) {
          progressData.push(data);
        }
      }

      return progressData;
    } catch (error) {
      console.warn('Failed to get all tutorial progress:', error);
      return [];
    }
  }, [db, activeProfile?.id, stores]);

  return {
    // Core progress methods
    getProgress,
    setProgress,
    clearProgress,
    getAllProgress,

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
 * Used during the migration process to read old data
 */
export class LegacyTutorialStorage {
  private static getKey(suffix: string, profileId?: string): string {
    if (profileId) {
      return `inkwell:tutorial:${profileId}:${suffix}`;
    }
    return `inkwell:tutorial:${suffix}`;
  }

  static getProgress(slug: string, profileId?: string): TutorialProgress | null {
    try {
      const key = this.getKey(`progress:${slug}`, profileId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to get legacy tutorial progress for ${slug}:`, error);
      return null;
    }
  }

  static setProgress(slug: string, progress: TutorialProgress, profileId?: string): void {
    try {
      const key = this.getKey(`progress:${slug}`, profileId);
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.warn(`Failed to save legacy tutorial progress for ${slug}:`, error);
    }
  }

  static getPreferences(profileId?: string): TutorialPreferences | null {
    try {
      const key = this.getKey('preferences', profileId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to get legacy tutorial preferences:', error);
      return null;
    }
  }

  static getChecklist(profileId?: string): CompletionChecklist | null {
    try {
      const key = this.getKey('checklist', profileId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to get legacy completion checklist:', error);
      return null;
    }
  }

  static getAllLegacyKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('inkwell:tutorial:') || key?.includes('tour-progress')) {
        keys.push(key);
      }
    }
    return keys;
  }

  static clearLegacyData(profileId?: string): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove profile-specific keys or global keys if no profileId
      if (profileId) {
        if (key.includes(`tutorial:${profileId}:`)) {
          keysToRemove.push(key);
        }
      } else {
        if (key.startsWith('inkwell:tutorial:') && !key.includes(':profile:')) {
          keysToRemove.push(key);
        }
        // Also remove the old TourProvider keys
        if (key.includes('tour-progress') || key.includes('completion-checklist')) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}

/**
 * Migrate legacy tutorial data to the new profile-based system
 * Called during profile migration
 */
export async function migrateLegacyTutorialData(
  profileId: string,
  db: any, // ProfileStorageManager type
  isFirstProfile: boolean = false,
): Promise<void> {
  const stores = defineStores();
  console.log(`Migrating tutorial data for profile ${profileId}...`);

  try {
    // Migrate global legacy data to first profile only
    if (isFirstProfile) {
      // Old TourProvider localStorage keys
      const oldProgress = localStorage.getItem('inkwell-tour-progress');
      const oldPreferences = localStorage.getItem('inkwell-tour-progress-preferences');
      const oldChecklist = localStorage.getItem('inkwell-completion-checklist');

      if (oldProgress) {
        try {
          const parsed = JSON.parse(oldProgress);
          if (parsed.completedSteps || parsed.isFirstTimeUser !== undefined) {
            await db.put(stores.tutorialPreferences, {
              neverShowAgain: false,
              remindMeLater: false,
              completedTours: parsed.completedSteps ? ['full-onboarding'] : [],
              tourDismissals: 0,
              updatedAt: Date.now(),
            });
          }
        } catch (e) {
          console.warn('Failed to migrate old tour progress:', e);
        }
      }

      if (oldPreferences) {
        try {
          const parsed = JSON.parse(oldPreferences);
          await db.put(stores.tutorialPreferences, {
            neverShowAgain: parsed.neverShowAgain || false,
            remindMeLater: parsed.remindMeLater || false,
            remindMeLaterUntil: parsed.remindMeLaterUntil,
            completedTours: parsed.completedTours || [],
            tourDismissals: parsed.tourDismissals || 0,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn('Failed to migrate old preferences:', e);
        }
      }

      if (oldChecklist) {
        try {
          const parsed = JSON.parse(oldChecklist);
          await db.put(stores.tutorialChecklist, {
            ...parsed,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn('Failed to migrate old checklist:', e);
        }
      }

      // Clean up old global keys
      localStorage.removeItem('inkwell-tour-progress');
      localStorage.removeItem('inkwell-tour-progress-preferences');
      localStorage.removeItem('inkwell-completion-checklist');
      localStorage.removeItem('inkwell-tour-analytics');
    }

    // Migrate any profile-specific legacy data
    const legacyProgress = LegacyTutorialStorage.getPreferences(profileId);
    if (legacyProgress) {
      await db.put(stores.tutorialPreferences, {
        ...legacyProgress,
        updatedAt: Date.now(),
      });
    }

    const legacyChecklist = LegacyTutorialStorage.getChecklist(profileId);
    if (legacyChecklist) {
      await db.put(stores.tutorialChecklist, {
        ...legacyChecklist,
        updatedAt: Date.now(),
      });
    }

    // Clean up profile-specific legacy keys
    LegacyTutorialStorage.clearLegacyData(profileId);

    console.log(`Tutorial data migration completed for profile ${profileId}`);
  } catch (error) {
    console.error(`Failed to migrate tutorial data for profile ${profileId}:`, error);
    // Don't throw - let the profile migration continue
  }
}
