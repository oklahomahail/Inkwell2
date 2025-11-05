/**
 * useTour Hook - Tour state management
 *
 * Manages tour progression, step navigation, and completion state.
 */

import { useState, useCallback, useEffect } from 'react';

import { defaultTourSteps, TourStep } from '@/data/tourSteps';

const TOUR_COMPLETED_KEY = 'inkwell:tour:completed';

interface UseTourReturn {
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

export function useTour(): UseTourReturn {
  const [steps] = useState<TourStep[]>(defaultTourSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [active, setActive] = useState(false);

  // Check if tour has been completed before
  const isCompleted = useCallback(() => {
    try {
      return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Mark tour as completed
  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    } catch (error) {
      console.warn('[useTour] Failed to mark tour as completed:', error);
    }
  }, []);

  // Start the tour
  const start = useCallback(() => {
    setActive(true);
    setCurrentStep(0);
  }, []);

  // Move to next step
  const next = useCallback(() => {
    setCurrentStep((prev) => {
      const nextStep = Math.min(prev + 1, steps.length - 1);
      // If we've reached the last step, mark tour as completed
      if (nextStep === steps.length - 1) {
        setTimeout(markCompleted, 100);
      }
      return nextStep;
    });
  }, [steps.length, markCompleted]);

  // Move to previous step
  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // End the tour
  const end = useCallback(() => {
    setActive(false);
    markCompleted();
  }, [markCompleted]);

  // Skip the tour
  const skip = useCallback(() => {
    setActive(false);
    markCompleted();
  }, [markCompleted]);

  // Auto-start tour for first-time users (optional)
  useEffect(() => {
    if (!isCompleted() && !active) {
      // You can enable auto-start here if desired
      // setTimeout(() => start(), 1000);
    }
  }, [isCompleted, active]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return {
    steps,
    currentStep,
    active,
    start,
    next,
    prev,
    end,
    skip,
    isFirstStep,
    isLastStep,
    progress,
  };
}
