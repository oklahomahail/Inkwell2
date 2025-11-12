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
    <div className="h-full flex flex-col bg-inkwell-canvas dark:bg-inkwell-dark-bg">
      {/* Enhanced Header with Story Architect Button */}
      <div className="border-b border-inkwell-panel dark:border-inkwell-dark-elevated">
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
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-sans text-label transition-all duration-200
                    ${
                      isActive
                        ? 'border-inkwell-gold text-inkwell-focus dark:text-inkwell-gold-light'
                        : 'border-transparent text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text hover:border-inkwell-panel dark:hover:border-inkwell-dark-elevated'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'health' && (
                    <span className="ml-1 px-2 py-0.5 text-caption bg-inkwell-gold/10 text-inkwell-gold dark:bg-inkwell-gold-light/20 dark:text-inkwell-gold-light rounded-full font-medium">
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-inkwell-gold to-inkwell-gold-600 hover:from-inkwell-gold-600 hover:to-inkwell-gold-700 text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated focus:shadow-focus"
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
    <div className="h-full overflow-y-auto p-8 bg-gradient-to-b from-inkwell-canvas to-inkwell-parchment dark:from-inkwell-dark-bg dark:to-inkwell-dark-surface">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-heading-xl font-serif text-inkwell-ink dark:text-inkwell-dark-text">
            Plan Your Story
          </h1>
          <p className="text-body text-inkwell-ink/70 dark:text-inkwell-dark-muted mt-4 max-w-2xl mx-auto">
            Transform your ideas into a complete story blueprint. Start broad, then refine each
            layer — plot, characters, and world.
          </p>
        </header>

        {/* BLOCK 1 – AI STORY ARCHITECT */}
        <section className="p-6 rounded-card border border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-white/80 dark:bg-inkwell-dark-surface/80 shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Wand2 className="text-inkwell-gold w-5 h-5 flex-shrink-0" />
              <h2 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text">
                AI Story Architect
              </h2>
            </div>
            <AiFeatureBadge status="free" />
          </div>
          <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-4">
            Generate a complete story outline with chapters, scenes, and characters from your
            premise — perfect for getting started or breaking through planning blocks.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onOpenArchitectFlow}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-inkwell-gold to-inkwell-gold-600 hover:from-inkwell-gold-600 hover:to-inkwell-gold-700 text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated focus:shadow-focus"
            >
              <Wand2 className="w-4 h-4" />
              Generate Outline with AI
            </button>
            <button
              onClick={() => onNavigateToTab('beats')}
              className="flex-1 px-4 py-2 border border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-ink dark:text-inkwell-dark-text rounded-button font-medium hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated transition-all duration-200"
            >
              Start Outline Manually
            </button>
          </div>
        </section>

        {/* BLOCK 2 – BEAT SHEET */}
        <section className="p-6 rounded-card border border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-white/80 dark:bg-inkwell-dark-surface/80 shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="text-inkwell-focus w-5 h-5 flex-shrink-0" />
            <h2 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text">
              Beat Sheet
            </h2>
          </div>
          <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-4">
            Structure your story using classic templates like the Three-Act Structure or Save the
            Cat! framework.
          </p>
          <button
            onClick={() => onNavigateToTab('beats')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-focus hover:bg-inkwell-navy text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated"
          >
            Open Beat Sheet →
          </button>
        </section>

        {/* BLOCK 3 – CHARACTERS */}
        <section className="p-6 rounded-card border border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-white/80 dark:bg-inkwell-dark-surface/80 shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-inkwell-error w-5 h-5 flex-shrink-0" />
            <h2 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text">
              Characters
            </h2>
          </div>
          <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-4">
            Create detailed character profiles with motivations, conflicts, and arcs. Track growth
            and relationships.
          </p>
          <button
            onClick={() => onNavigateToTab('characters')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-error hover:bg-red-700 text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated"
          >
            Manage Characters →
          </button>
        </section>

        {/* BLOCK 4 – STORY HEALTH */}
        <section className="p-6 rounded-card border border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-white/80 dark:bg-inkwell-dark-surface/80 shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-inkwell-success w-5 h-5 flex-shrink-0" />
              <h2 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text">
                Story Health
              </h2>
            </div>
            <AiFeatureBadge status={getFeatureBadgeStatus('apiKey', settings)} />
          </div>
          <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-4">
            Get professional AI insights on structure, pacing, and character balance to fine-tune
            your manuscript.
          </p>
          <div className="flex gap-3">
            {userHasApiKey ? (
              <button
                onClick={() => onNavigateToTab('health')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-success hover:bg-green-700 text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated"
              >
                Analyze Story →
              </button>
            ) : (
              <button
                onClick={handleConfigureApiKey}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-focus hover:bg-inkwell-navy text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated"
              >
                <Settings className="w-4 h-4" />
                Configure API Key →
              </button>
            )}
          </div>
        </section>

        {/* BLOCK 5 – WORLD BUILDING */}
        <section className="p-6 rounded-card border border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-white/80 dark:bg-inkwell-dark-surface/80 shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Map className="text-purple-600 w-5 h-5 flex-shrink-0" />
            <h2 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text">
              World Building
            </h2>
          </div>
          <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-4">
            Define your settings, history, and world logic to make your story universe consistent
            and immersive.
          </p>
          <button
            onClick={() => onNavigateToTab('world')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-button font-medium transition-all duration-200 shadow-card hover:shadow-elevated"
          >
            Start World Building →
          </button>
        </section>

        {/* FOOTER / TIPS */}
        <footer className="mt-8 pt-6 border-t border-inkwell-panel/50 dark:border-inkwell-dark-elevated">
          <h3 className="text-label font-serif text-inkwell-ink dark:text-inkwell-dark-text mb-3">
            Planning Tips
          </h3>
          <ul className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted space-y-2 list-disc pl-5">
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

// Story Health Tab Component
const StoryHealthTab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 bg-inkwell-canvas dark:bg-inkwell-dark-bg">
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
        <div className="h-full flex items-center justify-center bg-inkwell-canvas dark:bg-inkwell-dark-bg">
          <div className="text-center text-inkwell-ink/60 dark:text-inkwell-dark-muted">
            <Map className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse text-purple-600 dark:text-purple-400" />
            <p className="text-body-sm">Loading World Building...</p>
          </div>
        </div>
      }
    >
      <WorldBuildingPanel />
    </Suspense>
  );
};

export default StoryPlanningView;
