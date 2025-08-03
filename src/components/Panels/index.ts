// src/components/Panels/index.ts

// Export the panels that definitely exist
export { default as DashboardPanel } from './DashboardPanel';
export { default as WritingPanel } from './WritingPanel';
export { default as TimelinePanel } from './TimelinePanel';

// For optional panels, create dynamic exports
let SettingsPanel: React.ComponentType;
let AnalysisPanel: React.ComponentType;

// Try to import SettingsPanel
try {
  SettingsPanel = require('./SettingsPanel').default;
} catch {
  // Fallback component if SettingsPanel doesn't exist
  SettingsPanel = () => {
    const React = require('react');
    return React.createElement(
      'div',
      {
        className: 'h-full bg-[#0A0F1C] text-gray-100 p-6 flex items-center justify-center',
      },
      React.createElement(
        'div',
        {
          className: 'text-center',
        },
        React.createElement(
          'h2',
          { className: 'text-2xl font-bold font-bold font-bold mb-4' },
          'Settings Panel',
        ),
        React.createElement('p', { className: 'text-gray-400' }, 'Settings coming soon!'),
      ),
    );
  };
}

// Try to import AnalysisPanel
try {
  AnalysisPanel = require('./AnalysisPanel').default;
} catch {
  // Fallback component if AnalysisPanel doesn't exist
  AnalysisPanel = () => {
    const React = require('react');
    return React.createElement(
      'div',
      {
        className: 'h-full bg-[#0A0F1C] text-gray-100 p-6 flex items-center justify-center',
      },
      React.createElement(
        'div',
        {
          className: 'text-center',
        },
        React.createElement(
          'h2',
          { className: 'text-2xl font-bold font-bold font-bold mb-4' },
          'Analysis Panel',
        ),
        React.createElement('p', { className: 'text-gray-400' }, 'Analytics coming soon!'),
      ),
    );
  };
}

export { SettingsPanel, AnalysisPanel };
