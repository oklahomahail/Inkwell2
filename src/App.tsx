// src/App.tsx
import React, { useEffect } from "react";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastManager from "@/components/ui/ToastManager";
import CompleteWritingPlatform from "@/components/CompleteWritingPlatform";
import { initializeBackupSystem, cleanupBackupSystem } from "@/services/backupSetup";

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeBackupSystem({
          autoBackupEnabled: true,
          autoBackupInterval: 5, // 5 minutes
          includeSettings: false,
          maxBackups: 10,
        });
        console.log("✅ Backup system initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize backup system:", error);
      }
    };

    initializeApp();

    return () => {
      cleanupBackupSystem();
    };
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <CompleteWritingPlatform />
          <ToastManager />
        </div>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
