import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error";
  duration: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: {
    message: string;
    type?: "info" | "success" | "error";
    duration?: number;
  }) => void;
  removeToast: (id: string) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook for consuming the context
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};

// Provider
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: {
      message: string;
      type?: "info" | "success" | "error";
      duration?: number;
    }) => {
      const id = `toast_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const duration = toast.duration ?? 3000;

      const newToast: Toast = {
        id,
        message: toast.message,
        type: toast.type ?? "info",
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after the duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
