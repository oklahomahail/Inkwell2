import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import React, { useState } from 'react';

interface PassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'initialize' | 'unlock' | 'change';
  projectId: string;
  projectTitle: string;
  onSubmit: (passphrase: string, newPassphrase?: string) => Promise<void>;
}

export function PassphraseModal({
  isOpen,
  onClose,
  mode,
  projectId: _projectId,
  projectTitle,
  onSubmit,
}: PassphraseModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showNewPassphrase, setShowNewPassphrase] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (mode === 'initialize' || mode === 'change') {
      if (mode === 'initialize' && passphrase.length < 8) {
        setError('Passphrase must be at least 8 characters');
        return;
      }

      if (mode === 'change') {
        if (newPassphrase.length < 8) {
          setError('New passphrase must be at least 8 characters');
          return;
        }
        if (newPassphrase !== confirmPassphrase) {
          setError('New passphrases do not match');
          return;
        }
      } else if (passphrase !== confirmPassphrase) {
        setError('Passphrases do not match');
        return;
      }
    }

    if (!passphrase.trim()) {
      setError('Please enter a passphrase');
      return;
    }

    setIsProcessing(true);

    try {
      if (mode === 'change') {
        await onSubmit(passphrase, newPassphrase);
      } else {
        await onSubmit(passphrase);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setPassphrase('');
        setNewPassphrase('');
        setConfirmPassphrase('');
        setShowPassphrase(false);
        setShowNewPassphrase(false);
        setError(null);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process passphrase');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
      // Reset form
      setPassphrase('');
      setNewPassphrase('');
      setConfirmPassphrase('');
      setShowPassphrase(false);
      setShowNewPassphrase(false);
      setError(null);
      setSuccess(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'initialize':
        return 'Enable End-to-End Encryption';
      case 'unlock':
        return 'Unlock Project';
      case 'change':
        return 'Change Encryption Passphrase';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'initialize':
        return 'Your data will be encrypted before being synced to the cloud. Only you will be able to decrypt it with this passphrase.';
      case 'unlock':
        return `Enter your passphrase to unlock "${projectTitle}".`;
      case 'change':
        return 'Enter your current passphrase and choose a new one. Your data will be re-encrypted with the new passphrase.';
    }
  };

  const getSubmitButtonText = () => {
    if (isProcessing) {
      switch (mode) {
        case 'initialize':
          return 'Enabling...';
        case 'unlock':
          return 'Unlocking...';
        case 'change':
          return 'Changing...';
      }
    }
    switch (mode) {
      case 'initialize':
        return 'Enable Encryption';
      case 'unlock':
        return 'Unlock Project';
      case 'change':
        return 'Change Passphrase';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl bg-[#1A2233] border border-gray-700 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{getModalTitle()}</h2>
            <p className="text-sm text-gray-400 mt-1">{getModalDescription()}</p>
          </div>
        </div>

        {/* Security Notice for Initialize */}
        {mode === 'initialize' && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-200 mb-1">Important: Save Your Passphrase</p>
                <p className="text-gray-300">
                  If you forget your passphrase, your encrypted data cannot be recovered. We
                  recommend saving a Recovery Kit after enabling encryption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">
              {mode === 'initialize' && 'Encryption enabled successfully!'}
              {mode === 'unlock' && 'Project unlocked successfully!'}
              {mode === 'change' && 'Passphrase changed successfully!'}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Passphrase */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {mode === 'change' ? 'Current Passphrase' : 'Passphrase'}
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={
                  mode === 'initialize' ? 'Choose a strong passphrase' : 'Enter passphrase'
                }
                disabled={isProcessing || success}
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                disabled={isProcessing || success}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                title={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Passphrase (Initialize mode only) */}
          {mode === 'initialize' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Passphrase
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter passphrase"
                disabled={isProcessing || success}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                autoComplete="off"
              />
            </div>
          )}

          {/* New Passphrase (Change mode only) */}
          {mode === 'change' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Passphrase
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassphrase ? 'text' : 'password'}
                    value={newPassphrase}
                    onChange={(e) => setNewPassphrase(e.target.value)}
                    placeholder="Choose a new passphrase"
                    disabled={isProcessing || success}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassphrase(!showNewPassphrase)}
                    disabled={isProcessing || success}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                    title={showNewPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showNewPassphrase ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Passphrase
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type={showNewPassphrase ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter new passphrase"
                  disabled={isProcessing || success}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {/* Passphrase Strength Indicator (Initialize/Change) */}
          {(mode === 'initialize' || mode === 'change') && (
            <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  <p className="font-medium text-blue-300 mb-1">Passphrase Tips:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                    <li>Use at least 8 characters (longer is better)</li>
                    <li>Consider using multiple words or a phrase</li>
                    <li>Mix letters, numbers, and symbols</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing || success}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || success}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PassphraseModal;
