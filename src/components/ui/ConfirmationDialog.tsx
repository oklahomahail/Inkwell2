// src/components/ui/ConfirmationDialog.tsx
import { AlertTriangle, Trash2, X, Save, Download, RefreshCw, Archive } from 'lucide-react';
import React, { useState } from 'react';

// ==========================================
// BASE CONFIRMATION DIALOG
// ==========================================

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ComponentType<{ className?: string }>;
  requiresTyping?: string; // Require typing this text to confirm
  isLoading?: boolean;
  details?: string[];
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon: CustomIcon,
  requiresTyping,
  isLoading = false,
  details,
}) => {
  const [typedText, setTypedText] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(!requiresTyping);

  React.useEffect(() => {
    if (requiresTyping) {
      setIsConfirmEnabled(typedText.toLowerCase() === requiresTyping.toLowerCase());
    } else {
      setIsConfirmEnabled(true);
    }
  }, [typedText, requiresTyping]);

  React.useEffect(() => {
    if (isOpen) {
      setTypedText('');
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: AlertTriangle,
    },
    warning: {
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      icon: AlertTriangle,
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: AlertTriangle,
    },
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: AlertTriangle,
    },
  };

  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  const handleConfirm = () => {
    if (isConfirmEnabled && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-slate-600 dark:text-slate-400 mb-4">{message}</p>

          {/* Details */}
          {details && details.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <strong>This will:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Typing confirmation */}
          {requiresTyping && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type "{requiresTyping}" to confirm:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={requiresTyping}
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isConfirmEnabled || isLoading}
              className={`
                px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${config.buttonColor}
              `}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SPECIALIZED CONFIRMATION DIALOGS
// ==========================================

// Delete confirmation dialog
export const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: string;
  itemName?: string;
  isLoading?: boolean;
  requiresTyping?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  isLoading = false,
  requiresTyping = false,
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Delete ${itemType}`}
    message={`Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType.toLowerCase()}`}? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
    variant="danger"
    icon={Trash2}
    requiresTyping={requiresTyping ? 'DELETE' : undefined}
    isLoading={isLoading}
    details={[
      `The ${itemType.toLowerCase()} will be permanently removed`,
      'All associated data will be lost',
      'This action cannot be undone',
    ]}
  />
);

// Save confirmation dialog (for unsaved changes)
export const SaveConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onSave, onDiscard, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Save className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Unsaved Changes
            </h3>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You have unsaved changes. What would you like to do?
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onDiscard}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Discard Changes
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export confirmation dialog
export const ExportConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exportType: string;
  fileName?: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, exportType, fileName, isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Export as ${exportType.toUpperCase()}`}
    message={`Export your project${fileName ? ` as "${fileName}"` : ''} in ${exportType.toUpperCase()} format?`}
    confirmText="Export"
    cancelText="Cancel"
    variant="info"
    icon={Download}
    isLoading={isLoading}
    details={[
      `Export format: ${exportType.toUpperCase()}`,
      'Include all chapters and content',
      'Professional formatting applied',
    ]}
  />
);

// Archive confirmation dialog
export const ArchiveConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: string;
  itemName?: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemType, itemName, isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Archive ${itemType}`}
    message={`Archive ${itemName ? `"${itemName}"` : `this ${itemType.toLowerCase()}`}? It will be moved to your archived items and hidden from the main view.`}
    confirmText="Archive"
    cancelText="Cancel"
    variant="warning"
    icon={Archive}
    isLoading={isLoading}
    details={[
      `The ${itemType.toLowerCase()} will be archived`,
      'You can restore it later from archived items',
      'It will be hidden from the main view',
    ]}
  />
);

// ==========================================
// CONFIRMATION HOOK
// ==========================================

interface UseConfirmationReturn {
  isOpen: boolean;
  open: (config?: Partial<ConfirmationConfig>) => void;
  close: () => void;
  config: ConfirmationConfig;
}

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  requiresTyping?: string;
  details?: string[];
}

export const useConfirmation = (
  defaultConfig: Partial<ConfirmationConfig> = {},
): UseConfirmationReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig>({
    title: 'Confirm Action',
    message: 'Are you sure you want to continue?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
    onConfirm: () => {},
    ...defaultConfig,
  });

  const open = (newConfig: Partial<ConfirmationConfig> = {}) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    open,
    close,
    config,
  };
};
