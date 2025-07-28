import React, { useEffect, useState } from "react";

export interface Toast {
  id: string;
  message: string;
  duration?: number; // milliseconds
}

interface ToastManagerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastManager: React.FC<ToastManagerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade-out animation before removing
      setTimeout(onDismiss, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const handleClick = () => {
    setFadeOut(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer px-4 py-2 rounded shadow-md bg-gray-800 text-white transition-opacity ${
        fadeOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      {toast.message}
    </div>
  );
};

export default ToastManager;
