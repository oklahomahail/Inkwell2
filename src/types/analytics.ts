/**
 * Represents a single analytics event
 */
export interface AnalyticsEvent {
  /** Timestamp when the event occurred */
  timestamp: number;
  /** Additional metadata for the event */
  metadata?: Record<string, unknown>;
}

/**
 * Map of event names to their recorded instances
 */
export interface AnalyticsStore {
  [eventName: string]: AnalyticsEvent[];
}

/**
 * Available analytics event names
 */
export type AnalyticsEventName =
  | 'feature_usage'
  | 'writing_session'
  | 'onboarding_step'
  | 'performance_metric'
  | 'error'
  | 'ui_interaction';
