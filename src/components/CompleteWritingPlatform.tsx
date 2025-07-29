import React, { useMemo, useState, useCallback, useEffect } from "react";
import Sidebar from "./Sidebar";
import ClaudeAssistant from "./ClaudeAssistant"; // Uses index.ts for clean import
import { useWritingPlatform, useClaude, View } from "@/context/AppContext";
import ToastManager from "./ui/ToastManager";

import DashboardPanel from "./Panels/DashboardPanel";
import WritingPanel from "./Panels/WritingPanel";
import TimelinePanel from "./Panels/TimelinePanel";

// Debounce utility to avoid unnecessary dependencies
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel?: () => void } {
  let timeoutId: ReturnType<typeof setTimeout>;
  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  } as T & { cancel?: () => void };
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
  return debounced;
}

const CompleteWritingPlatform: React.FC = () => {
  const { activeView, theme, toggleTheme, currentProject, setCurrentProject } =
    useWritingPlatform();
  const { isVisible, toggleVisibility } = useClaude();

  const [draftText, setDraftText] = useState<string>("");
  const [selectedText, setSelectedText] = useState<string>("");

  // Handle selection for Claude Assistant
  const updateSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText("");
    }
  }, []);

  const debouncedHandleTextSelection = useMemo(
    () => debounce(updateSelection, 150),
    [updateSelection]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedHandleTextSelection.cancel?.();
    };
  }, [debouncedHandleTextSelection]);

  // Handle text insertion from Claude
  const handleInsertText = useCallback((text: string) => {
    const event = new CustomEvent("claude-insert-text", { detail: text });
    window.dispatchEvent(event);
  }, []);

  // Renders the main panel based on the active view
  const renderPanel = useCallback(() => {
    switch (activeView as View) {
      case "dashboard":
        return <DashboardPanel />;
      case "writing":
        return (
          <WritingPanel
            draftText={draftText}
            onChangeText={setDraftText}
            onTextSelect={debouncedHandleTextSelection}
            selectedText={selectedText}
          />
        );
      case "timeline":
        return <TimelinePanel />;
      default:
        return <DashboardPanel />;
    }
  }, [activeView, draftText, selectedText, debouncedHandleTextSelection]);

  const handleProjectChange = useCallback(
    (newProject: string) => {
      setCurrentProject(newProject);
    },
    [setCurrentProject]
  );

  return (
    <div
      className={`h-screen w-screen flex flex-col ${
        theme === "dark" ? "dark bg-[#0A0F1C]" : "bg-[#F5F7FA]"
      }`}
      onMouseUp={debouncedHandleTextSelection}
      onKeyUp={debouncedHandleTextSelection}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0A0F1C] to-[#0073E6] text-white shadow-md">
        <h1 className="text-xl font-semibold tracking-wide">{currentProject}</h1>
        <div className="flex items-center space-x-4">
          <select
            value={currentProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#0073E6] focus:outline-none"
          >
            <option value="My First Project">My First Project</option>
            <option value="New Project (Placeholder)">
              New Project (Placeholder)
            </option>
          </select>

          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm hover:bg-gray-100 transition-colors"
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <button
            onClick={toggleVisibility}
            className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium shadow-sm hover:bg-purple-700 transition-colors"
          >
            {isVisible ? "Hide Claude" : "Show Claude"}
          </button>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto p-6 bg-[#0A0F1C] text-gray-200"
          role="region"
          aria-label="Main content area"
        >
          {renderPanel()}
        </main>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 bg-gray-900 border-t border-gray-700 text-sm text-gray-400 flex justify-between">
        <span>Active View: {activeView}</span>
        <span>
          {selectedText
            ? `Selected: ${selectedText.length} chars`
            : "No text selected"}
        </span>
      </footer>

      {/* Claude Assistant */}
      {isVisible && (
        <ClaudeAssistant
          selectedText={selectedText}
          onInsertText={handleInsertText}
        />
      )}

      {/* Toast Notifications */}
      <ToastManager />
    </div>
  );
};

export default CompleteWritingPlatform;
