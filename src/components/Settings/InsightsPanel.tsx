/**
 * Insights Panel Component
 *
 * User-facing analytics insights panel for Settings.
 * Shows opt-in analytics visualizations:
 * - Writing velocity and session streaks
 * - Autosave latency over time
 * - AI usage heatmap
 * - Performance insights
 */

import { useEffect, useState } from 'react';

import { analyticsService } from '@/services/analytics';
import type { AnalyticsSummary, AnalyticsMetric } from '@/services/analytics/types';

interface WritingInsights {
  totalSessions: number;
  averageSessionDuration: number;
  totalEvents: number;
  recentActivity: Array<{ date: string; events: number }>;
}

export function InsightsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<WritingInsights | null>(null);

  useEffect(() => {
    const config = analyticsService.getConfig();
    setEnabled(config.enabled);
    if (config.enabled) {
      loadInsights();
    } else {
      setLoading(false);
    }
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Get last 30 days of data
      const startTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const query = { startTime };

      const [summaryData, metricsData] = await Promise.all([
        analyticsService.getSummary(query),
        analyticsService.queryMetrics(query),
      ]);

      setSummary(summaryData);
      setMetrics(metricsData);

      // Calculate writing insights
      const recentEvents = await analyticsService.queryEvents({
        category: 'writing',
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      });

      // Group events by day
      const eventsByDay = new Map<string, number>();
      recentEvents.forEach((event) => {
        const date = new Date(event.timestamp).toLocaleDateString();
        eventsByDay.set(date, (eventsByDay.get(date) || 0) + 1);
      });

      const recentActivity = Array.from(eventsByDay.entries())
        .map(([date, events]) => ({ date, events }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);

      setInsights({
        totalSessions: summaryData.totalSessions,
        averageSessionDuration: summaryData.averageSessionDuration,
        totalEvents: summaryData.totalEvents,
        recentActivity,
      });
    } catch (error) {
      console.error('[InsightsPanel] Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnalytics = async () => {
    const newEnabled = !enabled;
    analyticsService.updateConfig({ enabled: newEnabled });
    setEnabled(newEnabled);

    if (newEnabled) {
      await analyticsService.initialize();
      await loadInsights();
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  // Get autosave metrics
  const autosaveMetrics = metrics.filter(
    (m) => m.category === 'autosave' && m.name.includes('latency'),
  );
  const avgAutosaveLatency =
    autosaveMetrics.length > 0
      ? autosaveMetrics.reduce((sum, m) => sum + m.value, 0) / autosaveMetrics.length
      : 0;

  // Get AI metrics
  const aiMetrics = metrics.filter((m) => m.category === 'ai');
  const aiRequestCount = aiMetrics.filter((m) => m.name.includes('request')).length;
  const avgAiLatency =
    aiMetrics.length > 0 ? aiMetrics.reduce((sum, m) => sum + m.value, 0) / aiMetrics.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Privacy-first analytics about your writing sessions and performance
        </p>
      </div>

      {/* Analytics Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Enable Analytics</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track your writing sessions and performance metrics. All data stays on your device.
            </p>
          </div>
          <button
            onClick={handleToggleAnalytics}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Insights Content */}
      {enabled && !loading && summary && insights && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Sessions
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {insights.totalSessions}
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last 30 days</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Session Duration
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {formatDuration(insights.averageSessionDuration)}
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Per session</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Events
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {insights.totalEvents.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tracked actions</div>
            </div>
          </div>

          {/* Recent Activity */}
          {insights.recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recent Activity (Last 7 Days)
              </h3>
              <div className="space-y-3">
                {insights.recentActivity.map(({ date, events }) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{date}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-blue-500 rounded"
                        style={{
                          width: `${Math.min((events / 50) * 100, 100)}px`,
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {events}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Autosave Performance */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Autosave Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Saves</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {autosaveMetrics.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Avg Latency</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {avgAutosaveLatency > 0 ? formatDuration(avgAutosaveLatency) : '—'}
                  </span>
                </div>
                <div className="mt-4">
                  {avgAutosaveLatency > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            avgAutosaveLatency < 100
                              ? 'bg-green-500'
                              : avgAutosaveLatency < 500
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((avgAutosaveLatency / 1000) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {avgAutosaveLatency < 100
                          ? 'Excellent'
                          : avgAutosaveLatency < 500
                            ? 'Good'
                            : 'Needs attention'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Usage */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Requests</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {aiRequestCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Avg Response Time
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {avgAiLatency > 0 ? formatDuration(avgAiLatency) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Your Privacy Matters
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    All analytics data is stored locally on your device. No data is sent to external
                    servers unless you explicitly opt-in to telemetry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {enabled && loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading insights...</p>
        </div>
      )}

      {/* Disabled State */}
      {!enabled && !loading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Analytics Disabled
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enable analytics to see insights about your writing sessions.
          </p>
        </div>
      )}
    </div>
  );
}
