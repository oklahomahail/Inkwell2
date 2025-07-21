import React, { useState } from "react";
import DashboardPanel from "./Panels/DashboardPanel";
import TimelinePanel from "./Panels/TimelinePanel";
import WritingPanel from "./Panels/WritingPanel";
import ClaudeAssistant from "./Claude/ClaudeAssistant";

type PanelType = "dashboard" | "timeline" | "writing";

const AppContent: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>("dashboard");
  const [draftText, setDraftText] = useState<string>("");
  const [selectedText, setSelectedText] = useState<string>("");

  const handleTextSelect = (text: string) => {
    setSelectedText(text);
  };

  const handleInsertText = (newText: string) => {
    setDraftText((prev) => `${prev}\n${newText}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Tabs */}
      <nav className="flex justify-center space-x-6 p-4 bg-white dark:bg-gray-800 shadow-md">
        {["dashboard", "timeline", "writing"].map((panel) => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel as PanelType)}
            className={`px-4 py-2 rounded ${
              activePanel === panel
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            }`}
          >
            {panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </nav>

      {/* Active Panel */}
      <main className="flex-1 p-6">
        {activePanel === "dashboard" && <DashboardPanel />}
        {activePanel === "timeline" && <TimelinePanel />}
        {activePanel === "writing" && (
          <WritingPanel
            draftText={draftText}
            onChangeText={setDraftText}
            onTextSelect={() => handleTextSelect(draftText)}
            selectedText={selectedText}
          />
        )}
      </main>

      {/* Floating Claude Assistant (active across all panels) */}
      <ClaudeAssistant
        selectedText={selectedText}
        onInsertText={handleInsertText}
      />
    </div>
  );
};

export default AppContent;
