// src/components/UI/ToastMessage.tsx
import React from "react";
import { Toast } from "@/context/ToastContext"; // or define Toast interface here too

interface ToastMessageProps {
  toast: Toast;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ toast }) => {
  const bgColor =
    toast.type === "success"
      ? "bg-green-600"
      : toast.type === "error"
      ? "bg-red-600"
      : toast.type === "warning"
      ? "bg-yellow-600"
      : "bg-blue-600";

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9999] px-4 py-2 rounded shadow-lg text-white text-sm animate-fade-in-out',
        toast.type === 'success' && 'bg-green-600',
        toast.type === 'error' && 'bg-red-600',
        toast.type === 'warning' && 'bg-yellow-600',
        toast.type === 'info' && 'bg-blue-600'
      )}
      role="alert"
      aria-live="assertive"
    >
      {toast.message}
    </div>
  );
};

export default ToastMessage;
