// src/components/Panels/DashboardPanel.tsx
import React from 'react';

const DashboardPanel: React.FC = () => {
  return (
    <div className="p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg">Welcome to your writing dashboard.</p>
      <ul className="list-disc list-inside mt-4 space-y-2">
        <li>View recent projects</li>
        <li>Track writing streaks and word counts</li>
        <li>Access quick links and tips</li>
      </ul>
    </div>
  );
};

export default DashboardPanel;
