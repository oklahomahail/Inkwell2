import React, { useState } from "react";
import { useClaude } from "@/context/ClaudeProvider";
import { useToastContext } from "@/context/ToastContext";

interface ClaudeAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

const ClaudeAssistant: React.FC<ClaudeAssistantProps> = ({
  selectedText = "",
  onInsertText,
}) => {
  const {
    messages,
    sendMessage,
    isLoading,
    toggleVisibility,
    suggestContinuation,
    improveText,
    generatePlotIdeas,
  } = useClaude();

  const { showToast } = useToastContext();
  const [input, setInput] = useState("");
  const [lastResult, setLastResult] = useState<string>("");

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, { selectedText });
    setInput("");
  };

  const handleSuggestContinuation = async () => {
    const target = selectedText || messages[messages.length - 1]?.content || "";
    if (!target) return;
    const result = await suggestContinuation(target);
    setLastResult(result);
    await sendMessage(`Continuation suggestion for: "${target.slice(0, 60)}..."`);
    await sendMessage(result);
    showToast({ message: "Claude suggested a continuation", type: "info" });
  };

  const handleImproveText = async () => {
    const target = selectedText || messages[messages.length - 1]?.content || "";
    if (!target) return;
    const result = await improveText(
      target,
      "Make it flow naturally and improve clarity without losing style."
    );
    setLastResult(result);
    await sendMessage(`Improved version for: "${target.slice(0, 60)}..."`);
    await sendMessage(result);
    showToast({ message: "Claude improved your text", type: "success" });
  };

  const handleGeneratePlotIdeas = async () => {
    const result = await generatePlotIdeas(selectedText || "");
    setLastResult(result);
    await sendMessage("Here are some plot ideas:");
    await sendMessage(result);
    showToast({ message: "Claude generated plot ideas", type: "info" });
  };

  const handleInsert = () => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
      showToast({ message: "Text inserted into your draft", type: "success" });
    }
  };

  return (
    <div
      aria-label="Claude AI Assistant"
      className="fixed bottom-6 right-6 w-96 max-w-full bg-[#0F1522] border border-[#0073E6] rounded-xl shadow-2xl p-5 z-50 flex flex-col space-y-4 text-gray-100"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#0073E6]">Claude Assistant</h2>
        <button
          onClick={toggleVisibility}
          className="text-red-400 hover:text-red-500 text-sm"
        >
          ✕
        </button>
      </div>

      {/* AI Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSuggestContinuation}
          className="flex-1 px-3 py-1 text-xs bg-[#0073E6] text-white rounded hover:bg-blue-500 transition"
        >
          Continue
        </button>
        <button
          onClick={handleImproveText}
          className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 transition"
        >
          Improve
        </button>
        <button
          onClick={handleGeneratePlotIdeas}
          className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 transition"
        >
          Plot Ideas
        </button>
        {lastResult && onInsertText && (
          <button
            onClick={handleInsert}
            className="flex-1 px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-400 transition"
          >
            Insert
          </button>
        )}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto max-h-56 space-y-3 bg-[#1A2233] rounded p-3 border border-gray-700">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded text-sm ${
              msg.role === "user"
                ? "bg-[#0073E6]/20 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <p className="text-xs text-gray-400 italic">Claude is thinking…</p>
        )}
      </div>

      {/* User Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedText
              ? `Ask about: "${selectedText.slice(0, 20)}..."`
              : "Ask Claude something..."
          }
          className="flex-1 px-3 py-2 rounded-md bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-[#0073E6] text-white rounded hover:bg-blue-500 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ClaudeAssistant;
