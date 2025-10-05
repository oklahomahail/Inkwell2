// Observability and tracing system for Inkwell
// Dev-only logger for store actions and editor render timings

import React from 'react';

import { featureFlags } from './flags';

/* ========= Types ========= */
export interface TraceEvent {
  id: string;
  type: 'store_action' | 'component_render' | 'api_call' | 'user_action' | 'performance';
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  category?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
}

export interface PerformanceMetrics {
  component: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowestRender: number;
  lastRender: number;
}

/* ========= Trace Logger ========= */
class TraceLogger {
  private events: TraceEvent[] = [];
  private activeTraces = new Map<string, TraceEvent>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private isEnabled = false;

  constructor() {
    this.checkEnabled();

    // Re-check when URL changes
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => this.checkEnabled());
    }
  }

  private checkEnabled(): void {
    this.isEnabled =
      featureFlags.isEnabled('performanceMonitoring') ||
      featureFlags.isDebugMode() ||
      new URLSearchParams(window.location.search).get('trace') === '1';

    if (this.isEnabled) {
      console.log('📊 Trace logging enabled');
    }
  }

  /**
   * Start a new trace event
   */
  start(name: string, type: TraceEvent['type'], metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';

    const id = `${type}_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: TraceEvent = {
      id,
      type,
      name,
      startTime: performance.now(),
      metadata,
      level: 'debug',
    };

    this.activeTraces.set(id, event);
    return id;
  }

  /**
   * End a trace event
   */
  end(id: string, additionalMetadata?: Record<string, any>): void {
    if (!this.isEnabled || !id) return;

    const event = this.activeTraces.get(id);
    if (!event) {
      console.warn(`Trace event ${id} not found`);
      return;
    }

    event.endTime = performance.now();
    event.duration = event.endTime - event.startTime;

    if (additionalMetadata) {
      event.metadata = { ...event.metadata, ...additionalMetadata };
    }

    this.activeTraces.delete(id);
    this.events.push(event);

    // Update performance metrics for renders
    if (event.type === 'component_render') {
      this.updateRenderMetrics(event);
    }

    // Log slow operations
    if (event.duration > 100) {
      console.warn(
        `🐌 Slow ${event.type}: ${event.name} took ${event.duration.toFixed(2)}ms`,
        event.metadata,
      );
    } else if (event.duration > 16.67) {
      // > 60fps threshold
      console.log(
        `⚡ ${event.type}: ${event.name} took ${event.duration.toFixed(2)}ms`,
        event.metadata,
      );
    }

    // Keep only last 1000 events to prevent memory leaks
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Log an instant event (no duration)
   */
  log(
    name: string,
    type: TraceEvent['type'],
    level: TraceEvent['level'] = 'info',
    metadata?: Record<string, any>,
  ): void {
    if (!this.isEnabled) return;

    const event: TraceEvent = {
      id: `${type}_${name}_${Date.now()}`,
      type,
      name,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      metadata,
      level,
    };

    this.events.push(event);

    // Console output based on level
    const emoji = {
      debug: '🐛',
      info: '📝',
      warn: '⚠️',
      error: '❌',
    }[level];

    console.log(`${emoji} ${type}: ${name}`, metadata);
  }

  /**
   * Update component render metrics
   */
  private updateRenderMetrics(event: TraceEvent): void {
    if (!event.duration || event.type !== 'component_render') return;

    const component = event.name;
    const existing = this.performanceMetrics.get(component);

    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += event.duration;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.slowestRender = Math.max(existing.slowestRender, event.duration);
      existing.lastRender = event.duration;
    } else {
      this.performanceMetrics.set(component, {
        component,
        renderCount: 1,
        totalRenderTime: event.duration,
        averageRenderTime: event.duration,
        slowestRender: event.duration,
        lastRender: event.duration,
      });
    }
  }

  /**
   * Get all trace events
   */
  getEvents(type?: TraceEvent['type'], limit?: number): TraceEvent[] {
    let events = type ? this.events.filter((e) => e.type === type) : this.events;

    if (limit) {
      events = events.slice(-limit);
    }

    return events.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get performance metrics for components
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values()).sort(
      (a, b) => b.averageRenderTime - a.averageRenderTime,
    );
  }

  /**
   * Clear all trace data
   */
  clear(): void {
    this.events = [];
    this.performanceMetrics.clear();
    this.activeTraces.clear();
    console.log('🧹 Trace data cleared');
  }

  /**
   * Export trace data as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        events: this.events,
        performanceMetrics: Array.from(this.performanceMetrics.values()),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Get summary stats
   */
  getSummary(): {
    totalEvents: number;
    storeActions: number;
    componentRenders: number;
    apiCalls: number;
    averageEventDuration: number;
    slowestEvent: TraceEvent | null;
  } {
    const storeActions = this.events.filter((e) => e.type === 'store_action').length;
    const componentRenders = this.events.filter((e) => e.type === 'component_render').length;
    const apiCalls = this.events.filter((e) => e.type === 'api_call').length;

    const eventsWithDuration = this.events.filter((e) => e.duration != null);
    const averageEventDuration =
      eventsWithDuration.length > 0
        ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) /
          eventsWithDuration.length
        : 0;

    const slowestEvent =
      eventsWithDuration.sort((a, b) => (b.duration || 0) - (a.duration || 0))[0] || null;

    return {
      totalEvents: this.events.length,
      storeActions,
      componentRenders,
      apiCalls,
      averageEventDuration,
      slowestEvent,
    };
  }
}

/* ========= Singleton Instance ========= */
export const trace = new TraceLogger();

/* ========= Higher-Order Functions ========= */

/**
 * Trace a function execution
 */
export function traceFunction<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  type: TraceEvent['type'] = 'user_action',
): T {
  return ((...args: any[]) => {
    const traceId = trace.start(name, type, { args: args.length });

    try {
      const result = fn(...args);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            trace.end(traceId, { success: true, resultType: typeof value });
            return value;
          })
          .catch((error: any) => {
            trace.end(traceId, { success: false, error: error.message });
            throw error;
          });
      }

      trace.end(traceId, { success: true, resultType: typeof result });
      return result;
    } catch (error: any) {
      trace.end(traceId, { success: false, error: error.message });
      throw error;
    }
  }) as T;
}

/**
 * Trace a store action
 */
export function traceStoreAction(storeName: string, actionName: string, payload?: any): string {
  return trace.start(`${storeName}.${actionName}`, 'store_action', {
    store: storeName,
    action: actionName,
    payloadType: typeof payload,
    payloadSize: payload ? JSON.stringify(payload).length : 0,
  });
}

/**
 * Trace component render
 */
export function traceComponentRender(componentName: string, props?: any): string {
  return trace.start(componentName, 'component_render', {
    propsCount: props ? Object.keys(props).length : 0,
    propsSize: props ? JSON.stringify(props).length : 0,
  });
}

/**
 * React Hook for tracing component renders
 */
export function useTraceRender(componentName: string, dependencies?: any[]): void {
  if (!featureFlags.isEnabled('performanceMonitoring')) return;

  const traceId = React.useRef<string>('');
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current++;
    traceId.current = traceComponentRender(componentName, {
      renderNumber: renderCount.current,
      dependencyCount: dependencies?.length || 0,
    });

    return () => {
      if (traceId.current) {
        trace.end(traceId.current);
      }
    };
  });
}

/**
 * React Hook for tracing store actions
 */
export function useTraceStore(storeName: string) {
  return React.useCallback(
    (actionName: string, payload?: any) => {
      const traceId = traceStoreAction(storeName, actionName, payload);

      // Return a function to end the trace
      return () => trace.end(traceId);
    },
    [storeName],
  );
}

/* ========= Console Commands (Development) ========= */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__inkwellTrace = {
    getEvents: (type?: string, limit?: number) => trace.getEvents(type as any, limit),
    getMetrics: () => trace.getPerformanceMetrics(),
    getSummary: () => trace.getSummary(),
    clear: () => trace.clear(),
    export: () => trace.export(),
    log: (name: string, type: string, level?: string, metadata?: any) =>
      trace.log(name, type as any, level as any, metadata),
  };

  console.log('📊 Trace utilities available at window.__inkwellTrace');
}
