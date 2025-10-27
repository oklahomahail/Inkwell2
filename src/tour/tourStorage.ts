/**
 * Tour Last Used Tracker
 * Persists and retrieves the last tour used by the user
 */

export type TourVariant = 'core' | 'ai-tools' | 'export';

const STORAGE_KEY = 'tour:last_used';

/**
 * Get the last tour variant used by the user
 */
export function getLastTourUsed(): TourVariant | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['core', 'ai-tools', 'export'].includes(stored)) {
      return stored as TourVariant;
    }
  } catch (error) {
    console.warn('[TourStorage] Failed to get last tour used:', error);
  }
  return null;
}

/**
 * Set the last tour variant used
 */
export function setLastTourUsed(variant: TourVariant): void {
  try {
    localStorage.setItem(STORAGE_KEY, variant);
  } catch (error) {
    console.warn('[TourStorage] Failed to save last tour used:', error);
  }
}

/**
 * Clear the last tour used
 */
export function clearLastTourUsed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[TourStorage] Failed to clear last tour used:', error);
  }
}

/**
 * Track first app open timestamp
 */
const FIRST_OPEN_KEY = 'analytics:first_open';

/**
 * Get or set first app open timestamp
 */
export function getFirstOpenTimestamp(): number {
  try {
    const stored = localStorage.getItem(FIRST_OPEN_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }

    // First time - store current timestamp
    const now = Date.now();
    localStorage.setItem(FIRST_OPEN_KEY, String(now));
    return now;
  } catch (error) {
    console.warn('[TourStorage] Failed to get/set first open timestamp:', error);
    return Date.now();
  }
}

/**
 * Calculate time to first tour in milliseconds
 */
export function getTimeToFirstTour(): number | null {
  try {
    const firstOpen = getFirstOpenTimestamp();
    const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');

    // Find first tour_started event
    const firstTourEvent = events.find((e: any) => e.type === 'tour_started');

    if (firstTourEvent && firstTourEvent.ts) {
      return firstTourEvent.ts - firstOpen;
    }
  } catch (error) {
    console.warn('[TourStorage] Failed to calculate time to first tour:', error);
  }

  return null;
}
