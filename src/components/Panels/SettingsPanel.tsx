// File: src/components/Panels/SettingsPanel.tsx - Enhanced Claude Setup
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import claudeService from '@/services/claudeService';
import { Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react';
import BackupControls from '@/components/Settings/BackupControls';
import SnapshotHistoryDialog from '@/components/Settings/SnapshotHistoryDialog';
import { Button } from '@/components/ui/Button';

const SettingsPanel: React.FC = () => {
  const { state, claudeActions, claude } = useAppContext();
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
    darkMode: state.theme === 'dark',
    showWordCount: true,
    showReadingTime: true,
  });

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
  }, []);

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
    } catch (_error) {
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

  const handleExportSettings = () => {
    const settings = {
      claudeConfig,
      appSettings,
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

        {/* Claude AI Configuration */}
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Claude AI Assistant</h3>
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
                    onChange={(e) => setApiKey(e.target.value)}
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
                onChange={(e) => setAppSettings({ ...appSettings, autoSave: e.target.checked })}
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
                  onChange={(e) =>
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
