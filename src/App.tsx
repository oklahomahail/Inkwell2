// src/App.tsx
import React, { useEffect } from "react";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";
import CompleteWritingPlatform from "@/components/CompleteWritingPlatform";
import { initializeBackupSystem } from "@/services/backupSetup";
import { backupService } from "@/services/backupCore";

const App: React.FC = () => {
  useEffect(() => {
    // Initialize backups when the app starts
    initializeBackupSystem();

    // Clean up on unmount (stop timers, release resources)
    return () => {
      backupService.cleanup();
    };
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <CompleteWritingPlatform />
        </div>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
