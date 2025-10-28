/**
 * Auto-start Spotlight Tour Hook
 * Manages first-run detection and tour auto-start
 */
import { useEffect, useState } from 'react';

import devLog from "src/utils/devLogger";


import { getSpotlightSteps } from '@/tour/getSpotlightSteps';
import { tourService } from '@/tour/TourService';

const TOUR_COMPLETED_KEY = 'inkwell:tour:completed';
const TOUR_ID = 'onboarding-v2';

/**
 * Check if the user has completed the tour before
 */
function hasCompletedTour(): boolean {
  try {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    return completed === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the tour as completed
 */
function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  } catch (error) {
    console.warn('[useAutostartSpotlight] Failed to mark tour as completed:', error);
  }
}

/**
 * Hook to auto-start the Spotlight Tour for first-time users
 */
export function useAutostartSpotlight() {
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  useEffect(() => {
    // Check if we should auto-start the tour
    const isFirstRun = !hasCompletedTour();
    const isTourRunning = tourService.isRunning();

    if (isFirstRun && !isTourRunning) {
      setShouldAutoStart(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldAutoStart) return;

    // Small delay to ensure DOM is ready and components are mounted
    const timer = setTimeout(() => {
      const steps = getSpotlightSteps();

      tourService.start({
        id: TOUR_ID,
        steps,
        showProgress: true,
        allowSkip: true,
        onComplete: () => {
          markTourCompleted();
          devLog.debug('[useAutostartSpotlight] Tour completed');
        },
        onSkip: () => {
          markTourCompleted();
          devLog.debug('[useAutostartSpotlight] Tour skipped');
        },
      });

      setShouldAutoStart(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [shouldAutoStart]);

  /**
   * Manually restart the tour (e.g., from Settings)
   */
  const restartTour = () => {
    const steps = getSpotlightSteps();

    tourService.start({
      id: TOUR_ID,
      steps,
      showProgress: true,
      allowSkip: true,
      onComplete: () => {
        devLog.debug('[useAutostartSpotlight] Manual tour completed');
      },
      onSkip: () => {
        devLog.debug('[useAutostartSpotlight] Manual tour skipped');
      },
    });
  };

  return {
    restartTour,
  };
}
