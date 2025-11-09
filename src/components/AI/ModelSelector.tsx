/**
 * Model Selector Component - Simplified Version
 *
 * Simple dropdown for selecting from curated AI models.
 * Baseline version with 7 models from 3 providers.
 */

import { Sparkles } from 'lucide-react';
import React from 'react';

import { getCuratedModels } from '@/ai/registry';

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  className = '',
}) => {
  const curatedModels = getCuratedModels();

  // Group models by provider
  const modelsByProvider = curatedModels.reduce(
    (acc, { provider, model }) => {
      if (!acc[provider.id]) {
        acc[provider.id] = { provider, models: [] };
      }
      acc[provider.id]!.models.push(model);
      return acc;
    },
    {} as Record<string, { provider: any; models: any[] }>,
  );

  const currentProviderModels = modelsByProvider[selectedProvider]?.models || [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => {
            const newProvider = e.target.value;
            onProviderChange(newProvider);
            // Auto-select first model of new provider
            const firstModel = modelsByProvider[newProvider]?.models[0];
            if (firstModel) {
              onModelChange(firstModel.id);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-inkwell-gold focus:border-transparent"
        >
          {Object.entries(modelsByProvider).map(([providerId, { provider }]) => (
            <option key={providerId} value={providerId}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-inkwell-gold focus:border-transparent"
        >
          {currentProviderModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
              {model.inputCost && ` - $${model.inputCost}/1M tokens`}
            </option>
          ))}
        </select>

        {/* Model Info */}
        {currentProviderModels.find((m) => m.id === selectedModel) && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm space-y-1">
            <p className="text-gray-700 dark:text-gray-300">
              {currentProviderModels.find((m) => m.id === selectedModel)?.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
              {currentProviderModels.find((m) => m.id === selectedModel)?.isFree && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Sparkles className="w-3 h-3" />
                  Free
                </span>
              )}
              <span>
                Context:{' '}
                {(
                  (currentProviderModels.find((m) => m.id === selectedModel)?.contextWindow || 0) /
                  1000
                ).toFixed(0)}
                K tokens
              </span>
              <span>
                Max output:{' '}
                {(
                  (currentProviderModels.find((m) => m.id === selectedModel)?.maxOutputTokens ||
                    0) / 1000
                ).toFixed(0)}
                K tokens
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
