import React, { useState } from 'react';
import { useClaude } from '@/context/ClaudeProvider';

interface ClaudeAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void; // New prop to push AI results into WritingPanel
}

const ClaudeAssistant: React.FC<ClaudeAssistantProps> = ({ selectedText = '', onInsertText }) => {
  const {
    messages,
    sendMessage,
    isLoading,
    toggleVisibility,
    suggestContinuation,
    improveText,
    generatePlotIdeas,
  } = useClaude();

  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<string>(''); // Track last AI output for insertion

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, { selectedText });
    setInput('');
  };

  // AI tool handlers
  const handleSuggestContinuation = async () => {
    const targetText = selectedText || messages[messages.length - 1]?.content || '';
    if (!targetText) return;
    const result = await suggestContinuation(targetText);
    setLastResult(result);
    await sendMessage(`Suggested continuation for: "${targetText.slice(0, 60)}..."`, {
      selectedText: targetText,
    });
    await sendMessage(result);
  };

  const handleImproveText = async () => {
    const targetText = selectedText || messages[messages.length - 1]?.content || '';
    if (!targetText) return;
    const result = await improveText(targetText, 'Make it flow naturally and tighten clarity.');
    setLastResult(result);
    await sendMessage(`Improved version of: "${targetText.slice(0, 60)}..."`, {
      selectedText: targetText,
    });
    await sendMessage(result);
  };

  const handleGeneratePlotIdeas = async () => {
    const result = await generatePlotIdeas(selectedText || '');
    setLastResult(result);
    await sendMessage('Here are some plot ideas:', { selectedText });
    await sendMessage(result);
  };

  const handleInsert = () => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
    }
  };

  return (
    <div
      aria-label="Claude AI assistant panel"
      className="fixed bottom-6 right-6 w-96 max-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 flex flex-col"
    >
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex justify-between">
        Claude Assistant
        <button onClick={toggleVisibility} className="text-red-500 hover:text-red-700 text-sm">
          ✕
        </button>
      </h2>

      {/* AI Tools */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={handleSuggestContinuation}
          className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
        >
          Suggest Continuation
        </button>
        <button
          onClick={handleImproveText}
          className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
        >
          Improve Text
        </button>
        <button
          onClick={handleGeneratePlotIdeas}
          className="flex-1 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
        >
          Plot Ideas
        </button>
        {lastResult && onInsertText && (
          <button
            onClick={handleInsert}
            className="flex-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
          >
            Insert into Draft
          </button>
        )}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm p-2 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && <p className="text-xs text-gray-500 italic">Thinking...</p>}
      </div>

      {/* Freeform Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          placeholder={selectedText ? `Ask about "${selectedText.slice(0, 20)}..."` : 'Ask Claude...'}
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ClaudeAssistant;
