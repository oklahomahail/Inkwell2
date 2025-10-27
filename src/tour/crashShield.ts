/**
 * Tour Crash Shield
 * Provides soft crash handling and fallback for tour failures
 */

import { tourAnalytics } from './adapters/analyticsAdapter';

interface CrashShieldState {
  failureCount: number;
  lastFailureTime: number;
  tourId?: string;
}

const CRASH_THRESHOLD = 2; // Failures before shield activates
const CRASH_WINDOW = 2000; // 2 seconds
const STORAGE_KEY = 'inkwell:tour:crash-shield';

/**
 * Get crash shield state from storage
 */
function getState(): CrashShieldState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[CrashShield] Failed to read state:', error);
  }
  return { failureCount: 0, lastFailureTime: 0 };
}

/**
 * Update crash shield state
 */
function setState(state: CrashShieldState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[CrashShield] Failed to save state:', error);
  }
}

/**
 * Reset crash shield state
 */
function resetState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[CrashShield] Failed to reset state:', error);
  }
}

/**
 * Record a tour failure
 */
export function recordTourFailure(tourId: string, reason: string): void {
  const state = getState();
  const now = Date.now();

  // Reset counter if outside the crash window
  if (now - state.lastFailureTime > CRASH_WINDOW) {
    state.failureCount = 0;
  }

  state.failureCount++;
  state.lastFailureTime = now;
  state.tourId = tourId;

  setState(state);

  // Log the failure
  tourAnalytics.logTourError(`Tour failure: ${reason}`, {
    tourId,
    failureCount: state.failureCount,
    withinWindow: now - state.lastFailureTime <= CRASH_WINDOW,
  });

  // Check if we should activate the shield
  if (state.failureCount >= CRASH_THRESHOLD) {
    activateShield(tourId, reason);
  }
}

/**
 * Activate crash shield and show fallback UI
 */
function activateShield(tourId: string, reason: string): void {
  tourAnalytics.logTourError('Crash shield activated', {
    tourId,
    reason,
    threshold: CRASH_THRESHOLD,
  });

  // Show toast notification
  showFallbackToast();

  // Reset state to prevent shield from staying active
  setTimeout(() => {
    resetState();
  }, 5000);
}

/**
 * Show fallback toast message
 */
function showFallbackToast(): void {
  // Check if toast service is available
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast:show', {
      detail: {
        message: "Couldn't start the tour. You can still explore via the checklist in Help.",
        variant: 'info',
        duration: 5000,
      },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Check if shield should prevent tour from starting
 */
export function shouldBlockTour(): boolean {
  const state = getState();
  const now = Date.now();

  // Block if we've had multiple failures within the window
  if (state.failureCount >= CRASH_THRESHOLD && now - state.lastFailureTime <= CRASH_WINDOW) {
    return true;
  }

  return false;
}

/**
 * Reset crash shield (e.g., on successful tour completion)
 */
export function resetCrashShield(): void {
  resetState();
}

/**
 * Wrap tour initialization with crash shield
 */
export async function withCrashShield<T>(
  tourId: string,
  fn: () => Promise<T>,
  onError?: (error: Error) => void,
): Promise<T | null> {
  // Check if shield is active
  if (shouldBlockTour()) {
    tourAnalytics.logTourError('Tour blocked by crash shield', { tourId });
    showFallbackToast();
    return null;
  }

  try {
    const result = await fn();
    // Success - reset any previous failures
    resetCrashShield();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    recordTourFailure(tourId, errorMessage);

    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage));
    }

    return null;
  }
}
