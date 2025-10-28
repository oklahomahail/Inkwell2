/**
 * Tour Analytics Adapter
 *
 * Provides a clean interface for tracking tour lifecycle events.
 * Wraps the analytics service with tour-specific event tracking.
 */

import { analyticsService } from '@/services/analyticsService';
import devLog from '@/utils/devLog';

type Payload = Record<string, unknown>;

export type TourEvent =
  | { type: 'tour_started'; tour_id: string; version?: number; ts: number; metadata?: Payload }
  | { type: 'tour_step_viewed'; tour_id: string; step_id?: string; index: number; ts: number }
  | {
      type: 'tour_completed';
      tour_id: string;
      version?: number;
      steps: number;
      duration_ms?: number;
      ts: number;
    }
  | { type: 'tour_skipped'; tour_id: string; step_id?: string; index?: number; ts: number }
  | { type: 'tour_error'; tour_id?: string; message: string; ts: number; metadata?: Payload };

/**
 * Safe track wrapper that prevents analytics errors from breaking tours
 */
function track(event: string, payload: Payload): void {
  try {
    // Use the real analytics service
    analyticsService.track(event as any, payload);
  } catch (error) {
    // Analytics should never break the tour flow
    devLog.warn('[TourAnalytics] Failed to track event:', event, error);
  }
}

/**
 * Persist tour events to localStorage for analytics dashboard
 */
function persistEvent(event: TourEvent): void {
  try {
    const key = 'analytics.tour.events';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    prev.push(event);
    // Keep only the last 5000 events
    localStorage.setItem(key, JSON.stringify(prev.slice(-5000)));
  } catch (error) {
    // Silent fail - don't break tour flow
    devLog.warn('[TourAnalytics] Failed to persist event:', error);
  }
}

export const tourAnalytics = {
  /**
   * Track when a tour starts
   */
  started(tourId: string, metadata?: Payload): void {
    const event: TourEvent = {
      type: 'tour_started',
      tour_id: tourId,
      version: (metadata?.version as number) ?? 1,
      ts: Date.now(),
      metadata,
    };
    persistEvent(event);
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
    const event: TourEvent = {
      type: 'tour_step_viewed',
      tour_id: tourId,
      step_id: stepId,
      index: stepIndex,
      ts: Date.now(),
    };
    persistEvent(event);
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
    const event: TourEvent = {
      type: 'tour_completed',
      tour_id: tourId,
      version: (metadata?.version as number) ?? 1,
      steps: (metadata?.totalSteps as number) ?? 0,
      duration_ms: (metadata?.durationMs as number) ?? 0,
      ts: Date.now(),
    };
    persistEvent(event);
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
    const event: TourEvent = {
      type: 'tour_skipped',
      tour_id: tourId,
      step_id: (metadata?.stepId as string) ?? undefined,
      index: stepIndex,
      ts: Date.now(),
    };
    persistEvent(event);
    track('tour_skipped', {
      tour_id: tourId,
      step_index: stepIndex,
      timestamp: Date.now(),
      ...metadata,
    });
  },

  /**
   * Log tour errors for remote debugging
   * Breadcrumb logging to help diagnose production issues
   */
  logTourError(message: string, meta?: Record<string, unknown>): void {
    const event: TourEvent = {
      type: 'tour_error',
      tour_id: meta?.tourId as string | undefined,
      message,
      ts: Date.now(),
      metadata: meta,
    };

    // Log to console in development
    devLog.error('tour_error', { message, ...meta, ts: Date.now() });

    // Persist for analytics
    persistEvent(event);

    // Track via analytics service
    track('tour_error', {
      message,
      timestamp: Date.now(),
      ...meta,
    });
  },
};

export type TourAnalytics = typeof tourAnalytics;
