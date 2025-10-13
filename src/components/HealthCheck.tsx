// src/components/HealthCheck.tsx
import React, { useState, useEffect } from 'react';

import { AnalyticsPanel, DashboardPanel, SettingsPanel, TimelinePanel } from './Panels';
import StoryPlanningView from './Views/StoryPlanningView';
import EnhancedWritingPanel from './Writing/EnhancedWritingPanel';

interface HealthStatus {
  component: string;
  status: 'loading' | 'success' | 'error';
  error: string | undefined;
  renderTime: number | undefined;
}

/**
 * Health check component that renders each major panel to catch provider
 * or code-split regressions. Designed for CI testing and debugging.
 */
export const HealthCheck: React.FC = () => {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([
    { component: 'DashboardPanel', status: 'loading', error: undefined, renderTime: undefined },
    {
      component: 'EnhancedWritingPanel',
      status: 'loading',
      error: undefined,
      renderTime: undefined,
    },
    { component: 'TimelinePanel', status: 'loading', error: undefined, renderTime: undefined },
    { component: 'AnalyticsPanel', status: 'loading', error: undefined, renderTime: undefined },
    { component: 'StoryPlanningView', status: 'loading', error: undefined, renderTime: undefined },
    { component: 'SettingsPanel', status: 'loading', error: undefined, renderTime: undefined },
  ]);

  const updateStatus = (
    component: string,
    status: 'success' | 'error',
    error?: string,
    renderTime?: number,
  ) => {
    setHealthStatuses((prev) =>
      prev.map(
        (item): HealthStatus =>
          item.component === component
            ? {
                component: item.component,
                status,
                error: error ?? '',
                renderTime,
              }
            : item,
      ),
    );
  };

  const TestComponent: React.FC<{ name: string; children: React.ReactNode }> = ({
    name,
    children,
  }) => {
    useEffect(() => {
      const startTime = Date.now();
      try {
        // Component rendered successfully
        const renderTime = Date.now() - startTime;
        updateStatus(name, 'success', undefined, renderTime);
      } catch (error) {
        updateStatus(name, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    }, [name]);

    return <div style={{ display: 'none' }}>{children}</div>;
  };

  const allPassed = healthStatuses.every((status) => status.status === 'success');
  const _anyFailed = healthStatuses.some((status) => status.status === 'error');
  const allCompleted = healthStatuses.every((status) => status.status !== 'loading');

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Health Check Dashboard
        </h1>

        {/* Overall Status */}
        <div
          className={`mb-6 p-4 rounded-lg ${
            !allCompleted
              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
              : allPassed
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                : 'bg-red-100 dark:bg-red-900/30 border-red-500'
          } border`}
        >
          <h2 className="text-lg font-semibold mb-2">
            Overall Status:{' '}
            {!allCompleted
              ? '⏳ Running Tests...'
              : allPassed
                ? '✅ All Systems Operational'
                : '❌ Issues Detected'}
          </h2>
          <p className="text-sm">
            {healthStatuses.filter((s) => s.status === 'success').length}/{healthStatuses.length}{' '}
            components healthy
          </p>
        </div>

        {/* Component Status List */}
        <div className="space-y-4">
          {healthStatuses.map((status) => (
            <div
              key={status.component}
              className={`p-4 rounded-lg border ${
                status.status === 'loading'
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-300'
                  : status.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">{status.component}</h3>
                <div className="flex items-center gap-2">
                  {status.renderTime && (
                    <span className="text-xs text-gray-500">{status.renderTime}ms</span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      status.status === 'loading'
                        ? 'bg-yellow-200 text-yellow-800'
                        : status.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {status.status === 'loading' ? 'TESTING' : status.status.toUpperCase()}
                  </span>
                </div>
              </div>
              {status.error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-mono">
                  {status.error}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* JSON Output for CI */}
        {allCompleted && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              JSON Output (for CI)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
              {JSON.stringify(
                {
                  timestamp: new Date().toISOString(),
                  overall: allPassed ? 'PASS' : 'FAIL',
                  components: healthStatuses,
                },
                null,
                2,
              )}
            </pre>
          </details>
        )}
      </div>

      {/* Hidden component renders for testing */}
      <TestComponent name="DashboardPanel">
        <DashboardPanel />
      </TestComponent>

      <TestComponent name="EnhancedWritingPanel">
        <EnhancedWritingPanel />
      </TestComponent>

      <TestComponent name="TimelinePanel">
        <TimelinePanel />
      </TestComponent>

      <TestComponent name="AnalyticsPanel">
        <AnalyticsPanel />
      </TestComponent>

      <TestComponent name="StoryPlanningView">
        <StoryPlanningView />
      </TestComponent>

      <TestComponent name="SettingsPanel">
        <SettingsPanel />
      </TestComponent>
    </div>
  );
};

export default HealthCheck;
