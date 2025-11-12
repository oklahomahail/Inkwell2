// src/components/Chapters/RealtimeStatus.tsx
/**
 * RealtimeStatus Component
 *
 * Displays real-time sync status with visual indicators:
 * - Live connection status (green dot = connected, gray = offline)
 * - Live update flash (animated pulse when update received)
 * - Manual sync button with loading state
 */

import { RefreshCw } from 'lucide-react';
import React from 'react';

interface RealtimeStatusProps {
  connected: boolean;
  liveUpdate: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  onSync: () => void;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  connected,
  liveUpdate,
  syncing,
  lastSynced,
  onSync,
}) => {
  const formatLastSynced = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-slate-900 border-l border-slate-800"
      data-tour="realtime-status"
    >
      {/* Connection Status */}
      <div
        className={`flex items-center gap-1.5 text-xs transition-colors ${
          connected ? 'text-emerald-400' : 'text-slate-500'
        }`}
        title={
          connected
            ? `Connected${lastSynced ? ` • Last synced: ${formatLastSynced(lastSynced)}` : ''}`
            : 'Disconnected • Working offline'
        }
      >
        {/* Status indicator dot with pulse animation when live update received */}
        <span className="relative flex h-2.5 w-2.5">
          {liveUpdate && connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              connected ? 'bg-emerald-500' : 'bg-slate-500'
            }`}
          />
        </span>
        <span className="font-medium">{connected ? 'Live' : 'Offline'}</span>
      </div>

      {/* Manual Sync Button */}
      <button
        onClick={onSync}
        disabled={syncing}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          syncing
            ? 'bg-blue-800 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'
        }`}
        title={syncing ? 'Syncing with cloud...' : 'Manually sync with cloud'}
      >
        <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
        <span>{syncing ? 'Syncing' : 'Sync'}</span>
      </button>
    </div>
  );
};
