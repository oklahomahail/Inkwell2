// src/components/Writing/TipTapWithTypes.tsx
import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

// Import TipTap and add basic type definitions
const TipTap = require('@tiptap/react');
const StarterKit = require('@tiptap/starter-kit');

// Basic type definitions for what we need
interface TipTapEditor {
  getHTML: () => string;
  commands: {
    setContent: (content: string) => any;
    focus: () => any;
    toggleBold: () => any;
    toggleItalic: () => any;
    toggleHeading: (options: { level: number }) => any;
    toggleBulletList: () => any;
    toggleBlockquote: () => any;
  };
  chain: () => any;
  isActive: (type: string, options?: any) => boolean;
}

interface UseEditorOptions {
  extensions: any[];
  content: string;
  onUpdate: ({ editor }: { editor: TipTapEditor }) => void;
  editorProps?: any;
  immediatelyRender?: boolean;
}

// Extract the functions we need with proper typing
const { useEditor, EditorContent }: {
  useEditor: (options: UseEditorOptions) => TipTapEditor | null;
  EditorContent: React.ComponentType<{ editor: TipTapEditor | null; className?: string }>;
} = TipTap;

interface TipTapWithTypesProps {
  content: string;
  onChange: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  className?: string;
  wordCountGoal?: number;
}

// Simple word count function
const countWords = (text: string): number => {
  const div = document.createElement('div');
  div.innerHTML = text;
  const plainText = div.textContent || div.innerText || '';
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const TipTapWithTypes: React.FC<TipTapWithTypesProps> = ({
  content,
  onChange,
  onWordCountChange,
  placeholder = "Start writing your scene...",
  className,
  wordCountGoal = 0,
}) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showWordCount, setShowWordCount] = useState(true);
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit.default || StarterKit],
    content: content || `<p>${placeholder}</p>`,
    onUpdate: ({ editor }: { editor: TipTapEditor }) => {
      const htmlContent = editor.getHTML();
      const currentWordCount = countWords(htmlContent);
      
      setWordCount(currentWordCount);
      onChange(htmlContent);
      onWordCountChange?.(currentWordCount);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
          'prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
          'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-em:text-gray-700 dark:prose-em:text-gray-300',
          'prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20',
          'prose-ul:text-gray-700 dark:prose-ul:text-gray-300',
          'prose-ol:text-gray-700 dark:prose-ol:text-gray-300',
          'min-h-[400px] p-4'
        ),
        placeholder,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update word count when editor changes
  useEffect(() => {
    if (editor) {
      const currentWordCount = countWords(editor.getHTML());
      setWordCount(currentWordCount);
      onWordCountChange?.(currentWordCount);
    }
  }, [editor, onWordCountChange]);

  // Focus mode keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11' || ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F')) {
        event.preventDefault();
        setIsFocusMode(prev => !prev);
      }
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading TipTap editor...</p>
        </div>
      </div>
    );
  }

  const characterCount = editor.getHTML().length;
  const goalProgress = wordCountGoal > 0 ? (wordCount / wordCountGoal) * 100 : 0;

  return (
    <div className={cn("relative", className)}>
      {/* Success Message */}
      <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
        🎉 TipTap v3 with proper TypeScript types!
      </div>

      {/* Editor Toolbar */}
      {!isFocusMode && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "px-3 py-1 rounded text-sm font-bold transition-colors",
                  editor.isActive('bold')
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border"
                )}
                title="Bold (Ctrl+B)"
              >
                B
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "px-3 py-1 rounded text-sm italic transition-colors",
                  editor.isActive('italic')
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border"
                )}
                title="Italic (Ctrl+I)"
              >
                I
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors",
                  editor.isActive('heading', { level: 2 })
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border"
                )}
                title="Heading 2 (Type ##)"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors",
                  editor.isActive('bulletList')
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border"
                )}
                title="Bullet List (Type -)"
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors",
                  editor.isActive('blockquote')
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border"
                )}
                title="Quote (Type >)"
              >
                " Quote
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
              TipTap v3 with Types! Type ## for heading, - for list
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWordCount(!showWordCount)}
              className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Toggle word count"
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

      {/* Focus Mode Toggle */}
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
          "transition-all duration-300",
          isFocusMode
            ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-8 overflow-y-auto"
            : "relative border rounded-lg bg-white dark:bg-gray-900"
        )}
      >
        <EditorContent
          editor={editor}
          className={cn(
            "focus-within:outline-none",
            isFocusMode && "max-w-4xl mx-auto pt-16"
          )}
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
                        "h-full transition-all duration-300",
                        goalProgress >= 100 ? "bg-green-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    goalProgress >= 100 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                  )}>
                    {Math.round(goalProgress)}%
                    {goalProgress >= 100 && " ✅"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Word Count */}
      {showWordCount && isFocusMode && (
        <div className="fixed bottom-6 right-6 z-60 bg-gray-900/90 text-white px-4 py-3 rounded-lg text-sm backdrop-blur shadow-lg">
          <div className="flex items-center space-x-3">
            <span>📝 {wordCount} words</span>
            {wordCountGoal > 0 && (
              <>
                <span className="opacity-60">|</span>
                <span className="opacity-75">
                  🎯 {Math.round(goalProgress)}% of goal
                  {goalProgress >= 100 && " ✅"}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};