// src/components/Claude/TypingIndicator.tsx
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-2 text-gray-400 italic text-sm">
      <svg
        className="animate-pulse"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-label="Typing indicator"
        role="status"
      >
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
      </svg>
      <span>Claude is typing...</span>
    </div>
  );
};

export default TypingIndicator;
