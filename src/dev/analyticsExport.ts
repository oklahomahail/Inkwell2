/**
 * Analytics Development Tools
 * Console helpers for querying and exporting analytics data
 *
 * Available in development mode via window.analytics
 */

import { analyticsService } from '@/services/analytics';
import type {
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsQuery,
  AnalyticsCategory,
} from '@/services/analytics/types';
import devLog from '@/utils/devLog';

/**
 * Print analytics summary to console
 */
export async function printAnalyticsSummary(query?: AnalyticsQuery): Promise<void> {
  const summary = await analyticsService.getSummary(query);

  console.group('📊 Analytics Summary');
  console.log('Total Events:', summary.totalEvents);
  console.log('Total Sessions:', summary.totalSessions);
  console.log(
    'Average Session Duration:',
    `${(summary.averageSessionDuration / 1000).toFixed(2)}s`,
  );
  console.log('\nCategories:');
  console.table(summary.categories);
  console.log('\nTop Actions:');
  console.table(summary.topActions);
  console.log(
    '\nDate Range:',
    new Date(summary.dateRange.start).toLocaleString(),
    '→',
    new Date(summary.dateRange.end).toLocaleString(),
  );
  console.groupEnd();
}

/**
 * Query and print events
 */
export async function printEvents(query?: AnalyticsQuery): Promise<AnalyticsEvent[]> {
  const events = await analyticsService.queryEvents(query);
  console.group(`🎯 Events (${events.length})`);
  console.table(
    events.map((e) => ({
      timestamp: new Date(e.timestamp).toLocaleString(),
      category: e.category,
      action: e.action,
      label: e.label,
      value: e.value,
    })),
  );
  console.groupEnd();
  return events;
}

/**
 * Query and print metrics
 */
export async function printMetrics(query?: AnalyticsQuery): Promise<AnalyticsMetric[]> {
  const metrics = await analyticsService.queryMetrics(query);

  // Calculate statistics
  const byName = new Map<string, number[]>();
  metrics.forEach((m) => {
    const values = byName.get(m.name) || [];
    values.push(m.value);
    byName.set(m.name, values);
  });

  const stats = Array.from(byName.entries()).map(([name, values]) => {
    values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const p50 = values[Math.floor(values.length * 0.5)];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];

    return {
      name,
      count: values.length,
      avg: avg.toFixed(2),
      min,
      max,
      p50,
      p95,
      p99,
    };
  });

  console.group(`📈 Metrics (${metrics.length})`);
  console.table(stats);
  console.groupEnd();

  return metrics;
}

/**
 * Print performance metrics for a specific category
 */
export async function printPerformance(
  category: AnalyticsCategory,
  query?: Omit<AnalyticsQuery, 'category'>,
): Promise<void> {
  const metrics = await analyticsService.queryMetrics({ ...query, category });
  const events = await analyticsService.queryEvents({ ...query, category });

  console.group(`⚡ ${category} Performance`);
  console.log(`Total events: ${events.length}`);
  console.log(`Total metrics: ${metrics.length}`);

  // Group by metric name
  const byName = new Map<string, number[]>();
  metrics.forEach((m) => {
    const values = byName.get(m.name) || [];
    values.push(m.value);
    byName.set(m.name, values);
  });

  // Calculate stats for each metric
  byName.forEach((values, name) => {
    values.sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p50 = values[Math.floor(values.length * 0.5)];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];

    console.log(`\n${name}:`);
    console.log(`  Count: ${values.length}`);
    console.log(`  Avg: ${avg.toFixed(2)}`);
    console.log(`  p50: ${p50}`);
    console.log(`  p95: ${p95}`);
    console.log(`  p99: ${p99}`);
  });

  // Group events by action
  const eventsByAction = new Map<string, number>();
  events.forEach((e) => {
    eventsByAction.set(e.action, (eventsByAction.get(e.action) || 0) + 1);
  });

  if (eventsByAction.size > 0) {
    console.log('\nEvent Distribution:');
    console.table(
      Array.from(eventsByAction.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count),
    );
  }

  console.groupEnd();
}

/**
 * Download analytics data as JSON
 */
export async function downloadAnalyticsJSON(query?: AnalyticsQuery): Promise<void> {
  const [events, metrics, summary] = await Promise.all([
    analyticsService.queryEvents(query),
    analyticsService.queryMetrics(query),
    analyticsService.getSummary(query),
  ]);

  const data = {
    summary,
    events,
    metrics,
    exportedAt: new Date().toISOString(),
    query,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkwell-analytics-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  devLog.debug('✅ Analytics data downloaded');
}

/**
 * Download analytics data as CSV
 */
export async function downloadAnalyticsCSV(
  type: 'events' | 'metrics' = 'events',
  query?: AnalyticsQuery,
): Promise<void> {
  if (type === 'events') {
    const events = await analyticsService.queryEvents(query);
    const csv = [
      'Timestamp,Category,Action,Label,Value,Session ID',
      ...events.map(
        (e) =>
          `${new Date(e.timestamp).toISOString()},${e.category},${e.action},${e.label || ''},${e.value || ''},${e.sessionId}`,
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-analytics-events-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    devLog.debug('✅ Events CSV downloaded');
  } else {
    const metrics = await analyticsService.queryMetrics(query);
    const csv = [
      'Timestamp,Category,Name,Value,Unit,Session ID',
      ...metrics.map(
        (m) =>
          `${new Date(m.timestamp).toISOString()},${m.category},${m.name},${m.value},${m.unit},${m.sessionId}`,
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-analytics-metrics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    devLog.debug('✅ Metrics CSV downloaded');
  }
}

/**
 * Get analytics configuration
 */
export function printConfig(): void {
  const config = analyticsService.getConfig();
  console.group('⚙️ Analytics Configuration');
  console.table(config);
  console.groupEnd();
}

/**
 * Enable/disable analytics
 */
export function toggleAnalytics(enabled: boolean): void {
  analyticsService.updateConfig({ enabled });
  devLog.debug(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics(): Promise<void> {
  const confirmed = confirm(
    'Are you sure you want to clear all analytics data? This cannot be undone.',
  );
  if (!confirmed) return;

  await analyticsService.destroy();
  await analyticsService.initialize();

  devLog.debug('✅ Analytics data cleared');
}

/**
 * Export all helpers
 */
export const analyticsHelpers = {
  summary: printAnalyticsSummary,
  events: printEvents,
  metrics: printMetrics,
  performance: printPerformance,
  config: printConfig,
  downloadJSON: downloadAnalyticsJSON,
  downloadCSV: downloadAnalyticsCSV,
  toggle: toggleAnalytics,
  clear: clearAnalytics,
};
