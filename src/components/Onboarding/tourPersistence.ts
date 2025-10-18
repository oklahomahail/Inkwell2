/**
 * Tour Persistence Utilities
 *
 * Provides version-aware storage for tour progress with forward compatibility.
 * Handles migrations when tour versions change.
 *
 * Storage Keys:
 * - inkwell.tour.onboarding.progress - Current step (0-10)
 * - inkwell.tour.onboarding.completed - Boolean completion flag
 * - inkwell.tour.onboarding.skipped - Boolean skip flag
 * - inkwell.tour.onboarding.version - Version string (e.g., '2025-10-18')
 * - inkwell.tour.onboarding.startedAt - ISO timestamp
 * - inkwell.tour.onboarding.completedAt - ISO timestamp
 */

const TOUR_VERSION = '2025-10-18';

interface TourProgress {
  currentStep: number;
  version: string;
  startedAt: string;
  completedAt?: string;
}

interface TourState {
  completed: boolean;
  skipped: boolean;
  progress: TourProgress | null;
}

/**
 * Gets the storage key for a tour property
 */
function getStorageKey(tour: string, property: string): string {
  return `inkwell.tour.${tour}.${property}`;
}

/**
 * Checks if stored version matches current version
 */
function isVersionCurrent(storedVersion: string | null): boolean {
  return storedVersion === TOUR_VERSION;
}

/**
 * Loads tour state from localStorage
 *
 * @param tour - Tour name (e.g., 'onboarding')
 * @returns TourState object
 */
export function loadTourState(tour: string): TourState {
  try {
    const version = localStorage.getItem(getStorageKey(tour, 'version'));
    const completed = localStorage.getItem(getStorageKey(tour, 'completed')) === 'true';
    const skipped = localStorage.getItem(getStorageKey(tour, 'skipped')) === 'true';
    const progressJson = localStorage.getItem(getStorageKey(tour, 'progress'));

    let progress: TourProgress | null = null;

    if (progressJson) {
      try {
        progress = JSON.parse(progressJson) as TourProgress;
      } catch {
        progress = null;
      }
    }

    // Version migration: reset progress if version changed
    if (!isVersionCurrent(version)) {
      if (import.meta.env.DEV) {
        console.info(
          `[tour-persistence] Version changed (${version} → ${TOUR_VERSION}), resetting progress for "${tour}"`,
        );
      }

      // Keep a marker that they've seen a previous version
      if (version) {
        localStorage.setItem(getStorageKey(tour, 'seenLegacy'), 'true');
        localStorage.setItem(getStorageKey(tour, 'legacyVersion'), version);
      }

      // Reset progress and version
      localStorage.setItem(getStorageKey(tour, 'version'), TOUR_VERSION);
      localStorage.removeItem(getStorageKey(tour, 'progress'));
      localStorage.removeItem(getStorageKey(tour, 'completed'));
      localStorage.removeItem(getStorageKey(tour, 'skipped'));

      return {
        completed: false,
        skipped: false,
        progress: null,
      };
    }

    return {
      completed,
      skipped,
      progress,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[tour-persistence] Failed to load tour state:', error);
    }
    return {
      completed: false,
      skipped: false,
      progress: null,
    };
  }
}

/**
 * Saves tour progress to localStorage
 *
 * @param tour - Tour name
 * @param currentStep - Current step index
 */
export function saveTourProgress(tour: string, currentStep: number) {
  try {
    const state = loadTourState(tour);
    const progress: TourProgress = {
      currentStep,
      version: TOUR_VERSION,
      startedAt: state.progress?.startedAt ?? new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(tour, 'progress'), JSON.stringify(progress));
    localStorage.setItem(getStorageKey(tour, 'version'), TOUR_VERSION);

    if (import.meta.env.DEV) {
      console.info(`[tour-persistence] Saved progress for "${tour}":`, progress);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[tour-persistence] Failed to save progress:', error);
    }
  }
}

/**
 * Marks tour as completed
 *
 * @param tour - Tour name
 */
export function markTourCompleted(tour: string) {
  try {
    const state = loadTourState(tour);
    const progress: TourProgress = {
      currentStep: -1, // Completed
      version: TOUR_VERSION,
      startedAt: state.progress?.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(tour, 'completed'), 'true');
    localStorage.setItem(getStorageKey(tour, 'progress'), JSON.stringify(progress));
    localStorage.setItem(getStorageKey(tour, 'version'), TOUR_VERSION);

    if (import.meta.env.DEV) {
      console.info(`[tour-persistence] Marked "${tour}" as completed`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[tour-persistence] Failed to mark completed:', error);
    }
  }
}

/**
 * Marks tour as skipped
 *
 * @param tour - Tour name
 */
export function markTourSkipped(tour: string) {
  try {
    localStorage.setItem(getStorageKey(tour, 'skipped'), 'true');
    localStorage.setItem(getStorageKey(tour, 'version'), TOUR_VERSION);

    if (import.meta.env.DEV) {
      console.info(`[tour-persistence] Marked "${tour}" as skipped`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[tour-persistence] Failed to mark skipped:', error);
    }
  }
}

/**
 * Resets all tour state (for replay)
 *
 * @param tour - Tour name
 */
export function resetTourState(tour: string) {
  try {
    localStorage.removeItem(getStorageKey(tour, 'progress'));
    localStorage.removeItem(getStorageKey(tour, 'completed'));
    localStorage.removeItem(getStorageKey(tour, 'skipped'));
    localStorage.setItem(getStorageKey(tour, 'version'), TOUR_VERSION);

    if (import.meta.env.DEV) {
      console.info(`[tour-persistence] Reset state for "${tour}"`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[tour-persistence] Failed to reset tour state:', error);
    }
  }
}

/**
 * Checks if user has seen a legacy version of the tour
 *
 * @param tour - Tour name
 * @returns boolean
 */
export function hasSeenLegacyVersion(tour: string): boolean {
  return localStorage.getItem(getStorageKey(tour, 'seenLegacy')) === 'true';
}

/**
 * Idempotent auto-start guard
 *
 * Prevents duplicate tour starts due to React strict mode or other edge cases.
 * Uses a global token to ensure only one tour start per session.
 */
let _autoStartToken = 0;

export function safeAutoStart(startTour: () => void, isFirstLogin: boolean, tour = 'onboarding') {
  if (!isFirstLogin) return;

  const state = loadTourState(tour);

  // Don't auto-start if completed or skipped
  if (state.completed || state.skipped) {
    if (import.meta.env.DEV) {
      console.info(
        `[tour-persistence] Skipping auto-start for "${tour}" (completed=${state.completed}, skipped=${state.skipped})`,
      );
    }
    return;
  }

  // Idempotent guard: only allow one auto-start per session
  queueMicrotask(() => {
    if (_autoStartToken) {
      if (import.meta.env.DEV) {
        console.debug('[tour-persistence] Auto-start already triggered, skipping');
      }
      return;
    }

    _autoStartToken = 1; // One-shot flag
    startTour();

    // Release token on next tick
    setTimeout(() => {
      _autoStartToken = 0;
    }, 0);
  });
}

/**
 * Resets the auto-start token (useful for testing)
 */
export function resetAutoStartToken() {
  _autoStartToken = 0;
}
