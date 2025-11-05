/**
 * useOnboarding Hook
 *
 * Provides access to welcome project state and actions.
 * Minimal hook to expose onboarding functionality to components.
 */

import { useState, useEffect, useCallback } from 'react';

import {
  getWelcomeProjectId,
  isWelcomeProject,
  hasTourBeenSeen,
  skipTutorial,
  completeWelcomeFlow,
} from '@/onboarding/welcomeProject';

export interface OnboardingState {
  welcomeProjectId: string | null;
  isOnboarding: boolean;
  hasTourBeenSeen: boolean;
}

export interface OnboardingActions {
  skipTutorial: () => Promise<void>;
  completeWelcomeFlow: () => Promise<void>;
  isWelcomeProject: (projectId: string) => boolean;
}

export interface UseOnboardingReturn extends OnboardingState, OnboardingActions {}

/**
 * Hook to manage onboarding state and actions
 */
export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>({
    welcomeProjectId: getWelcomeProjectId(),
    isOnboarding: !!getWelcomeProjectId(),
    hasTourBeenSeen: hasTourBeenSeen(),
  });

  // Update state when localStorage changes (e.g., another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setState({
        welcomeProjectId: getWelcomeProjectId(),
        isOnboarding: !!getWelcomeProjectId(),
        hasTourBeenSeen: hasTourBeenSeen(),
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSkipTutorial = useCallback(async () => {
    await skipTutorial();
    setState({
      welcomeProjectId: null,
      isOnboarding: false,
      hasTourBeenSeen: true,
    });
  }, []);

  const handleCompleteWelcomeFlow = useCallback(async () => {
    await completeWelcomeFlow();
    setState({
      welcomeProjectId: null,
      isOnboarding: false,
      hasTourBeenSeen: true,
    });
  }, []);

  return {
    ...state,
    skipTutorial: handleSkipTutorial,
    completeWelcomeFlow: handleCompleteWelcomeFlow,
    isWelcomeProject,
  };
}

export default useOnboarding;
