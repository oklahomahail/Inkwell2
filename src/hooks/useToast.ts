// src/hooks/useToast.ts
import { useState, useCallback } from "react";

export interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // in ms (default 2000)
}

export function useToast() {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
    const duration = options.duration ?? 2000;
    setTimeout(() => setToast(null), duration);
  }, []);

  return {
    toast,
    showToast,
    clearToast: () => setToast(null),
  };
}
