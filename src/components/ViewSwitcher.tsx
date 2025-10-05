// src/components/ViewSwitcher.tsx - Fixed
import React, { useState, useCallback } from 'react';

import { useAppContext, View } from '@/context/AppContext';

// Import enhanced components
import EnhancedDashboard from './Dashboard/EnhancedDashboard';
import AnalysisPanel from './Panels/AnalysisPanel';
import SettingsPanel from './Panels/SettingsPanel';
import TimelinePanel from './Panels/TimelinePanel';
import StoryPlanningView from './Views/StoryPlanningView';
import EnhancedWritingPanel from './Writing/EnhancedWritingPanel';

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
      return <EnhancedDashboard />;
    case View.Writing:
      return <EnhancedWritingPanel />;
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
