// src/components/Views/StoryPlanningView.tsx - Enhanced with Story Architect Flow
import { BookOpen, Users, Map, FileText, BarChart3, Wand2 } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '../../context/ToastContext';
import { type GeneratedOutline } from '../../services/storyArchitectService';
import BeatSheetPlanner from '../Planning/BeatSheetPlanner';
import CharacterManager from '../Planning/CharacterManager';
import { StoryArchitectFlow } from '../Planning/StoryArchitectFlow';
import StoryStructureVisualizer from '../Planning/StoryStructureVisualizer';

type PlanningTab = 'overview' | 'beats' | 'characters' | 'world' | 'health';

const StoryPlanningView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlanningTab>('overview');
  const [showArchitectFlow, setShowArchitectFlow] = useState(false);
  const { showToast } = useToast();

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'health' as const, label: 'Story Health', icon: BarChart3 },
    { id: 'beats' as const, label: 'Beat Sheet', icon: BookOpen },
    { id: 'characters' as const, label: 'Characters', icon: Users },
    { id: 'world' as const, label: 'World Building', icon: Map },
  ];

  const handleStoryArchitectComplete = (outline: GeneratedOutline) => {
    // Story has been successfully integrated by the StoryArchitectFlow
    setShowArchitectFlow(false);
    setActiveTab('beats'); // Navigate to beat sheet to see results
    showToast(`Story outline "${outline.title}" integrated successfully!`, 'success');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            onNavigateToTab={setActiveTab}
            onOpenArchitectFlow={() => setShowArchitectFlow(true)}
          />
        );
      case 'health':
        return <StoryHealthTab />;
      case 'beats':
        return <BeatSheetPlanner />;
      case 'characters':
        return <CharacterManager />;
      case 'world':
        return <WorldBuildingTab />;
      default:
        return (
          <OverviewTab
            onNavigateToTab={setActiveTab}
            onOpenArchitectFlow={() => setShowArchitectFlow(true)}
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Enhanced Header with Story Architect Button */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between px-6 py-4">
          <nav className="flex space-x-8" aria-label="Planning tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'health' && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Story Architect Button */}
          <button
            onClick={() => setShowArchitectFlow(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Wand2 className="w-4 h-4" />
            Story Architect
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">{renderTabContent()}</div>

      {/* Story Architect Flow Modal */}
      {showArchitectFlow && (
        <StoryArchitectFlow
          onComplete={handleStoryArchitectComplete}
          onClose={() => setShowArchitectFlow(false)}
        />
      )}
    </div>
  );
};

// Enhanced Overview Tab with Story Architect integration
const OverviewTab: React.FC<{
  onNavigateToTab: (tab: PlanningTab) => void;
  onOpenArchitectFlow: () => void;
}> = ({ onNavigateToTab, onOpenArchitectFlow }) => {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Story Planning</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Quick Start - Enhanced */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Start</h2>

            <div className="space-y-4">
              {/* NEW: Story Architect card */}
              <div className="p-4 border border-purple-200 dark:border-purple-600 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  AI Story Architect
                  <span className="text-xs bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    ✨ New
                  </span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                  Generate a complete story outline with chapters, scenes, and characters from just
                  your premise. Perfect for getting started or breaking through planning blocks.
                </p>
                <button
                  onClick={onOpenArchitectFlow}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Story Outline
                </button>
              </div>

              {/* Story Health card */}
              <div className="p-4 border border-purple-200 dark:border-purple-600 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Check Your Story Health
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    New
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Get professional insights on your story's structure, pacing, and character
                  development.
                </p>
                <button
                  onClick={() => onNavigateToTab('health')}
                  className="text-purple-600 dark:text-purple-400 text-sm hover:underline font-medium"
                >
                  View Story Health Dashboard →
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  1. Create Your Beat Sheet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Structure your story with proven templates like Save the Cat! or Three-Act
                  Structure.
                </p>
                <button
                  onClick={() => onNavigateToTab('beats')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Start with Beat Sheet →
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  2. Develop Your Characters
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Create detailed character profiles with motivations, conflicts, and arcs.
                </p>
                <button
                  onClick={() => onNavigateToTab('characters')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Manage Characters →
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  3. Build Your World
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Define settings, rules, and background details that bring your story to life.
                </p>
                <button
                  onClick={() => onNavigateToTab('world')}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Start World Building →
                </button>
              </div>
            </div>
          </div>

          {/* Planning Tips - Enhanced with Story Architect info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Planning Tips</h2>

            {/* NEW: AI-Powered Planning tip */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-600">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                AI-Powered Planning
              </h3>
              <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                <li>• Use Story Architect to overcome writer's block</li>
                <li>• Generate outlines to explore different story directions</li>
                <li>• Get AI suggestions for character development</li>
                <li>• Combine AI generation with manual refinement</li>
              </ul>
            </div>

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
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Character Development
              </h3>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>• Give characters clear external goals and internal needs</li>
                <li>• Create believable flaws that generate conflict</li>
                <li>• Show character growth through actions, not exposition</li>
                <li>• Make each character's voice distinct</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                Pacing & Flow
              </h3>
              <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                <li>• Balance dialogue with narrative description</li>
                <li>• Vary sentence and scene lengths for rhythm</li>
                <li>• Use the Story Health tab to analyze your pacing</li>
                <li>• Fast scenes for action, slower for character moments</li>
              </ul>
            </div>

            {/* Story Health Preview */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Story Health Preview
                </h3>
                <button
                  onClick={() => onNavigateToTab('health')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View Full →
                </button>
              </div>
              <StoryStructureVisualizer compact={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Story Health Tab Component (unchanged)
const StoryHealthTab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <StoryStructureVisualizer />
      </div>
    </div>
  );
};

// World Building Tab (unchanged)
const WorldBuildingTab: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">World Building</h3>
        <p className="text-sm">
          Coming soon - Create locations, cultures, and rules for your story world
        </p>
      </div>
    </div>
  );
};

export default StoryPlanningView;
