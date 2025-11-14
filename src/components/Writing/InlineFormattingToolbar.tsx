/**
 * InlineFormattingToolbar - Inline writing formatting controls
 *
 * Provides quick access to formatting controls directly in the writing panel:
 * - Font family and size selection
 * - Line spacing controls
 * - Indentation controls
 * - Scene separator insertion
 *
 * Unlike FormattingPanel which provides project-level defaults, this toolbar
 * provides per-session visual formatting that doesn't modify the stored text.
 */

import { Type, IndentIncrease, IndentDecrease, Asterisk, RotateCcw } from 'lucide-react';
import React from 'react';

import { useFormatting } from '@/context/FormattingContext';
import { AVAILABLE_FONTS } from '@/types/formatting';

interface InlineFormattingToolbarProps {
  onInsertSceneSeparator: () => void;
  className?: string;
}

export const InlineFormattingToolbar: React.FC<InlineFormattingToolbarProps> = ({
  onInsertSceneSeparator,
  className = '',
}) => {
  const { formatting, setFormatting, resetFormatting } = useFormatting();

  // Quick font size options
  const fontSizeOptions = [
    { label: '14px', value: 0.875 },
    { label: '16px', value: 1.0 },
    { label: '18px', value: 1.125 },
    { label: '20px', value: 1.25 },
    { label: '22px', value: 1.375 },
  ];

  // Line spacing options
  const lineHeightOptions = [
    { label: '1.0', value: 1.0 },
    { label: '1.15', value: 1.15 },
    { label: '1.5', value: 1.5 },
    { label: '2.0', value: 2.0 },
  ];

  const handleIncreaseIndent = () => {
    const currentIndent = formatting.firstLineIndent ?? 0;
    setFormatting({ firstLineIndent: Math.min(currentIndent + 0.5, 3) });
  };

  const handleDecreaseIndent = () => {
    const currentIndent = formatting.firstLineIndent ?? 0;
    setFormatting({ firstLineIndent: Math.max(currentIndent - 0.5, 0) });
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 ${className}`}
    >
      {/* Font Family */}
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <select
          value={formatting.fontFamily}
          onChange={(e) => setFormatting({ fontFamily: e.target.value })}
          className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          title="Font family"
        >
          {AVAILABLE_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <select
        value={formatting.fontSize}
        onChange={(e) => setFormatting({ fontSize: Number(e.target.value) })}
        className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
        title="Font size"
      >
        {fontSizeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Line Spacing */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-600 dark:text-slate-400">Spacing:</span>
        <select
          value={formatting.lineHeight}
          onChange={(e) => setFormatting({ lineHeight: Number(e.target.value) })}
          className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          title="Line spacing"
        >
          {lineHeightOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

      {/* Indent Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDecreaseIndent}
          disabled={(formatting.firstLineIndent ?? 0) <= 0}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Decrease indent"
        >
          <IndentDecrease className="w-4 h-4" />
        </button>
        <button
          onClick={handleIncreaseIndent}
          disabled={(formatting.firstLineIndent ?? 0) >= 3}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Increase indent"
        >
          <IndentIncrease className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

      {/* Scene Separator */}
      <button
        onClick={onInsertSceneSeparator}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        title="Insert scene separator"
      >
        <Asterisk className="w-4 h-4" />
        <span>Scene Break</span>
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

      {/* Reset Button */}
      <button
        onClick={resetFormatting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors ml-auto"
        title="Reset formatting to defaults"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset</span>
      </button>
    </div>
  );
};
