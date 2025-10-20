// @ts-nocheck
// File: src/utils/trace.ts
// Observability and tracing system for Inkwell
// Dev-only logger for store actions and component render timings

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
  metadata?: Record<string, unknown>;
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

const now = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

/* ========= Trace Logger ========= */
class TraceLogger {
  private events: TraceEvent[] = [];
  private activeTraces = new Map<string, TraceEvent>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private isEnabled = false;

  constructor() {
    this.checkEnabled();
    if (typeof window !== 'undefined') {
      window.addEventListener?.('popstate', () => this.checkEnabled());
    }
  }

  private checkEnabled(): void {
    try {
      const urlParamEnabled =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('trace') === '1';

      this.isEnabled =
        featureFlags.isEnabled?.('performanceMonitoring') ||
        featureFlags.isDebugMode?.() ||
        urlParamEnabled ||
        false;

      if (this.isEnabled) {
        console.log('📊 Trace logging enabled');
      }
    } catch {
      this.isEnabled = false;
    }
  }

  /** Start a new trace event */
  start(name: string, type: TraceEvent['type'], metadata?: Record<string, unknown>): string {
    if (!this.isEnabled) return '';
    const id = `${type}_${name}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const event: TraceEvent = {
      id,
      type,
      name,
      startTime: now(),
      metadata,
      level: 'debug',
    };
    this.activeTraces.set(id, event);
    return id;
  }

  /** End a trace event */
  end(id: string, additionalMetadata?: Record<string, unknown>): void {
    if (!this.isEnabled || !id) return;
    const event = this.activeTraces.get(id);
    if (!event) return;

    event.endTime = now();
    event.duration = (event.endTime ?? 0) - event.startTime;
    if (additionalMetadata) {
      event.metadata = { ...event.metadata, ...additionalMetadata };
    }

    this.activeTraces.delete(id);
    this.events.push(event);

    if (event.type === 'component_render') {
      this.updateRenderMetrics(event);
    }

    // Lightweight console hints for slow ops
    if (event.duration && event.duration > 100) {
      console.warn(
        `🐌 Slow ${event.type}: ${event.name} took ${event.duration.toFixed(2)}ms`,
        event.metadata,
      );
    } else if (event.duration && event.duration > 16.67) {
      console.log(
        `⚡ ${event.type}: ${event.name} took ${event.duration.toFixed(2)}ms`,
        event.metadata,
      );
    }

    // Cap memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /** Log an instant event (no duration) */
  log(
    name: string,
    type: TraceEvent['type'],
    level: TraceEvent['level'] = 'info',
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.isEnabled) return;

    const event: TraceEvent = {
      id: `${type}_${name}_${Date.now()}`,
      type,
      name,
      startTime: now(),
      endTime: now(),
      duration: 0,
      metadata,
      level,
    };
    this.events.push(event);

    console.log(
      `${{ debug: '🐛', info: '📝', warn: '⚠️', error: '❌' }[level]} ${type}: ${name}`,
      metadata,
    );
  }

  /** Update component render metrics */
  private updateRenderMetrics(event: TraceEvent): void {
    if (!event.duration || event.type !== 'component_render') return;
    const component = event.name;
    const existing = this.performanceMetrics.get(component);
    if (existing) {
      existing.renderCount += 1;
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

  getEvents(type?: TraceEvent['type'], limit?: number): TraceEvent[] {
    let events = type ? this.events.filter((e) => e.type === type) : this.events;
    if (limit) events = events.slice(-limit);
    return events.sort((a, b) => b.startTime - a.startTime);
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values()).sort(
      (a, b) => b.averageRenderTime - a.averageRenderTime,
    );
  }

  clear(): void {
    this.events = [];
    this.performanceMetrics.clear();
    this.activeTraces.clear();

    console.log('🧹 Trace data cleared');
  }

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

    const withDuration = this.events.filter((e) => e.duration != null);
    const averageEventDuration =
      withDuration.length > 0
        ? withDuration.reduce((sum, evt) => sum + (evt.duration || 0), 0) / withDuration.length
        : 0;

    const slowestEvent =
      withDuration.sort((a, b) => (b.duration || 0) - (a.duration || 0))[0] || null;

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
let _trace: TraceLogger | null = null;
function _getTrace(): TraceLogger {
  if (!_trace) _trace = new TraceLogger();
  return _trace;
}

export const trace = {
  start: (_name: string, _type: TraceEvent['type'], _metadata?: Record<string, unknown>) =>
    getTrace().start(name, type, metadata),
  end: (_id: string, _additionalMetadata?: Record<string, unknown>) =>
    getTrace().end(id, additionalMetadata),
  log: (
    _name: string,
    _type: TraceEvent['type'],
    _level?: TraceEvent['level'],
    _metadata?: Record<string, unknown>,
  ) => getTrace().log(name, type, level, metadata),
  getEvents: (_type?: TraceEvent['type'], _limit?: number) => getTrace().getEvents(type, limit),
  getPerformanceMetrics: () => getTrace().getPerformanceMetrics(),
  getSummary: () => getTrace().getSummary(),
  clear: () => getTrace().clear(),
  export: () => getTrace().export(),
};

/* ========= Overloads & Helpers ========= */

/**
 * Trace a function execution
 */
export function traceFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
  type: TraceEvent['type'] = 'user_action',
): T {
  return ((...args: unknown[]) => {
    const traceId = trace.start(name, type, { args: args.length });
    try {
      const result = fn(...args);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        return (result as Promise<unknown>)
          .then((value) => {
            trace.end(traceId, { success: true, resultType: typeof value });
            return value;
          })
          .catch((error: unknown) => {
            trace.end(traceId, {
              success: false,
              error: (error as Error)?.message ?? String(error),
            });
            throw error;
          }) as unknown as ReturnType<T>;
      }
      trace.end(traceId, { success: true, resultType: typeof result });
      return result as ReturnType<T>;
    } catch (error) {
      trace.end(traceId, {
        success: false,
        error: (error as Error)?.message ?? String(error),
      });
      throw error;
    }
  }) as T;
}

/**
 * Trace a store action (overloaded)
 * Supports:
 *  - traceStoreAction('settings:setIncludeMetadata', { include })
 *  - traceStoreAction('settings', 'setIncludeMetadata', { include })
 */
export const traceStoreAction = _traceStoreAction;

export function _traceStoreAction(action: string, payload?: unknown): string;
export function _traceStoreAction(storeName: string, actionName: string, payload?: unknown): string;
export function _traceStoreAction(a: string, b?: string | unknown, c?: unknown): string {
  // Normalize arguments to storeName + actionName + payload
  let storeName: string;
  let actionName: string;
  let payload: unknown;

  if (typeof b === 'string') {
    // 3-arg form
    storeName = a;
    actionName = b;
    payload = c;
  } else {
    // 2-arg form: a = "store:action" or "store.action" or just "action"
    const raw = a;
    if (raw.includes(':')) {
      const [s, act] = raw.split(':', 2);
      storeName = s || 'store';
      actionName = act || 'action';
    } else if (raw.includes('.')) {
      const [s, act] = raw.split('.', 2);
      storeName = s || 'store';
      actionName = act || 'action';
    } else {
      storeName = 'store';
      actionName = raw;
    }
    payload = b;
  }

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
export function _traceComponentRender(componentName: string, props?: unknown): string {
  return trace.start(componentName, 'component_render', {
    propsCount: props && typeof props === 'object' ? Object.keys(props as object).length : 0,
    propsSize: props ? JSON.stringify(props).length : 0,
  });
}

/**
 * React Hook for tracing component renders
 */
export function useTraceRender(componentName: string, dependencies?: unknown[]): void {
  const traceId = React.useRef<string>('');
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    if (!featureFlags.isEnabled?.('performanceMonitoring')) return;
    renderCount.current += 1;
    traceId.current = traceComponentRender(componentName, {
      renderNumber: renderCount.current,
      dependencyCount: dependencies?.length || 0,
    });

    return () => {
      if (traceId.current) trace.end(traceId.current);
    };
  });
}

/**
 * React Hook for tracing store actions
 */
export function useTraceStore(storeName: string) {
  return React.useCallback(
    (actionName: string, _payload?: unknown) => {
      const id = traceStoreAction(storeName, actionName, payload);
      return () => trace.end(id);
    },
    [storeName],
  );
}

/* ========= Console Commands (Development) ========= */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__inkwellTrace = {
    getEvents: (_type?: string, _limit?: number) => trace.getEvents(type as any, limit),
    getMetrics: () => trace.getPerformanceMetrics(),
    getSummary: () => trace.getSummary(),
    clear: () => trace.clear(),
    export: () => trace.export(),
    log: (_name: string, _type: string, _level?: string, _metadata?: unknown) =>
      trace.log(name, type as any, level as any, metadata as any),
  };

  console.log('📊 Trace utilities available at window.__inkwellTrace');
}
