// src/components/Onboarding/TourProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import analyticsService from '../../services/analyticsService';

import { hasPromptedThisSession, isNeverShow, isWithinRemindLaterWindow } from './tourGating';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  optional?: boolean;
  order: number;
  view?: string; // Which view this step belongs to
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

interface TourContextValue {
  tourState: TourState;
  preferences: TourPreferences;
  checklist: CompletionChecklist;
  startTour: (_type: TourState['tourType'], _steps?: TourStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  completeStep: (_stepId: string) => void;
  goToStep: (_stepIndex: number) => void;
  setTourSteps: (_steps: TourStep[]) => void;
  isStepCompleted: (_stepId: string) => boolean;
  getCurrentStep: () => TourStep | null;
  resetTour: () => void;
  // New methods for enhanced functionality
  setNeverShowAgain: () => void;
  setRemindMeLater: (_hours?: number) => void;
  shouldShowTourPrompt: () => boolean;
  updateChecklist: (_item: keyof CompletionChecklist) => void;
  getChecklistProgress: () => { completed: number; total: number };
  logAnalytics: (_event: string, _data?: any) => void;
  canShowContextualTour: (_tourType: string) => boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const STORAGE_KEY = 'inkwell-tour-progress';
const _ANALYTICS_KEY = 'tutorial_analytics';
const CHECKLIST_KEY = 'inkwell-completion-checklist';

// Enhanced tour state with new capabilities
interface TourPreferences {
  neverShowAgain: boolean;
  remindMeLater: boolean;
  remindMeLaterUntil?: number; // timestamp
  completedTours: string[]; // track which tour types are completed
  tourDismissals: number; // how many times user dismissed
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

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  // Load saved tour progress from localStorage
  const [tourState, setTourState] = useState<TourState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        return { ...defaultTourState, ...parsedState, isActive: false }; // Never start active on page load
      }
    } catch (error) {
      console.warn('Failed to load tour progress:', error);
    }
    return defaultTourState;
  });

  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<TourPreferences>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-preferences`);
      if (saved) {
        const parsedPrefs = JSON.parse(saved);
        return { ...defaultPreferences, ...parsedPrefs };
      }
    } catch (error) {
      console.warn('Failed to load tour preferences:', error);
    }
    return defaultPreferences;
  });

  // Load completion checklist from localStorage
  const [checklist, setChecklist] = useState<CompletionChecklist>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) {
        const parsedChecklist = JSON.parse(saved);
        return { ...defaultChecklist, ...parsedChecklist };
      }
    } catch (error) {
      console.warn('Failed to load completion checklist:', error);
    }
    return defaultChecklist;
  });

  // Save tour progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedSteps: tourState.completedSteps,
          isFirstTimeUser: tourState.isFirstTimeUser,
        }),
      );
    } catch (error) {
      console.warn('Failed to save tour progress:', error);
    }
  }, [tourState.completedSteps, tourState.isFirstTimeUser]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-preferences`, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save tour preferences:', error);
    }
  }, [preferences]);

  // Save checklist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    } catch (error) {
      console.warn('Failed to save completion checklist:', error);
    }
  }, [checklist]);

  // Define logAnalytics first to avoid temporal dead zone errors
  const logAnalytics = (event: string, data: any = {}) => {
    try {
      // Enhanced analytics with tour context
      const analyticsEvent = {
        ...data,
        tourType: tourState.tourType,
        step: tourState.currentStep,
      };

      // Unify analytics via a single track API
      analyticsService.track(event as any, analyticsEvent);

      // Log to console in dev mode
      if (import.meta.env.DEV) {
        console.log('Tour Analytics:', event, analyticsEvent);
      }
    } catch (error) {
      console.warn('Failed to log analytics:', error);
      // Track telemetry errors
      try {
        analyticsService.track('analytics_error' as any, {
          error: error instanceof Error ? error.message : String(error),
          event,
          context: 'TourProvider.logAnalytics',
        });
      } catch (telemetryError) {
        // Silent fail for telemetry errors to avoid infinite loops
        console.warn('Telemetry error:', telemetryError);
      }
    }
  };

  const startTour = (type: TourState['tourType'], steps?: TourStep[]) => {
    // Prevent duplicate tours
    if (tourState.isActive) {
      console.warn('Tour already active, ignoring duplicate start request');
      return;
    }

    analyticsService.track('tour_started', {
      tourType: 'full-onboarding',
      entryPoint: 'prompt',
    });

    // Mark that we've prompted in this session
    sessionStorage.setItem('inkwell-tour-prompted-this-session', 'true');

    setTourState((prev) => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      tourType: type,
      steps: steps || prev.steps,
    }));

    // Clear remind me later if user manually starts a tour
    if (preferences.remindMeLater) {
      setPreferences((prev) => ({ ...prev, remindMeLater: false, remindMeLaterUntil: undefined }));
    }
  };

  const nextStep = () => {
    setTourState((prev) => {
      if (prev.currentStep < prev.steps.length - 1) {
        return { ...prev, currentStep: prev.currentStep + 1 };
      } else {
        // Tour completed
        return {
          ...prev,
          isActive: false,
          isFirstTimeUser: false,
        };
      }
    });
  };

  const previousStep = () => {
    setTourState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  };

  const skipTour = () => {
    logAnalytics('tour_skipped', {
      step: tourState.currentStep,
      totalSteps: tourState.steps.length,
    });

    setTourState((prev) => ({
      ...prev,
      isActive: false,
      isFirstTimeUser: false,
    }));
  };

  const completeTour = () => {
    logAnalytics('tour_completed', {
      tourType: tourState.tourType,
      stepsCompleted: tourState.steps.length,
      totalSteps: tourState.steps.length,
    });

    setPreferences((prev) => ({
      ...prev,
      completedTours: [...new Set([...prev.completedTours, tourState.tourType])],
    }));

    setTourState((prev) => ({
      ...prev,
      isActive: false,
      isFirstTimeUser: false,
      completedSteps: [...new Set([...prev.completedSteps, ...prev.steps.map((s) => s.id)])],
    }));
  };

  const completeStep = (stepId: string) => {
    setTourState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, stepId])],
    }));
  };

  const goToStep = (stepIndex: number) => {
    setTourState((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(stepIndex, prev.steps.length - 1)),
    }));
  };

  const setTourSteps = (steps: TourStep[]) => {
    setTourState((prev) => ({
      ...prev,
      steps: [...steps].sort((a, b) => a.order - b.order),
    }));
  };

  const isStepCompleted = (stepId: string): boolean => {
    return tourState.completedSteps.includes(stepId);
  };

  const getCurrentStep = (): TourStep | null => {
    if (!tourState.isActive || tourState.steps.length === 0) {
      return null;
    }
    return tourState.steps[tourState.currentStep] || null;
  };

  const resetTour = () => {
    setTourState({
      ...defaultTourState,
      isFirstTimeUser: true,
    });
    setPreferences(defaultPreferences);
    setChecklist(defaultChecklist);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-preferences`);
    localStorage.removeItem(CHECKLIST_KEY);
  };

  // New enhanced methods
  const setNeverShowAgain = () => {
    setPreferences((prev) => ({ ...prev, neverShowAgain: true }));
    logAnalytics('tour_never_show_again');
  };

  const setRemindMeLater = (hours: number = 24) => {
    const remindMeLaterUntil = Date.now() + hours * 60 * 60 * 1000;
    setPreferences((prev) => ({
      ...prev,
      remindMeLater: true,
      remindMeLaterUntil,
      tourDismissals: prev.tourDismissals + 1,
    }));
    logAnalytics('tour_remind_me_later', { hours, dismissalCount: preferences.tourDismissals + 1 });
  };

  const shouldShowTourPrompt = (): boolean => {
    try {
      // Storage checks take precedence over any state
      if (hasPromptedThisSession(window.sessionStorage)) return false;
      if (isNeverShow(window.localStorage)) return false;
      if (isWithinRemindLaterWindow(Date.now(), window.localStorage)) return false;

      // Then check local state
      if (tourState.isActive) return false;
      if (!tourState.isFirstTimeUser) return false;
      if (preferences.completedTours.includes('full-onboarding')) return false;

      return true;
    } catch {
      // If storage access fails, respect local state
      return (
        !tourState.isActive &&
        tourState.isFirstTimeUser &&
        !preferences.completedTours.includes('full-onboarding')
      );
    }
  };

  const updateChecklist = (item: keyof CompletionChecklist) => {
    setChecklist((prev) => ({ ...prev, [item]: true }));
    logAnalytics('checklist_item_completed', { item });
  };

  const getChecklistProgress = () => {
    const items = Object.values(checklist);
    const completed = items.filter(Boolean).length;
    return { completed, total: items.length };
  };

  const canShowContextualTour = (tourType: string): boolean => {
    // Don't show contextual tours if user is in an active tour
    if (tourState.isActive) return false;

    // Don't show if user has completed this specific tour type
    if (preferences.completedTours.includes(tourType)) return false;

    // Don't show if user said never show tours
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
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

// CORE TOUR: 60-90 seconds, 6-9 essential steps for the "happy path"
export const CORE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Inkwell!',
    description: "Ready to write your next story? Let's take a quick tour—just 90 seconds!",
    target: '#tour-viewport-anchor',
    placement: 'center',
    order: 1,
    category: 'onboarding',
  },
  {
    id: 'create-project',
    title: 'Create Your Project',
    description: 'Click here to start a new story. Pick a template or go blank—your choice!',
    target: '[data-tour="new-project-button"], .new-project-button, [data-testid="create-project"]',
    placement: 'left',
    action: 'click',
    order: 2,
    category: 'onboarding',
  },
  {
    id: 'sidebar-navigation',
    title: 'Navigate Your Story',
    description: 'Switch between writing, planning, and tracking your progress with these tabs.',
    target: '[data-tour="sidebar"], .sidebar-nav, nav[role="navigation"]',
    placement: 'right',
    order: 3,
    category: 'onboarding',
  },
  {
    id: 'writing-space',
    title: 'Start Writing Here',
    description: 'Your story begins in this editor. Just click and start typing!',
    target: '[data-tour="writing-editor"], .writing-editor, .editor-content',
    placement: 'top',
    order: 4,
    view: 'Writing',
    category: 'onboarding',
  },
  {
    id: 'save-your-work',
    title: 'Your Work Saves Automatically',
    description: 'No need to worry—everything saves as you type. Keep writing!',
    target: '[data-tour="auto-save"], .auto-save-indicator',
    placement: 'bottom',
    order: 5,
    category: 'onboarding',
  },
  {
    id: 'explore-timeline',
    title: 'Plan Your Story',
    description: 'Use Timeline to organize chapters, track characters, and map your plot.',
    target: '[data-tour="timeline-tab"], [href*="timeline"]',
    placement: 'bottom',
    order: 6,
    category: 'onboarding',
  },
  {
    id: 'export-anytime',
    title: 'Share Your Story',
    description: "When you're ready, export to PDF, Word, or other formats to share your work.",
    target: '[data-tour="export-button"], .export-button',
    placement: 'left',
    order: 7,
    category: 'onboarding',
  },
  {
    id: 'tour-complete',
    title: "🎉 You're Ready to Write!",
    description: "That's it! Press Cmd+K anytime for quick actions. Happy writing!",
    target: '#tour-viewport-anchor',
    placement: 'center',
    order: 8,
    category: 'onboarding',
  },
];

// CONTEXTUAL MINI-TOURS: 3-5 steps each, triggered when entering specific panels
export const WRITING_PANEL_TOUR: TourStep[] = [
  {
    id: 'writing-welcome',
    title: 'Welcome to Your Writing Space',
    description: 'This is where your story comes to life. Let me show you the key tools.',
    target: '[data-tour="writing-editor"], .writing-editor',
    placement: 'top',
    order: 1,
    category: 'feature-discovery',
  },
  {
    id: 'ai-assistant',
    title: 'AI Writing Helper',
    description: 'Select any text to get AI suggestions for improvements or ideas.',
    target: '[data-tour="ai-toolbar"], .ai-assistant-button',
    placement: 'bottom',
    order: 2,
    category: 'feature-discovery',
    optional: true,
  },
  {
    id: 'focus-mode',
    title: 'Distraction-Free Writing',
    description: 'Press F11 or click here to hide everything except your words.',
    target: '[data-tour="focus-mode"], .focus-mode-toggle',
    placement: 'left',
    order: 3,
    category: 'feature-discovery',
  },
  {
    id: 'word-count',
    title: 'Track Your Progress',
    description: 'Watch your word count grow and set daily goals to stay motivated.',
    target: '[data-tour="word-count"], .word-counter',
    placement: 'top',
    order: 4,
    category: 'feature-discovery',
  },
];

export const TIMELINE_PANEL_TOUR: TourStep[] = [
  {
    id: 'timeline-overview',
    title: 'Plan Your Story Structure',
    description: 'Organize your chapters, scenes, and story beats in this planning space.',
    target: '[data-tour="timeline-panel"], .timeline-container',
    placement: 'top',
    order: 1,
    category: 'feature-discovery',
  },
  {
    id: 'add-chapters',
    title: 'Add Chapters',
    description: 'Click here to add new chapters and organize your story structure.',
    target: '[data-tour="add-chapter"], .add-chapter-button',
    placement: 'right',
    order: 2,
    category: 'feature-discovery',
  },
  {
    id: 'character-tracking',
    title: 'Develop Your Characters',
    description: 'Keep track of character details, backstories, and development arcs.',
    target: '[data-tour="characters-section"], .characters-panel',
    placement: 'left',
    order: 3,
    category: 'feature-discovery',
  },
  {
    id: 'plot-boards',
    title: 'Map Your Plot',
    description: 'Drag story beats around to experiment with your plot structure.',
    target: '[data-tour="plot-boards"], .plot-board',
    placement: 'bottom',
    order: 4,
    category: 'feature-discovery',
  },
];

export const ANALYTICS_PANEL_TOUR: TourStep[] = [
  {
    id: 'analytics-overview',
    title: 'Track Your Writing Journey',
    description: 'See your progress, build writing habits, and celebrate your wins.',
    target: '[data-tour="analytics-panel"], .analytics-container',
    placement: 'top',
    order: 1,
    category: 'feature-discovery',
  },
  {
    id: 'daily-progress',
    title: 'Daily Writing Goals',
    description: 'Set word count targets and track your daily writing streaks.',
    target: '[data-tour="daily-goals"], .daily-progress',
    placement: 'right',
    order: 2,
    category: 'feature-discovery',
  },
  {
    id: 'writing-trends',
    title: 'Writing Patterns',
    description: 'Discover when you write best and build on your natural rhythms.',
    target: '[data-tour="writing-trends"], .trend-chart',
    placement: 'left',
    order: 3,
    category: 'feature-discovery',
  },
];

export const DASHBOARD_PANEL_TOUR: TourStep[] = [
  {
    id: 'dashboard-overview',
    title: 'Your Writing Dashboard',
    description: 'All your projects and progress in one place. Let me show you around.',
    target: '[data-tour="dashboard"], .dashboard-container',
    placement: 'top',
    order: 1,
    category: 'feature-discovery',
  },
  {
    id: 'project-management',
    title: 'Manage Your Projects',
    description: 'Create, organize, and switch between multiple writing projects.',
    target: '[data-tour="project-list"], .project-grid',
    placement: 'right',
    order: 2,
    category: 'feature-discovery',
  },
  {
    id: 'recent-activity',
    title: 'Pick Up Where You Left Off',
    description: 'See your recent changes and jump back into your stories quickly.',
    target: '[data-tour="recent-activity"], .recent-changes',
    placement: 'bottom',
    order: 3,
    category: 'feature-discovery',
  },
];

// COMPREHENSIVE TOUR MAP
export const TOUR_MAP = {
  'core-onboarding': CORE_TOUR_STEPS,
  'writing-panel': WRITING_PANEL_TOUR,
  'timeline-panel': TIMELINE_PANEL_TOUR,
  'analytics-panel': ANALYTICS_PANEL_TOUR,
  'dashboard-panel': DASHBOARD_PANEL_TOUR,
};

// Legacy support - map old tour names to new ones
export const ONBOARDING_STEPS = CORE_TOUR_STEPS;
export const FEATURE_DISCOVERY_STEPS = WRITING_PANEL_TOUR;
