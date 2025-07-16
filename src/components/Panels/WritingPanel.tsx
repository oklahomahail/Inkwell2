// src/components/Panels/WritingPanel.tsx
import React, { useState, useRef } from 'react';
import { useClaude } from '../../context/ClaudeProvider';

interface WritingPanelProps {
  onTextSelect?: () => void;
  selectedText?: string;
}

const WritingPanel: React.FC<WritingPanelProps> = ({ onTextSelect, selectedText }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestContinuation, improveText, isLoading } = useClaude();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleQuickAction = async (action: 'continue' | 'improve') => {
    if (!selectedText || isLoading) return;

    try {
      let result: string;
      
      if (action === 'continue') {
        result = await suggestContinuation(selectedText);
      } else {
        result = await improveText(selectedText);
      }

      // Insert the result at the current cursor position or replace selected text
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newContent = content.substring(0, start) + '\n\n' + result + '\n\n' + content.substring(end);
        setContent(newContent);
        
        // Move cursor to end of inserted text
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + result.length + 4, start + result.length + 4);
        }, 0);
      }
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return content.length;
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{getWordCount()} words</span>
            <span>{getCharacterCount()} characters</span>
          </div>
        </div>
        
        {/* Quick Actions Bar */}
        {selectedText && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Selected: "{selectedText.substring(0, 60)}..."
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickAction('continue')}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  <span>Continue</span>
                </button>
                <button
                  onClick={() => handleQuickAction('improve')}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  <span>Improve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Writing Area */}
      <div className="flex-1 flex">
        {/* Main Editor */}
        <div className="flex-1 p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onSelect={onTextSelect}
            placeholder="Start writing your story..."
            className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 text-lg leading-relaxed placeholder-gray-500 dark:placeholder-gray-400 font-serif"
            style={{ minHeight: 'calc(100vh - 200px)' }}
          />
        </div>

        {/* Sidebar - Writing Tools */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Writing Tools</h3>
          
          {/* Writing Stats */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statistics</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Words:</span>
                <span className="font-medium">{getWordCount()}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters:</span>
                <span className="font-medium">{getCharacterCount()}</span>
              </div>
              <div className="flex justify-between">
                <span>Paragraphs:</span>
                <span className="font-medium">{content.split('\n\n').filter(p => p.trim()).length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button 
                className="w-full text-left p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  // Focus the textarea and open Claude
                  textareaRef.current?.focus();
                }}
              >
                💡 Get Writing Ideas
              </button>
              <button 
                className="w-full text-left p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  // Save current work
                  console.log('Saving work...');
                }}
              >
                💾 Save Chapter
              </button>
              <button 
                className="w-full text-left p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  // Export options
                  console.log('Export options...');
                }}
              >
                📄 Export
              </button>
            </div>
          </div>

          {/* Writing Goals */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Goal</h4>
            <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-gray-600 dark:text-gray-400">{Math.min(getWordCount(), 500)}/500</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((getWordCount() / 500) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getWordCount() >= 500 ? '🎉 Goal achieved!' : `${500 - getWordCount()} words to go`}
              </p>
            </div>
          </div>

          {/* Recent Characters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Characters</h4>
            <div className="space-y-1 text-sm">
              <div className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 text-center italic">
                No characters yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPanel;