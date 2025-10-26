/**
 * Feature-Specific Tour Launchers
 *
 * Convenience functions for launching feature-specific tours
 * from various parts of the app (help menus, feature introductions, etc.)
 */

import { aiToolsTourSteps, AI_TOOLS_TOUR_ID } from './configs/aiToolsTour';
import { exportTourSteps, EXPORT_TOUR_ID } from './configs/exportTour';
import { startTourById } from './tourEntry';

/**
 * Launch the AI Tools tour
 *
 * Use this when introducing users to AI features or from the help menu.
 *
 * @param skipIfCompleted - Skip if the user has already completed this tour
 *
 * @example
 * ```tsx
 * <button onClick={() => launchAIToolsTour()}>
 *   Learn About AI Features
 * </button>
 * ```
 */
export function launchAIToolsTour(skipIfCompleted = true): void {
  startTourById(AI_TOOLS_TOUR_ID, aiToolsTourSteps, {
    version: 1,
    skipIfCompleted,
  });
}

/**
 * Launch the Export tour
 *
 * Use this when users first access export features or from the help menu.
 *
 * @param skipIfCompleted - Skip if the user has already completed this tour
 *
 * @example
 * ```tsx
 * <button onClick={() => launchExportTour()}>
 *   Learn How to Export
 * </button>
 * ```
 */
export function launchExportTour(skipIfCompleted = true): void {
  startTourById(EXPORT_TOUR_ID, exportTourSteps, {
    version: 1,
    skipIfCompleted,
  });
}

/**
 * Check if a specific tour has been completed
 *
 * @param tourId - The tour ID to check
 * @returns true if the tour has been completed
 */
export { isTourDone } from './persistence';
