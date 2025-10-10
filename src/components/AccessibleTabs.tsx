// src/components/AccessibleTabs.tsx
import React, { useState, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  initialSelectedId?: string;
  onChange?: (selectedId: string) => void;
  className?: string;
}

const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  initialSelectedId,
  onChange,
  className = '',
}) => {
  const [selectedId, setSelectedId] = useState(initialSelectedId || tabs[0]?.id || '');

  useEffect(() => {
    if (initialSelectedId && initialSelectedId !== selectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId, selectedId]);

  const handleTabChange = (id: string) => {
    const tab = tabs.find((tab) => tab.id === id);
    if (tab && !tab.disabled) {
      setSelectedId(id);
      onChange?.(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabChange(id);
        return;
      default:
        return;
    }

    // Find next non-disabled tab
    let attempts = 0;
    while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex && attempts < tabs.length) {
      nextIndex = nextIndex < tabs.length - 1 ? nextIndex + 1 : 0;
      attempts++;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab && !nextTab.disabled) {
      const nextButton = document.querySelector(
        `[data-tab-id="${nextTab.id}"]`,
      ) as HTMLButtonElement;
      nextButton?.focus();
    }
  };

  const selectedTab = tabs.find((tab) => tab.id === selectedId);

  // Safety check - if no tabs provided, render nothing
  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab List */}
      <div
        className="flex border-b border-gray-700"
        role="tablist"
        aria-label="Claude Assistant Modes"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={selectedId === tab.id}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={selectedId === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            disabled={tab.disabled}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:ring-inset ${
              selectedId === tab.id
                ? 'text-[#0073E6] border-b-2 border-[#0073E6] bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-center space-x-1">
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedTab && (
          <div
            id={`panel-${selectedTab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${selectedTab.id}`}
            className="h-full flex flex-col"
          >
            {selectedTab.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibleTabs;
