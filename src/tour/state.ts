// File: src/tour/state.ts
// Tour state management with versioned persistence

import type { TourState } from './types';

const STORAGE_KEY = 'inkwell.tour.v2.state';

/**
 * Initialize or get existing tour state
 */
export function getTourState(): TourState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { version: 2 };

    const state = JSON.parse(stored) as TourState;
    if (!state || typeof state !== 'object') return { version: 2 };

    // Ensure required fields
    return {
      version: state.version || 2,
      completedAt: state.completedAt,
      lastStep: state.lastStep,
    };
  } catch (err) {
    console.warn('Error reading tour state:', err);
    return { version: 2 };
  }
}

/**
 * Save tour state updates
 */
export function setTourState(state: TourState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Error saving tour state:', err);
  }
}

/**
 * Mark the tour as completed
 */
export function markTourComplete(): void {
  const current = getTourState();
  setTourState({
    ...current,
    completedAt: Date.now(),
    lastStep: undefined,
  });
}

/**
 * Save progress on the last viewed step
 */
export function saveLastStep(stepId: string): void {
  const current = getTourState();
  setTourState({
    ...current,
    lastStep: stepId,
  });
}

/**
 * Check if this is a first-time tour view
 */
export function isFirstTime(): boolean {
  const state = getTourState();
  return !state.completedAt && !state.lastStep;
}

/**
 * Check if tour should auto-start
 * This is true for first-time users who haven't seen or completed the tour
 */
export function shouldAutoStart(): boolean {
  if (typeof window === 'undefined') return false;

  const state = getTourState();
  const autoStarted = localStorage.getItem('inkwell.tour.v2.autostarted');

  return isFirstTime() && !autoStarted && !state.completedAt;
}

/**
 * Get analytics-friendly state snapshot
 */
export function getStateSnapshot() {
  const state = getTourState();
  return {
    isFirstTime: isFirstTime(),
    hasCompleted: Boolean(state.completedAt),
    lastStep: state.lastStep || null,
    version: state.version,
  };
}
