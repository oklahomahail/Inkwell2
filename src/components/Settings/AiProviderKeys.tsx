/**
 * AI Provider Keys Component
 *
 * Allows users to override environment-based API keys with their own
 * (Advanced Mode only)
 */

import { Eye, EyeOff, Check, X } from 'lucide-react';
import React, { useState } from 'react';

import { getApiKey, setUserApiKey, removeUserApiKey } from '@/ai/config';
import { providers } from '@/ai/registry';

interface ProviderKeyState {
  value: string;
  isVisible: boolean;
  isModified: boolean;
}

export const AiProviderKeys: React.FC = () => {
  const [providerKeys, setProviderKeys] = useState<Record<string, ProviderKeyState>>(() => {
    const initial: Record<string, ProviderKeyState> = {};
    providers.forEach((provider) => {
      initial[provider.id] = {
        value: getApiKey(provider.id) || '',
        isVisible: false,
        isModified: false,
      };
    });
    return initial;
  });

  const handleKeyChange = (providerId: string, value: string) => {
    setProviderKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId]!,
        value,
        isModified: true,
      },
    }));
  };

  const toggleVisibility = (providerId: string) => {
    setProviderKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId]!,
        isVisible: !prev[providerId]!.isVisible,
      },
    }));
  };

  const saveKey = (providerId: string) => {
    const state = providerKeys[providerId];
    if (!state) return;

    if (state.value.trim()) {
      setUserApiKey(providerId, state.value.trim());
    } else {
      removeUserApiKey(providerId);
    }

    setProviderKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId]!,
        isModified: false,
      },
    }));
  };

  const resetKey = (providerId: string) => {
    removeUserApiKey(providerId);
    setProviderKeys((prev) => ({
      ...prev,
      [providerId]: {
        value: getApiKey(providerId) || '',
        isVisible: false,
        isModified: false,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">API Key Overrides</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Override environment variables with your own API keys. Leave blank to use environment
          defaults.
        </p>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => {
          const state = providerKeys[provider.id];
          if (!state) return null;

          return (
            <div key={provider.id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {provider.name}
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={state.isVisible ? 'text' : 'password'}
                    value={state.value}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    placeholder={`Enter ${provider.name} API key`}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-inkwell-gold focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(provider.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={state.isVisible ? 'Hide API key' : 'Show API key'}
                  >
                    {state.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {state.isModified && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveKey(provider.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      aria-label="Save key"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => resetKey(provider.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      aria-label="Reset key"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {state.value && !state.isModified && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Key configured{' '}
                  {state.value.startsWith('sk-') ? '(using override)' : '(from environment)'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> API keys are stored in your browser's localStorage. For production
          use with sensitive keys, use environment variables instead.
        </p>
      </div>
    </div>
  );
};
