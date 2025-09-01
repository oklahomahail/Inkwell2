// src/components/ui/ToastManager.tsx
import React, { memo } from 'react';

import { useToast } from '@/context/ToastContext';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  onDismiss: () => void;
}

const ToastItem = memo<ToastItemProps>(({ message, type, onDismiss }) => {
  const getToastStyles = () => {
    const base =
      'px-4 py-3 rounded-lg shadow-lg text-white text-sm text-gray-600 font-medium cursor-pointer transition-all duration-300 transform hover:scale-105';

    switch (type) {
      case 'success':
        return `${base} bg-green-600 hover:bg-green-700`;
      case 'error':
        return `${base} bg-red-600 hover:bg-red-700`;
      case 'warning':
        return `${base} bg-yellow-600 hover:bg-yellow-700`;
      default:
        return `${base} bg-blue-600 hover:bg-blue-700`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div onClick={onDismiss} className={getToastStyles()} role="alert" aria-live="polite">
      <div className="flex items-center">
        {getIcon()}
        <span>{message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-3 text-white/70 hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

const ToastManager: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
      {toasts.map((toast: any) => {
        const id = String(toast.id ?? Date.now()); // normalize id as string
        return (
          <ToastItem
            key={id}
            id={id}
            message={toast.message}
            type={(toast.type as 'info' | 'success' | 'error' | 'warning') ?? 'info'}
            onDismiss={() => removeToast(id)}
          />
        );
      })}
    </div>
  );
};

export default ToastManager;
