/**
 * AIDisclosureSection Component
 *
 * Provides a UI section for export dialogs that allows authors to optionally include
 * an AI assistance disclosure statement in their exported work.
 *
 * Features:
 * - Optional checkbox to enable/disable
 * - Three style options (short, process-focused, formal)
 * - Two placement options (front matter, back matter)
 * - Live preview of selected statement
 * - Preferences automatically persist to localStorage
 * - Full accessibility support (keyboard navigation, ARIA labels)
 *
 * @see docs/features/ai-disclosure.md
 */
import React from 'react';

import {
  ExportAIDisclosure,
  AIDisclosureStyle,
  AIDisclosurePlacement,
  getDisclosureText,
} from '@/types/aiDisclosure';

interface AIDisclosureSectionProps {
  /** Current disclosure configuration */
  value: ExportAIDisclosure;
  /** Callback when configuration changes */
  onChange: (value: ExportAIDisclosure) => void;
  /** Whether the section should be disabled (e.g., during export) */
  disabled?: boolean;
}

export const AIDisclosureSection: React.FC<AIDisclosureSectionProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleToggleEnabled = () => {
    onChange({
      ...value,
      enabled: !value.enabled,
    });
  };

  const handleStyleChange = (style: AIDisclosureStyle) => {
    onChange({
      ...value,
      style,
    });
  };

  const handlePlacementChange = (placement: AIDisclosurePlacement) => {
    onChange({
      ...value,
      placement,
    });
  };

  const previewText = getDisclosureText(value.style);

  return (
    <section className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            AI assistance statement
          </h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Optional, project-level note about how AI was used. You can remove or edit this after
            export if you prefer.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            checked={value.enabled}
            onChange={handleToggleEnabled}
            disabled={disabled}
            aria-label="Include AI assistance statement in export"
          />
          <span>Include in export</span>
        </label>
      </div>

      <div
        className={`mt-4 space-y-4 transition-opacity ${
          value.enabled ? 'opacity-100' : 'opacity-40'
        } ${disabled || !value.enabled ? 'pointer-events-none' : ''}`}
        aria-hidden={!value.enabled}
      >
        {/* Style selection */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Style</p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="AI disclosure statement style"
          >
            <StyleChip
              label="Short"
              selected={value.style === 'short'}
              onClick={() => handleStyleChange('short')}
              disabled={!value.enabled}
            />
            <StyleChip
              label="Process-focused"
              selected={value.style === 'process'}
              onClick={() => handleStyleChange('process')}
              disabled={!value.enabled}
            />
            <StyleChip
              label="Formal"
              selected={value.style === 'formal'}
              onClick={() => handleStyleChange('formal')}
              disabled={!value.enabled}
            />
          </div>
        </div>

        {/* Placement selection */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Placement</p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="AI disclosure statement placement"
          >
            <PlacementChip
              label="Front matter or title page"
              value="front"
              selected={value.placement === 'front'}
              onClick={() => handlePlacementChange('front')}
              disabled={!value.enabled}
            />
            <PlacementChip
              label="Back matter or acknowledgements"
              value="back"
              selected={value.placement === 'back'}
              onClick={() => handlePlacementChange('back')}
              disabled={!value.enabled}
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</p>
          <div
            className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3"
            role="region"
            aria-label="Preview of AI disclosure statement"
          >
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
              {previewText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface StyleChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const StyleChip: React.FC<StyleChipProps> = ({ label, selected, onClick, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </button>
  );
};

interface PlacementChipProps {
  label: string;
  value: AIDisclosurePlacement;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const PlacementChip: React.FC<PlacementChipProps> = ({
  label,
  selected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </button>
  );
};
