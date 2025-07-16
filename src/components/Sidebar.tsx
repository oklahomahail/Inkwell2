// src/components/Sidebar/Sidebar.tsx
import React from 'react';
import { useWritingPlatform } from '@/context/WritingPlatformProvider';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'writing', label: 'Writing' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'analysis', label: 'Analysis' },
] as const;

const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useWritingPlatform();

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Navigation</h2>
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
