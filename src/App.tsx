// src/App.tsx - Enhanced with Safety UI Integration
import React, { useState, useEffect } from 'react';
import PlatformLayout from './components/Platform/PlatformLayout';
import ViewSwitcher from './components/ViewSwitcher';
import ToastContainer from './components/ToastContainer';
import ClaudeAssistant from './components/ClaudeAssistant';
import ClaudeErrorBoundary from './components/ClaudeErrorBoundary';
import ExportDialog from './components/ExportDialog';
import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import CommandPaletteUI from './components/CommandPalette/CommandPaletteUI';
import {
  StorageRecoveryBanner,
  OfflineBanner,
  useStorageRecovery,
} from './components/Recovery/StorageRecoveryBanner';
import { useAppContext } from './context/AppContext';
import { connectivityService } from './services/connectivityService';
import { enhancedStorageService } from './services/enhancedStorageService';

interface ConnectivityStatus {
  isOnline: boolean;
  queuedWrites: number;
}

const App: React.FC = () => {
  const { claude, currentProject } = useAppContext();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showOfflineQueue, setShowOfflineQueue] = useState(false);

  // Storage recovery state
  const { showRecoveryBanner, dismissRecoveryBanner } = useStorageRecovery();

  // Connectivity state
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>({
    isOnline: true,
    queuedWrites: 0,
  });

  // Initialize connectivity monitoring
  useEffect(() => {
    const unsubscribe = connectivityService.onStatusChange((status) => {
      setConnectivityStatus({
        isOnline: status.isOnline,
        queuedWrites: status.queuedWrites,
      });
    });

    // Initial status
    const initialStatus = connectivityService.getStatus();
    setConnectivityStatus({
      isOnline: initialStatus.isOnline,
      queuedWrites: initialStatus.queuedWrites,
    });

    return unsubscribe;
  }, []);

  // Perform maintenance check on app start
  useEffect(() => {
    const performStartupMaintenance = async () => {
      try {
        const result = await enhancedStorageService.performMaintenance();
        if (result.actions.length > 0) {
          console.log('Startup maintenance completed:', result.actions);
        }
      } catch (error) {
        console.warn('Startup maintenance failed:', error);
      }
    };

    // Run maintenance after a short delay to avoid blocking startup
    const timeoutId = setTimeout(performStartupMaintenance, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Export dialog controls
  const openExportDialog = () => setIsExportDialogOpen(true);
  const closeExportDialog = () => setIsExportDialogOpen(false);

  // Queue management
  const handleViewQueue = () => {
    setShowOfflineQueue(true);
  };

  const handleDismissOfflineBanner = () => {
    // Optional: Allow users to temporarily hide the offline banner
    // You might want to store this preference in localStorage
  };

  return (
    <CommandPaletteProvider>
      {/* Storage Recovery Banner - Highest priority, appears above everything */}
      {showRecoveryBanner && <StorageRecoveryBanner onDismiss={dismissRecoveryBanner} />}

      {/* Offline Banner - Shows when offline with queued operations */}
      {!connectivityStatus.isOnline && connectivityStatus.queuedWrites > 0 && (
        <OfflineBanner
          queuedOperations={connectivityStatus.queuedWrites}
          onViewQueue={handleViewQueue}
          onDismiss={handleDismissOfflineBanner}
        />
      )}

      <PlatformLayout>
        <ViewSwitcher />
        <ToastContainer />

        {/* Claude Assistant with Error Boundary */}
        {claude.isVisible && (
          <ClaudeErrorBoundary>
            <ClaudeAssistant
              selectedText=""
              onInsertText={(text) => {
                // TODO: Connect this to the current editor
                console.log('Insert text:', text);
              }}
            />
          </ClaudeErrorBoundary>
        )}

        {/* Enhanced Export Dialog with Import Support */}
        {currentProject && (
          <ExportDialog
            isOpen={isExportDialogOpen}
            onClose={closeExportDialog}
            projectId={currentProject.id}
            projectName={currentProject.name}
          />
        )}

        {/* Queue Management Modal */}
        {showOfflineQueue && (
          <OfflineQueueModal isOpen={showOfflineQueue} onClose={() => setShowOfflineQueue(false)} />
        )}

        {/* Command Palette UI */}
        <CommandPaletteUI />

        {/* Global export trigger - you can access this from anywhere */}
        <div style={{ display: 'none' }}>
          <button onClick={openExportDialog} id="global-export-trigger">
            Export
          </button>
        </div>

        {/* Storage Stats Debug Panel (only in development) */}
        {import.meta.env.DEV && <StorageDebugPanel />}
      </PlatformLayout>
    </CommandPaletteProvider>
  );
};

// Optional: Offline Queue Management Modal
const OfflineQueueModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [queuedOperations, setQueuedOperations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const operations = connectivityService.getQueuedOperations();
      setQueuedOperations(operations);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Queued Operations</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {queuedOperations.length === 0 ? (
            <p className="text-gray-500">No operations queued</p>
          ) : (
            queuedOperations.map((op) => (
              <div key={op.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="text-sm font-medium">{op.operation}</div>
                <div className="text-xs text-gray-500">
                  {new Date(op.timestamp).toLocaleTimeString()}
                  {op.retryCount > 0 && ` (Retry ${op.retryCount})`}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={async () => {
              await connectivityService.clearQueue();
              setQueuedOperations([]);
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Queue
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Optional: Development Storage Debug Panel
const StorageDebugPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshStats = async () => {
    try {
      const storageStats = await enhancedStorageService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 text-left hover:bg-gray-800 rounded-lg"
        >
          📊 Storage: {(stats.storageUsed / 1024 / 1024).toFixed(1)}MB
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-1 border-t border-gray-700 pt-2">
            <div>Projects: {stats.totalProjects}</div>
            <div>Words: {stats.totalWordCount.toLocaleString()}</div>
            <div>Sessions: {stats.writingSessions}</div>
            <div>Snapshots: {stats.snapshotCount}</div>
            <div>
              Usage:{' '}
              {stats.quotaInfo ? `${(stats.quotaInfo.percentUsed * 100).toFixed(1)}%` : 'Unknown'}
            </div>
            <button
              onClick={async () => {
                const result = await enhancedStorageService.performMaintenance();
                console.log('Manual maintenance:', result);
                refreshStats();
              }}
              className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Run Maintenance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
