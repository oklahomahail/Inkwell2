import React, { useState } from "react";
import DashboardPanel from "@/components/Panels/DashboardPanel";
import TimelinePanel from "@/components/Panels/TimelinePanel";
import WritingPanel from "@/components/Panels/WritingPanel";
import ClaudeAssistant from "@/components/Claude/ClaudeAssistant";

type PanelType = "dashboard" | "timeline" | "writing";

const AppContent: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>("dashboard");
  const [selectedText, setSelectedText] = useState<string>("");

  const handleInsertText = (newText: string) => {
    // Dispatch a custom event so WritingPanel can handle text insertion
    const event = new CustomEvent("claude-insert-text", { detail: newText });
    window.dispatchEvent(event);
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
        {activePanel === "writing" && <WritingPanel draftText={""} onChangeText={function (value: string): void {
          throw new Error("Function not implemented.");
        } } onTextSelect={function (): void {
          throw new Error("Function not implemented.");
        } } selectedText={""} />}
      </main>

      {/* Floating Claude Assistant */}
      <ClaudeAssistant selectedText={selectedText} onInsertText={handleInsertText} />
    </div>
  );
};

export default AppContent;
