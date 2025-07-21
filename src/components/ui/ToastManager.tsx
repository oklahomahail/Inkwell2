import React, { useEffect } from "react";
import { useToastContext } from "@/context/ToastContext";

const ToastManager: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed top-6 right-6 space-y-3 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-80 max-w-full p-4 rounded-lg shadow-lg border-l-4 animate-fade-slide 
            ${toast.type === "success" ? "border-green-500 bg-[#0A0F1C]" : ""}
            ${toast.type === "error" ? "border-red-500 bg-[#0A0F1C]" : ""}
            ${toast.type === "info" ? "border-[#0073E6] bg-[#0A0F1C]" : ""}
          `}
        >
          <p className="text-gray-200 text-sm">{toast.message}</p>
          <div className="w-full h-1 mt-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#0073E6] animate-progress-bar"></div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide {
          animation: fadeSlide 0.3s ease-out forwards;
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-bar {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastManager;
