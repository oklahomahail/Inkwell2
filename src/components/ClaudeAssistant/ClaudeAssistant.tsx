import React, { useState, useRef, useEffect } from "react";
import { useClaude, useToast } from "@/context/AppContext";

interface ClaudeAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

type ActiveMode = "chat" | "quick-actions" | "analysis";

// Custom hook for keyboard tab switching
const useTabShortcuts = (
  activeMode: ActiveMode,
  setActiveMode: (mode: ActiveMode) => void,
  isMinimized: boolean
) => {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isMinimized && (e.ctrlKey || e.metaKey)) {
        const modes: ActiveMode[] = ["chat", "quick-actions", "analysis"];
        const currentIndex = modes.indexOf(activeMode);

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            setActiveMode(
              modes[currentIndex > 0 ? currentIndex - 1 : modes.length - 1]
            );
            break;
          case "ArrowRight":
            e.preventDefault();
            setActiveMode(
              modes[currentIndex < modes.length - 1 ? currentIndex + 1 : 0]
            );
            break;
          case "1":
            e.preventDefault();
            setActiveMode("chat");
            break;
          case "2":
            e.preventDefault();
            setActiveMode("quick-actions");
            break;
          case "3":
            e.preventDefault();
            setActiveMode("analysis");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeMode, isMinimized, setActiveMode]);
};

