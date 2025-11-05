/**
 * Persistence Advanced Settings Component
 *
 * Fine-grained control over sync, backup, and encryption settings
 */

import { Clock, Shield, Database, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/context/toast';
import { useUserPersistence } from '@/hooks/useUserPersistence';

export function PersistenceAdvancedSettings() {
  const { settings, status, capabilities, updateSettings, triggerSync, triggerBackup } =
    useUserPersistence();
  const { showToast } = useToast();

  const [localAutoSync, setLocalAutoSync] = useState(settings.autoSync);
  const [localSyncInterval, setLocalSyncInterval] = useState(settings.syncInterval / 60000); // Convert to minutes
  const [localBackupEnabled, setLocalBackupEnabled] = useState(settings.cloudBackupEnabled);
  const [localBackupInterval, setLocalBackupInterval] = useState(settings.backupInterval / 3600000); // Convert to hours

  const isCloudMode = settings.mode === 'cloud-sync' || settings.mode === 'hybrid';
  const isHybridMode = settings.mode === 'hybrid';

  const handleSave = async () => {
    try {
      await updateSettings({
        autoSync: localAutoSync,
        syncInterval: localSyncInterval * 60000,
        cloudBackupEnabled: localBackupEnabled,
        backupInterval: localBackupInterval * 3600000,
      });
      showToast('Settings saved successfully', 'success');
    } catch (_error) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleManualSync = async () => {
    try {
      await triggerSync();
      showToast('Sync completed successfully', 'success');
    } catch (_error) {
      showToast('Sync failed', 'error');
    }
  };

  const handleManualBackup = async () => {
    try {
      await triggerBackup();
      showToast('Backup completed successfully', 'success');
    } catch (_error) {
      showToast('Backup failed', 'error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (settings.mode === 'local-only') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <Info className="w-5 h-5" />
          <p className="text-sm">
            Advanced sync settings are not available in Local Only mode. Switch to Cloud Sync or
            Hybrid mode to access these features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="font-semibold text-gray-900">Advanced Settings</h4>
        <p className="text-sm text-gray-600 mt-1">
          Fine-tune your data synchronization and backup preferences
        </p>
      </div>

      {/* Storage Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-gray-600" />
          <h5 className="font-medium text-gray-900">Storage Status</h5>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Local Storage Used</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatBytes(status?.localStorageUsed || 0)} /{' '}
              {formatBytes(status?.localStorageAvailable || 0)}
            </p>
          </div>
          {status?.cloudStorageUsed !== null && status !== null && (
            <div>
              <p className="text-gray-600">Cloud Storage Used</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatBytes(status.cloudStorageUsed)}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-600">Last Sync</p>
            <p className="font-medium text-gray-900 mt-1">{formatTimestamp(settings.lastSyncAt)}</p>
          </div>
          {isHybridMode && (
            <div>
              <p className="text-gray-600">Last Backup</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatTimestamp(settings.lastBackupAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Sync Settings (Cloud Sync & Hybrid) */}
      {isCloudMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-600" />
            <h5 className="font-medium text-gray-900">Cloud Sync Settings</h5>
          </div>

          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Automatic Sync</p>
              <p className="text-xs text-gray-600">Sync changes to cloud automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localAutoSync}
                onChange={(e) => setLocalAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Sync interval */}
          {localAutoSync && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Sync Interval</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={localSyncInterval}
                  onChange={(e) => setLocalSyncInterval(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-24">{localSyncInterval} min</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">How often to sync changes to the cloud</p>
            </div>
          )}

          {/* Manual sync button */}
          <button
            onClick={handleManualSync}
            disabled={!status?.isCloudConnected || !status?.isAuthenticated}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Sync Now
          </button>

          {!status?.isCloudConnected && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Not connected to cloud. Check your internet connection.</span>
            </div>
          )}
        </div>
      )}

      {/* Backup Settings (Hybrid only) */}
      {isHybridMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h5 className="font-medium text-gray-900">Cloud Backup Settings</h5>
          </div>

          <p className="text-sm text-gray-600">
            In Hybrid mode, your data is primarily stored locally but backed up to the cloud for
            safety.
          </p>

          {/* Backup toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Cloud Backup</p>
              <p className="text-xs text-gray-600">Periodic backups to cloud storage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localBackupEnabled}
                onChange={(e) => setLocalBackupEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Backup interval */}
          {localBackupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Backup Frequency
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="168"
                  value={localBackupInterval}
                  onChange={(e) => setLocalBackupInterval(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-24">{localBackupInterval} hr</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">How often to backup to the cloud</p>
            </div>
          )}

          {/* Manual backup button */}
          {localBackupEnabled && (
            <button
              onClick={handleManualBackup}
              disabled={!status?.isCloudConnected || !status?.isAuthenticated}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Backup Now
            </button>
          )}
        </div>
      )}

      {/* Encryption Settings (Future Feature) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h5 className="font-medium text-gray-900">Encryption</h5>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
        </div>

        <div className="opacity-50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Local Encryption</p>
              <p className="text-xs text-gray-600">Encrypt data stored on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input type="checkbox" disabled className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Cloud Encryption</p>
              <p className="text-xs text-gray-600">Encrypt data before uploading to cloud</p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input type="checkbox" disabled className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Save Settings
      </button>

      {/* Storage Persistence Info */}
      {capabilities && !capabilities.isPersistent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-yellow-900">Storage Not Persistent</p>
            <p className="text-yellow-700 mt-1">
              Your browser may clear local data under storage pressure. Consider using Cloud Sync
              for better persistence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
