/**
 * Tour Entry Points
 *
 * Convenience functions for starting tours from various parts of the app.
 */

import { DEFAULT_TOUR_ID, defaultTourConfig } from './configs/defaultTour';
import { isTourDone } from './persistence';

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
  // TODO: Integrate with TourService once available
  // import { TourService } from './TourService';
  // TourService.start(defaultTourConfig);

  if (process.env.NODE_ENV === 'development') {
    console.log('[TourEntry] Starting default tour:', defaultTourConfig);
  }
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
  steps: any[], // Replace with TourStep[] when types are imported
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

  // TODO: Integrate with TourService
  // TourService.start({ id: tourId, steps, version });

  if (process.env.NODE_ENV === 'development') {
    console.log('[TourEntry] Starting tour:', { tourId, steps, version });
  }
}
