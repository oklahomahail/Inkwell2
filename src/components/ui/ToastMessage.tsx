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
    <>
      <div
        className={`${bgColor} fixed bottom-6 right-6 px-4 py-2 text-white rounded shadow-lg animate-fade-in-out z-[9999]`}
      >
        {toast.message}
      </div>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease forwards;
        }
      `}</style>
    </>
  );
};

export default ToastMessage;
