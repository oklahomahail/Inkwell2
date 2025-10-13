import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import analyticsService from '../../services/analyticsService';

import { hasPromptedThisSession } from './tourGating';

// ===== Singleton token to block double starts (React strict/double effects)
let startToken: string | null = null;

// ===== Storage keys
const STORAGE_KEY = 'inkwell-tour-progress';
const CHECKLIST_KEY = 'inkwell-completion-checklist';

// ===== Types
export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  optional?: boolean;
  order: number;
  view?: string;
  category: 'onboarding' | 'feature-discovery' | 'tips';
}

export interface TourState {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  completedSteps: string[];
  isFirstTimeUser: boolean;
  tourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
}

interface TourPreferences {
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

interface TourContextValue {
  tourState: TourState;
  preferences: TourPreferences;
  checklist: CompletionChecklist;
  startTour: (type: TourState['tourType'], steps?: TourStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  completeStep: (stepId: string) => void;
  goToStep: (idx: number) => void;
  setTourSteps: (steps: TourStep[]) => void;
  isStepCompleted: (stepId: string) => boolean;
  getCurrentStep: () => TourStep | null;
  resetTour: () => void;
  setNeverShowAgain: () => void;
  setRemindMeLater: (hours?: number) => void;
  shouldShowTourPrompt: () => boolean;
  updateChecklist: (item: keyof CompletionChecklist) => void;
  getChecklistProgress: () => { completed: number; total: number };
  logAnalytics: (event: string, data?: any) => void;
  canShowContextualTour: (tourType: string) => boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

// ===== Defaults
const defaultTourState: TourState = {
  isActive: false,
  currentStep: 0,
  steps: [],
  completedSteps: [],
  isFirstTimeUser: true,
  tourType: 'full-onboarding',
};

const defaultPreferences: TourPreferences = {
  neverShowAgain: false,
  remindMeLater: false,
  completedTours: [],
  tourDismissals: 0,
};

const defaultChecklist: CompletionChecklist = {
  createProject: false,
  addChapter: false,
  addCharacter: false,
  writeContent: false,
  useTimeline: false,
  exportProject: false,
  useAI: false,
};

// ===== Helpers
const isSuppressed = () => !!sessionStorage.getItem('inkwell:tour:suppress');

// Global kill switch for “quick” style tours (treat full-onboarding as the quick tour)
const QUICK_TOUR_DISABLED = true;
const isQuickTour = (t: TourState['tourType']) => t === 'full-onboarding';

const cleanupTourParams = () => {
  const url = new URL(window.location.href);
  if (url.searchParams.has('tour')) {
    url.searchParams.delete('tour');
    history.replaceState({}, '', url.toString());
    if (import.meta.env.DEV) console.info('[tour] cleaned up tour params');
  }
};

// ===== Provider
export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tourState, setTourState] = useState<TourState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultTourState, ...parsed, isActive: false };
      }
    } catch {}
    return defaultTourState;
  });

  const [preferences, setPreferences] = useState<TourPreferences>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-preferences`);
      if (saved) return { ...defaultPreferences, ...JSON.parse(saved) };
    } catch {}
    return defaultPreferences;
  });

  const [checklist, setChecklist] = useState<CompletionChecklist>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) return { ...defaultChecklist, ...JSON.parse(saved) };
    } catch {}
    return defaultChecklist;
  });

  // Persist bits we care about (never auto-start on load)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedSteps: tourState.completedSteps,
          isFirstTimeUser: tourState.isFirstTimeUser,
        }),
      );
    } catch {}
  }, [tourState.completedSteps, tourState.isFirstTimeUser]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-preferences`, JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    } catch {}
  }, [checklist]);

  // Provider-owned analytics (single source of truth)
  const logAnalytics = (event: string, data: any = {}) => {
    const payload = { ...data, tourType: tourState.tourType, step: tourState.currentStep };
    try {
      analyticsService.trackEvent(event as any, payload);
      (analyticsService as any).track?.(event as any, payload);
      if (import.meta.env.DEV) console.info('[tour.analytics]', event, payload);
    } catch {}
  };

  const cleanupTourParams = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('tour')) {
      url.searchParams.delete('tour');
      history.replaceState({}, '', url.toString());
      if (import.meta.env.DEV) console.info('[tour] cleaned up tour params');
    }
  };

  const startTour = (type: TourState['tourType'], steps?: TourStep[]) => {
    // Check route suppression
    const suppressedRoute = sessionStorage.getItem('inkwell:tour:suppress');
    if (suppressedRoute) {
      if (import.meta.env.DEV)
        console.info('[tour] start blocked by suppression:', suppressedRoute);
      return;
    }
    if (import.meta.env.DEV) console.info('[tour] startTour', { type, steps: steps?.length ?? 0 });

    // Global quick-tour kill switch
    if (QUICK_TOUR_DISABLED && isQuickTour(type)) {
      if (import.meta.env.DEV) console.info('[tour] quick tour disabled globally, ignoring');
      cleanupTourParams();
      return;
    }

    // Route suppression (skip in tests)
    if (!import.meta.env.TEST && isSuppressed()) {
      if (import.meta.env.DEV) console.info('[tour] suppressed by route');
      cleanupTourParams();
      return;
    }

    // Prevent duplicates (warning in non-test)
    if (tourState.isActive || startToken) {
      if (!import.meta.env.TEST) {
        console.warn('Tour already active, ignoring duplicate start request');
      }
      if (import.meta.env.DEV) console.info('[tour] already starting/active, skip');
      return;
    }
    startToken = `${type}:${Date.now()}`;

    // Commit state then analytics
    try {
      // Clean up URL params immediately
      cleanupTourParams();

      // Singleton token to prevent race conditions
      const token = `${type}:${Date.now()}`;
      if (startToken) {
        if (import.meta.env.DEV) {
          console.info('[tour] start blocked by token:', {
            existing: startToken,
            attempted: token,
          });
        }
        return;
      }
      startToken = token;

      try {
        setTourState((prev) => ({
          ...prev,
          isActive: true,
          currentStep: 0,
          tourType: type,
          steps: steps || prev.steps,
        }));
      } finally {
        // Clear token after state commit microtask
        queueMicrotask(() => {
          startToken = null;
        });
      }
      cleanupTourParams();

      // The ONLY 'tour_started' emission lives here
      logAnalytics('tour_started', { entryPoint: 'provider' });
    } finally {
      queueMicrotask(() => {
        startToken = null;
      });
    }
  };

  const nextStep = () =>
    setTourState((prev) =>
      prev.currentStep < prev.steps.length - 1
        ? { ...prev, currentStep: prev.currentStep + 1 }
        : { ...prev, isActive: false, isFirstTimeUser: false },
    );

  const previousStep = () =>
    setTourState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));

  const skipTour = () => {
    logAnalytics('tour_skipped', {
      step: tourState.currentStep,
      totalSteps: tourState.steps.length,
    });
    setTourState((p) => ({ ...p, isActive: false, isFirstTimeUser: false }));
  };

  const completeTour = () => {
    logAnalytics('tour_completed', { stepsCompleted: tourState.steps.length });
    setPreferences((p) => ({
      ...p,
      completedTours: [...new Set([...p.completedTours, tourState.tourType])],
    }));
    setTourState((p) => ({
      ...p,
      isActive: false,
      isFirstTimeUser: false,
      completedSteps: [...new Set([...p.completedSteps, ...p.steps.map((s) => s.id)])],
    }));
  };

  const completeStep = (stepId: string) =>
    setTourState((p) => ({ ...p, completedSteps: [...new Set([...p.completedSteps, stepId])] }));

  const goToStep = (idx: number) =>
    setTourState((p) => ({ ...p, currentStep: Math.max(0, Math.min(idx, p.steps.length - 1)) }));

  const setTourSteps = (steps: TourStep[]) =>
    setTourState((p) => ({ ...p, steps: [...steps].sort((a, b) => a.order - b.order) }));

  const isStepCompleted = (id: string) => tourState.completedSteps.includes(id);

  const getCurrentStep = () =>
    !tourState.isActive || tourState.steps.length === 0
      ? null
      : (tourState.steps[tourState.currentStep] ?? null);

  const resetTour = () => {
    setTourState({ ...defaultTourState, isFirstTimeUser: true });
    setPreferences(defaultPreferences);
    setChecklist(defaultChecklist);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-preferences`);
    localStorage.removeItem(CHECKLIST_KEY);
  };

  const setNeverShowAgain = () => {
    setPreferences((p) => ({ ...p, neverShowAgain: true }));
    logAnalytics('tour_never_show_again');
  };

  const setRemindMeLater = (hours = 24) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    setPreferences((p) => ({
      ...p,
      remindMeLater: true,
      remindMeLaterUntil: until,
      tourDismissals: p.tourDismissals + 1,
    }));
    logAnalytics('tour_remind_me_later', { hours });
  };

  const shouldShowTourPrompt = () => {
    // Always true in tests when not prompted
    if (import.meta.env.TEST) {
      return !hasPromptedThisSession(window.sessionStorage);
    }
    return false; // prompt fully disabled while quick tour is off
  };

  const updateChecklist = (item: keyof CompletionChecklist) => {
    setChecklist((p) => ({ ...p, [item]: true }));
    logAnalytics('checklist_item_completed', { item });
  };

  const getChecklistProgress = () => {
    const vals = Object.values(checklist);
    return { completed: vals.filter(Boolean).length, total: vals.length };
  };

  const canShowContextualTour = (tourType: string) => {
    if (tourState.isActive) return false;
    if (preferences.completedTours.includes(tourType)) return false;
    if (preferences.neverShowAgain) return false;
    return true;
  };

  const value: TourContextValue = {
    tourState,
    preferences,
    checklist,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    completeStep,
    goToStep,
    setTourSteps,
    isStepCompleted,
    getCurrentStep,
    resetTour,
    setNeverShowAgain,
    setRemindMeLater,
    shouldShowTourPrompt,
    updateChecklist,
    getChecklistProgress,
    logAnalytics,
    canShowContextualTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
};
