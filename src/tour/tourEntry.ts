/**
 * Tour Entry Points
 *
 * Convenience functions for starting tours from various parts of the app.
 */

import { DEFAULT_TOUR_ID, defaultTourConfig, defaultTourSteps } from './configs/defaultTour';
import { isTourDone, markTourDone } from './persistence';
import { tourService } from './TourService';

import type { TourConfig as ServiceTourConfig } from './TourTypes';
import type { TourStep } from './types';

/**
 * Convert tour steps to the format expected by TourService
 */
function convertToServiceConfig(
  tourId: string,
  steps: TourStep[],
  version?: number,
): ServiceTourConfig {
  return {
    id: tourId,
    steps: steps.map((step) => ({
      target: step.selectors[0] || `[data-tour-id="${step.id}"]`, // Fallback to data-tour-id
      title: step.title,
      content: step.body,
      placement: step.placement || 'bottom',
      beforeShow: step.beforeNavigate,
      onNext: step.onAdvance,
    })),
    showProgress: true,
    allowSkip: true,
    onComplete: () => {
      markTourDone(tourId);
    },
  };
}

/**
 * Start the default onboarding tour
 *
 * Use this from help menus, onboarding flows, or tutorial buttons.
 *
 * @example
 * ```tsx
 * <button onClick={startDefaultTour}>Take a Tour</button>
 * ```
 */
export function startDefaultTour(): void {
  const serviceConfig = convertToServiceConfig(
    DEFAULT_TOUR_ID,
    defaultTourSteps,
    defaultTourConfig.version,
  );
  tourService.start(serviceConfig);
}

/**
 * Check if the default tour should auto-start
 *
 * Use this in first-run experience or after onboarding completion.
 *
 * @returns true if tour hasn't been completed yet
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   if (shouldAutoStartTour()) {
 *     startDefaultTour();
 *   }
 * }, []);
 * ```
 */
export function shouldAutoStartTour(): boolean {
  return !isTourDone(DEFAULT_TOUR_ID);
}

/**
 * Start a tour by ID with custom configuration
 *
 * Use this for feature-specific tours or advanced flows.
 *
 * @param tourId - Unique identifier for the tour
 * @param steps - Array of tour steps
 * @param options - Additional tour configuration
 *
 * @example
 * ```tsx
 * startTourById('ai-tools-tour', aiToolsSteps);
 * ```
 */
export function startTourById(
  tourId: string,
  steps: TourStep[],
  options?: {
    version?: number;
    skipIfCompleted?: boolean;
  },
): void {
  const { version = 1, skipIfCompleted = false } = options ?? {};

  // Check if tour was already completed
  if (skipIfCompleted && isTourDone(tourId)) {
    console.log(`[TourEntry] Tour "${tourId}" already completed, skipping`);
    return;
  }

  const serviceConfig = convertToServiceConfig(tourId, steps, version);
  tourService.start(serviceConfig);
}

/**
 * Start the default tour from Settings with forced restart
 * This ensures the tour starts even if something is mid-run
 */
export function startDefaultTourFromSettings(): void {
  // Stop if something is weirdly mid-run
  if (tourService.isRunning()) {
    tourService.stop();
  }

  const serviceConfig = convertToServiceConfig(
    DEFAULT_TOUR_ID,
    defaultTourSteps,
    defaultTourConfig.version,
  );
  tourService.start(serviceConfig, { forceRestart: true });
}
