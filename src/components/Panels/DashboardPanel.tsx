// src/components/Panels/DashboardPanel.tsx
import React, { useEffect, useState, useCallback } from "react";

// Contexts
import { useAppContext, View } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";

// Backup services and types
import {
  backupManager,
  triggerBackup,
  setupAutoBackup,
  stopAutoBackup,
} from "@/services/backupSetup";
import type { Backup } from "@/services/backupService";
import { getBackups, getBackupStatus } from "@/services/backupService";

interface ProjectStats {
  wordCount: number;
  backups: number;
  backupSize: string;
  lastBackup: number | null;
}

interface BackupStatus {
  totalBackups: number;
  totalSize: string;
  lastBackup: number | null;
  autoBackupEnabled: boolean;
  storageWarning: boolean;
}

const DashboardPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();

  const [stats, setStats] = useState<ProjectStats>({
    wordCount: 0,
    backups: 0,
    backupSize: "0 B",
    lastBackup: null,
  });

  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    totalBackups: 0,
    totalSize: "0 B",
    lastBackup: null,
    autoBackupEnabled: false,
    storageWarning: false,
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Refresh backups data and stats
  const refreshBackups = useCallback(async () => {
    try {
      const backupList = await getBackups();
      const status = await getBackupStatus();

      setBackups(backupList);
      setBackupStatus(status);
      setStats((prev) => ({
        ...prev,
        backups: status.totalBackups,
        backupSize: status.totalSize,
        lastBackup: status.lastBackup,
      }));
    } catch (error) {
      console.error("Failed to refresh backups:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    refreshBackups();
  }, [refreshBackups]);

  // Create backup handler
  const handleCreateBackup = useCallback(async () => {
    if (isCreatingBackup) return;
    
    setIsCreatingBackup(true);
    try {
      await triggerBackup();
      showToast("Backup created successfully", "success");
      await refreshBackups();
    } catch (error) {
      console.error("Failed to create backup:", error);
      showToast("Failed to create backup", "error");
    } finally {
      setIsCreatingBackup(false);
    }
  }, [isCreatingBackup, showToast, refreshBackups]);

  // Delete backup handler
  const handleDeleteBackup = useCallback(async (backupId: string) => {
    try {
      const result = await backupManager.deleteBackup(backupId);
      if (result?.success) {
        showToast("Backup deleted successfully", "success");
        await refreshBackups();
      } else {
        showToast("Failed to delete backup", "error");
      }
    } catch (error) {
      console.error("Failed to delete backup:", error);
      showToast("Failed to delete backup", "error");
    }
  }, [showToast, refreshBackups]);

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Project: {state.currentProject}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Word Count
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.wordCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Backups
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.backups}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Backup Size
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.backupSize}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Last Backup
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(stats.lastBackup)}
          </div>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Backup Management
            </h2>
            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </button>
          </div>
        </div>

        <div className="p-4">
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No backups found. Create your first backup to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {backups.slice(0, 5).map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {backup.title || "Untitled Backup"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(backup.timestamp)} • {formatSize(backup.size)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      backup.type === 'auto' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {backup.type || 'manual'}
                    </span>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: View.Writing })}
              className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                Continue Writing
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Resume your current project
              </div>
            </button>
            
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: View.Timeline })}
              className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                View Timeline
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Check your story progress
              </div>
            </button>
            
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: View.Analysis })}
              className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                Analytics
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                View writing analytics
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;