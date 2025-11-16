/**
 * Analytics Service
 *
 * Privacy-first analytics system for performance monitoring and user insights.
 * All data is stored locally in IndexedDB with configurable retention.
 * External telemetry is opt-in only.
 */

import { openDB, IDBPDatabase } from 'idb';

import {
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsAggregate,
  AnalyticsSession,
  AnalyticsConfig,
  AnalyticsQuery,
  AnalyticsSummary,
  AnalyticsCategory,
} from './types';

const DB_NAME = 'inkwell_analytics';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';
const STORE_METRICS = 'metrics';
const STORE_AGGREGATES = 'aggregates';
const STORE_SESSIONS = 'sessions';

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  telemetryEnabled: false,
  sampleRate: 1.0, // 100% sampling by default
  retentionDays: 30,
  batchSize: 100,
  flushInterval: 60000, // 1 minute
};

class AnalyticsService {
  private db: IDBPDatabase | null = null;
  private config: AnalyticsConfig = DEFAULT_CONFIG;
  private eventQueue: AnalyticsEvent[] = [];
  private metricQueue: AnalyticsMetric[] = [];
  private aggregateQueue: AnalyticsAggregate[] = [];
  private currentSession: AnalyticsSession | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    // Load config from localStorage
    this.loadConfig();

    // Check if analytics is globally disabled
    if (!this.config.enabled) {
      // Analytics disabled - silent skip
      return;
    }

    // Initialize IndexedDB
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Events store
          if (!db.objectStoreNames.contains(STORE_EVENTS)) {
            const eventsStore = db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
            eventsStore.createIndex('timestamp', 'timestamp');
            eventsStore.createIndex('category', 'category');
            eventsStore.createIndex('sessionId', 'sessionId');
          }

          // Metrics store
          if (!db.objectStoreNames.contains(STORE_METRICS)) {
            const metricsStore = db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
            metricsStore.createIndex('timestamp', 'timestamp');
            metricsStore.createIndex('category', 'category');
            metricsStore.createIndex('name', 'name');
          }

          // Aggregates store
          if (!db.objectStoreNames.contains(STORE_AGGREGATES)) {
            const aggregatesStore = db.createObjectStore(STORE_AGGREGATES, { keyPath: 'id' });
            aggregatesStore.createIndex('timestamp', 'timestamp');
            aggregatesStore.createIndex('category', 'category');
            aggregatesStore.createIndex('projectId', 'projectId');
          }

