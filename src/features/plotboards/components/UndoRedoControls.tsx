// Undo/Redo controls component
// Provides visual undo/redo buttons and keyboard shortcut support

import React, { useEffect } from 'react';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription?: string;
  redoDescription?: string;
  onUndo: () => void;
  onRedo: () => void;
  isUndoing?: boolean;
  isRedoing?: boolean;
  className?: string;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  onUndo,
  onRedo,
  isUndoing = false,
  isRedoing = false,
  className = '',
}) => {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo && !isUndoing && !isRedoing) {
          onUndo();
        }
      }

      // Cmd/Ctrl + Shift + Z (or Cmd/Ctrl + Y) for redo
      if (
        ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) ||
        ((event.metaKey || event.ctrlKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo && !isUndoing && !isRedoing) {
          onRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo, isUndoing, isRedoing]);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo || isUndoing || isRedoing}
        className={`
          flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200
          ${
            canUndo && !isUndoing && !isRedoing
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
        title={
          undoDescription
            ? `Undo: ${undoDescription} (⌘Z)`
            : canUndo
              ? 'Undo (⌘Z)'
              : 'Nothing to undo'
        }
        aria-label={`Undo${undoDescription ? `: ${undoDescription}` : ''}`}
      >
        {isUndoing ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        )}
        <span className="ml-1 hidden sm:inline">Undo</span>
      </button>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        disabled={!canRedo || isUndoing || isRedoing}
        className={`
          flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200
          ${
            canRedo && !isUndoing && !isRedoing
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
        title={
          redoDescription
            ? `Redo: ${redoDescription} (⌘⇧Z)`
            : canRedo
              ? 'Redo (⌘⇧Z)'
              : 'Nothing to redo'
        }
        aria-label={`Redo${redoDescription ? `: ${redoDescription}` : ''}`}
      >
        {isRedoing ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
            />
          </svg>
        )}
        <span className="ml-1 hidden sm:inline">Redo</span>
      </button>
    </div>
  );
};

// History viewer component for debugging/advanced users
export const HistoryViewer: React.FC<{
  history: Array<{
    id: string;
    timestamp: Date;
    operation: string;
    description: string;
  }>;
  onJumpTo?: (historyId: string) => void;
  className?: string;
}> = ({ history, onJumpTo, className = '' }) => {
  if (history.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-4 ${className}`}>
        <p className="text-sm">No history available</p>
      </div>
    );
  }

  return (
    <div className={`max-h-64 overflow-y-auto ${className}`}>
      <div className="space-y-1">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            className={`
              flex items-center justify-between p-2 text-sm rounded
              ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
            `}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{entry.description}</span>
                {index === 0 && (
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {entry.timestamp.toLocaleTimeString()} - {entry.operation}
              </div>
            </div>

            {onJumpTo && index > 0 && (
              <button
                onClick={() => onJumpTo(entry.id)}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-100"
                title="Jump to this state"
              >
                Jump
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
