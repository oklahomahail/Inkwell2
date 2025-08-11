import React, { useState } from 'react';
import { FallbackEditor } from './FallbackEditor';

export const TipTapV3Test: React.FC = () => {
  const [content, setContent] = useState('Hello! Welcome to Inkwell. Try typing **bold** or *italic* text, or press F11 for focus mode.');
  const [wordCount, setWordCount] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Inkwell Writing Platform
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Phase 1 Editor - All core features working ✨
        </p>
      </div>
      
      <FallbackEditor
        content={content}
        onChange={setContent}
        onWordCountChange={setWordCount}
        placeholder="Start writing your story here..."
        wordCountGoal={100}
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stats Card */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📊 Writing Stats</h3>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Current word count: <span className="font-mono font-bold">{wordCount}</span> words
          </div>
        </div>

        {/* Features Card */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">✅ Phase 1 Features</h3>
          <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <li>✅ Word count with goals</li>
            <li>✅ Focus mode (F11)</li>
            <li>✅ Basic formatting</li>
            <li>✅ Auto-resize editor</li>
          </ul>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">🚀 Try These Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium mb-1">Formatting:</h4>
            <ul className="text-xs space-y-1">
              <li>• Type <code>**bold**</code> for bold text</li>
              <li>• Type <code>*italic*</code> for italic text</li>
              <li>• Type <code>## Heading</code> for headings</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Focus Mode:</h4>
            <ul className="text-xs space-y-1">
              <li>• Press <kbd>F11</kbd> to enter focus mode</li>
              <li>• Press <kbd>Esc</kbd> to exit focus mode</li>
              <li>• Distraction-free writing experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
