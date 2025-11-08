import { Lock, Shield, Key, Download, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { e2eeKeyManager } from '@/services/e2eeKeyManager';
import type { RecoveryKit } from '@/types/crypto';

import { PassphraseModal } from './PassphraseModal';
import { RecoveryKitModal } from './RecoveryKitModal';

interface E2EESettingsSectionProps {
  projectId: string | null;
  projectTitle: string | null;
  onStatusChange?: (enabled: boolean, unlocked: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function E2EESettingsSection({
  projectId,
  projectTitle,
  onStatusChange,
  showToast,
}: E2EESettingsSectionProps) {
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [passphraseModalOpen, setPassphraseModalOpen] = useState(false);
  const [passphraseMode, setPassphraseMode] = useState<'initialize' | 'unlock' | 'change'>(
    'initialize',
  );
  const [recoveryKitModalOpen, setRecoveryKitModalOpen] = useState(false);
  const [recoveryKitMode, setRecoveryKitMode] = useState<'export' | 'import'>('export');

  // Load E2EE status
  useEffect(() => {
    if (!projectId) {
      setIsE2EEEnabled(false);
      setIsUnlocked(false);
      return;
    }

    const checkE2EEStatus = async () => {
      const enabled = await e2eeKeyManager.isE2EEEnabled(projectId);
      const unlocked = e2eeKeyManager.isUnlocked(projectId);

      setIsE2EEEnabled(enabled);
      setIsUnlocked(unlocked);
      onStatusChange?.(enabled, unlocked);
    };

    checkE2EEStatus();
  }, [projectId, onStatusChange]);

  const handleEnableE2EE = () => {
    setPassphraseMode('initialize');
    setPassphraseModalOpen(true);
  };

  const handleUnlock = () => {
    setPassphraseMode('unlock');
    setPassphraseModalOpen(true);
  };

  const handleLock = () => {
    if (!projectId) return;
    e2eeKeyManager.lockProject(projectId);
    setIsUnlocked(false);
    onStatusChange?.(isE2EEEnabled, false);
    showToast('Project locked successfully', 'success');
  };

  const handleChangePassphrase = () => {
    setPassphraseMode('change');
    setPassphraseModalOpen(true);
  };

  const handlePassphraseSubmit = async (passphrase: string, newPassphrase?: string) => {
    if (!projectId) throw new Error('No project selected');

    setIsLoading(true);

    try {
      if (passphraseMode === 'initialize') {
        // Initialize E2EE
        const recoveryKit = await e2eeKeyManager.initializeProject({
          projectId,
          passphrase,
          useInteractiveParams: false, // Use secure params for production
        });

        setIsE2EEEnabled(true);
        setIsUnlocked(true);
        onStatusChange?.(true, true);
        showToast(
          'E2EE enabled successfully! Download your Recovery Kit to backup your encryption key.',
          'success',
        );

        // Prompt to download recovery kit (returned for reference, unused here)
        const _recoveryKit = recoveryKit;
        setTimeout(() => {
          setRecoveryKitMode('export');
          setRecoveryKitModalOpen(true);
        }, 1000);
      } else if (passphraseMode === 'unlock') {
        // Unlock project
        await e2eeKeyManager.unlockProject(projectId, passphrase);
        setIsUnlocked(true);
        onStatusChange?.(isE2EEEnabled, true);
        showToast('Project unlocked successfully', 'success');
      } else if (passphraseMode === 'change' && newPassphrase) {
        // Change passphrase
        await e2eeKeyManager.changePassphrase(projectId, passphrase, newPassphrase);
        showToast('Passphrase changed successfully! Download your new Recovery Kit.', 'success');

        // Prompt to download new recovery kit
        setTimeout(() => {
          setRecoveryKitMode('export');
          setRecoveryKitModalOpen(true);
        }, 1000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRecoveryKit = async (): Promise<RecoveryKit> => {
    if (!projectId) throw new Error('No project selected');
    return e2eeKeyManager.exportRecoveryKit(projectId);
  };

  const handleImportRecoveryKit = async (kit: RecoveryKit, passphrase: string) => {
    await e2eeKeyManager.importRecoveryKit(kit, passphrase);

    // Update status
    const enabled = await e2eeKeyManager.isE2EEEnabled(kit.project_id);
    const unlocked = e2eeKeyManager.isUnlocked(kit.project_id);

    setIsE2EEEnabled(enabled);
    setIsUnlocked(unlocked);
    onStatusChange?.(enabled, unlocked);
    showToast('Recovery Kit imported successfully', 'success');
  };

  const handleDisableE2EE = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      'Are you sure you want to disable E2EE?\n\n' +
        'WARNING: This will remove your encryption key from this device. ' +
        'You will need your Recovery Kit to re-enable encryption. ' +
        'Existing encrypted data will remain encrypted in the cloud.',
    );

    if (!confirmed) return;

    try {
      await e2eeKeyManager.disableE2EE(projectId);
      setIsE2EEEnabled(false);
      setIsUnlocked(false);
      onStatusChange?.(false, false);
      showToast('E2EE disabled for this device', 'info');
    } catch (_error) {
      showToast('Failed to disable E2EE', 'error');
    }
  };

  const getStatusBadge = () => {
    if (!isE2EEEnabled) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-400">Disabled</span>
        </div>
      );
    }

    if (isUnlocked) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-700/50 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Unlocked</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-700/50 rounded-lg">
        <Lock className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-400">Locked</span>
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          End-to-End Encryption
        </h3>
        <p className="text-gray-400 text-sm">
          Select a project to configure end-to-end encryption settings.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            End-to-End Encryption
          </h3>
          {getStatusBadge()}
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6">
          Encrypt your project data before syncing to the cloud. Only you can decrypt it with your
          passphrase.
        </p>

        {/* What is E2EE */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What is End-to-End Encryption?
          </h4>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              E2EE ensures that your writing is encrypted on your device before being uploaded to
              the cloud. The server only sees encrypted data and cannot read your content.
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-gray-400">
              <li>Data is encrypted with military-grade XChaCha20-Poly1305</li>
              <li>Only you have the decryption key (derived from your passphrase)</li>
              <li>Not even Inkwell servers can read your encrypted content</li>
              <li>If you forget your passphrase, your data cannot be recovered</li>
            </ul>
          </div>
        </div>

        {/* Status and Actions */}
        {!isE2EEEnabled ? (
          <>
            {/* Enable E2EE */}
            <div className="space-y-4">
              <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-amber-200 mb-1">Before You Enable:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Choose a strong, memorable passphrase</li>
                      <li>Save your Recovery Kit after enabling</li>
                      <li>Store both in a secure location</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEnableE2EE}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Enable E2EE for This Project
                </button>
                <button
                  onClick={() => {
                    setRecoveryKitMode('import');
                    setRecoveryKitModalOpen(true);
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Recovery Kit
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* E2EE Enabled - Show Controls */}
            <div className="space-y-4">
              {/* Project Info */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Project:</span>
                    <span className="text-white font-medium">{projectTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-gray-300">
                      {isUnlocked
                        ? 'Unlocked - Data is accessible'
                        : 'Locked - Enter passphrase to unlock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lock/Unlock Controls */}
              <div className="grid grid-cols-2 gap-3">
                {!isUnlocked ? (
                  <button
                    onClick={handleUnlock}
                    disabled={isLoading}
                    className="col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Unlock Project
                  </button>
                ) : (
                  <button
                    onClick={handleLock}
                    disabled={isLoading}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Lock Project
                  </button>
                )}

                {isUnlocked && (
                  <button
                    onClick={handleChangePassphrase}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Change Passphrase
                  </button>
                )}
              </div>

              {/* Recovery Kit Controls */}
              <div className="border-t border-gray-600 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Recovery Kit Management</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setRecoveryKitMode('export');
                      setRecoveryKitModalOpen(true);
                    }}
                    disabled={isLoading || !isUnlocked}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Recovery Kit
                  </button>
                  <button
                    onClick={() => {
                      setRecoveryKitMode('import');
                      setRecoveryKitModalOpen(true);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Recovery Kit
                  </button>
                </div>
                {!isUnlocked && (
                  <p className="text-xs text-gray-500 mt-2">
                    Unlock the project to export Recovery Kit
                  </p>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border-t border-gray-600 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Danger Zone</h4>
                <button
                  onClick={handleDisableE2EE}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-red-900/20 border border-red-800 text-red-300 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Disable E2EE (Remove Keys from Device)
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  This removes encryption keys from this device. Use Recovery Kit to restore.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {projectId && (
        <>
          <PassphraseModal
            isOpen={passphraseModalOpen}
            onClose={() => setPassphraseModalOpen(false)}
            mode={passphraseMode}
            projectId={projectId}
            projectTitle={projectTitle || 'Untitled Project'}
            onSubmit={handlePassphraseSubmit}
          />

          <RecoveryKitModal
            isOpen={recoveryKitModalOpen}
            onClose={() => setRecoveryKitModalOpen(false)}
            mode={recoveryKitMode}
            projectId={projectId}
            projectTitle={projectTitle || 'Untitled Project'}
            onExport={recoveryKitMode === 'export' ? handleExportRecoveryKit : undefined}
            onImport={recoveryKitMode === 'import' ? handleImportRecoveryKit : undefined}
          />
        </>
      )}
    </>
  );
}

export default E2EESettingsSection;
