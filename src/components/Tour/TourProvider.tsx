/**
 * TourProvider - React Context Provider for Tour System
 *
 * Provides tour state and controls to the entire application.
 */

import React, { createContext, useContext, ReactNode } from 'react';

import { TourTooltip } from '@/components/TourTooltip';
import type { TourStep } from '@/data/tourSets';
import { useTour } from '@/hooks/useTour';

// Import the new TourTooltip

interface TourContextValue {
  isActive: boolean;
  currentSet: string | null;
  currentStep: TourStep | null;
  index: number;
  steps: TourStep[];
  totalSteps: number;
  start: (setKey: string, force?: boolean) => boolean;
  next: () => void;
  prev: () => void;
  end: () => void;
  skip: () => void;
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
      {tour.isActive && <TourTooltip />}
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
