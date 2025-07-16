// src/CompleteWritingPlatform.tsx
import React, { useState } from 'react';
import { useWritingPlatform } from './context/WritingPlatformProvider';
import ClaudeAssistant from './components/Claude/ClaudeAssistant';

// Panels
import DashboardPanel from './components/Panels/DashboardPanel';
import WritingPanel from './components/Panels/WritingPanel';
import TimelinePanel from './components/Panels/TimelinePanel';
import AnalysisPanel from './components/Panels/AnalysisPanel';

// Common props interface for panels
interface PanelProps {
  onTextSelect?: () => void;
  selectedText?: string;
}

const CompleteWritingPlatform: React.FC = () => {
  const { activeView } = useWritingPlatform();
  const [selectedText, setSelectedText] = useState<string>('');

  // Handle text selection for Claude integration
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText('');
    }
  };

  const renderPanel = () => {
    const panelProps: PanelProps = {
      onTextSelect: handleTextSelection,
      selectedText
    };

    switch (activeView) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'writing':
        return <WritingPanel {...panelProps} />;
      case 'timeline':
        return <TimelinePanel />;
      case 'analysis':
        return <AnalysisPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <main 
      className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"
      onMouseUp={handleTextSelection}
      onKeyUp={handleTextSelection}
    >
      {renderPanel()}
      <ClaudeAssistant selectedText={selectedText} />
    </main>
  );
};

export default CompleteWritingPlatform;