// src/components/index.ts
// Try the folder-based import first
let ClaudeAssistant: React.ComponentType;

try {
  ClaudeAssistant = require('./ClaudeAssistant').default;
} catch {
  try {
    ClaudeAssistant = require('./ClaudeAssistant/ClaudeAssistant').default;
  } catch {
    // Fallback component if ClaudeAssistant doesn't exist
    ClaudeAssistant = () => {
      const React = require('react');
      return React.createElement(
        'div',
        {
          className: 'p-4 text-center text-gray-400',
        },
        'Claude Assistant not available',
      );
    };
  }
}

export { ClaudeAssistant };
