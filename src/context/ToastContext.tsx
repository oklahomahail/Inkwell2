// src/context/ToastContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';
export type Toast = { id: string; message: string; type: ToastType };

export type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, timeoutMs?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', timeoutMs = 3000) => {
      const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, type }]);
      window.setTimeout(() => removeToast(id), timeoutMs);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, showToast, removeToast, clearToasts }),
    [toasts, showToast, removeToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Optional built-in container — remove if you render your own */}
      {/* <ToastContainer /> */}
    </ToastContext.Provider>
  );
}

// Optional presentational container if you want it here:
// export function ToastContainer() { ... }
