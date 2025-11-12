// src/components/ViewSwitcher.tsx - Enhanced with Page Transitions
import React, { useState, useCallback, lazy, Suspense } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { useChapters } from '@/hooks/useChapters';

import { PlotBoards } from '../features/plotboards';
import { useFeatureDiscovery } from '../hooks/useAnalyticsTracking';

// Error boundaries

// Import enhanced components

import EnhancedDashboard from './Dashboard/EnhancedDashboard';
import { FeatureErrorBoundary } from './ErrorBoundary';
import { RecoveryErrorBoundary } from './ErrorBoundary/RecoveryErrorBoundary';
import { TimelinePanel } from './Panels';
import OnboardingPanel from './Panels/OnboardingPanel';
import { ViewTransition } from './Transitions/ViewTransition';
import StoryPlanningView from './Views/StoryPlanningView';
import EnhancedWritingPanel from './Writing/EnhancedWritingPanel';

// Lazy-load Analysis and Settings panels
const AnalyticsPanel = lazy(() => import('@/components/Panels/AnalyticsPanel'));
const SettingsPanel = lazy(() => import('@/components/Panels/SettingsPanel'));
const PlotAnalysisPanel = lazy(() =>
  import('@/services/plotAnalysis/components/PlotAnalysisPanel').then((m) => ({
    default: m.PlotAnalysisPanel,
  })),
);

// Lazy-load Export Dashboard (v0.7.0)
const ExportDashboard = lazy(() => import('@/components/Dashboard/ExportDashboard'));

// Lazy-load Formatting Panel (v0.10.0)
const FormattingPanel = lazy(() => import('@/components/Panels/FormattingPanel'));

const ViewSwitcher: React.FC = () => {
  const { state, currentProject, updateProject } = useAppContext();
  const { recordFeatureUse } = useFeatureDiscovery();
  const [_selectedText, _setSelectedText] = useState('');

  // Load chapters for Export Dashboard (v0.7.0)
  const { chapters } = useChapters(currentProject?.id ?? null);

  // Get current project content or default
  const _draftText = currentProject?.content || '';

  // Handle text changes and save to current project
  const _handleTextChange = useCallback(
    (value: string) => {
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          content: value,
          updatedAt: Date.now(),
        };
        updateProject(updatedProject);
      }
    },
    [currentProject, updateProject],
  );

  // Handle text selection for Claude integration
  const _handleTextSelect = useCallback(() => {
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      const selected = selection?.toString() || '';
      _setSelectedText(selected);
    }
  }, []);

  const currentView = state.view;

  // Track feature usage when switching views
  React.useEffect(() => {
    switch (currentView) {
      case View.PlotBoards:
        recordFeatureUse('plot_boards');
        break;
      case View.Timeline:
        recordFeatureUse('timeline');
        break;
      case View.Analysis:
        recordFeatureUse('analytics');
        break;
      case View.Writing:
        recordFeatureUse('writing_mode');
        break;
    }
  }, [currentView, recordFeatureUse]);

  // Helper to render content with page turn transition
  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return (
          <RecoveryErrorBoundary panelName="Dashboard">
            <FeatureErrorBoundary featureName="Dashboard">
              <EnhancedDashboard />
            </FeatureErrorBoundary>
          </RecoveryErrorBoundary>
        );
      case View.Writing:
        return (
          <RecoveryErrorBoundary panelName="Editor">
            <FeatureErrorBoundary featureName="Writing Editor">
              <EnhancedWritingPanel />
            </FeatureErrorBoundary>
          </RecoveryErrorBoundary>
        );
      case View.Timeline:
        return (
          <FeatureErrorBoundary featureName="Timeline">
            <TimelinePanel />
          </FeatureErrorBoundary>
        );
      case View.Analysis:
        return (
          <FeatureErrorBoundary featureName="Analytics">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading Analytics...</p>
                </div>
              }
            >
              <AnalyticsPanel />
            </Suspense>
          </FeatureErrorBoundary>
        );
      case View.Planning:
        return (
          <FeatureErrorBoundary featureName="Story Planning">
            <StoryPlanningView />
          </FeatureErrorBoundary>
        );
      case View.PlotBoards:
        return currentProject ? (
          <FeatureErrorBoundary featureName="Plot Boards">
            <PlotBoards projectId={currentProject.id} />
          </FeatureErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to use Plot Boards</p>
          </div>
        );
      case View.Plot:
        return currentProject ? (
          <FeatureErrorBoundary featureName="Plot Analysis">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading Plot Analysis...</p>
                </div>
              }
            >
              <PlotAnalysisPanel
                project={currentProject}
                onOpenChapter={(_chapterIndex) => {
                  // Navigate to Writing view - chapter selection would need ChapterContext integration
                  // For now, just switch to writing view
                  // TODO: Implement setActiveChapter(chapterIndex) via ChapterContext
                  window.location.hash = 'writing';
                }}
              />
            </Suspense>
          </FeatureErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to analyze plot structure</p>
          </div>
        );
      case View.Settings:
        return (
          <FeatureErrorBoundary featureName="Settings">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading Settings...</p>
                </div>
              }
            >
              <SettingsPanel />
            </Suspense>
          </FeatureErrorBoundary>
        );
      case View.Export:
        return currentProject ? (
          <FeatureErrorBoundary featureName="Export Dashboard">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading Export Dashboard...</p>
                </div>
              }
            >
              <ExportDashboard
                projectId={currentProject.id}
                projectName={currentProject.name}
                chapters={chapters}
              />
            </Suspense>
          </FeatureErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to view export dashboard</p>
          </div>
        );
      case View.Onboarding:
        return (
          <FeatureErrorBoundary featureName="Onboarding">
            <OnboardingPanel />
          </FeatureErrorBoundary>
        );
      case View.Formatting:
        return currentProject ? (
          <FeatureErrorBoundary featureName="Document Formatting">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading Formatting...</p>
                </div>
              }
            >
              <FormattingPanel />
            </Suspense>
          </FeatureErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to configure formatting</p>
          </div>
        );
      default:
        return (
          <FeatureErrorBoundary featureName="Dashboard">
            <EnhancedDashboard />
          </FeatureErrorBoundary>
        );
    }
  };

  // Wrap view with page turn transition
  return (
    <ViewTransition viewKey={currentView} variant="pageTurn" duration={0.4}>
      {renderView()}
    </ViewTransition>
  );
};

export default ViewSwitcher;
