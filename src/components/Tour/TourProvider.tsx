/**
 * TourProvider - React Context Provider for Tour System
 *
 * Provides tour state and controls to the entire application.
 */

import React, { createContext, useContext, ReactNode } from 'react';

import type { TourStep } from '@/data/tourSteps';
import { useTour } from '@/hooks/useTour';

import { TourTooltip } from './TourTooltip';

interface TourContextValue {
  steps: TourStep[];
  currentStep: number;
  active: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  end: () => void;
  skip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
}

const TourContext = createContext<TourContextValue | null>(null);

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const tour = useTour();

  return (
    <TourContext.Provider value={tour}>
      {children}
      {tour.active && <TourTooltip />}
    </TourContext.Provider>
  );
}

/**
 * Hook to access tour context
 * Must be used within TourProvider
 */
export function useTourContext(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within TourProvider');
  }
  return context;
}
