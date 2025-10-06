// src/components/Onboarding/TourProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  startTour: (type: TourState['tourType'], steps?: TourStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  completeStep: (stepId: string) => void;
  goToStep: (stepIndex: number) => void;
  setTourSteps: (steps: TourStep[]) => void;
  isStepCompleted: (stepId: string) => boolean;
  getCurrentStep: () => TourStep | null;
  resetTour: () => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const STORAGE_KEY = 'inkwell-tour-progress';

const defaultTourState: TourState = {
  isActive: false,
  currentStep: 0,
  steps: [],
  completedSteps: [],
  isFirstTimeUser: true,
  tourType: 'full-onboarding',
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourState, setTourState] = useState<TourState>(() => {
    // Load saved tour progress from localStorage
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

  const startTour = (type: TourState['tourType'], steps?: TourStep[]) => {
    setTourState((prev) => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      tourType: type,
      steps: steps || prev.steps,
    }));
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
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      isFirstTimeUser: false,
    }));
  };

  const completeTour = () => {
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: TourContextValue = {
    tourState,
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

// Predefined tour steps for common scenarios
export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Inkwell!',
    description:
      "Let's take a quick tour of your new writing workspace. This will only take a minute.",
    target: '#app-header',
    placement: 'bottom',
    order: 1,
    category: 'onboarding',
  },
  {
    id: 'create-project',
    title: 'Create Your First Project',
    description:
      'Click here to create a new writing project. You can choose from templates or start blank.',
    target: '[data-tour="new-project-button"]',
    placement: 'left',
    action: 'click',
    order: 2,
    category: 'onboarding',
  },
  {
    id: 'sidebar-navigation',
    title: 'Navigate Your Workspace',
    description: 'Use the sidebar to switch between Dashboard, Writing, Timeline, and Analytics.',
    target: '[data-tour="sidebar"]',
    placement: 'right',
    order: 3,
    category: 'onboarding',
  },
  {
    id: 'writing-area',
    title: 'Your Writing Space',
    description:
      'This is where the magic happens! Start writing your story here. The editor has many helpful features.',
    target: '[data-tour="writing-editor"]',
    placement: 'top',
    order: 4,
    view: 'Writing',
    category: 'onboarding',
  },
  {
    id: 'ai-features',
    title: 'AI Writing Assistant',
    description:
      'Select text to see AI suggestions, or use the toolbar for writing assistance and brainstorming.',
    target: '[data-tour="ai-toolbar"]',
    placement: 'top',
    order: 5,
    view: 'Writing',
    category: 'onboarding',
    optional: true,
  },
  {
    id: 'command-palette',
    title: 'Quick Actions',
    description: 'Press Cmd+K to open the command palette for quick navigation and actions.',
    target: 'body',
    placement: 'center',
    order: 6,
    category: 'onboarding',
  },
];

export const FEATURE_DISCOVERY_STEPS: TourStep[] = [
  {
    id: 'analytics-intro',
    title: 'Track Your Progress',
    description:
      'Monitor your writing habits, word count trends, and stay motivated with detailed analytics.',
    target: '[data-tour="analytics-panel"]',
    placement: 'left',
    order: 1,
    view: 'Analysis',
    category: 'feature-discovery',
  },
  {
    id: 'timeline-planning',
    title: 'Plan Your Story',
    description:
      'Create timelines, set goals, and organize your story structure with our planning tools.',
    target: '[data-tour="timeline-panel"]',
    placement: 'left',
    order: 2,
    view: 'Timeline',
    category: 'feature-discovery',
  },
];
