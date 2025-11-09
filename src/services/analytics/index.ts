/**
 * Analytics Module
 *
 * Privacy-first analytics system for performance monitoring and user insights.
 * All data is stored locally in IndexedDB with configurable retention.
 * External telemetry is opt-in only.
 */

export { analyticsService } from './analyticsService';
export type {
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsAggregate,
  AnalyticsSession,
  AnalyticsConfig,
  AnalyticsQuery,
  AnalyticsSummary,
  AnalyticsCategory,
  PerformanceMetrics,
  WritingSessionAnalytics,
  StoryInsights,
} from './types';
