import React, { useState } from "react";
import { useClaude } from "../../context/ClaudeProvider"; // <- Relative import

interface ClaudeToolbarProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

const ClaudeToolbar: React.FC<ClaudeToolbarProps> = ({
  selectedText = "",
  onInsertText,
}) => {
  const {
    suggestContinuation,
    improveText,
    generatePlotIdeas,
    sendMessage,
  } = useClaude();

  const [lastResult, setLastResult] = useState<string>("");

  const handleSuggestContinuation = async (): Promise<void> => {
    const target = selectedText || "";
    if (!target) return;
    const result = await suggestContinuation(target);
    setLastResult(result);
    await sendMessage(`Claude continuation for: "${target.slice(0, 50)}..."`);
    await sendMessage(result);
  };

  const handleImproveText = async (): Promise<void> => {
    const target = selectedText || "";
    if (!target) return;
    const result = await improveText(
      target,
      "Make it flow naturally and tighten clarity."
    );
    setLastResult(result);
    await sendMessage(`Claude improved: "${target.slice(0, 50)}..."`);
    await sendMessage(result);
  };

  const handleGeneratePlotIdeas = async (): Promise<void> => {
    const result = await generatePlotIdeas(selectedText || "");
    setLastResult(result);
    await sendMessage("Claude plot ideas:");
    await sendMessage(result);
  };

  const handleInsert = (): void => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded shadow-sm">
      <button
        onClick={handleSuggestContinuation}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition"
      >
        Continue
      </button>
      <button
        onClick={handleImproveText}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 transition"
      >
        Improve
      </button>
      <button
        onClick={handleGeneratePlotIdeas}
        className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 transition"
      >
        Plot Ideas
      </button>
      {lastResult && onInsertText && (
        <button
          onClick={handleInsert}
          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 transition"
        >
          Insert
        </button>
      )}
    </div>
  );
};

export default ClaudeToolbar;
