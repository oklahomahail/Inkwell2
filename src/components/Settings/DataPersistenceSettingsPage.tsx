/**
 * Data Persistence Settings Page
 *
 * Main settings page for user-defined data persistence
 */

import { HardDrive, Info, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';

import { PersistenceAdvancedSettings } from '@/components/Settings/PersistenceAdvancedSettings';
import { PersistenceModeSelector } from '@/components/Settings/PersistenceModeSelector';
import { useUserPersistence } from '@/hooks/useUserPersistence';

export function DataPersistenceSettingsPage() {
  const { settings, status, capabilities } = useUserPersistence();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Data Persistence</h2>
        </div>
        <p className="text-gray-600">
          Control where and how your writing data is stored. Your data, your choice.
        </p>
      </div>

      {/* Current Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Mode</p>
            <p className="font-semibold text-gray-900 mt-1 capitalize">
              {settings.mode.replace('-', ' ')}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Auto-Sync</p>
            <p className="font-semibold text-gray-900 mt-1">
              {settings.autoSync ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Connection</p>
            <p className="font-semibold text-gray-900 mt-1">
              {status?.isCloudConnected ? '✓ Connected' : '○ Local Only'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PersistenceModeSelector />
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">Advanced Settings</span>
        <ArrowRight
          className={`w-5 h-5 text-gray-600 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <PersistenceAdvancedSettings />
        </div>
      )}

      {/* Info Sections */}
      <div className="grid gap-6">
        {/* Data Export */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Data Export & Portability</h3>
          <p className="text-sm text-gray-600 mb-4">
            You can export your data at any time in standard formats. No vendor lock-in.
          </p>
          <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Export All Data
          </button>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Privacy & Security</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Local Only:</strong> Your data never leaves your device. Complete privacy.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Cloud Sync:</strong> Data encrypted in transit and at rest. Only you can
                access it.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Hybrid:</strong> Best of both worlds - local privacy with cloud backup
                safety.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        {capabilities && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">System Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">IndexedDB</p>
                <p className="font-medium text-gray-900 mt-1">
                  {capabilities.hasIndexedDB ? '✓ Available' : '✗ Not Available'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">LocalStorage</p>
                <p className="font-medium text-gray-900 mt-1">
                  {capabilities.hasLocalStorage ? '✓ Available' : '✗ Not Available'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Storage Quota</p>
                <p className="font-medium text-gray-900 mt-1">
                  {capabilities.localQuota
                    ? `${Math.round(capabilities.localQuota / 1024 / 1024 / 1024)} GB`
                    : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Persistence</p>
                <p className="font-medium text-gray-900 mt-1">
                  {capabilities.isPersistent ? '✓ Granted' : '○ Not Granted'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