const ClaudeAssistant: React.FC<ClaudeAssistantProps> = ({
  selectedText = "",
  onInsertText,
}) => {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    toggleVisibility,
    clearMessages,
    suggestContinuation,
    improveText,
    generatePlotIdeas,
    analyzeCharacter,
    analyzeWritingStyle,
    brainstormIdeas,
  } = useClaude();

  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<ActiveMode>("chat");
  const [lastResult, setLastResult] = useState<string>("");
  const [characterName, setCharacterName] = useState("");
  const [brainstormTopic, setBrainstormTopic] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);

  // Enable tab keyboard shortcuts
  useTabShortcuts(activeMode, setActiveMode, isMinimized);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus chat input
  useEffect(() => {
    if (!isMinimized && activeMode === "chat") {
      inputRef.current?.focus();
    }
  }, [isMinimized, activeMode]);

  // Auto-focus "Insert" button when quick-action result appears
  useEffect(() => {
    if (lastResult && onInsertText) {
      insertButtonRef.current?.focus();
    }
  }, [lastResult, onInsertText]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    try {
      await sendMessage(input);
      setInput("");
    } catch {
      showToast("Failed to send message", "error");
    }
  };

  const handleQuickAction = async (action: string) => {
    if (isLoading) return;
    try {
      let result = "";
      let description = "";

      switch (action) {
        case "continue":
          if (!selectedText) {
            showToast("Please select some text to continue", "error");
            return;
          }
          result = await suggestContinuation(selectedText);
          description = `Continue text: "${selectedText.slice(0, 40)}..."`;
          break;
        case "improve":
          if (!selectedText) {
            showToast("Please select some text to improve", "error");
            return;
          }
          result = await improveText(selectedText);
          description = `Improve text: "${selectedText.slice(0, 40)}..."`;
          break;
        case "analyze-style":
          if (!selectedText) {
            showToast("Please select some text to analyze", "error");
            return;
          }
          result = await analyzeWritingStyle(selectedText);
          description = `Analyze style: "${selectedText.slice(0, 40)}..."`;
          break;
        case "plot-ideas":
          result = await generatePlotIdeas(selectedText);
          description = selectedText
            ? `Plot ideas for: "${selectedText.slice(0, 40)}..."`
            : "Generate plot ideas";
          break;
        case "character-analysis":
          if (!characterName.trim()) {
            showToast("Please enter a character name", "error");
            return;
          }
          result = await analyzeCharacter(characterName);
          description = `Analyze character: ${characterName}`;
          setCharacterName("");
          break;
        case "brainstorm":
          if (!brainstormTopic.trim()) {
            showToast("Please enter a topic to brainstorm", "error");
            return;
          }
          result = await brainstormIdeas(brainstormTopic);
          description = `Brainstorm: ${brainstormTopic}`;
          setBrainstormTopic("");
          break;
      }

      // Log the description + (truncated) result into chat
      await sendMessage(description);
      if (result) {
        const truncated =
          result.length > 500
            ? result.slice(0, 500) +
              "\n\n...(truncated - full text available for insertion)"
            : result;
        await sendMessage(truncated);
      }

      setLastResult(result);
      showToast("Claude provided suggestions", "success");
    } catch {
      showToast("Action failed. Please try again.", "error");
    }
  };

  const handleInsert = () => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
      showToast("Text inserted into your draft", "success");
      setLastResult("");
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-[#0073E6] text-white rounded-full shadow-2xl hover:bg-blue-500 transition-colors flex items-center justify-center"
          aria-label="Open Claude Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-2.319-.371l-6.104 2.103a.5.5 0 01-.65-.65l2.103-6.104A8.013 8.013 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-full bg-[#0F1522] border border-[#0073E6] rounded-xl shadow-2xl z-50 flex flex-col text-gray-100 max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-[#0073E6]">Claude</h2>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0073E6]"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            aria-label="Minimize"
          >
            —
          </button>
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            aria-label="Clear chat"
          >
            🗑️
          </button>
          <button
            onClick={toggleVisibility}
            className="text-red-400 hover:text-red-500 text-sm transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: "chat", label: "Chat", icon: "💬", shortcut: "1" },
          { id: "quick-actions", label: "Quick", icon: "⚡", shortcut: "2" },
          { id: "analysis", label: "Analysis", icon: "🔍", shortcut: "3" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as ActiveMode)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeMode === mode.id
                ? "bg-[#0073E6] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title={`${mode.label} (Ctrl+${mode.shortcut})`}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border-l-4 border-red-500 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Panel Rendering */}
      <div className="flex-1 overflow-hidden">
        {/* Chat Panel */}
        {activeMode === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <div className="mb-2">👋</div>
                  <p>Start a conversation with Claude!</p>
                  <p className="text-xs mt-1">
                    I have full context of your writing project.
                  </p>
                  <p className="text-xs mt-2 opacity-75">
                    💡 Tip: Use Ctrl+Enter to send messages
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-[#0073E6]/20 text-white ml-6"
                        : "bg-gray-700 text-gray-200 mr-6"
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1 font-medium">
                      {msg.role === "user" ? "You" : "Claude"}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    } else if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                  placeholder={
                    selectedText
                      ? `Ask about: "${selectedText.slice(0, 20)}..."`
                      : "Ask Claude about your writing... (Ctrl+Enter to send)"
                  }
                  className="flex-1 px-3 py-2 rounded-md bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50 transition-colors text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-[#0073E6] text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isLoading ? "..." : "Send"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions Panel */}
        {activeMode === "quick-actions" && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleQuickAction("continue")}
                disabled={isLoading || !selectedText}
                className="px-3 py-2 text-xs bg-[#0073E6] text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                📝 Continue Text
              </button>
              <button
                onClick={() => handleQuickAction("improve")}
                disabled={isLoading || !selectedText}
                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ✨ Improve Text
              </button>
              <button
                onClick={() => handleQuickAction("analyze-style")}
                disabled={isLoading || !selectedText}
                className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🎨 Analyze Style
              </button>
              <button
                onClick={() => handleQuickAction("plot-ideas")}
                disabled={isLoading}
                className="px-3 py-2 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💡 Plot Ideas
              </button>
            </div>

            {!selectedText && (
              <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                💡 Select text in your document to enable text-specific actions
              </div>
            )}

            {lastResult && onInsertText && (
              <div className="border border-gray-600 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-[#0073E6]">
                    Claude's Suggestion:
                  </span>
                  <button
                    ref={insertButtonRef}
                    onClick={handleInsert}
                    className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-400 transition-colors focus:ring-2 focus:ring-yellow-300"
                  >
                    Insert
                  </button>
                </div>
                <div className="text-xs text-gray-300 max-h-20 overflow-y-auto whitespace-pre-wrap">
                  {lastResult.slice(0, 200)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Panel */}
        {activeMode === "analysis" && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Character Analysis
              </label>
              <div className="flex gap-2">
                <input
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Character name..."
                  className="flex-1 px-2 py-1 text-xs rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
                <button
                  onClick={() => handleQuickAction("character-analysis")}
                  disabled={isLoading || !characterName.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  Analyze
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Brainstorm Ideas
              </label>
              <div className="flex gap-2">
                <input
                  value={brainstormTopic}
                  onChange={(e) => setBrainstormTopic(e.target.value)}
                  placeholder="Topic to explore..."
                  className="flex-1 px-2 py-1 text-xs rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
                <button
                  onClick={() => handleQuickAction("brainstorm")}
                  disabled={isLoading || !brainstormTopic.trim()}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  💭 Ideas
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
              🔍 Advanced analysis tools that understand your full project context
              <br />
              💡 Tip: Use Ctrl+← → to switch tabs, or Ctrl+1/2/3
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaudeAssistant;
