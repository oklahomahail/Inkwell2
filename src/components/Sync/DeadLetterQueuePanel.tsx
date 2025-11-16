import { AlertCircle, CheckCircle, RefreshCw, Trash2, Clock, Database } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import type { DeadLetter } from '@/sync/errorRecovery';
import { ErrorCategory } from '@/sync/errorRecovery';
import { syncQueue } from '@/sync/syncQueue';

/**
 * Dead Letter Queue Panel
 *
 * Displays permanently failed sync operations and allows manual retry.
 * Shows full error context, attempt history, and batch actions.
 */
export function DeadLetterQueuePanel() {
  const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadDeadLetters = () => {
    const letters = syncQueue.getDeadLetters();
    setDeadLetters(letters);
  };

  useEffect(() => {
    loadDeadLetters();
    // Refresh every 30 seconds
    const interval = setInterval(loadDeadLetters, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (operationId: string) => {
    setIsLoading(true);
    try {
      const success = await syncQueue.retryDeadLetter(operationId);
      if (success) {
        loadDeadLetters();
      }
    } catch (error) {
      console.error('[DeadLetterQueue] Retry failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryAll = async () => {
    setIsLoading(true);
    try {
      for (const letter of deadLetters) {
        await syncQueue.retryDeadLetter(letter.operation.id);
      }
      loadDeadLetters();
    } catch (error) {
      console.error('[DeadLetterQueue] Retry all failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all dead letters? This cannot be undone.')) {
      syncQueue.clearDeadLetters();
      loadDeadLetters();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getCategoryIcon = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.NETWORK:
        return <Database className="h-4 w-4 text-blue-500" />;
      case ErrorCategory.AUTHENTICATION:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ErrorCategory.RATE_LIMIT:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'text-blue-600 bg-blue-50';
      case ErrorCategory.AUTHENTICATION:
        return 'text-red-600 bg-red-50';
      case ErrorCategory.RATE_LIMIT:
        return 'text-yellow-600 bg-yellow-50';
      case ErrorCategory.SERVER_ERROR:
        return 'text-orange-600 bg-orange-50';
      case ErrorCategory.CLIENT_ERROR:
        return 'text-purple-600 bg-purple-50';
      case ErrorCategory.CONFLICT:
        return 'text-pink-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (deadLetters.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Dead Letter Queue</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">No failed operations</p>
          <p className="text-sm text-gray-500 mt-1">
            All sync operations are succeeding or retrying normally
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Dead Letter Queue ({deadLetters.length})
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRetryAll}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Retry All
          </Button>
          <Button
            onClick={handleClearAll}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {deadLetters.map((letter) => (
          <div
            key={letter.operation.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(letter.finalError.category)}
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${getCategoryColor(letter.finalError.category)}`}
                  >
                    {letter.finalError.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Table:{' '}
                    <code className="bg-gray-100 px-1 rounded">{letter.operation.table}</code>
                  </span>
                  <span className="text-xs text-gray-500">
                    Record:{' '}
                    <code className="bg-gray-100 px-1 rounded">{letter.operation.recordId}</code>
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  Failed {formatDuration(Date.now() - letter.deadAt)} (
                  {letter.attemptHistory.length} attempts)
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Created: {formatDate(letter.operation.createdAt)}</span>
                  <span>Failed: {formatDate(letter.deadAt)}</span>
                </div>

                {expandedId === letter.operation.id && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Final Error</h4>
                      <pre className="text-xs bg-red-50 text-red-900 p-3 rounded overflow-x-auto">
                        {letter.finalError.originalError?.message || 'Unknown error'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Attempt History ({letter.attemptHistory.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {letter.attemptHistory.map((attempt, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-gray-50 p-2 rounded flex justify-between items-start"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">Attempt #{attempt.attempt}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded ${getCategoryColor(attempt.category)}`}
                                >
                                  {attempt.category}
                                </span>
                              </div>
                              <p className="text-gray-600 truncate">{attempt.error}</p>
                            </div>
                            <div className="text-gray-500 text-right ml-4">
                              <div>{formatDate(attempt.timestamp)}</div>
                              {attempt.delay > 0 && (
                                <div className="text-xs">Delay: {attempt.delay}ms</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  onClick={() => handleRetry(letter.operation.id)}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
                <Button
                  onClick={() =>
                    setExpandedId(expandedId === letter.operation.id ? null : letter.operation.id)
                  }
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  {expandedId === letter.operation.id ? 'Hide' : 'Details'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
