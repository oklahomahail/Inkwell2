import React, { useEffect } from 'react';

const QuickActionsPanel: React.FC<{
  selectedText: string;
  onQuickAction: (action: string) => void;
  isLoading: boolean;
  lastResult: string;
  onInsert: () => void;
  onInsertText?: (text: string) => void;
  insertButtonRef: React.RefObject<HTMLButtonElement>;
}> = ({
  selectedText,
  onQuickAction,
  isLoading,
  lastResult,
  onInsert,
  onInsertText,
  insertButtonRef,
}) => {
  useEffect(() => {
    if (lastResult && onInsertText) {
      insertButtonRef.current?.focus();
    }
  }, [lastResult, onInsertText, insertButtonRef]);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onQuickAction('continue')}
          disabled={isLoading || !selectedText}
          className="px-3 py-2 text-xs text-gray-500 bg-[#0073E6] text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📝 Continue Text
        </button>
        <button
          onClick={() => onQuickAction('improve')}
          disabled={isLoading || !selectedText}
          className="px-3 py-2 text-xs text-gray-500 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ✨ Improve Text
        </button>
        <button
          onClick={() => onQuickAction('analyze-style')}
          disabled={isLoading || !selectedText}
          className="px-3 py-2 text-xs text-gray-500 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🎨 Analyze Style
        </button>
        <button
          onClick={() => onQuickAction('plot-ideas')}
          disabled={isLoading}
          className="px-3 py-2 text-xs text-gray-500 bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💡 Plot Ideas
        </button>
      </div>

      {!selectedText && (
        <div className="text-xs text-gray-500 text-gray-400 bg-gray-800 p-2 rounded">
          💡 Select text in your document to enable text-specific actions
        </div>
      )}

      {lastResult && onInsertText && (
        <div className="border border-gray-600 rounded p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500 font-medium text-[#0073E6]">
              Claude&apos;s Suggestion:
            </span>
            <button
              ref={insertButtonRef}
              onClick={onInsert}
              className="px-2 py-1 text-xs text-gray-500 bg-yellow-500 text-white rounded hover:bg-yellow-400 transition-colors focus:ring-2 focus:ring-yellow-300"
            >
              Insert
            </button>
          </div>
          <div className="text-xs text-gray-500 text-gray-300 max-h-20 overflow-y-auto whitespace-pre-wrap">
            {lastResult.slice(0, 200)}...
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsPanel;
