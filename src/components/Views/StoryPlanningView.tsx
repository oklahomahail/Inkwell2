// src/components/Views/StoryPlanningView.tsx
import React, { useState } from 'react';
import { BookOpen, Users, Map, FileText } from 'lucide-react';
import BeatSheetPlanner from '../Planning/BeatSheetPlanner';
import CharacterManager from '../Planning/CharacterManager';

type PlanningTab = 'overview' | 'beats' | 'characters' | 'world';

const StoryPlanningView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlanningTab>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'beats' as const, label: 'Beat Sheet', icon: BookOpen },
    { id: 'characters' as const, label: 'Characters', icon: Users },
    { id: 'world' as const, label: 'World Building', icon: Map },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'beats':
        return <BeatSheetPlanner />;
      case 'characters':
        return <CharacterManager />;
      case 'world':
        return <WorldBuildingTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex space-x-8 px-6" aria-label="Planning tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }
                `}
              >
                <IconComponent className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Story Planning</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quick Start */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Start</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">1. Create Your Beat Sheet</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Structure your story with proven templates like Save the Cat! or Three-Act Structure.
                </p>
                <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Start with Beat Sheet →
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">2. Develop Your Characters</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Create detailed character profiles with motivations, conflicts, and arcs.
                </p>
                <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Manage Characters →
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">3. Build Your World</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Define settings, rules, and background details that bring your story to life.
                </p>
                <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Start World Building →
                </button>
              </div>
            </div>
          </div>

          {/* Planning Tips */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Planning Tips</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Story Structure</h3>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• Every scene should advance plot or develop character</li>
                <li>• Create clear stakes and escalating tension</li>
                <li>• Give your protagonist agency in the climax</li>
                <li>• Plant setups early for satisfying payoffs</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">Character Development</h3>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>• Give characters clear external goals and internal needs</li>
                <li>• Create believable flaws that generate conflict</li>
                <li>• Show character growth through actions, not exposition</li>
                <li>• Make each character's voice distinct</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">World Building</h3>
              <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                <li>• Establish clear rules and stick to them</li>
                <li>• Show don't tell - reveal through character interactions</li>
                <li>• Consider how your world affects the plot</li>
                <li>• Don't over-explain - leave room for mystery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// World Building Tab (placeholder)
const WorldBuildingTab: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">World Building</h3>
        <p className="text-sm">Coming soon - Create locations, cultures, and rules for your story world</p>
      </div>
    </div>
  );
};

export default StoryPlanningView;