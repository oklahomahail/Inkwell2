// src/components/Panels/index.ts
import React from 'react';

// Export the panels that definitely exist
export { default as DashboardPanel } from './DashboardPanel';
export { default as WritingPanel } from './WritingPanel';
export { default as TimelinePanel } from './TimelinePanel';

// Fallback component for SettingsPanel
const SettingsPanel: React.FC = () => {
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
        { className: 'text-2xl font-bold font-bold mb-4' },
        'Settings Panel',
      ),
      React.createElement('p', { className: 'text-gray-400' }, 'Settings coming soon!'),
    ),
  );
};
SettingsPanel.displayName = 'SettingsPanel';

// Fallback component for AnalysisPanel
const AnalyticsPanel: React.FC = () => {
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
        { className: 'text-2xl font-bold font-bold mb-4' },
        'Analytics Panel',
      ),
      React.createElement('p', { className: 'text-gray-400' }, 'Analytics coming soon!'),
    ),
  );
};
AnalyticsPanel.displayName = 'AnalyticsPanel';

export { SettingsPanel, AnalyticsPanel };
