/**
 * Tour Provider Stub
 *
 * Minimal implementation to satisfy legacy imports.
 * The actual tour functionality is now in /src/tour/
 */

import React, { createContext, useContext, type ReactNode } from 'react';

// Re-export from tour registry for backwards compatibility
export { CORE_TOUR_STEPS } from './tourRegistry';

interface TourContextValue {
  startTour: (type: string, steps?: any[]) => Promise<void>;
  tourState: {
    isActive: boolean;
    currentStep: number;
    steps: any[];
  };
  completeTour: () => void;
  resetTour: () => void;
  shouldShowTourPrompt: () => boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const value: TourContextValue = {
    startTour: async () => {
      console.warn('TourProvider stub: startTour called but not implemented');
    },
    tourState: {
      isActive: false,
      currentStep: 0,
      steps: [],
    },
    completeTour: () => {
      console.warn('TourProvider stub: completeTour called but not implemented');
    },
    resetTour: () => {
      console.warn('TourProvider stub: resetTour called but not implemented');
    },
    shouldShowTourPrompt: () => false,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
