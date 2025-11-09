/**
 * Advanced Mode Toggle Component
 *
 * Allows users to enable/disable advanced AI features:
 * - Extended model selection
 * - Custom API key overrides
 */

import { Info } from 'lucide-react';
import React from 'react';

import { useAiPreferences } from '@/state/ai/aiPreferences';

interface AdvancedModeToggleProps {
  className?: string;
}

export const AdvancedModeToggle: React.FC<AdvancedModeToggleProps> = ({ className = '' }) => {
  const { advancedMode, setAdvancedMode } = useAiPreferences();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor="advanced-mode"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Advanced Mode
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
              Enables extended model selection and custom API key overrides
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="advanced-mode"
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => setAdvancedMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-inkwell-gold/20 dark:peer-focus:ring-inkwell-gold/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-inkwell-gold"></div>
        </label>
      </div>

      {advancedMode && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Advanced features enabled: Extended models and custom API keys are now available.
        </p>
      )}
    </div>
  );
};
