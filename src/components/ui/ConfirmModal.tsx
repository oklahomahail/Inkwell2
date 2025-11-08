// src/components/ui/ConfirmModal.tsx
import React, { useEffect } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: 'red' | 'blue' | 'gray';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmColor = 'blue',
  onConfirm,
  onCancel,
}) => {
  const colorClass =
    confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700'
      : confirmColor === 'gray'
        ? 'bg-gray-600 hover:bg-gray-700'
        : 'bg-blue-600 hover:bg-blue-700';

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm rounded-md text-white transition-colors ${colorClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
