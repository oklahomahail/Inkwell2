// src/components/ClaudeAssistant/index.ts
import React from 'react';

// Simple fallback component for now
const ClaudeAssistant: React.FC = () => {
  return React.createElement(
    'div',
    {
      className: 'p-4 text-center text-gray-400',
    },
    'Claude Assistant not available',
  );
};

ClaudeAssistant.displayName = 'ClaudeAssistant';

export { ClaudeAssistant };
