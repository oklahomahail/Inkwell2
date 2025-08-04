// src/components/Claude/LoadingIndicator.tsx
import React from 'react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 'md', message }) => {
  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <svg
        className="animate-spin"
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Loading"
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
};

export default LoadingIndicator;
