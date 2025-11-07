// src/hooks/useUserPreferences.ts
import { useCallback, useState, useEffect } from 'react';

export type StorageMode = 'local' | 'hybrid';
export type WritingStyle = 'world-builder' | 'writer-first';

export interface UserPreferences {
  storageMode: StorageMode;
  writingStyle: WritingStyle;
  onboardingCompleted: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  storageMode: 'hybrid',
  writingStyle: 'writer-first',
  onboardingCompleted: false,
};

const STORAGE_KEY = 'inkwell.user.preferences';

/**
 * Hook for managing user preferences
 *
 * Stores user choices for:
 * - Storage mode (local-only vs hybrid sync)
 * - Writing style (world-builder vs writer-first)
 * - Onboarding completion status
 */
export function useUserPreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('[useUserPreferences] Failed to load preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Persist to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('[useUserPreferences] Failed to save preferences:', error);
    }
  }, [preferences]);

  const setStorageMode = useCallback((mode: StorageMode) => {
    setPreferencesState((prev) => ({ ...prev, storageMode: mode }));
  }, []);

  const setWritingStyle = useCallback((style: WritingStyle) => {
    setPreferencesState((prev) => ({ ...prev, writingStyle: style }));
  }, []);

  const markOnboardingComplete = useCallback(() => {
    setPreferencesState((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferencesState(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[useUserPreferences] Failed to reset preferences:', error);
    }
  }, []);

  const hasCompletedPreferences = useCallback(() => {
    // Check if user has made their initial choices
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null;
  }, []);

  return {
    preferences,
    storageMode: preferences.storageMode,
    writingStyle: preferences.writingStyle,
    onboardingCompleted: preferences.onboardingCompleted,
    setStorageMode,
    setWritingStyle,
    markOnboardingComplete,
    resetPreferences,
    hasCompletedPreferences,
  };
}
