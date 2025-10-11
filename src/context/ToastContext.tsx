// src/context/ToastContext.tsx - Toast Provider Component
import React, { useState, useCallback, useMemo, type ReactNode } from 'react';

import { ToastContext, type ToastContextValue, type Toast, type ToastType } from './toast';

export const ToastProvider = _ToastProvider;

export function _ToastProvider({ children }: { children: ReactNode }) {
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
// export function _ToastContainer() { ... }
