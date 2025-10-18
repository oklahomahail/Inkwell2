/**
 * Tour Analytics Tracking Utilities
 *
 * Provides consistent, telemetry-friendly event tracking for the Inkwell Spotlight Tour.
 * All events follow a standardized naming convention and payload structure.
 *
 * Events:
 * - tour_started: When the tour begins
 * - tour_step_viewed: When a step is displayed
 * - tour_step_action: When user clicks an action button (e.g., "Open Settings")
 * - tour_completed: When all steps are finished
 * - tour_skipped: When user exits early
 */

export type TourEvent =
  | 'tour_started'
  | 'tour_step_viewed'
  | 'tour_step_action'
  | 'tour_completed'
  | 'tour_skipped';

export interface TourEventPayload {
  tour: string; // e.g., 'inkwell-spotlight'
  stepIndex?: number;
  stepId?: string;
  action?: string;
  durationMs?: number;
  totalSteps?: number;
  timestamp?: number;
}

/**
 * Checks if Do Not Track (DNT) is enabled
 */
function isDNTEnabled(): boolean {
  if (typeof navigator === 'undefined') return true;
  return (
    navigator.doNotTrack === '1' ||
    // @ts-expect-error - legacy DNT property
    navigator.doNotTrack === 'yes' ||
    // @ts-expect-error - legacy msDoNotTrack
    navigator.msDoNotTrack === '1'
  );
}

/**
 * Checks if we're using development/test API keys
 */
function isDevEnvironment(): boolean {
  // Check for common dev indicators
  if (import.meta.env.DEV) return true;
  if (import.meta.env.MODE === 'development') return true;

  // Check for test/dev Supabase keys
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl?.includes('localhost')) return true;
  if (supabaseUrl?.includes('127.0.0.1')) return true;

  return false;
}

/**
 * Core tracking function - dispatches custom events
 *
 * @param event - Event name
 * @param payload - Event data
 */
export function trackTourEvent(event: TourEvent, payload: TourEventPayload) {
  // Respect DNT
  if (isDNTEnabled()) {
    if (import.meta.env.DEV) {
      console.info('[tour-analytics] DNT enabled, skipping event:', event);
    }
    return;
  }

  // Add timestamp
  const enrichedPayload: TourEventPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  // Log in dev
  if (import.meta.env.DEV || isDevEnvironment()) {
    console.info('[tour-analytics]', event, enrichedPayload);
  }

  // Dispatch custom event for external listeners
  try {
    window.dispatchEvent(
      new CustomEvent('inkwell_analytics', {
        detail: { event, ...enrichedPayload },
      }),
    );
  } catch (error) {
    // Silent fail - analytics should never break the app
    if (import.meta.env.DEV) {
      console.error('[tour-analytics] Failed to dispatch event:', error);
    }
  }

  // TODO: Wire to your analytics service
  // Example:
  // analyticsService.track(event, enrichedPayload);
}

/**
 * Convenience methods for common tour events
 */

export function trackTourStarted(tour: string, totalSteps: number) {
  trackTourEvent('tour_started', { tour, totalSteps });
}

export function trackTourStepViewed(tour: string, stepIndex: number, stepId: string) {
  trackTourEvent('tour_step_viewed', { tour, stepIndex, stepId });
}

export function trackTourStepAction(
  tour: string,
  stepIndex: number,
  stepId: string,
  action: string,
) {
  trackTourEvent('tour_step_action', { tour, stepIndex, stepId, action });
}

export function trackTourCompleted(tour: string, durationMs: number) {
  trackTourEvent('tour_completed', { tour, durationMs });
}

export function trackTourSkipped(tour: string, stepIndex: number) {
  trackTourEvent('tour_skipped', { tour, stepIndex });
}

/**
 * Timer utility for measuring tour duration
 */
export class TourTimer {
  private startTime: number;
  private tour: string;

  constructor(tour: string) {
    this.tour = tour;
    this.startTime = Date.now();
  }

  /**
   * Completes the tour and tracks duration
   */
  complete() {
    const durationMs = Date.now() - this.startTime;
    trackTourCompleted(this.tour, durationMs);
  }

  /**
   * Skips the tour and tracks current step
   */
  skip(stepIndex: number) {
    trackTourSkipped(this.tour, stepIndex);
  }

  /**
   * Gets current duration without tracking
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}
