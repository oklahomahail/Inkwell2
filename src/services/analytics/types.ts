/**
 * Analytics Types
 *
 * Type definitions for the privacy-first analytics system.
 * All analytics are local-only by default with opt-in telemetry.
 */

/**
 * Analytics event categories
 */
export type AnalyticsCategory =
  | 'writing' // Writing sessions, typing, focus
  | 'editor' // Editor performance, latency
  | 'autosave' // Save operations, latency
  | 'ai' // AI requests, responses, tokens
  | 'export' // Export operations, formats
  | 'timeline' // Timeline operations
  | 'storage' // Storage read/write operations
  | 'ui' // UI interactions, navigation
  | 'performance'; // General performance metrics

/**
 * Analytics event type
 */
export interface AnalyticsEvent {
  id: string; // Unique event ID
  timestamp: number; // Unix timestamp (ms)
  category: AnalyticsCategory;
  action: string; // e.g., "session.start", "latency.measure"
  label?: string; // Optional label for grouping
  value?: number; // Numeric value (for metrics)
  metadata?: Record<string, unknown>; // Additional context
  sessionId: string; // Current session ID
}

/**
 * Analytics metric type (for performance measurements)
 */
export interface AnalyticsMetric {
  id: string;
  timestamp: number;
  category: AnalyticsCategory;
  name: string; // Metric name (e.g., "typing.latency")
  value: number; // Measured value
  unit: string; // Unit of measurement (ms, bytes, count)
  sessionId: string;
}

/**
 * Analytics aggregate type (for cumulative data)
 */
export interface AnalyticsAggregate {
  id: string;
  timestamp: number;
  category: AnalyticsCategory;
  name: string; // Aggregate name (e.g., "wordcount")
  value: number; // Aggregated value
  projectId?: string; // Optional project context
  sessionId: string;
}

/**
 * Analytics session type
 */
export interface AnalyticsSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number; // Duration in ms
  eventCount: number;
  projectId?: string;
  userId?: string;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean; // Global analytics toggle
  telemetryEnabled: boolean; // External telemetry opt-in
  sampleRate: number; // Sampling rate (0-1)
  retentionDays: number; // Days to retain analytics data
  batchSize: number; // Events per batch
  flushInterval: number; // Auto-flush interval (ms)
}

/**
 * Analytics storage schema
 */
export interface AnalyticsStorage {
  events: AnalyticsEvent[];
  metrics: AnalyticsMetric[];
  aggregates: AnalyticsAggregate[];
  sessions: AnalyticsSession[];
}

/**
 * Analytics query filters
 */
export interface AnalyticsQuery {
  category?: AnalyticsCategory;
  action?: string;
  startTime?: number;
  endTime?: number;
  sessionId?: string;
  projectId?: string;
  limit?: number;
}

/**
 * Analytics summary statistics
 */
export interface AnalyticsSummary {
  totalEvents: number;
  totalSessions: number;
  averageSessionDuration: number;
  categories: Record<AnalyticsCategory, number>;
  topActions: Array<{ action: string; count: number }>;
  dateRange: {
    start: number;
    end: number;
  };
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  typing: {
    averageLatency: number;
    p50: number;
    p95: number;
    p99: number;
  };
  autosave: {
    averageLatency: number;
    p50: number;
    p95: number;
    p99: number;
    frequency: number; // saves per hour
  };
  storage: {
    readLatency: number;
    writeLatency: number;
    totalReads: number;
    totalWrites: number;
  };
  memory: {
    usedBytes: number;
    limitBytes?: number;
  };
}

/**
 * Writing session analytics
 */
export interface WritingSessionAnalytics {
  sessionId: string;
  projectId?: string;
  duration: number; // ms
  wordsWritten: number;
  charactersWritten: number;
  deletions: number;
  focusDuration: number; // Time with editor in focus
  pauseDuration: number; // Time paused/idle
  averageTypingSpeed: number; // words per minute
  peakTypingSpeed: number;
}

/**
 * Story insights (aggregated from analytics)
 */
export interface StoryInsights {
  projectId: string;
  totalWords: number;
  totalSessions: number;
  totalWritingTime: number; // ms
  averageWordsPerSession: number;
  writingStreak: number; // consecutive days
  pacing: {
    dialogueRatio: number; // 0-1
    narrativeRatio: number; // 0-1
    averageSceneLength: number; // words
  };
  productivity: {
    wordsPerHour: number;
    peakHour: number; // 0-23
    bestDayOfWeek: number; // 0-6
  };
}
