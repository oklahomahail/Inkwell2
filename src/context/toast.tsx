// src/context/toast.tsx - Toast context and utilities
import { createContext, useContext } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';
export type Toast = { id: string; message: string; type: ToastType };

export type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, timeoutMs?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
