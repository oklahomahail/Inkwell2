// src/components/Claude/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isConfigured, _isLoading, error }) => {
  if (isLoading) {
    return (
      <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded">
        Loading...
      </span>
    );
  }

  if (error) {
    return (
      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded">Error</span>
    );
  }

  if (!isConfigured) {
    return (
      <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded">
        Not Configured
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded">
      Ready
    </span>
  );
};

export default StatusBadge;
