import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CircuitState } from '@/sync/errorRecovery';
import type { ErrorRecoveryMetrics } from '@/sync/errorRecovery';
import { syncQueue } from '@/sync/syncQueue';
import type { SyncQueueStats } from '@/sync/types';

/**
 * Sync Status Dashboard
 *
 * Real-time monitoring of sync health:
 * - Circuit breaker status
 * - Retry budget usage
 * - Error metrics by category
 * - Queue statistics
 * - Performance metrics
 */
export function SyncStatusDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<SyncQueueStats | null>(null);
  const [metrics, setMetrics] = useState<ErrorRecoveryMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const loadHealth = () => {
    const healthData = syncQueue.getHealth();
    setHealth(healthData);
    if (healthData) {
      setQueueStats(healthData.queue);
      setMetrics(healthData.metrics);
    }
  };

  useEffect(() => {
    loadHealth();

    // Update every 5 seconds
    const interval = setInterval(loadHealth, 5000);

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleResetCircuitBreaker = () => {
    if (confirm('Reset circuit breaker? This will resume sync operations.')) {
      syncQueue.resetCircuitBreaker();
      loadHealth();
    }
  };

  const handleResetAll = () => {
    if (confirm('Reset all error recovery systems? This will clear all error states.')) {
      syncQueue.resetErrorRecovery();
      loadHealth();
    }
  };

  const getCircuitBreakerIcon = (state: CircuitState) => {
    switch (state) {
      case CircuitState.CLOSED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case CircuitState.OPEN:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case CircuitState.HALF_OPEN:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getCircuitBreakerColor = (state: CircuitState) => {
    switch (state) {
      case CircuitState.CLOSED:
        return 'bg-green-50 border-green-200 text-green-800';
      case CircuitState.OPEN:
        return 'bg-red-50 border-red-200 text-red-800';
      case CircuitState.HALF_OPEN:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getBudgetColor = (percentUsed: number) => {
    if (percentUsed >= 90) return 'bg-red-500';
    if (percentUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!health || !queueStats || !metrics) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading sync status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sync Status Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Wifi className="h-4 w-4" />
              Online
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <WifiOff className="h-4 w-4" />
              Offline
            </div>
          )}
          <Button onClick={loadHealth} size="sm" variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Circuit Breaker */}
        <div
          className={`rounded-lg border p-4 ${getCircuitBreakerColor(health.circuitBreaker.state)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Circuit Breaker</span>
            {getCircuitBreakerIcon(health.circuitBreaker.state)}
          </div>
          <p className="text-2xl font-bold mb-1">{health.circuitBreaker.state.toUpperCase()}</p>
          <p className="text-xs opacity-75">
            {health.circuitBreaker.isHealthy ? 'Operating normally' : 'Sync paused'}
          </p>
          {health.circuitBreaker.state !== CircuitState.CLOSED && (
            <Button
              onClick={handleResetCircuitBreaker}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Retry Budget */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Retry Budget</span>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {health.retryBudget.retries} / {health.retryBudget.limit}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              role="progressbar"
              aria-valuenow={health.retryBudget.percentUsed}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Retry budget usage"
              className={`h-2 rounded-full transition-all ${getBudgetColor(health.retryBudget.percentUsed)}`}
              style={{ width: `${health.retryBudget.percentUsed}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            Resets in {Math.floor(health.retryBudget.windowResetIn / 1000)}s
          </p>
        </div>

        {/* Dead Letters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Dead Letters</span>
            <Database className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{health.deadLetters.count}</p>
          <p className="text-xs text-gray-600">
            {health.deadLetters.count === 0
              ? 'No failed operations'
              : `${health.deadLetters.count} permanent failures`}
          </p>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Queue Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{queueStats.pending}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Syncing</p>
            <p className="text-2xl font-bold text-yellow-600">{queueStats.syncing}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Success</p>
            <p className="text-2xl font-bold text-green-600">{queueStats.success}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
          </div>
        </div>
        {queueStats.oldestPendingAt && (
          <p className="text-xs text-gray-500 mt-4">
            Oldest pending: {new Date(queueStats.oldestPendingAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error Metrics */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Error Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Operations</p>
            <p className="text-lg font-semibold text-gray-900">{metrics.totalOperations}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Successful</p>
            <p className="text-lg font-semibold text-green-600">{metrics.successfulOperations}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Failed</p>
            <p className="text-lg font-semibold text-red-600">{metrics.failedOperations}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Retried</p>
            <p className="text-lg font-semibold text-yellow-600">{metrics.retriedOperations}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-medium text-gray-700 mb-3">Errors by Category</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {Object.entries(metrics.errorsByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">{category}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Avg Retry Count</p>
              <p className="font-medium text-gray-900">{metrics.averageRetryCount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Avg Retry Delay</p>
              <p className="font-medium text-gray-900">
                {(metrics.averageRetryDelay / 1000).toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Circuit Breaker Trips</p>
              <p className="font-medium text-gray-900">{metrics.circuitBreakerTrips}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Budget Exhaustion</p>
              <p className="font-medium text-gray-900">{metrics.retryBudgetExhaustion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button onClick={handleResetAll} size="sm" variant="outline">
          Reset All Systems
        </Button>
      </div>
    </div>
  );
}
