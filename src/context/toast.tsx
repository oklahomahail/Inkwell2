// src/context/toast.tsx - Toast context and utilities
import { createContext, useContext } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';
export type Toast = { id: string; message: string; type: ToastType };

export type ToastContextValue = {
  toasts: Toast[];
  showToast: (_message: string, _type?: ToastType, _timeoutMs?: number) => void;
  removeToast: (_id: string) => void;
  clearToasts: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function _useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
