// src/App.tsx
import React, { useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import ToastManager from '@/components/ui/ToastManager';
import CompleteWritingPlatform from '@/components/CompleteWritingPlatform';

// Optional backup system imports - will work if they exist
let initializeBackupSystem: (() => Promise<void>) | undefined;
let cleanupBackupSystem: (() => void) | undefined;

try {
  const backupModule = require('@/services/backupSetup');
  initializeBackupSystem = backupModule.initializeBackupSystem;
  cleanupBackupSystem = backupModule.cleanupBackupSystem;
} catch (error) {
  console.log("Backup system not available - that's ok for testing");
}

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (initializeBackupSystem) {
          await initializeBackupSystem();
          console.log('✅ Backup system initialized successfully');
        } else {
          console.log('📝 Running without backup system');
        }
      } catch (error) {
        console.error('❌ Failed to initialize backup system:', error);
      }
    };

    initializeApp();

    return () => {
      if (cleanupBackupSystem) {
        cleanupBackupSystem();
      }
    };
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <CompleteWritingPlatform />
          <ToastManager />
        </div>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
