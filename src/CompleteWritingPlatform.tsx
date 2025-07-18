import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import ClaudeAssistant from "./components/Claude/ClaudeAssistant";
import { useWritingPlatform } from "./context/WritingPlatformProvider";

import DashboardPanel from "./components/Panels/DashboardPanel";
import WritingPanel from "./components/Panels/WritingPanel";
import TimelinePanel from "./components/Panels/TimelinePanel";
import AnalysisPanel from "./components/Panels/AnalysisPanel";

// Types
export type ActiveView = "dashboard" | "writing" | "timeline" | "analysis";

interface PanelProps {
  onTextSelect: () => void;
  selectedText: string;
}

type Theme = "light" | "dark";

const CompleteWritingPlatform: React.FC = () => {
  const { activeView } = useWritingPlatform();
  const [selectedText, setSelectedText] = useState<string>("");
  const [theme, setTheme] = useState<Theme>("light");
  const [currentProject, setCurrentProject] = useState<string>("My First Project");

  // Load persisted theme & project on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedProject = localStorage.getItem("currentProject");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    }
    if (savedProject) setCurrentProject(savedProject);
  }, []);

  // Persist changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("currentProject", currentProject);
  }, [theme, currentProject]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText("");
    }
  };

  // Fixed theme toggle (explicitly add/remove class)
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Memoize props for WritingPanel (avoid re-renders)
  const panelProps: PanelProps = useMemo(
    () => ({
      onTextSelect: handleTextSelection,
      selectedText,
    }),
    [selectedText]
  );

  const renderPanel = () => {
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
      className={`h-screen w-screen flex flex-col ${theme === "dark" ? "dark" : ""}`}
      onMouseUp={handleTextSelection}
      onKeyUp={handleTextSelection}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentProject}</h1>
        <div className="flex items-center space-x-4">
          {/* Project Selector (Stub) */}
          <select
            value={currentProject}
            onChange={(e) => setCurrentProject(e.target.value)}
            className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="My First Project">My First Project</option>
            <option value="New Project (Placeholder)">New Project (Placeholder)</option>
          </select>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <Sidebar />
        </aside>
        <main
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4"
          role="region"
          aria-label="Main content area"
        >
          {renderPanel()}
        </main>
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span>Active View: {activeView}</span>
        <span>{selectedText ? `Selected: ${selectedText.length} chars` : "No selection"}</span>
      </footer>

      {/* Claude Assistant */}
      <ClaudeAssistant selectedText={selectedText} />
    </div>
  );
};

export default CompleteWritingPlatform;
