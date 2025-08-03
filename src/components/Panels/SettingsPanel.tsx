// src/components/Panels/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import claudeService from '@/services/claudeService';

const SettingsPanel: React.FC = () => {
  const { state, claudeActions, claude } = useAppContext();
  const { showToast } = useToast();

  // API Key Management
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

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
    darkMode: state.theme === 'dark',
    showWordCount: true,
    showReadingTime: true,
  });

  useEffect(() => {
    // Load Claude configuration if service is available
    try {
      const config = claudeService.getConfig();
      setClaudeConfig({
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      });
    } catch (error) {
      console.warn('Could not load Claude configuration:', error);
    }
  }, []);

  const handleApiKeyUpdate = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter a valid API key', 'error');
      return;
    }

    setIsUpdatingKey(true);
    try {
      claudeActions.configureApiKey(apiKey.trim());
      setApiKey('');
      showToast('Claude API key updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update API key', 'error');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const handleClaudeConfigUpdate = () => {
    try {
      claudeService.updateConfig(claudeConfig);
      showToast('Claude configuration updated', 'success');
    } catch (error) {
      showToast('Failed to update Claude configuration', 'error');
    }
  };

  const handleTestConnection = async () => {
    if (!claude.isConfigured) {
      showToast('Please configure your API key first', 'error');
      return;
    }

    try {
      await claudeActions.sendMessage('Hello! This is a test message to verify the connection.');
      showToast('Connection test successful!', 'success');
    } catch (error) {
      showToast('Connection test failed. Please check your API key.', 'error');
    }
  };

  const handleClearMessages = () => {
    claudeActions.clearMessages();
    showToast('Claude conversation history cleared', 'success');
  };

  const handleExportSettings = () => {
    const settings = {
      claudeConfig,
      appSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkwell-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Settings exported successfully', 'success');
  };

  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold leading-tight font-bold text-white mb-2">
            Settings
          </h2>
          <p className="text-gray-400">
            Configure your writing environment and Claude AI assistant
          </p>
        </div>

        {/* Claude AI Configuration */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-white">
              Claude AI Assistant
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  claude.isConfigured ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-sm text-gray-600 text-gray-400">
                {claude.isConfigured ? 'Connected' : 'Not configured'}
              </span>
            </div>
          </div>

          {/* API Key Section */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      claude.isConfigured ? 'Enter new API key to update...' : 'sk-ant-api03-...'
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6] transition-colors"
                  />
                  <p className="text-xs text-gray-500 text-gray-500 mt-1">
                    Get your API key from{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      console.anthropic.com
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? '👁️‍🗨️' : '👁️'}
                </button>
                <button
                  onClick={handleApiKeyUpdate}
                  disabled={!apiKey.trim() || isUpdatingKey}
                  className="px-4 py-2 bg-[#0073E6] text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingKey ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={!claude.isConfigured}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test Connection
              </button>
              <button
                onClick={handleClearMessages}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Clear Chat History
              </button>
            </div>
          </div>

          {/* Claude Model Configuration */}
          <div className="border-t border-gray-600 pt-6">
            <h4 className="text-lg font-semibold font-semibold font-semibold font-medium font-medium text-white mb-4">
              Model Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
                  Model
                </label>
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
                <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={claudeConfig.maxTokens}
                  onChange={(e) =>
                    setClaudeConfig({
                      ...claudeConfig,
                      maxTokens: parseInt(e.target.value) || 1000,
                    })
                  }
                  min="100"
                  max="4000"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={claudeConfig.temperature}
                  onChange={(e) =>
                    setClaudeConfig({
                      ...claudeConfig,
                      temperature: parseFloat(e.target.value) || 0.7,
                    })
                  }
                  min="0"
                  max="1"
                  step="0.1"
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
          <h3 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-white mb-4">
            Application Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-600 font-medium text-gray-300">Auto-save</label>
                <p className="text-xs text-gray-500 text-gray-500">Automatically save your work</p>
              </div>
              <input
                type="checkbox"
                checked={appSettings.autoSave}
                onChange={(e) => setAppSettings({ ...appSettings, autoSave: e.target.checked })}
                className="w-4 h-4 text-[#0073E6] bg-gray-800 border-gray-600 rounded focus:ring-[#0073E6]"
              />
            </div>

            {appSettings.autoSave && (
              <div>
                <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
                  Auto-save interval (seconds)
                </label>
                <input
                  type="number"
                  value={appSettings.autoSaveInterval}
                  onChange={(e) =>
                    setAppSettings({
                      ...appSettings,
                      autoSaveInterval: parseInt(e.target.value) || 30,
                    })
                  }
                  min="10"
                  max="300"
                  className="w-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-[#0073E6]"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-600 font-medium text-gray-300">
                  Show word count
                </label>
                <p className="text-xs text-gray-500 text-gray-500">
                  Display word count in the editor
                </p>
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
                <label className="text-sm text-gray-600 font-medium text-gray-300">
                  Show reading time
                </label>
                <p className="text-xs text-gray-500 text-gray-500">
                  Display estimated reading time
                </p>
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

        {/* Data Management */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-white mb-4">
            Data Management
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-gray-600 font-medium text-gray-300 mb-2">
                Export & Backup
              </h4>
              <div className="flex gap-3">
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Export Settings
                </button>
                <button
                  onClick={() => showToast('Full backup system coming soon!', 'info')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Export All Data
                </button>
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm text-gray-600 font-medium text-gray-300 mb-2">
                Storage Usage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="text-gray-400">Claude Messages</span>
                  <span className="text-gray-300">{claude.messages.length} messages</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="text-gray-400">Local Storage</span>
                  <span className="text-gray-300">Calculating...</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm text-gray-600 font-medium text-gray-300 mb-2 text-red-400">
                Danger Zone
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to clear all Claude conversation history? This cannot be undone.',
                      )
                    ) {
                      handleClearMessages();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Clear All Claude Data
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to reset all settings to defaults? This cannot be undone.',
                      )
                    ) {
                      setClaudeConfig({
                        model: 'claude-sonnet-4-20250514',
                        maxTokens: 1000,
                        temperature: 0.7,
                      });
                      setAppSettings({
                        autoSave: true,
                        autoSaveInterval: 30,
                        darkMode: true,
                        showWordCount: true,
                        showReadingTime: true,
                      });
                      showToast('Settings reset to defaults', 'success');
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Reset All Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-white mb-4">
            About Inkwell
          </h3>

          <div className="space-y-3 text-sm text-gray-600 text-gray-300">
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

          <div className="mt-4 pt-4 border-t border-gray-600 text-xs text-gray-500 text-gray-500">
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
              href="https://github.com/oklahomahail/Inkwell2"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-xs text-gray-500 hover:bg-gray-600 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://docs.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-xs text-gray-500 hover:bg-gray-600 transition-colors"
            >
              Claude API Docs
            </a>
          </div>
        </div>

        {/* Claude Usage Tips */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold text-white mb-4">
            Claude Usage Tips
          </h3>

          <div className="space-y-3 text-sm text-gray-600 text-gray-300">
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
                <strong>Privacy:</strong> Your API key is stored locally and only used to
                communicate with Anthropic's servers.
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
