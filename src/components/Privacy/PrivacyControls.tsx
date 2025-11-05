// Privacy Controls Component for Analytics Preferences
import { Shield, Eye, EyeOff, Database, Trash2, Download, Info, ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { isTelemetryEnabled, setTelemetryEnabled } from '@/services/telemetry';
import type { AnalyticsStore } from '@/types/analytics';

import { analyticsService, useAnalytics } from '../../services/analyticsService';

interface PrivacyControlsProps {
  className?: string;
  detailed?: boolean;
}

export const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  className = '',
  detailed = false,
}) => {
  const { isEnabled } = useAnalytics();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(isEnabled);
  const [telemetryEnabled, setTelemetryEnabledState] = useState(true);
  const [dataSize, setDataSize] = useState(0);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [localAnalytics, setLocalAnalytics] = useState<AnalyticsStore>({});

  useEffect(() => {
    setAnalyticsEnabled(analyticsService.isAnalyticsEnabled());
    setTelemetryEnabledState(isTelemetryEnabled());

    // Calculate stored data size
    const analytics = analyticsService.getLocalAnalytics();
    setLocalAnalytics(analytics);

    const dataString = JSON.stringify(analytics);
    setDataSize(new Blob([dataString]).size);
  }, []);

  const handleToggleAnalytics = () => {
    if (analyticsEnabled) {
      analyticsService.disable();
      setAnalyticsEnabled(false);
    } else {
      analyticsService.enable();
      setAnalyticsEnabled(true);
    }
  };

  const handleToggleTelemetry = () => {
    const nextState = !telemetryEnabled;
    setTelemetryEnabled(nextState);
    setTelemetryEnabledState(nextState);
  };

  const handleClearData = () => {
    if (
      confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')
    ) {
      analyticsService.clearAllData();
      setLocalAnalytics({});
      setDataSize(0);
    }
  };

  const handleExportData = () => {
    const analytics = analyticsService.getLocalAnalytics();
    const dataBlob = new Blob([JSON.stringify(analytics, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEventCount = () => {
    return Object.values(localAnalytics).reduce((total, events) => total + events.length, 0);
  };

  if (!detailed) {
    // Simple toggle for settings panels
    return (
      <div className={`privacy-controls ${className} space-y-4`}>
        {/* Telemetry Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Anonymous Telemetry</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help improve Inkwell with minimal, anonymous performance data
              </p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={telemetryEnabled}
              onChange={handleToggleTelemetry}
              className="sr-only"
            />
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                telemetryEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  telemetryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Privacy Documentation Link */}
        <div className="text-sm text-gray-600 dark:text-gray-400 px-4">
          <p>
            No content, titles, or personal info are ever transmitted.{' '}
            <a
              href="/docs/privacy.md"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Usage Analytics Toggle (old system) */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Usage Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Local feature usage tracking (stored on device)
              </p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={handleToggleAnalytics}
              className="sr-only"
            />
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                analyticsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    );
  }

  // Detailed privacy dashboard
  return (
    <div className={`privacy-controls-detailed ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Privacy & Analytics
          </h2>
        </div>

        {/* Privacy Policy Summary */}
        <div
          data-tour-id="privacy-hint"
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Your Privacy Matters
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• All data is stored locally on your device</li>
                <li>• No personal information is collected</li>
                <li>• User IDs are hashed for anonymity</li>
                <li>• Data is automatically deleted after 30 days</li>
                <li>• You can export or delete your data anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Analytics Toggle */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {analyticsEnabled ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Usage Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analyticsEnabled
                    ? 'Currently collecting anonymous usage data'
                    : 'Analytics collection is disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAnalytics}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                analyticsEnabled
                  ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
              }`}
            >
              {analyticsEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {analyticsEnabled && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">What we track:</p>
              <ul className="space-y-1 ml-4">
                <li>• Feature usage and adoption</li>
                <li>• Writing session patterns</li>
                <li>• Onboarding completion rates</li>
                <li>• App performance metrics</li>
              </ul>
            </div>
          )}
        </div>

        {/* Data Summary */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h3 className="font-medium text-gray-900 dark:text-white">Your Data</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {getEventCount()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Events Stored</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatBytes(dataSize)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDataPreview(!showDataPreview)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showDataPreview ? 'Hide' : 'Show'} Data
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Data Preview */}
          {showDataPreview && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Stored Analytics Data
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(localAnalytics).map(([eventName, events]) => (
                  <div key={eventName} className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {eventName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {events.length} events
                      </span>
                    </div>
                    {events.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Latest:{' '}
                        {new Date(
                          events[events.length - 1]?.timestamp ?? Date.now(),
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
                {Object.keys(localAnalytics).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No analytics data stored
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Do Not Track Status */}
        {navigator.doNotTrack === '1' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900 dark:text-orange-100">
                  Do Not Track Enabled
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Your browser's Do Not Track setting is enabled, so analytics are automatically
                  disabled.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
