import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ClaudeAssistant from "./components/Claude/ClaudeAssistant";
import { useWritingPlatform } from "./context/WritingPlatformProvider";

import DashboardPanel from "./components/Panels/DashboardPanel";
import WritingPanel from "./components/Panels/WritingPanel";
import TimelinePanel from "./components/Panels/TimelinePanel";
import AnalysisPanel from "./components/Panels/AnalysisPanel";

// Panel props interface
interface PanelProps {
  onTextSelect?: () => void;
  selectedText?: string;
}

const CompleteWritingPlatform: React.FC = () => {
  const { activeView } = useWritingPlatform();
  const [selectedText, setSelectedText] = useState<string>("");

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText("");
    }
  };

  const renderPanel = () => {
    const panelProps: PanelProps = {
      onTextSelect: handleTextSelection,
      selectedText,
    };

    switch (activeView) {
      case "dashboard":
        return <DashboardPanel />;
      case "writing":
        return <WritingPanel {...panelProps} />;
      case "timeline":
        return <TimelinePanel />;
      case "analysis":
        return <AnalysisPanel />;
      default:
        return <div className="p-4">Unknown view: {activeView}</div>;
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
      onMouseUp={handleTextSelection}
      onKeyUp={handleTextSelection}
    >
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md overflow-y-auto">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto p-4">
          {renderPanel()}
        </main>
      </div>
      <ClaudeAssistant selectedText={selectedText} />
    </div>
  );
};

export default CompleteWritingPlatform;
