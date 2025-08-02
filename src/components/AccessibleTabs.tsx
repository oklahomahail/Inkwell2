// src/components/AccessibleTabs.tsx
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactElement;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  initialSelectedId: string;
  onChange: (id: string) => void;
}

const AccessibleTabs: React.FC<AccessibleTabsProps> = ({ tabs, initialSelectedId, onChange }) => {
  const [selectedId, setSelectedId] = React.useState(initialSelectedId);

  const handleTabChange = (id: string) => {
    setSelectedId(id);
    onChange(id);
  };

  const selectedTab = tabs.find((tab) => tab.id === selectedId);

  return (
    <div className="accessible-tabs">
      <div className="tab-list flex border-b" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === selectedId}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 flex items-center ${
              tab.id === selectedId
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content mt-4" role="tabpanel">
        {selectedTab?.content}
      </div>
    </div>
  );
};

export default AccessibleTabs;
