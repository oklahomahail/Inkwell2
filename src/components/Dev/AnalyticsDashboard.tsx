/**
 * Analytics Dashboard Component
 *
 * Dev-only React dashboard for viewing analytics insights in the UI.
 * Provides real-time visualization of performance metrics, session data,
 * and usage patterns.
 */

import { useEffect, useState, useCallback } from 'react';

import { downloadAnalyticsJSON, downloadAnalyticsCSV } from '@/dev/analyticsExport';
import { analyticsService } from '@/services/analytics';
import type {
  AnalyticsSummary,
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsCategory,
  AnalyticsQuery,
} from '@/services/analytics/types';

interface MetricStats {
  name: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

interface CategoryFilter {
  category: AnalyticsCategory | 'all';
  timeRange: '1h' | '24h' | '7d' | '30d' | 'all';
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [_metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [metricStats, setMetricStats] = useState<MetricStats[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>({
    category: 'all',
    timeRange: '24h',
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'metrics' | 'performance'>(
    'overview',
  );

  const getTimeRangeMs = (range: CategoryFilter['timeRange']): number | undefined => {
    const now = Date.now();
    switch (range) {
      case '1h':
        return now - 60 * 60 * 1000;
      case '24h':
        return now - 24 * 60 * 60 * 1000;
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - 30 * 24 * 60 * 60 * 1000;
      case 'all':
        return undefined;
    }
  };

  const buildQuery = useCallback((): AnalyticsQuery => {
    const query: AnalyticsQuery = {};
    if (filter.category !== 'all') {
      query.category = filter.category;
    }
    const startTime = getTimeRangeMs(filter.timeRange);
    if (startTime) {
      query.startTime = startTime;
    }
    return query;
  }, [filter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const [summaryData, eventsData, metricsData] = await Promise.all([
        analyticsService.getSummary(query),
        analyticsService.queryEvents(query),
        analyticsService.queryMetrics(query),
      ]);

      setSummary(summaryData);
      setEvents(eventsData);
      setMetrics(metricsData);

      // Calculate metric statistics
      const byName = new Map<string, number[]>();
      metricsData.forEach((m) => {
        const values = byName.get(m.name) || [];
        values.push(m.value);
        byName.set(m.name, values);
      });

      const stats = Array.from(byName.entries()).map(([name, values]) => {
        values.sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = values[0] ?? 0;
        const max = values[values.length - 1] ?? 0;
        const p50 = values[Math.floor(values.length * 0.5)] ?? 0;
        const p95 = values[Math.floor(values.length * 0.95)] ?? 0;
        const p99 = values[Math.floor(values.length * 0.99)] ?? 0;

        return {
          name,
          count: values.length,
          avg: parseFloat(avg.toFixed(2)),
          min,
          max,
          p50,
          p95,
          p99,
        };
      });

      setMetricStats(stats);
    } catch (error) {
      console.error('[AnalyticsDashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleExportJSON = () => {
    downloadAnalyticsJSON(buildQuery());
  };

  const handleExportCSV = (type: 'events' | 'metrics') => {
    downloadAnalyticsCSV(type, buildQuery());
  };

  const handleClearData = async () => {
    if (confirm('Clear all analytics data? This cannot be undone.')) {
      await analyticsService.destroy();
      await analyticsService.initialize();
      await loadData();
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Privacy-first analytics insights
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExportCSV('events')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Events CSV
              </button>
              <button
                onClick={() => handleExportCSV('metrics')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Metrics CSV
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value as CategoryFilter['category'] })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="writing">Writing</option>
                <option value="editor">Editor</option>
                <option value="autosave">Autosave</option>
                <option value="ai">AI</option>
                <option value="export">Export</option>
                <option value="timeline">Timeline</option>
                <option value="storage">Storage</option>
                <option value="ui">UI</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Range
              </label>
              <select
                value={filter.timeRange}
                onChange={(e) =>
                  setFilter({ ...filter, timeRange: e.target.value as CategoryFilter['timeRange'] })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {(['overview', 'events', 'metrics', 'performance'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && summary && (
          <OverviewTab summary={summary} formatDuration={formatDuration} formatDate={formatDate} />
        )}

        {selectedTab === 'events' && (
          <EventsTab events={events} formatDate={formatDate} loading={loading} />
        )}

        {selectedTab === 'metrics' && <MetricsTab metricStats={metricStats} loading={loading} />}

        {selectedTab === 'performance' && (
          <PerformanceTab
            metricStats={metricStats}
            events={events}
            formatDuration={formatDuration}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  summary,
  formatDuration,
  formatDate,
}: {
  summary: AnalyticsSummary;
  formatDuration: (ms: number) => string;
  formatDate: (ts: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalEvents.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalSessions.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg Session Duration
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(summary.averageSessionDuration)}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Events by Category
        </h2>
        <div className="space-y-2">
          {Object.entries(summary.categories)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Top Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Actions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {summary.topActions.map(({ action, count }) => (
                <tr key={action}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{action}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Date Range</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Start</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(summary.dateRange.start)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">End</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(summary.dateRange.end)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({
  events,
  formatDate,
  loading,
}: {
  events: AnalyticsEvent[];
  formatDate: (ts: number) => string;
  loading: boolean;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const totalPages = Math.ceil(events.length / pageSize);
  const paginatedEvents = events.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Events ({events.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(event.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {event.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {event.action}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {event.label || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {event.value !== undefined ? event.value : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Metrics Tab Component
function MetricsTab({ metricStats, loading }: { metricStats: MetricStats[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-8">Loading metrics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Metric Statistics
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Max
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  p50
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  p95
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  p99
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metricStats.map((stat) => (
                <tr key={stat.name}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {stat.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {stat.count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {stat.avg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{stat.min}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{stat.max}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{stat.p50}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{stat.p95}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{stat.p99}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Performance Tab Component
function PerformanceTab({
  metricStats,
  events,
  formatDuration,
  loading,
}: {
  metricStats: MetricStats[];
  events: AnalyticsEvent[];
  formatDuration: (ms: number) => string;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-8">Loading performance data...</div>;
  }

  // Group events by action
  const eventsByAction = new Map<string, number>();
  events.forEach((e) => {
    eventsByAction.set(e.action, (eventsByAction.get(e.action) || 0) + 1);
  });

  const topEventActions = Array.from(eventsByAction.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Metrics Performance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h2>
        {metricStats.length > 0 ? (
          <div className="space-y-4">
            {metricStats.map((stat) => (
              <div
                key={stat.name}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-2">{stat.name}</div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Count</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{stat.count}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Average</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stat.avg)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">p50</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stat.p50)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">p95</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stat.p95)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No performance metrics available.</p>
        )}
      </div>

      {/* Event Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Event Distribution
        </h2>
        {topEventActions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topEventActions.map(({ action, count }) => (
                  <tr key={action}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{action}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No events to display.</p>
        )}
      </div>
    </div>
  );
}
