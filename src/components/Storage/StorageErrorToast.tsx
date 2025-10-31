/**
 * Storage Error Toast Component
 *
 * Non-intrusive notification for storage errors.
 * Appears at bottom-right, auto-dismisses or can be manually closed.
 */

import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { storageErrorLogger, type ErrorLogEntry } from '@/services/storageErrorLogger';
import { cn } from '@/utils/cn';

export function StorageErrorToast() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load initial unacknowledged errors
    const initial = storageErrorLogger.getUnacknowledgedErrors();
    setErrors(initial);

    // Subscribe to new errors
    const unsubscribe = storageErrorLogger.onError((entry) => {
      // Only show critical and error severity
      if (entry.event.severity === 'critical' || entry.event.severity === 'error') {
        setErrors((prev) => [...prev, entry]);
      }
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    storageErrorLogger.acknowledgeError(id);

    // Remove from state after animation
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    }, 300);
  };

  // Filter out dismissed errors
  const visibleErrors = errors.filter((e) => !dismissed.has(e.id));

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-toast space-y-2 max-w-md">
      {visibleErrors.map((entry) => (
        <ErrorToastItem
          key={entry.id}
          entry={entry}
          onDismiss={handleDismiss}
          isDismissed={dismissed.has(entry.id)}
        />
      ))}
    </div>
  );
}

interface ErrorToastItemProps {
  entry: ErrorLogEntry;
  onDismiss: (id: string) => void;
  isDismissed: boolean;
}

function ErrorToastItem({ entry, onDismiss, isDismissed }: ErrorToastItemProps) {
  const { event } = entry;

  const getIcon = () => {
    switch (event.severity) {
      case 'critical':
        return {
          Icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
        };
      case 'error':
        return {
          Icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
        };
      default:
        return { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  const { Icon, color, bg, border } = getIcon();

  // Auto-dismiss after 10 seconds for recoverable errors
  useEffect(() => {
    if (event.canRecover && !isDismissed) {
      const timeout = setTimeout(() => {
        onDismiss(entry.id);
      }, 10000);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [entry.id, event.canRecover, isDismissed, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
        bg,
        border,
        isDismissed ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', color)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">{event.message}</p>

        {event.suggestedActions.length > 0 && (
          <div className="text-xs text-gray-700 mt-2">
            <p className="font-medium mb-1">Suggested actions:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {event.suggestedActions.slice(0, 2).map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {!event.canRecover && (
          <p className="text-xs text-red-700 mt-2 font-medium">Manual intervention required</p>
        )}
      </div>

      <button
        onClick={() => onDismiss(entry.id)}
        className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
