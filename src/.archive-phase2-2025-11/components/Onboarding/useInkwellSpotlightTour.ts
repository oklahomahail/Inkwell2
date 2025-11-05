/**
 * Hook for managing the Inkwell Spotlight Tour
 *
 * Provides easy access to start, reset, and check completion status
 * of the cinematic walkthrough tour.
 */

import { useCallback, useEffect, useState } from 'react';

import devLog from "@/utils/devLog";

import { useTour } from './TourProvider';
import { INKWELL_SPOTLIGHT_STEPS } from './tourRegistry';

const STORAGE_KEY = 'inkwell.tour.spotlight';
const COMPLETION_KEY = 'inkwell.tour.spotlight.completed';
const SKIP_KEY = 'inkwell.tour.spotlight.skipped';

interface SpotlightTourProgress {
  currentStep: number;
  completed: boolean;
  lastUpdated: string;
  version: string;
}

export function useInkwellSpotlightTour() {
  const { startTour, tourState, completeTour, resetTour } = useTour();
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  // Check completion status on mount
  useEffect(() => {
    const completed = localStorage.getItem(COMPLETION_KEY) === 'true';
    const skipped = localStorage.getItem(SKIP_KEY) === 'true';
    setHasCompletedBefore(completed);
    setHasSkipped(skipped);
  }, []);

  /**
   * Start the Inkwell Spotlight Tour
   */
  const startSpotlightTour = useCallback(async () => {
    try {
      await startTour('full-onboarding', INKWELL_SPOTLIGHT_STEPS);

      // Log start event
      devLog.debug('[Tour] Inkwell Spotlight Tour started', {
        timestamp: new Date().toISOString(),
        stepCount: INKWELL_SPOTLIGHT_STEPS.length,
      });
    } catch (error) {
      devLog.error('[Tour] Failed to start Spotlight Tour:', error);
    }
  }, [startTour]);

  /**
   * Reset the tour (for "Replay Onboarding Tour" feature)
   */
  const resetSpotlightTour = useCallback(() => {
    // Clear all tour storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETION_KEY);
    localStorage.removeItem(SKIP_KEY);

    // Reset tour state
    resetTour();

    // Update local state
    setHasCompletedBefore(false);
    setHasSkipped(false);

    devLog.debug('[Tour] Inkwell Spotlight Tour reset');
  }, [resetTour]);

  /**
   * Mark tour as completed
   */
  const markCompleted = useCallback(() => {
    localStorage.setItem(COMPLETION_KEY, 'true');
    setHasCompletedBefore(true);
    completeTour();

    devLog.debug('[Tour] Inkwell Spotlight Tour marked as completed');
  }, [completeTour]);

  /**
   * Mark tour as skipped
   */
  const markSkipped = useCallback(() => {
    localStorage.setItem(SKIP_KEY, 'true');
    setHasSkipped(true);

    devLog.debug('[Tour] Inkwell Spotlight Tour skipped by user');
  }, []);

  /**
   * Check if tour should auto-start (first login, not completed, not skipped)
   */
  const shouldAutoStart = useCallback(
    (isFirstLogin: boolean) => {
      if (!isFirstLogin) return false;
      if (hasCompletedBefore) return false;
      if (hasSkipped) return false;
      return true;
    },
    [hasCompletedBefore, hasSkipped],
  );

  /**
   * Get current progress
   */
  const getProgress = useCallback((): SpotlightTourProgress | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  /**
   * Save progress
   */
  const saveProgress = useCallback((stepIndex: number, completed: boolean = false) => {
    const data: SpotlightTourProgress = {
      currentStep: stepIndex,
      completed,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  return {
    // State
    isActive: tourState.isActive && tourState.steps.length === INKWELL_SPOTLIGHT_STEPS.length,
    currentStep: tourState.currentStep,
    totalSteps: INKWELL_SPOTLIGHT_STEPS.length,
    hasCompletedBefore,
    hasSkipped,

    // Actions
    startSpotlightTour,
    resetSpotlightTour,
    markCompleted,
    markSkipped,

    // Helpers
    shouldAutoStart,
    getProgress,
    saveProgress,

    // Tour steps (for reference)
    steps: INKWELL_SPOTLIGHT_STEPS,
  };
}
