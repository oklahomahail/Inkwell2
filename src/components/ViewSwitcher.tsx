// src/components/ViewSwitcher.tsx - Fixed
import React, { useState, useCallback } from 'react';
import AnalysisPanel from './Panels/AnalysisPanel';
import DashboardPanel from './Panels/DashboardPanel';
import SettingsPanel from './Panels/SettingsPanel';
import TimelinePanel from './Panels/TimelinePanel';
import WritingPanel from './Panels/WritingPanel';
import StoryPlanningView from './Views/StoryPlanningView';
import { useAppContext, View } from '@/context/AppContext';

const ViewSwitcher: React.FC = () => {
  const { state, currentProject, updateProject } = useAppContext();
  const [selectedText, setSelectedText] = useState('');

  // Get current project content or default
  const draftText = currentProject?.content || '';

  // Handle text changes and save to current project
  const handleTextChange = useCallback(
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
  const handleTextSelect = useCallback(() => {
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      const selected = selection?.toString() || '';
      setSelectedText(selected);
    }
  }, []);

  const currentView = state.view;

  switch (currentView) {
    case View.Dashboard:
      return <DashboardPanel />;
    case View.Writing:
      return (
        <WritingPanel
          draftText={draftText}
          onChangeText={handleTextChange}
          onTextSelect={handleTextSelect}
          selectedText={selectedText}
        />
      );
    case View.Timeline:
      return <TimelinePanel />;
    case View.Analysis:
      return <AnalysisPanel />;
    // ✅ ADD THIS NEW CASE
    case View.Planning:
      return <StoryPlanningView />;
    case View.Settings:
      return <SettingsPanel />;
    default:
      return <DashboardPanel />;
  }
};

export default ViewSwitcher;
