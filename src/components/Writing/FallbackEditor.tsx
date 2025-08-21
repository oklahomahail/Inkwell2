// src/components/Writing/FallbackEditor.tsx
import React, { useState, useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';

interface FallbackEditorProps {
  content: string;
  onChange: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  className?: string;
  wordCountGoal?: number;
}

export const FallbackEditor: React.FC<FallbackEditorProps> = ({
  content,
  onChange,
  onWordCountChange,
  placeholder = 'Start writing your scene...',
  className,
  wordCountGoal = 0,
}) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showWordCount, setShowWordCount] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert HTML content to plain text for textarea
  const htmlToText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Convert plain text to simple HTML
  const textToHtml = (text: string): string => {
    return text
      .split('\n\n')
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  const [textContent, setTextContent] = useState(htmlToText(content));

  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const wordCount = countWords(textContent);
  const characterCount = textContent.length;
  const goalProgress = wordCountGoal > 0 ? (wordCount / wordCountGoal) * 100 : 0;

  useEffect(() => {
    onWordCountChange?.(wordCount);
  }, [wordCount, onWordCountChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);
    onChange(textToHtml(newText));
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'F11' ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F')
      ) {
        event.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Format text functions
  const formatText = (type: 'bold' | 'italic' | 'heading') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textContent.substring(start, end);

    let replacement = '';
    switch (type) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'heading':
        replacement = `## ${selectedText}`;
        break;
    }

    const newText = textContent.substring(0, start) + replacement + textContent.substring(end);
    setTextContent(newText);
    onChange(textToHtml(newText));

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      {!isFocusMode && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => formatText('bold')}
                className="px-3 py-1 rounded text-sm font-bold bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border transition-colors"
                title="Bold (add **text**)"
              >
                B
              </button>
              <button
                onClick={() => formatText('italic')}
                className="px-3 py-1 rounded text-sm italic bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border transition-colors"
                title="Italic (add *text*)"
              >
                I
              </button>
              <button
                onClick={() => formatText('heading')}
                className="px-3 py-1 rounded text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border transition-colors"
                title="Heading (add ## text)"
              >
                H2
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
              Tip: Use **bold**, *italic*, ## heading for formatting
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWordCount(!showWordCount)}
              className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              📊 {showWordCount ? 'Hide' : 'Show'} Stats
            </button>
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Focus mode (F11)"
            >
              🎯 Focus Mode
            </button>
          </div>
        </div>
      )}

      {/* Focus Mode Exit Button */}
      {isFocusMode && (
        <button
          onClick={() => setIsFocusMode(false)}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-gray-900/90 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors backdrop-blur shadow-lg"
          title="Exit focus mode (Esc)"
        >
          ← Exit Focus
        </button>
      )}

      {/* Editor Container */}
      <div
        className={cn(
          'transition-all duration-300',
          isFocusMode
            ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-8 overflow-y-auto'
            : 'relative',
        )}
      >
        <textarea
          ref={textareaRef}
          value={textContent}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={cn(
            'w-full min-h-[400px] p-4 border rounded-lg resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'font-mono text-base leading-relaxed',
            isFocusMode && 'max-w-4xl mx-auto pt-16 border-none focus:ring-0 bg-transparent',
          )}
          style={{
            lineHeight: '1.6',
            fontSize: isFocusMode ? '1.125rem' : '1rem',
          }}
        />
      </div>

      {/* Word Count Display */}
      {showWordCount && !isFocusMode && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span>📝</span>
                <span className="font-medium">{wordCount} words</span>
              </div>
              <div>{characterCount} characters</div>
              {wordCountGoal > 0 && (
                <div className="flex items-center space-x-2">
                  <span>🎯 Goal: {wordCountGoal}</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        goalProgress >= 100 ? 'bg-green-500' : 'bg-blue-500',
                      )}
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      goalProgress >= 100
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400',
                    )}
                  >
                    {Math.round(goalProgress)}%{goalProgress >= 100 && ' ✅'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Stats */}
      {showWordCount && isFocusMode && (
        <div className="fixed bottom-6 right-6 z-60 bg-gray-900/90 text-white px-4 py-3 rounded-lg text-sm backdrop-blur shadow-lg">
          <div className="flex items-center space-x-3">
            <span>📝 {wordCount} words</span>
            {wordCountGoal > 0 && (
              <>
                <span className="opacity-60">|</span>
                <span className="opacity-75">
                  🎯 {Math.round(goalProgress)}% of goal
                  {goalProgress >= 100 && ' ✅'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Formatting Help */}
      {!isFocusMode && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          💡 Temporary fallback editor while TipTap is being fixed. Use **bold**, *italic*, ##
          heading for basic formatting.
        </div>
      )}
    </div>
  );
};
