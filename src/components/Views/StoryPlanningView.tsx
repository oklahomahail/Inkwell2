// src/components/Views/StoryPlanningView.tsx - Enhanced with Story Architect Flow
import { BookOpen, Users, Map, FileText, BarChart3, Wand2, Settings } from 'lucide-react';
import React, { useState, useEffect, lazy, Suspense } from 'react';

import { useAiSettings } from '@/context/AiSettingsContext';
import { useAppContext, View } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import { hasUserApiKey, getFeatureBadgeStatus } from '@/utils/aiFeatureClassification';
import { triggerStoryPlanningOpen, triggerWorldBuildingVisited } from '@/utils/tourTriggers';

import { type GeneratedOutline } from '../../services/storyArchitectService';
import { AiFeatureBadge } from '../Planning/AiFeatureBadge';
import BeatSheetPlanner from '../Planning/BeatSheetPlanner';
import CharacterManager from '../Planning/CharacterManager';
import { StoryArchitectFlow } from '../Planning/StoryArchitectFlow';
import StoryStructureVisualizer from '../Planning/StoryStructureVisualizer';

// Lazy load World Building panel
const WorldBuildingPanel = lazy(() => import('../Planning/WorldBuilding/WorldBuildingPanel'));

type PlanningTab = 'overview' | 'beats' | 'characters' | 'world' | 'health';

const StoryPlanningView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlanningTab>('overview');
  const [showArchitectFlow, setShowArchitectFlow] = useState(false);
  const { showToast } = useToast();

  // Fire tour trigger on component mount
  useEffect(() => {
    triggerStoryPlanningOpen();
  }, []);

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
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'world') {
                      triggerWorldBuildingVisited();
                    }
                  }}
                  data-tour={`planner-tab-${tab.id}`}
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

// Enhanced Overview Tab with Story Architect integration and AI status badges
const OverviewTab: React.FC<{
  onNavigateToTab: (_tab: PlanningTab) => void;
  onOpenArchitectFlow: () => void;
}> = ({ onNavigateToTab, onOpenArchitectFlow }) => {
  const { settings } = useAiSettings();
  const { setView } = useAppContext();

  // Check if user has API key configured
  const [userHasApiKey, setUserHasApiKey] = useState(() => hasUserApiKey(settings));

  // Listen for storage changes to update badge status in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      setUserHasApiKey(hasUserApiKey(settings));
    };

    // Listen for localStorage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also re-check when settings change in current tab
    setUserHasApiKey(hasUserApiKey(settings));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [settings]);

  const handleConfigureApiKey = () => {
    setView(View.Settings);
  };

  return (
    <div className="h-full overflow-y-auto p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
            Plan Your Story
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
            Transform your ideas into a complete story blueprint. Start broad, then refine each
            layer — plot, characters, and world.
          </p>
        </header>

        {/* BLOCK 1 – AI STORY ARCHITECT */}
        <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Wand2 className="text-amber-500 w-5 h-5 flex-shrink-0" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">AI Story Architect</h2>
            </div>
            <AiFeatureBadge status="free" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Generate a complete story outline with chapters, scenes, and characters from your
            premise — perfect for getting started or breaking through planning blocks.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onOpenArchitectFlow}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow"
            >
              <Wand2 className="w-4 h-4" />
              Generate Outline with AI
            </button>
            <button
              onClick={() => onNavigateToTab('beats')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Start Outline Manually
            </button>
          </div>
        </section>

        {/* BLOCK 2 – BEAT SHEET */}
        <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="text-sky-500 w-5 h-5 flex-shrink-0" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Beat Sheet</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Structure your story using classic templates like the Three-Act Structure or Save the
            Cat! framework.
          </p>
          <button
            onClick={() => onNavigateToTab('beats')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
          >
            Open Beat Sheet →
          </button>
        </section>

        {/* BLOCK 3 – CHARACTERS */}
        <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-rose-500 w-5 h-5 flex-shrink-0" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Characters</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Create detailed character profiles with motivations, conflicts, and arcs. Track growth
            and relationships.
          </p>
          <button
            onClick={() => onNavigateToTab('characters')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
          >
            Manage Characters →
          </button>
        </section>

        {/* BLOCK 4 – STORY HEALTH */}
        <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-emerald-500 w-5 h-5 flex-shrink-0" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Story Health</h2>
            </div>
            <AiFeatureBadge status={getFeatureBadgeStatus('apiKey', settings)} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Get professional AI insights on structure, pacing, and character balance to fine-tune
            your manuscript.
          </p>
          <div className="flex gap-3">
            {userHasApiKey ? (
              <button
                onClick={() => onNavigateToTab('health')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Analyze Story →
              </button>
            ) : (
              <button
                onClick={handleConfigureApiKey}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configure API Key →
              </button>
            )}
          </div>
        </section>

        {/* BLOCK 5 – WORLD BUILDING */}
        <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Map className="text-indigo-500 w-5 h-5 flex-shrink-0" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">World Building</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Define your settings, history, and world logic to make your story universe consistent
            and immersive.
          </p>
          <button
            onClick={() => onNavigateToTab('world')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Start World Building →
          </button>
        </section>

        {/* FOOTER / TIPS */}
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-3 text-sm">
            Planning Tips
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-5">
            <li>Every scene should advance the plot or develop a character</li>
            <li>Plant setups early for satisfying payoffs</li>
            <li>Balance pacing — mix action, reflection, and dialogue</li>
            <li>Give each character clear motivations and arcs</li>
          </ul>
        </footer>
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

// World Building Tab
const WorldBuildingTab: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Map className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-sm">Loading World Building...</p>
          </div>
        </div>
      }
    >
      <WorldBuildingPanel />
    </Suspense>
  );
};

export default StoryPlanningView;
