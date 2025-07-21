import React, { useMemo, useState, useCallback, useEffect } from "react";
import Sidebar from "./Sidebar";
import ClaudeAssistant from "./Claude/ClaudeAssistant";
import { useWritingPlatform, View } from "@/context/WritingPlatformProvider";
import { useClaude } from "@/context/ClaudeProvider";
import ToastManager from "./ui/ToastManager";

import DashboardPanel from "./Panels/DashboardPanel";
import WritingPanel from "./Panels/WritingPanel";
import TimelinePanel from "./Panels/TimelinePanel";
import AnalysisPanel from "./Panels/AnalysisPanel";

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

  useEffect(() => {
    return () => {
      debouncedHandleTextSelection.cancel?.();
    };
  }, [debouncedHandleTextSelection]);

  const handleInsertText = (text: string) => {
    const event = new CustomEvent("claude-insert-text", { detail: text });
    window.dispatchEvent(event);
  };

  const renderPanel = () => {
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
      case "analysis":
        return <AnalysisPanel />;
      default:
        return <DashboardPanel />;
    }
  };

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
            onChange={(e) => setCurrentProject(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#0073E6] focus:outline-none"
          >
            <option value="My First Project">My First Project</option>
            <option value="New Project (Placeholder)">New Project (Placeholder)</option>
          </select>

          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm hover:bg-gray-100 transition"
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <button
            onClick={toggleVisibility}
            className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium shadow-sm hover:bg-purple-700 transition"
          >
            {isVisible ? "Hide Claude" : "Show Claude"}
          </button>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
          <Sidebar />
        </aside>

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
        <ClaudeAssistant selectedText={selectedText} onInsertText={handleInsertText} />
      )}

      {/* Toast Notifications */}
      <ToastManager />
    </div>
  );
};

export default CompleteWritingPlatform;
