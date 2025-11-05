import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import devLog from '@/utils/devLog';

import analyticsService from '../../services/analyticsService';
import * as tourGatingMod from './tourGating';
import { hasPromptedThisSession } from './tourGating';

// Re-export the tour map for backwards compatibility
export {
  TOUR_MAP,
  CORE_TOUR_STEPS,
  WRITING_PANEL_TOUR,
  TIMELINE_PANEL_TOUR,
  ANALYTICS_PANEL_TOUR,
  DASHBOARD_PANEL_TOUR,
  ONBOARDING_STEPS,
  FEATURE_DISCOVERY_STEPS,
} from './tourRegistry';

// ===== Singleton token to block double starts (React strict/double effects)
let startToken: string | null = null;

// ===== Storage keys
const STORAGE_KEY = 'inkwell-tour-progress';
const CHECKLIST_KEY = 'inkwell-completion-checklist';

// ===== Types
import { type TourStep as BaseTourStep } from './tourRegistry';

export interface TourStep extends BaseTourStep {
  action?: 'click' | 'hover' | 'none';
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
  startTour: (type: TourState['tourType'], steps?: TourStep[]) => Promise<void>;
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

const _cleanupTourParams = () => {
  const url = new URL(window.location.href);
  if (url.searchParams.has('tour')) {
    url.searchParams.delete('tour');
    history.replaceState({}, '', url.toString());
    if (import.meta.env.DEV) devLog.debug('[tour] cleaned up tour params');
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
  type TourAnalyticsData = {
    tourType?: TourState['tourType'];
    step?: number;
    [key: string]: unknown;
  };

  const logAnalytics = (event: string, data: TourAnalyticsData = {}) => {
    const payload = {
      tourType: data.tourType ?? tourState.tourType,
      step: data.step ?? tourState.currentStep,
      ...data,
    };
    try {
      analyticsService.trackEvent(event, payload);
      analyticsService.track?.(event, payload);
      if (import.meta.env.DEV) devLog.debug('[tour.analytics]', event, payload);
    } catch {}
  };

  const cleanupTourParams = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('tour')) {
      url.searchParams.delete('tour');
      history.replaceState({}, '', url.toString());
      if (import.meta.env.DEV) devLog.debug('[tour] cleaned up tour params');
    }
  };

  const startTour = async (type: TourState['tourType'], steps?: TourStep[]) => {
    // Check route suppression
    const suppressedRoute = sessionStorage.getItem('inkwell:tour:suppress');
    if (suppressedRoute) {
      if (import.meta.env.DEV)
        devLog.debug('[tour] start blocked by suppression:', suppressedRoute);
      return;
    }

    // Extra check for profile routes
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath === '/profile' || currentPath.startsWith('/profiles')) {
      if (import.meta.env.DEV) devLog.debug('[tour] start blocked by profile route:', currentPath);
      return;
    }
    if (import.meta.env.DEV) devLog.debug('[tour] startTour', { type, steps: steps?.length ?? 0 });

    // Global quick-tour kill switch
    if (QUICK_TOUR_DISABLED && isQuickTour(type)) {
      if (import.meta.env.DEV) devLog.debug('[tour] quick tour disabled globally, ignoring');
      cleanupTourParams();
      return;
    }

    // Route suppression (skip in tests)
    if (!import.meta.env.TEST && isSuppressed()) {
      if (import.meta.env.DEV) devLog.debug('[tour] suppressed by route');
      cleanupTourParams();
      return;
    }

    // Prevent duplicates (warning in non-test)
    if (tourState.isActive || startToken) {
      if (!import.meta.env.TEST) {
        console.warn('Tour already active, ignoring duplicate start request');
      }
      if (import.meta.env.DEV) devLog.debug('[tour] already starting/active, skip');
      return;
    }

    // Commit state then analytics
    try {
      // In tests, mark that we prompted this session
      try {
        if (import.meta.env.TEST) {
          const { setPromptedThisSession } = await import('./tourGating');
          setPromptedThisSession(window.sessionStorage);
        }
      } catch {}
      // Clean up URL params immediately
      cleanupTourParams();

      // Singleton token to prevent race conditions
      const token = `${type}:${Date.now()}`;
      if (startToken) {
        if (import.meta.env.DEV) {
          devLog.debug('[tour] start blocked by token:', {
            existing: startToken,
            attempted: token,
          });
        }
        return;
      }
      startToken = token;

      // Log analytics before state update to preserve the tour type
      logAnalytics('tour_started', { entryPoint: 'provider', tourType: type });

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
    setTourState((p) => ({
      ...p,
      steps: [...steps].sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));

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
    // Prefer statically imported module when available (works in tests reliably)
    if (tourGatingMod && typeof tourGatingMod.shouldShowTourPrompt === 'function') {
      return Boolean(tourGatingMod.shouldShowTourPrompt());
    }
    try {
      const gating = require('./tourGating');
      const compute = gating.shouldShowTourPrompt ?? gating.default?.shouldShowTourPrompt;
      if (typeof compute === 'function') return Boolean(compute());
    } catch {}
    if (import.meta.env.TEST) {
      return !hasPromptedThisSession(window.sessionStorage);
    }
    return false; // default disabled
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

  // Handle spotlight tour events from TourController
  useEffect(() => {
    const handleSpotlightTour = (event: CustomEvent) => {
      const { steps, _profileId, _options } = event.detail;
      if (steps && steps.length > 0) {
        // Convert spotlight steps to tour steps format
        const tourSteps: TourStep[] = steps.map((step: any, index: number) => ({
          id: step.id,
          title: `Step ${index + 1}`,
          description: step.content,
          target: step.target,
          placement: 'center' as const,
          action: 'none' as const,
          optional: false,
          order: index,
          category: 'feature-discovery' as const,
        }));

        // Start the tour with the converted steps
        startTour('feature-tour', tourSteps);
      }
    };

    window.addEventListener('inkwell:tour:start-spotlight', handleSpotlightTour as EventListener);
    return () => {
      window.removeEventListener(
        'inkwell:tour:start-spotlight',
        handleSpotlightTour as EventListener,
      );
    };
  }, [startTour]); // Include startTour in dependencies

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
