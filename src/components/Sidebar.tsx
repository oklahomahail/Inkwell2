import React from 'react';
import { useWritingPlatform, View } from '@/context/WritingPlatformProvider';

const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useWritingPlatform();

  const navItems: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'writing', label: 'Writing' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'analysis', label: 'Analysis' },
  ];

  return (
    <nav className="flex flex-col p-4 space-y-2 text-gray-700 dark:text-gray-300">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`text-left px-4 py-2 rounded-lg transition ${
            activeView === item.id
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default Sidebar;
