/**
 * AI Model Settings Component
 *
 * UI for managing AI provider selection, API keys, and usage tracking.
 * Allows users to switch between providers and models, add API keys, and view usage stats.
 */

import {
  Settings,
  Key,
  TrendingUp,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { providers, getProvider } from '@/ai/registry';
import type { UserAISettings } from '@/ai/types';
import { aiService } from '@/services/aiService';
import { aiSettingsService } from '@/services/aiSettingsService';

export const AiModelSettings: React.FC<{ className?: string }> = ({ className }) => {
  const [settings, setSettings] = useState<UserAISettings>(aiSettingsService.getSettings());
  const [selectedProvider, setSelectedProvider] = useState(settings.defaultProvider);
  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({});

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = aiSettingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    // Load existing API keys (decrypted)
    const keys: Record<string, string> = {};
    providers.forEach((provider) => {
      const key = aiSettingsService.getApiKey(provider.id);
      if (key) {
        keys[provider.id] = key;
      }
    });
    setApiKeys(keys);

    return unsubscribe;
  }, []);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = getProvider(providerId);
    if (provider) {
      setSelectedModel(provider.defaultModel);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleSaveDefaults = () => {
    aiSettingsService.setDefaultProvider(selectedProvider, selectedModel);
  };

  const handleApiKeyChange = (providerId: string, key: string) => {
    setApiKeys({ ...apiKeys, [providerId]: key });
  };

  const handleSaveApiKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key) {
      aiSettingsService.removeApiKey(providerId);
      return;
    }

    aiSettingsService.setApiKey(providerId, key);

    // Test the key
    await handleTestProvider(providerId);
  };

  const handleTestProvider = async (providerId: string) => {
    setTesting(providerId);
    const result = await aiService.testProvider(providerId);
    setTestResults({ ...testResults, [providerId]: result });
    setTesting(null);
  };

  const handleToggleKeyVisibility = (providerId: string) => {
    setShowKeys({ ...showKeys, [providerId]: !showKeys[providerId] });
  };

  const currentProvider = getProvider(selectedProvider);
  const currentModel = currentProvider?.models.find((m) => m.id === selectedModel);

  const totalUsage = aiSettingsService.getTotalUsage();

  return (
    <div
      className={`bg-white dark:bg-inkwell-charcoal rounded-lg border border-gray-200 dark:border-inkwell-gold/20 ${className}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-inkwell-gold/20">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-inkwell-gold" />
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-white">
            AI Model Settings
          </h2>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Choose your AI provider and model. Add API keys to unlock premium models, or use free
          models without any keys.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-inkwell-gold focus:border-transparent"
          >
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.description}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-inkwell-gold focus:border-transparent"
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.isFree && '(Free)'}
                  {model.inputCost && ` - $${model.inputCost}/1M tokens`}
                </option>
              ))}
            </select>

            {/* Model Info */}
            {currentModel && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm space-y-1">
                <p className="text-gray-700 dark:text-gray-300">{currentModel.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {currentModel.isFree && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Sparkles className="w-3 h-3" />
                      Free
                    </span>
                  )}
                  <span>Context: {(currentModel.contextWindow / 1000).toFixed(0)}K tokens</span>
                  <span>
                    Max output: {(currentModel.maxOutputTokens / 1000).toFixed(0)}K tokens
                  </span>
                  {currentModel.supportsStreaming && <span>Streaming: Yes</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveDefaults}
          disabled={
            selectedProvider === settings.defaultProvider && selectedModel === settings.defaultModel
          }
          className="w-full px-4 py-2 bg-inkwell-gold hover:bg-inkwell-gold/90 text-inkwell-navy rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="inline w-4 h-4 mr-2" />
          Save as Default
        </button>

        {/* API Keys Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-inkwell-gold" />
            API Keys
          </h3>

          <div className="space-y-4">
            {providers
              .filter((p) => p.requiresKey)
              .map((provider) => {
                const hasKey = aiSettingsService.hasApiKey(provider.id);
                const testResult = testResults[provider.id];
                const isTesting = testing === provider.id;

                return (
                  <div
                    key={provider.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </span>
                      {hasKey && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Key saved
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id] || ''}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        placeholder={`Enter ${provider.name} API key`}
                        className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-inkwell-gold focus:border-transparent font-mono text-sm"
                      />
                      <button
                        onClick={() => handleToggleKeyVisibility(provider.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {testResult && (
                      <div
                        className={`flex items-start gap-2 text-sm ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {testResult.success ? (
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        )}
                        <span>
                          {testResult.success ? 'Key is valid' : testResult.error || 'Test failed'}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveApiKey(provider.id)}
                        disabled={!apiKeys[provider.id]}
                        className="flex-1 px-3 py-1.5 bg-inkwell-gold/10 hover:bg-inkwell-gold/20 text-inkwell-gold rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Key
                      </button>
                      <button
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={!apiKeys[provider.id] || isTesting}
                        className="flex-1 px-3 py-1.5 border border-inkwell-gold/30 hover:bg-inkwell-gold/10 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Key'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 dark:text-blue-300">
              API keys are encrypted and stored locally in your browser. They never leave your
              device.
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        {settings.preferences.trackUsage && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-inkwell-gold" />
              Usage Stats
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totalUsage.totalTokens / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Tokens</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalUsage.requestCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Requests</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totalUsage.promptTokens / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Input</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totalUsage.completionTokens / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Output</div>
              </div>
            </div>

            <button
              onClick={() => aiSettingsService.resetUsage()}
              className="mt-4 w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              Reset Stats
            </button>
          </div>
        )}

        {/* Preferences */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-white mb-4">
            Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences.autoFallback}
                onChange={(e) =>
                  aiSettingsService.updatePreferences({ autoFallback: e.target.checked })
                }
                className="w-4 h-4 text-inkwell-gold border-gray-300 rounded focus:ring-inkwell-gold"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Auto-fallback to free models
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Automatically use free models if your API key fails
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences.trackUsage}
                onChange={(e) =>
                  aiSettingsService.updatePreferences({ trackUsage: e.target.checked })
                }
                className="w-4 h-4 text-inkwell-gold border-gray-300 rounded focus:ring-inkwell-gold"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Track usage statistics
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Monitor token usage and request counts
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
