/**
 * Tour Analytics Adapter
 *
 * Provides a clean interface for tracking tour lifecycle events.
 * Wraps the analytics service with tour-specific event tracking.
 */

import { analyticsService } from '@/services/analyticsService';

type Payload = Record<string, unknown>;

/**
 * Safe track wrapper that prevents analytics errors from breaking tours
 */
function track(event: string, payload: Payload): void {
  try {
    // Use the real analytics service
    analyticsService.track(event as any, payload);
  } catch (error) {
    // Analytics should never break the tour flow
    console.warn('[TourAnalytics] Failed to track event:', event, error);
  }
}

export const tourAnalytics = {
  /**
   * Track when a tour starts
   */
  started(tourId: string, metadata?: Payload): void {
    track('tour_started', {
      tour_id: tourId,
      timestamp: Date.now(),
      ...metadata,
    });
  },

  /**
   * Track when a user views a specific step
   */
  stepViewed(tourId: string, stepIndex: number, stepId?: string, metadata?: Payload): void {
    track('tour_step_viewed', {
      tour_id: tourId,
      step_index: stepIndex,
      step_id: stepId,
      timestamp: Date.now(),
      ...metadata,
    });
  },

  /**
   * Track when a tour is completed successfully
   */
  completed(tourId: string, metadata?: Payload): void {
    track('tour_completed', {
      tour_id: tourId,
      timestamp: Date.now(),
      ...metadata,
    });
  },

  /**
   * Track when a tour is skipped or abandoned
   */
  skipped(tourId: string, stepIndex: number, metadata?: Payload): void {
    track('tour_skipped', {
      tour_id: tourId,
      step_index: stepIndex,
      timestamp: Date.now(),
      ...metadata,
    });
  },
};

export type TourAnalytics = typeof tourAnalytics;
