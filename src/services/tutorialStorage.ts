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

export function useTutorialStorage() {
  const { active: activeProfile } = useProfile();
  const db = useMaybeDB();
  const stores = defineStores();

  const isProfileActive = !!(activeProfile?.id && db);

  const getProgress = useCallback(
    async (slug: string): Promise<TutorialProgress | null> => {
      // Implementation
      return null;
    },
    [db, activeProfile?.id, stores],
  );

  const setProgress = useCallback(
    async (slug: string, progress: TutorialProgress['progress']) => {
      // Implementation
    },
    [db, activeProfile?.id, stores],
  );

  const clearProgress = useCallback(
    async (slug?: string) => {
      // Implementation
    },
    [db, activeProfile?.id, stores],
  );

  const getPreferences = useCallback(async (): Promise<TutorialPreferences | null> => {
    // Implementation
    return null;
  }, [db, activeProfile?.id, stores]);

  const setPreferences = useCallback(
    async (preferences: TutorialPreferences) => {
      // Implementation
    },
    [db, activeProfile?.id, stores],
  );

  const getChecklist = useCallback(async (): Promise<CompletionChecklist | null> => {
    // Implementation
    return null;
  }, [db, activeProfile?.id, stores]);

  const setChecklist = useCallback(
    async (checklist: CompletionChecklist) => {
      // Implementation
    },
    [db, activeProfile?.id, stores],
  );

  const getAllProgress = useCallback(async (): Promise<TutorialProgress[]> => {
    // Implementation
    return [];
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
 */
export class LegacyTutorialStorage {
  private static getKey(suffix: string, profileId?: string): string {
    if (profileId) {
      return `inkwell:tutorial:${profileId}:${suffix}`;
    }
    return `inkwell:tutorial:${suffix}`;
  }

  static getProgress(slug: string, profileId?: string): TutorialProgress | null {
    // Implementation
    return null;
  }

  static setProgress(slug: string, progress: TutorialProgress, profileId?: string): void {
    // Implementation
  }

  static getPreferences(profileId?: string): TutorialPreferences | null {
    // Implementation
    return null;
  }

  static getChecklist(profileId?: string): CompletionChecklist | null {
    // Implementation
    return null;
  }

  static getAllLegacyKeys(): string[] {
    // Implementation
    return [];
  }

  static clearLegacyData(profileId?: string): void {
    // Implementation
  }
}

export async function migrateLegacyTutorialData(
  profileId: string,
  db: any, // ProfileStorageManager type
  isFirstProfile: boolean = false,
): Promise<void> {
  // Implementation
}
