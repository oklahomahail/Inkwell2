// src/components/Panels/TimelinePanel.tsx
import React from 'react';

const TimelinePanel: React.FC = () => {
  return (
    <div className="p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-4">Timeline</h1>
      <p className="text-lg">Visualize events, scenes, and character arcs over time.</p>
      <div className="mt-4 border rounded p-4 bg-white dark:bg-gray-800">
        <p className="text-sm italic text-gray-500 dark:text-gray-400">
          (Timeline visualization coming soon...)
        </p>
      </div>
    </div>
  );
};

export default TimelinePanel;
