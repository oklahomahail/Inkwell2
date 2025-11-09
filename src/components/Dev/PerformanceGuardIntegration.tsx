/**
 * Performance Guard Integration
 *
 * Merges analytics data with bundle audit system to provide
 * comprehensive performance monitoring and regression detection.
 */

import { useEffect, useState } from 'react';

import { analyticsService } from '@/services/analytics';
import type { AnalyticsMetric } from '@/services/analytics/types';

interface PerformanceSnapshot {
  timestamp: number;
  metrics: {
    autosaveLatency: { avg: number; p95: number };
    renderTime: { avg: number; p95: number };
    storageOps: { reads: number; writes: number };
    aiRequests: { count: number; avgLatency: number };
  };
}

interface PerformanceRegression {
  metric: string;
  current: number;
  baseline: number;
  change: number;
  severity: 'critical' | 'warning' | 'info';
}

export function PerformanceGuardIntegration() {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [baseline, setBaseline] = useState<PerformanceSnapshot | null>(null);
  const [regressions, setRegressions] = useState<PerformanceRegression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 60000); // Refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Get metrics from last hour
      const recentMetrics = await analyticsService.queryMetrics({
        startTime: Date.now() - 60 * 60 * 1000,
      });

      // Get baseline metrics (7 days ago)
      const baselineMetrics = await analyticsService.queryMetrics({
        startTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
        endTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      });

      const currentSnapshot = buildSnapshot(recentMetrics);
      const baselineSnapshot = buildSnapshot(baselineMetrics);

      setSnapshot(currentSnapshot);
      setBaseline(baselineSnapshot);

      // Detect regressions
      if (baselineSnapshot) {
        const detected = detectRegressions(currentSnapshot, baselineSnapshot);
        setRegressions(detected);
      }
    } catch (error) {
      console.error('[PerformanceGuard] Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildSnapshot = (metrics: AnalyticsMetric[]): PerformanceSnapshot => {
    // Autosave metrics
    const autosaveMetrics = metrics.filter(
      (m) => m.category === 'autosave' && m.name.includes('latency'),
    );
    const autosaveLatencies = autosaveMetrics.map((m) => m.value).sort((a, b) => a - b);
    const autosaveAvg =
      autosaveLatencies.length > 0
        ? autosaveLatencies.reduce((a, b) => a + b, 0) / autosaveLatencies.length
        : 0;
    const autosaveP95 =
      autosaveLatencies.length > 0
        ? (autosaveLatencies[Math.floor(autosaveLatencies.length * 0.95)] ?? 0)
        : 0;

    // Render metrics
    const renderMetrics = metrics.filter(
      (m) => m.category === 'performance' && m.name.includes('render'),
    );
    const renderTimes = renderMetrics.map((m) => m.value).sort((a, b) => a - b);
    const renderAvg =
      renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;
    const renderP95 =
      renderTimes.length > 0 ? (renderTimes[Math.floor(renderTimes.length * 0.95)] ?? 0) : 0;

    // Storage operations
    const storageReads = metrics.filter(
      (m) => m.category === 'storage' && m.name.includes('read'),
    ).length;
    const storageWrites = metrics.filter(
      (m) => m.category === 'storage' && m.name.includes('write'),
    ).length;

    // AI requests
    const aiMetrics = metrics.filter((m) => m.category === 'ai');
    const aiLatencies = aiMetrics.map((m) => m.value);
    const aiAvgLatency =
      aiLatencies.length > 0 ? aiLatencies.reduce((a, b) => a + b, 0) / aiLatencies.length : 0;

    return {
      timestamp: Date.now(),
      metrics: {
        autosaveLatency: { avg: autosaveAvg, p95: autosaveP95 },
        renderTime: { avg: renderAvg, p95: renderP95 },
        storageOps: { reads: storageReads, writes: storageWrites },
        aiRequests: { count: aiMetrics.length, avgLatency: aiAvgLatency },
      },
    };
  };

  const detectRegressions = (
    current: PerformanceSnapshot,
    baseline: PerformanceSnapshot,
  ): PerformanceRegression[] => {
    const regressions: PerformanceRegression[] = [];
    const threshold = 0.2; // 20% increase is a warning

    // Check autosave latency
    if (baseline.metrics.autosaveLatency.avg > 0) {
      const change =
        (current.metrics.autosaveLatency.avg - baseline.metrics.autosaveLatency.avg) /
        baseline.metrics.autosaveLatency.avg;
      if (change > threshold) {
        regressions.push({
          metric: 'Autosave Latency (avg)',
          current: current.metrics.autosaveLatency.avg,
          baseline: baseline.metrics.autosaveLatency.avg,
          change,
          severity: change > 0.5 ? 'critical' : 'warning',
        });
      }
    }

    // Check render time
    if (baseline.metrics.renderTime.avg > 0) {
      const change =
        (current.metrics.renderTime.avg - baseline.metrics.renderTime.avg) /
        baseline.metrics.renderTime.avg;
      if (change > threshold) {
        regressions.push({
          metric: 'Render Time (avg)',
          current: current.metrics.renderTime.avg,
          baseline: baseline.metrics.renderTime.avg,
          change,
          severity: change > 0.5 ? 'critical' : 'warning',
        });
      }
    }

    // Check AI latency
    if (baseline.metrics.aiRequests.avgLatency > 0) {
      const change =
        (current.metrics.aiRequests.avgLatency - baseline.metrics.aiRequests.avgLatency) /
        baseline.metrics.aiRequests.avgLatency;
      if (change > threshold) {
        regressions.push({
          metric: 'AI Response Time (avg)',
          current: current.metrics.aiRequests.avgLatency,
          baseline: baseline.metrics.aiRequests.avgLatency,
          change,
          severity: change > 0.5 ? 'critical' : 'warning',
        });
      }
    }

    return regressions;
  };

  const formatMs = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatChange = (change: number): string => {
    return `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading performance data...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No performance data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Regressions Alert */}
      {regressions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-400 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Performance Regressions Detected
              </h3>
              <div className="mt-2 space-y-2">
                {regressions.map((regression, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center justify-between"
                  >
                    <span>{regression.metric}</span>
                    <span className="font-mono">
                      {formatMs(regression.baseline)} → {formatMs(regression.current)}{' '}
                      <span
                        className={
                          regression.severity === 'critical' ? 'text-red-600 font-bold' : ''
                        }
                      >
                        ({formatChange(regression.change)})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Autosave Performance
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Average Latency</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatMs(snapshot.metrics.autosaveLatency.avg)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">P95 Latency</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatMs(snapshot.metrics.autosaveLatency.p95)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Render Performance
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Average Time</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatMs(snapshot.metrics.renderTime.avg)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">P95 Time</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatMs(snapshot.metrics.renderTime.p95)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Storage Operations
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Reads</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {snapshot.metrics.storageOps.reads}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Writes</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {snapshot.metrics.storageOps.writes}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">AI Requests</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total Requests</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {snapshot.metrics.aiRequests.count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Avg Latency</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatMs(snapshot.metrics.aiRequests.avgLatency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Comparison */}
      {baseline && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Comparing to baseline from {new Date(baseline.timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