          // Sessions store
          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            const sessionsStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
            sessionsStore.createIndex('startTime', 'startTime');
            sessionsStore.createIndex('projectId', 'projectId');
          }
        },
      });

      // Start a new session
      this.startSession();

      // Start auto-flush timer
      this.startFlushTimer();

      // Clean up old data
      await this.cleanupOldData();
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      // Always start with defaults
      this.config = { ...DEFAULT_CONFIG };

      // Then merge stored config if it exists
      const stored = localStorage.getItem('inkwell_analytics_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }

      // Check for global telemetry disable flag (always takes precedence)
      const telemetryDisabled = localStorage.getItem('inkwell_telemetry_disabled');
      if (telemetryDisabled === 'true') {
        this.config.telemetryEnabled = false;
      }
    } catch (error) {
      console.warn('[Analytics] Failed to load config:', error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('inkwell_analytics_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('[Analytics] Failed to save config:', error);
    }
  }

  /**
   * Update analytics configuration
   */
  updateConfig(updates: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...updates };

    // Always enforce global telemetry disable flag if set
    const telemetryDisabled = localStorage.getItem('inkwell_telemetry_disabled');
    if (telemetryDisabled === 'true') {
      this.config.telemetryEnabled = false;
    }

    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Start a new analytics session
   */
  private startSession(): void {
    this.currentSession = {
      id: this.generateId(),
      startTime: Date.now(),
      eventCount: 0,
    };
  }

  /**
   * End current analytics session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // Save session to database
    if (this.db) {
      try {
        await this.db.add(STORE_SESSIONS, this.currentSession);
      } catch (error) {
        console.error('[Analytics] Failed to save session:', error);
      }
    }

    // Flush any remaining queued data
    await this.flush();

    this.currentSession = null;
  }

  /**
   * Log an analytics event
   */
  logEvent(
    category: AnalyticsCategory,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const event: AnalyticsEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      metadata,
      sessionId: this.currentSession?.id || 'unknown',
    };

    this.eventQueue.push(event);

    // Increment session event count
    if (this.currentSession) {
      this.currentSession.eventCount++;
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Log a performance metric
   */
  logMetric(category: AnalyticsCategory, name: string, value: number, unit: string = 'ms'): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const metric: AnalyticsMetric = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      name,
      value,
      unit,
      sessionId: this.currentSession?.id || 'unknown',
    };

    this.metricQueue.push(metric);

    // Auto-flush if queue is full
    if (this.metricQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Log an aggregate value
   */
  logAggregate(category: AnalyticsCategory, name: string, value: number, projectId?: string): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const aggregate: AnalyticsAggregate = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      name,
      value,
      projectId,
      sessionId: this.currentSession?.id || 'unknown',
    };

    this.aggregateQueue.push(aggregate);

    // Auto-flush if queue is full
    if (this.aggregateQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queued analytics to IndexedDB
   */
  async flush(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if database is still available (important for incognito mode and page unload)
      // In incognito mode or during page unload, the database connection may be closing
      // which causes "The database connection is closing" errors
      try {
        // Try to access the database - this will throw if connection is closing
        const testTx = this.db.transaction(STORE_EVENTS, 'readonly');
        testTx.done.catch(() => {
          // Connection is closing, clear queues and return
          this.eventQueue = [];
          this.metricQueue = [];
          this.aggregateQueue = [];
        });
      } catch {
        // Connection not available, clear queues and return
        this.eventQueue = [];
        this.metricQueue = [];
        this.aggregateQueue = [];
        return;
      }

      // Flush events
      if (this.eventQueue.length > 0) {
        const tx = this.db.transaction(STORE_EVENTS, 'readwrite');
        await Promise.all(this.eventQueue.map((event) => tx.store.add(event)));
        await tx.done;
        this.eventQueue = [];
      }

      // Flush metrics
      if (this.metricQueue.length > 0) {
        const tx = this.db.transaction(STORE_METRICS, 'readwrite');
        await Promise.all(this.metricQueue.map((metric) => tx.store.add(metric)));
        await tx.done;
        this.metricQueue = [];
      }

      // Flush aggregates
      if (this.aggregateQueue.length > 0) {
        const tx = this.db.transaction(STORE_AGGREGATES, 'readwrite');
        await Promise.all(this.aggregateQueue.map((agg) => tx.store.add(agg)));
        await tx.done;
        this.aggregateQueue = [];
      }
    } catch (error) {
      // Silently fail in incognito mode or during page transitions
      // Only log if it's not the common "database connection is closing" error
      if (
        error instanceof Error &&
        !error.message.includes('database connection is closing') &&
        !error.message.includes('InvalidStateError')
      ) {
        console.error('[Analytics] Failed to flush data:', error);
      }
      // Clear queues on error to prevent memory leaks
      this.eventQueue = [];
      this.metricQueue = [];
      this.aggregateQueue = [];
    }
  }

  /**
   * Query analytics events
   */
  async queryEvents(query: AnalyticsQuery = {}): Promise<AnalyticsEvent[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction(STORE_EVENTS, 'readonly');
      let events: AnalyticsEvent[];

      if (query.category) {
        events = await tx.store.index('category').getAll(query.category);
      } else {
        events = await tx.store.getAll();
      }

      // Apply additional filters
      events = this.applyFilters(events, query);

      return events;
    } catch (error) {
      console.error('[Analytics] Failed to query events:', error);
      return [];
    }
  }

  /**
   * Query analytics metrics
   */
  async queryMetrics(query: AnalyticsQuery = {}): Promise<AnalyticsMetric[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction(STORE_METRICS, 'readonly');
      let metrics: AnalyticsMetric[];

      if (query.category) {
        metrics = await tx.store.index('category').getAll(query.category);
      } else {
        metrics = await tx.store.getAll();
      }

      // Apply additional filters
      metrics = this.applyFilters(metrics, query);

      return metrics;
    } catch (error) {
      console.error('[Analytics] Failed to query metrics:', error);
      return [];
    }
  }

  /**
   * Get analytics summary
   */
  async getSummary(query: AnalyticsQuery = {}): Promise<AnalyticsSummary> {
    const events = await this.queryEvents(query);
    const sessions = await this.getAllSessions();

    const categories: Record<AnalyticsCategory, number> = {} as any;
    const actions: Record<string, number> = {};

    events.forEach((event) => {
      categories[event.category] = (categories[event.category] || 0) + 1;
      actions[event.action] = (actions[event.action] || 0) + 1;
    });

    const topActions = Object.entries(actions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    const totalSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionDuration = sessions.length > 0 ? totalSessionDuration / sessions.length : 0;

    const timestamps = events.map((e) => e.timestamp);
    const dateRange = {
      start: timestamps.length > 0 ? Math.min(...timestamps) : Date.now(),
      end: timestamps.length > 0 ? Math.max(...timestamps) : Date.now(),
    };

    return {
      totalEvents: events.length,
      totalSessions: sessions.length,
      averageSessionDuration,
      categories,
      topActions,
      dateRange,
    };
  }

  /**
   * Get all sessions
   */
  private async getAllSessions(): Promise<AnalyticsSession[]> {
    if (!this.db) return [];

    try {
      return await this.db.getAll(STORE_SESSIONS);
    } catch (error) {
      console.error('[Analytics] Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Clean up old analytics data based on retention policy
   */
  private async cleanupOldData(): Promise<void> {
    if (!this.db) return;

    const cutoffTime = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;

    try {
      // Clean events
      const eventsTx = this.db.transaction(STORE_EVENTS, 'readwrite');
      const eventsIndex = eventsTx.store.index('timestamp');
      let eventsCursor = await eventsIndex.openCursor();
      while (eventsCursor) {
        if (eventsCursor.value.timestamp < cutoffTime) {
          await eventsCursor.delete();
        }
        eventsCursor = await eventsCursor.continue();
      }

      // Clean metrics
      const metricsTx = this.db.transaction(STORE_METRICS, 'readwrite');
      const metricsIndex = metricsTx.store.index('timestamp');
      let metricsCursor = await metricsIndex.openCursor();
      while (metricsCursor) {
        if (metricsCursor.value.timestamp < cutoffTime) {
          await metricsCursor.delete();
        }
        metricsCursor = await metricsCursor.continue();
      }

      // Clean aggregates
      const aggregatesTx = this.db.transaction(STORE_AGGREGATES, 'readwrite');
      const aggregatesIndex = aggregatesTx.store.index('timestamp');
      let aggregatesCursor = await aggregatesIndex.openCursor();
      while (aggregatesCursor) {
        if (aggregatesCursor.value.timestamp < cutoffTime) {
          await aggregatesCursor.delete();
        }
        aggregatesCursor = await aggregatesCursor.continue();
      }

      // Clean sessions
      const sessionsTx = this.db.transaction(STORE_SESSIONS, 'readwrite');
      const sessionsIndex = sessionsTx.store.index('startTime');
      let sessionsCursor = await sessionsIndex.openCursor();
      while (sessionsCursor) {
        if (sessionsCursor.value.startTime < cutoffTime) {
          await sessionsCursor.delete();
        }
        sessionsCursor = await sessionsCursor.continue();
      }
    } catch (error) {
      console.error('[Analytics] Failed to clean up old data:', error);
    }
  }

  /**
   * Apply query filters to results
   */
  private applyFilters<T extends { timestamp: number; sessionId?: string }>(
    items: T[],
    query: AnalyticsQuery,
  ): T[] {
    let filtered = items;

    if (query.startTime) {
      filtered = filtered.filter((item) => item.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      filtered = filtered.filter((item) => item.timestamp <= query.endTime!);
    }

    if (query.sessionId) {
      filtered = filtered.filter((item) => item.sessionId === query.sessionId);
    }

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Check if event should be sampled based on sample rate
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Start auto-flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy analytics service
   */
  async destroy(): Promise<void> {
    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // End current session
    await this.endSession();

    // Close database
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Reset config to defaults (important for tests)
    this.config = { ...DEFAULT_CONFIG };
    this.eventQueue = [];
    this.metricQueue = [];
    this.aggregateQueue = [];
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
