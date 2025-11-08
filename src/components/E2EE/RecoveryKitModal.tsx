import { Shield, Download, Upload, AlertTriangle, CheckCircle, Info, Copy } from 'lucide-react';
import React, { useState, useRef } from 'react';

import type { RecoveryKit } from '@/types/crypto';

interface RecoveryKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  projectId?: string;
  projectTitle?: string;
  recoveryKit?: RecoveryKit;
  onExport?: () => Promise<RecoveryKit>;
  onImport?: (kit: RecoveryKit, passphrase: string) => Promise<void>;
}

export function RecoveryKitModal({
  isOpen,
  onClose,
  mode,
  projectId,
  projectTitle,
  recoveryKit,
  onExport,
  onImport,
}: RecoveryKitModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [exportedKit, setExportedKit] = useState<RecoveryKit | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importedKitData, setImportedKitData] = useState<RecoveryKit | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!onExport) return;

    setIsProcessing(true);
    setError(null);

    try {
      const kit = await onExport();
      setExportedKit(kit);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export Recovery Kit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadKit = () => {
    const kit = exportedKit || recoveryKit;
    if (!kit) return;

    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkwell-recovery-kit-${kit.project_id}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const kit = exportedKit || recoveryKit;
    if (!kit) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(kit, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const kit = JSON.parse(content) as RecoveryKit;

        // Validate Recovery Kit format
        if (kit.inkwell_recovery_kit !== 1) {
          throw new Error('Invalid Recovery Kit format');
        }

        if (!kit.project_id || !kit.wrapped_dek || !kit.kdf) {
          throw new Error('Recovery Kit is missing required fields');
        }

        setImportedKitData(kit);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read Recovery Kit file');
        setImportedKitData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onImport || !importedKitData) return;

    if (!importPassphrase.trim()) {
      setError('Please enter your passphrase');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onImport(importedKitData, importPassphrase);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetImportState();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Recovery Kit');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImportState = () => {
    setImportPassphrase('');
    setImportedKitData(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    onClose();
    setExportedKit(null);
    setError(null);
    setSuccess(false);
    setCopied(false);
    resetImportState();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#1A2233] border border-gray-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-emerald-900/30 rounded-lg">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {mode === 'export' ? 'Export Recovery Kit' : 'Import Recovery Kit'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'export'
                ? 'Backup your encryption key to restore access if needed'
                : 'Restore encrypted project access from a Recovery Kit'}
            </p>
          </div>
        </div>

        {/* Export Mode */}
        {mode === 'export' && (
          <>
            {/* Warning */}
            <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-200 mb-2">Keep Your Recovery Kit Safe</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Store it in a secure location (password manager, encrypted drive)</li>
                    <li>Do not share it with anyone</li>
                    <li>Keep it separate from your passphrase</li>
                    <li>Anyone with this kit + passphrase can decrypt your data</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && exportedKit && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">
                    Recovery Kit exported successfully!
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadKit}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download as File
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* Export Info */}
            {!exportedKit && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-300 mb-2">What is a Recovery Kit?</p>
                    <p className="mb-2">
                      A Recovery Kit contains your encrypted project key. If you:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                      <li>Lose access to your device</li>
                      <li>Clear your browser data</li>
                      <li>Need to access your project on a new device</li>
                    </ul>
                    <p className="mt-2">
                      You can use this kit + your passphrase to restore access to your encrypted
                      data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Project:</span>
                  <span className="text-white font-medium">{projectTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Project ID:</span>
                  <span className="text-gray-300 font-mono text-xs">{projectId}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {exportedKit ? 'Close' : 'Cancel'}
              </button>
              {!exportedKit && (
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Download className="w-4 h-4" />
                  {isProcessing ? 'Exporting...' : 'Export Recovery Kit'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Import Mode */}
        {mode === 'import' && (
          <>
            {/* Info */}
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-blue-300 mb-1">Import Recovery Kit</p>
                  <p>
                    Select your Recovery Kit file and enter your passphrase to restore access to
                    your encrypted project.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300">Recovery Kit imported successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* Import Form */}
            <form onSubmit={handleImport} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recovery Kit File
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    disabled={isProcessing || success}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || success}
                    className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {importedKitData ? 'Change File' : 'Choose File'}
                  </button>
                </div>
                {importedKitData && (
                  <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Project ID:</span>
                        <span className="text-gray-300 font-mono">
                          {importedKitData.project_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-300">
                          {new Date(importedKitData.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Passphrase */}
              {importedKitData && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Passphrase
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    placeholder="Enter your passphrase"
                    disabled={isProcessing || success}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the passphrase you used when encrypting this project
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isProcessing || success}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importedKitData || !importPassphrase.trim() || isProcessing || success}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Shield className="w-4 h-4" />
                  {isProcessing ? 'Importing...' : 'Import Recovery Kit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default RecoveryKitModal;
