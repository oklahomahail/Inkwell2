/**
 * AutosaveIndicator
 *
 * UI component for displaying autosave state in the Topbar.
 * Shows real-time save status: Saving, Saved, Offline, Error.
 *
 * Part of v0.8.0 Phase 1 - Enhanced Chapter Editor + Autosave
 */

import { CheckCircle2, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AutosaveService, AutosaveState } from '@/services/autosaveService';

interface AutosaveIndicatorProps {
  service: AutosaveService;
  className?: string;
}

export default function AutosaveIndicator({ service, className = '' }: AutosaveIndicatorProps) {
  const [state, setState] = useState<AutosaveState>('idle');

  useEffect(() => {
    const unsubscribe = service.onState(setState);
    return () => unsubscribe();
  }, [service]);

  // Determine visual representation based on state
  const getStateDisplay = () => {
    switch (state) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
          label: 'Saving…',
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'saved':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          label: 'Saved',
          color: 'text-green-600 dark:text-green-400',
        };
      case 'offline':
        return {
          icon: <CloudOff className="w-4 h-4 text-amber-500" />,
          label: 'Offline (saving locally)',
          color: 'text-amber-600 dark:text-amber-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          label: 'Save error',
          color: 'text-red-600 dark:text-red-400',
        };
      case 'idle':
      default:
        return {
          icon: <Cloud className="w-4 h-4 text-gray-400" />,
          label: '',
          color: 'text-gray-500 dark:text-gray-400',
        };
    }
  };

  const display = getStateDisplay();

  // Don't show anything in idle state
  if (state === 'idle') {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${display.color} ${className}`}
      aria-live="polite"
      data-testid="autosave-indicator"
      data-state={state}
    >
      {display.icon}
      <span className="font-medium">{display.label}</span>
    </div>
  );
}
