// File: src/components/Panels/SettingsPanel.tsx - Enhanced Claude Setup
import { Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useState, useEffect, type ChangeEvent } from 'react';

import AiSettingsPanel from '@/components/AI/AiSettingsPanel';
import { PrivacyControls } from '@/components/Privacy/PrivacyControls';
import BackupControls from '@/components/Settings/BackupControls';
import SnapshotHistoryDialog from '@/components/Settings/SnapshotHistoryDialog';
import { TourReplayButton } from '@/components/Settings/TourReplayButton';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import claudeService from '@/services/claudeService';
import { phraseAnalysisService, DEFAULT_PHRASE_HYGIENE_SETTINGS } from '@/utils/textAnalysis';
import type { PhraseHygieneSettings } from '@/utils/textAnalysis';
import { triggerAiIntegrationConfigured } from '@/utils/tourTriggers';

const SettingsPanel: React.FC = () => {
  const { state, claudeActions, claude, currentProject } = useAppContext();
  const { showToast } = useToast();

  // API Key Management
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Claude Configuration
  const [claudeConfig, setClaudeConfig] = useState({
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1000,
    temperature: 0.7,
  });

  // App Settings
  const [appSettings, setAppSettings] = useState({
    autoSave: true,
    autoSaveInterval: 30,
    showWordCount: true,
    showReadingTime: true,
  });

  // Phrase Hygiene Settings
  const [phraseSettings, setPhraseSettings] = useState<PhraseHygieneSettings>(
    DEFAULT_PHRASE_HYGIENE_SETTINGS,
  );
  const [customPhraseInput, setCustomPhraseInput] = useState('');

  // Snapshots dialog
  const [openHistory, setOpenHistory] = useState(false);

  useEffect(() => {
    // Load Claude configuration if service is available
    try {
      const config = claudeService.getConfig?.();
      if (config) {
        setClaudeConfig({
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        });
      }
    } catch (_error) {
      console.warn('Could not load Claude configuration:', _error);
    }

    // Load phrase hygiene settings for current project
    if (currentProject) {
      const settings = phraseAnalysisService.getSettings(currentProject.id);
      setPhraseSettings(settings);
    }
  }, [currentProject]);

  const validateApiKey = (key: string): boolean => key.startsWith('sk-ant-') && key.length > 20;

  const handleApiKeyUpdate = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      showToast('Please enter an API key', 'error');
      return;
    }
    if (!validateApiKey(trimmed)) {
      showToast('Invalid API key format. Should start with "sk-ant-"', 'error');
      return;
    }
    setIsUpdatingKey(true);
    try {
      claudeActions.configureApiKey(trimmed);
      setApiKey('');
      showToast('Claude API key updated successfully!', 'success');

      // Fire tour trigger on AI integration configuration
      triggerAiIntegrationConfigured();
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Failed to update API key';
      showToast(errorMessage, 'error');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const handleClaudeConfigUpdate = () => {
    try {
      claudeService.updateConfig?.(claudeConfig);
      showToast('Claude configuration updated', 'success');
    } catch (error) {
      console.error('Failed to update Claude configuration:', error);
      showToast('Failed to update Claude configuration', 'error');
    }
  };

  const handleTestConnection = async () => {
    if (!claude.isConfigured) {
      showToast('Please configure your API key first', 'error');
      return;
    }
    setIsTestingConnection(true);
    try {
      await claudeActions.sendMessage(
        'Hello! This is a test message to verify the connection works properly.',
      );
      showToast('Connection test successful! Claude is ready to assist.', 'success');
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Connection test failed';
      showToast(`Connection test failed: ${errorMessage}`, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearMessages = () => {
    claudeActions.clearMessages();
    showToast('Claude conversation history cleared', 'success');
  };

  const handlePhraseSettingsUpdate = () => {
    if (!currentProject) {
      showToast('No project selected', 'error');
      return;
    }
    try {
      phraseAnalysisService.saveSettings(currentProject.id, phraseSettings);
      showToast('Phrase hygiene settings updated', 'success');
    } catch (error) {
      console.error('Failed to save phrase settings:', error);
      showToast('Failed to save phrase settings', 'error');
    }
  };

  const handleAddCustomPhrase = () => {
    if (!customPhraseInput.trim() || !currentProject) return;

    phraseAnalysisService.addToCustomStoplist(currentProject.id, customPhraseInput.trim());
    const updatedSettings = phraseAnalysisService.getSettings(currentProject.id);
    setPhraseSettings(updatedSettings);
    setCustomPhraseInput('');
    showToast(`Added "${customPhraseInput.trim()}" to stoplist`, 'success');
  };

  const handleRemoveCustomPhrase = (phrase: string) => {
    if (!currentProject) return;

    phraseAnalysisService.removeFromCustomStoplist(currentProject.id, phrase);
    const updatedSettings = phraseAnalysisService.getSettings(currentProject.id);
    setPhraseSettings(updatedSettings);
    showToast(`Removed "${phrase}" from stoplist`, 'success');
  };

  const handleExportSettings = () => {
    const settings = {
      claudeConfig,
      appSettings,
      phraseSettings: currentProject ? phraseSettings : null,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkwell-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Settings exported successfully', 'success');
  };

  const getConnectionStatus = () => {
    if (claude.error) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        text: 'Error',
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
      } as const;
    }
    if (claude.isLoading) {
      return {
        icon: (
          <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        ),
        text: 'Testing...',
        color: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
      } as const;
    }
    if (claude.isConfigured) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Connected',
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
      } as const;
    }
    return {
      icon: <Info className="w-5 h-5 text-gray-500" />,
      text: 'Not configured',
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
    } as const;
  };

  const status = getConnectionStatus();

  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold leading-tight text-white mb-2">Settings</h2>
          <p className="text-gray-400">
            Configure your writing environment and Claude AI assistant
          </p>
        </div>

        {/* Two-Tier AI Integration */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">AI Writing Companion</h3>
          <p className="text-gray-400 text-sm mb-6">
            Configure AI features for writing assistance, recommendations, and creative support.
          </p>
          <AiSettingsPanel />
        </div>

        {/* Claude AI Configuration */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Advanced: Direct Claude Integration
            </h3>
            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg border ${status.bg} ${status.border}`}
            >
              {status.icon}
              <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
            </div>
          </div>

          {/* Quick Setup Guide */}
          {!claude.isConfigured && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <h4 className="text-lg font-medium text-blue-200 mb-3">Quick Setup Guide</h4>
              <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
                <li>
                  Visit{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                  >
                    Anthropic Console
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Create a new API key (if you don't have one)</li>
                <li>Copy the API key and paste it below</li>
                <li>Click "Update" and test the connection</li>
              </ol>
            </div>
          )}

          {/* API Key Section */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
                {!claude.isConfigured && <span className="text-red-400 ml-1">*</span>}
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    placeholder={
                      claude.isConfigured ? 'Enter new API key to update...' : 'sk-ant-api03-...'
                    }
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    title={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleApiKeyUpdate}
                  disabled={!apiKey.trim() || isUpdatingKey}
                  className="px-4 py-2 bg-[#0073E6] text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isUpdatingKey && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isUpdatingKey ? 'Updating...' : 'Update'}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    console.anthropic.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                {apiKey && !validateApiKey(apiKey) && (
                  <p className="text-xs text-red-400">Invalid API key format</p>
                )}
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={!claude.isConfigured || isTestingConnection}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isTestingConnection && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleClearMessages}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Clear Chat History
              </button>
            </div>
          </div>

          {/* Connection Status Details */}
          {claude.error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-300">
                <strong>Error:</strong> {claude.error}
              </p>
            </div>
          )}

          {/* Claude Model Configuration */}
          <div className="border-t border-gray-600 pt-6">
            <h4 className="text-lg font-medium text-white mb-4">Model Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <select
                  value={claudeConfig.model}
                  onChange={(e) => setClaudeConfig({ ...claudeConfig, model: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                >
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-opus-4-20250514">Claude Opus 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={claudeConfig.maxTokens}
                  onChange={(e) =>
                    setClaudeConfig({
                      ...claudeConfig,
                      maxTokens: parseInt(e.target.value) || 1000,
                    })
                  }
                  min={100}
                  max={4000}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                <input
                  type="number"
                  value={claudeConfig.temperature}
                  onChange={(e) =>
                    setClaudeConfig({
                      ...claudeConfig,
                      temperature: parseFloat(e.target.value) || 0.7,
                    })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
              </div>
            </div>
            <button
              onClick={handleClaudeConfigUpdate}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              Update Configuration
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Application Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Auto-save</label>
                <p className="text-xs text-gray-500">Automatically save your work</p>
              </div>
              <input
                type="checkbox"
                checked={appSettings.autoSave}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAppSettings({ ...appSettings, autoSave: e.target.checked })
                }
                className="w-4 h-4 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
              />
            </div>

            {appSettings.autoSave && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-save interval (seconds)
                </label>
                <input
                  type="number"
                  value={appSettings.autoSaveInterval}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAppSettings({
                      ...appSettings,
                      autoSaveInterval: parseInt(e.target.value) || 30,
                    })
                  }
                  min={10}
                  max={300}
                  className="w-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Show word count</label>
                <p className="text-xs text-gray-500">Display word count in the editor</p>
              </div>
              <input
                type="checkbox"
                checked={appSettings.showWordCount}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, showWordCount: e.target.checked })
                }
                className="w-4 h-4 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Show reading time</label>
                <p className="text-xs text-gray-500">Display estimated reading time</p>
              </div>
              <input
                type="checkbox"
                checked={appSettings.showReadingTime}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, showReadingTime: e.target.checked })
                }
                className="w-4 h-4 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
              />
            </div>
          </div>
        </div>

        {/* Phrase Hygiene Settings */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Phrase Hygiene</h3>
          {!currentProject ? (
            <p className="text-gray-400 text-sm mb-4">
              Select a project to configure phrase detection settings.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Enable phrase detection
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically detect overused phrases in your writing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={phraseSettings.enabled}
                  onChange={(e) =>
                    setPhraseSettings({ ...phraseSettings, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
                />
              </div>

              {phraseSettings.enabled && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        N-gram sizes (word phrase lengths to check)
                      </label>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5].map((size) => (
                          <label key={size} className="flex items-center text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={phraseSettings.ngramSizes.includes(size)}
                              onChange={(e) => {
                                const newSizes = e.target.checked
                                  ? [...phraseSettings.ngramSizes, size].sort()
                                  : phraseSettings.ngramSizes.filter((s) => s !== size);
                                setPhraseSettings({ ...phraseSettings, ngramSizes: newSizes });
                              }}
                              className="mr-1 w-3 h-3 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
                            />
                            {size} words
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: "2 words" checks "very good", "3 words" checks "very good indeed"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Minimum occurrences
                        </label>
                        <input
                          type="number"
                          value={phraseSettings.minOccurrences}
                          onChange={(e) =>
                            setPhraseSettings({
                              ...phraseSettings,
                              minOccurrences: Math.max(1, parseInt(e.target.value) || 2),
                            })
                          }
                          min={1}
                          max={20}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Only flag phrases that appear this many times
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Severity thresholds (per 1000 words)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-yellow-400">Low</label>
                          <input
                            type="number"
                            value={phraseSettings.thresholds.low}
                            onChange={(e) =>
                              setPhraseSettings({
                                ...phraseSettings,
                                thresholds: {
                                  ...phraseSettings.thresholds,
                                  low: Math.max(0.1, parseFloat(e.target.value) || 0.5),
                                },
                              })
                            }
                            step={0.1}
                            min={0.1}
                            max={10}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-[#0073E6]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-orange-400">Medium</label>
                          <input
                            type="number"
                            value={phraseSettings.thresholds.medium}
                            onChange={(e) =>
                              setPhraseSettings({
                                ...phraseSettings,
                                thresholds: {
                                  ...phraseSettings.thresholds,
                                  medium: Math.max(0.1, parseFloat(e.target.value) || 1.0),
                                },
                              })
                            }
                            step={0.1}
                            min={0.1}
                            max={10}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-[#0073E6]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-red-400">High</label>
                          <input
                            type="number"
                            value={phraseSettings.thresholds.high}
                            onChange={(e) =>
                              setPhraseSettings({
                                ...phraseSettings,
                                thresholds: {
                                  ...phraseSettings.thresholds,
                                  high: Math.max(0.1, parseFloat(e.target.value) || 2.0),
                                },
                              })
                            }
                            step={0.1}
                            min={0.1}
                            max={10}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-[#0073E6]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Custom stoplist (phrases to ignore)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={customPhraseInput}
                          onChange={(e) => setCustomPhraseInput(e.target.value)}
                          placeholder="Enter phrase to ignore..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPhrase()}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                        />
                        <button
                          onClick={handleAddCustomPhrase}
                          disabled={!customPhraseInput.trim()}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {phraseSettings.customStoplist.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {phraseSettings.customStoplist.map((phrase, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                            >
                              {phrase}
                              <button
                                onClick={() => handleRemoveCustomPhrase(phrase)}
                                className="text-red-400 hover:text-red-300"
                                title={`Remove "${phrase}"`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Add phrases that should not be flagged as overused (e.g., character names,
                        specific terminology)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePhraseSettingsUpdate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
              >
                Save Phrase Settings
              </button>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Export & Backup</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Export Settings
                </button>
                {/* Full project backup controls */}
                <BackupControls />
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Snapshots & Version History
              </h4>
              <p className="text-sm text-gray-400 mb-2">
                Create restore points for your project and roll back if needed.
              </p>
              <Button onClick={() => setOpenHistory(true)}>Open Snapshot History</Button>
              <SnapshotHistoryDialog open={openHistory} onOpenChange={setOpenHistory} />
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Storage Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Claude Messages</span>
                  <span className="text-gray-300">{claude.messages.length} messages</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Projects</span>
                  <span className="text-gray-300">{state.projects.length} projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Analytics */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Privacy & Analytics</h3>
          <div className="text-gray-300">
            <PrivacyControls />
          </div>
        </div>

        {/* Help & Onboarding */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Help & Onboarding</h3>
          <p className="text-sm text-gray-400 mb-6">
            Replay the interactive tour or access help resources
          </p>
          <TourReplayButton />
        </div>

        {/* About */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">About Inkwell</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-[#0073E6]">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Build</span>
              <span className="text-gray-400">Development</span>
            </div>
            <div className="flex justify-between">
              <span>Claude API</span>
              <span className={claude.isConfigured ? 'text-green-400' : 'text-red-400'}>
                {claude.isConfigured ? 'Connected' : 'Not configured'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600 text-xs text-gray-500">
            <p>
              Inkwell is an AI-assisted writing platform built with React, TypeScript, and Tailwind
              CSS. It integrates with Claude AI to provide intelligent writing assistance.
            </p>
            <p className="mt-2">
              Your API key and writing data are stored locally in your browser. We don't collect or
              store any of your personal information.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://github.com/yourusername/inkwell"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition-colors inline-flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition-colors inline-flex items-center gap-1"
            >
              Claude API Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Claude Usage Tips */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Claude Usage Tips</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="text-[#0073E6] mt-0.5">💡</span>
              <div>
                <strong>Quick Actions:</strong> Select text in your document and use the Quick
                Actions tab for instant improvements and continuations.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#0073E6] mt-0.5">⚡</span>
              <div>
                <strong>Keyboard Shortcuts:</strong> Use Ctrl+1/2/3 to switch between Claude tabs,
                Ctrl+Enter to send messages.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#0073E6] mt-0.5">🎯</span>
              <div>
                <strong>Context Aware:</strong> Claude automatically receives context about your
                current project and selected text.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#0073E6] mt-0.5">🔒</span>
              <div>
                <strong>Privacy:</strong> Your API key is stored securely locally and only used to
                communicate with Anthropic servers.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#0073E6] mt-0.5">📊</span>
              <div>
                <strong>Rate Limits:</strong> The app automatically manages rate limiting to prevent
                API errors.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPanel;
