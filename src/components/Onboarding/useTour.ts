/**
 * Stub hook for tour functionality
 * Replaces ProfileTourProvider with a simpler implementation
 */

export interface TourStep {
  id: string;
  title?: string;
  content?: React.ReactNode;
  anchor?: string;
}

export interface TutorialPreferences {
  neverShowAgain: boolean;
  remindMeLater: boolean;
  remindMeLaterUntil?: number;
  completedTours: string[];
  tourDismissals: number;
  hasLaunched?: boolean;
}

interface TourState {
  active: boolean;
  currentStep: number;
  steps: TourStep[];
  tourId?: string;
}

export interface UseTourReturn {
  prefs: TutorialPreferences | null;
  hydrated: boolean;
  isFirstTimeUser: boolean;
  isActive: boolean;
  startTour: (id: string, steps?: TourStep[]) => void;
  completeTour: (id: string) => void;
  tourState: TourState | null;
  setTourSteps: (steps: TourStep[], opts?: { goTo?: number }) => void;
  goToStep: (idx: number) => void;
  preferences: TutorialPreferences | null;
  setNeverShowAgain: (v: boolean) => void;
  setRemindMeLater: (v: boolean) => void;
  logAnalytics: (event: string, payload?: Record<string, any>) => void;
  checklist: string[];
  getChecklistProgress: () => { completed: number; total: number };
  canShowContextualTour: (key: string) => boolean;
  completedTours: string[];
  neverShowAgain: boolean;
  remindMeLater: boolean;
  updateChecklist?: (key: string) => void;
}

/**
 * Stub implementation of useTour hook
 * Returns default/empty values for all tour-related functionality
 */
export function useTour(): UseTourReturn {
  return {
    prefs: null,
    hydrated: false,
    isFirstTimeUser: false,
    isActive: false,
    startTour: () => {},
    completeTour: () => {},
    tourState: { active: false, currentStep: 0, steps: [] },
    setTourSteps: () => {},
    goToStep: () => {},
    preferences: null,
    setNeverShowAgain: () => {},
    setRemindMeLater: () => {},
    logAnalytics: () => {},
    checklist: [],
    getChecklistProgress: () => ({ completed: 0, total: 0 }),
    canShowContextualTour: () => false,
    completedTours: [],
    neverShowAgain: false,
    remindMeLater: false,
    updateChecklist,
  };
}

// Export stub for ONBOARDING_STEPS for backward compatibility
export const ONBOARDING_STEPS: TourStep[] = [];

// Add updateChecklist stub
export function updateChecklist(_key: string) {
  // Stub - checklist updates now handled by CompletionChecklistNew
  console.warn('updateChecklist is deprecated - use CompletionChecklistNew state instead');
}
