/**
 * Persistence Mode Selector Component
 *
 * Allows users to choose their data persistence strategy
 */

import { Cloud, HardDrive, Network, AlertCircle, CheckCircle, Info } from 'lucide-react';
import React, { useState } from 'react';

import { useUserPersistence } from '@/hooks/useUserPersistence';
import { PersistenceMode } from '@/types/persistenceConfig';
import { cn } from '@/utils/cn';

export function PersistenceModeSelector() {
  const { settings, capabilities, loading, setMode } = useUserPersistence();
  const [selectedMode, setSelectedMode] = useState<PersistenceMode>(settings.mode);

  const modes = [
    {
      id: 'local-only' as PersistenceMode,
      name: 'Local Only',
      icon: HardDrive,
      description: 'All data stored on your device',
      benefits: ['Complete privacy', 'Works offline', 'No account required'],
      limitations: ['Data lost if browser cache cleared', 'Not accessible from other devices'],
      available: capabilities?.supportsLocalOnly ?? false,
      recommended: capabilities?.isPrivateMode ?? false,
    },
    {
      id: 'cloud-sync' as PersistenceMode,
      name: 'Cloud Sync',
      icon: Cloud,
      description: 'Data synced to cloud with local cache',
      benefits: [
        'Access from any device',
        'Automatic backups',
        'Never lose your work',
        'Collaborate with others',
      ],
      limitations: ['Requires account', 'Needs internet connection'],
      available: capabilities?.supportsCloudSync ?? false,
      recommended:
        !(capabilities?.isPrivateMode ?? false) && (capabilities?.cloudAccessible ?? false),
    },
    {
      id: 'hybrid' as PersistenceMode,
      name: 'Hybrid (Best of Both)',
      icon: Network,
      description: 'Local-first with cloud backups',
      benefits: [
        'Works offline',
        'Cloud backups for safety',
        'Access anywhere',
        'You control backup frequency',
      ],
      limitations: ['Requires account for cloud features'],
      available: capabilities?.supportsHybrid ?? false,
      recommended: true,
    },
  ];

  const handleModeSelect = async (mode: PersistenceMode) => {
    try {
      setSelectedMode(mode);
      await setMode(mode);
    } catch (error) {
      console.error('Failed to change persistence mode:', error);
      // Reset selection on error
      setSelectedMode(settings.mode);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Data Storage Preference</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose where and how your writing data is stored. You can change this anytime.
        </p>
      </div>

      {/* Warning if in private mode */}
      {capabilities?.isPrivateMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-yellow-900">Private/Incognito Mode Detected</p>
            <p className="text-yellow-700 mt-1">
              Your browser is in private mode. Data may be lost when you close the window. Consider
              using Cloud Sync for better data persistence.
            </p>
          </div>
        </div>
      )}

      {/* Mode Options */}
      <div className="grid gap-4">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isCurrent = settings.mode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              disabled={!mode.available || loading}
              className={cn(
                'relative text-left p-5 rounded-lg border-2 transition-all',
                'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected || isCurrent
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              {/* Recommended Badge */}
              {mode.recommended && mode.available && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Recommended
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  <CheckCircle className="w-3 h-3" />
                  Current
                </div>
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                    isSelected || isCurrent
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{mode.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{mode.description}</p>

                  {/* Benefits */}
                  <div className="space-y-1 mb-3">
                    {mode.benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {mode.limitations.length > 0 && (
                    <div className="space-y-1">
                      {mode.limitations.slice(0, 2).map((limitation, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                          <Info className="w-3 h-3 flex-shrink-0" />
                          <span>{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unavailable message */}
                  {!mode.available && (
                    <div className="mt-2 text-xs text-red-600">
                      Not available{' '}
                      {mode.id === 'cloud-sync' &&
                        'check your internet connection and authentication'}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-blue-900">
          <p className="font-medium">You're in control</p>
          <p className="text-blue-700 mt-1">
            Your data is always yours. You can export, migrate, or delete it at any time. No vendor
            lock-in.
          </p>
        </div>
      </div>
    </div>
  );
}
