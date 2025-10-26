/**
 * Tour Persistence
 *
 * Handles storing and retrieving tour completion state in localStorage.
 * Prevents auto-triggering tours that users have already completed.
 */

const KEY_PREFIX = 'inkwell.tour.';

/**
 * Generate the localStorage key for a specific tour
 */
export function completionKey(tourId: string): string {
  return `${KEY_PREFIX}${tourId}.completed`;
}

/**
 * Check if a tour has been completed by the user
 */
export function isTourDone(tourId: string): boolean {
  try {
    const value = localStorage.getItem(completionKey(tourId));
    return value === '1';
  } catch (error) {
    // localStorage may be unavailable (private mode, quota exceeded)
    console.warn('[TourPersistence] Failed to check tour completion:', error);
    return false;
  }
}

/**
 * Mark a tour as completed
 */
export function markTourDone(tourId: string): void {
  try {
    localStorage.setItem(completionKey(tourId), '1');
  } catch (error) {
    // localStorage may be unavailable, fail silently
    console.warn('[TourPersistence] Failed to mark tour as done:', error);
  }
}

/**
 * Reset a tour's completion state (useful for testing or re-onboarding)
 */
export function resetTour(tourId: string): void {
  try {
    localStorage.removeItem(completionKey(tourId));
  } catch (error) {
    console.warn('[TourPersistence] Failed to reset tour:', error);
  }
}

/**
 * Get all completed tour IDs
 */
export function getCompletedTours(): string[] {
  try {
    const tours: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX) && key.endsWith('.completed')) {
        const tourId = key.replace(KEY_PREFIX, '').replace('.completed', '');
        if (localStorage.getItem(key) === '1') {
          tours.push(tourId);
        }
      }
    }
    return tours;
  } catch (error) {
    console.warn('[TourPersistence] Failed to get completed tours:', error);
    return [];
  }
}
