import React, { useState } from 'react';
import TipTapEditor from '@/components/Writing/TipTapEditor';

export const TipTapV3Test: React.FC = () => {
  const [content, setContent] = useState(
    '<p>Hello. Welcome to Inkwell. Try typing <strong>bold</strong> or <em>italic</em>, or add a heading.</p>',
  );
  const [wordCount, setWordCount] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Inkwell Writing Platform
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Phase 1 Editor</p>
      </div>

      <TipTapEditor
        value={content}
        onChange={setContent}
        onWordCountChange={setWordCount}
        placeholder="Start writing your story here..."
        className="rounded-lg border p-4 bg-white dark:bg-gray-900"
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Writing stats</h3>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Current word count: <span className="font-mono font-bold">{wordCount}</span>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Phase 1 features</h3>
          <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <li>Rich text with headings, bold, italic</li>
            <li>Live word count</li>
            <li>TipTap v3 core ready for scene integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
