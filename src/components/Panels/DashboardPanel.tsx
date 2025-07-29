// src/components/Panels/DashboardPanel.tsx
import React, { useEffect, useState } from "react";
import { useAppContext, View } from "@/context/AppContext";
import { formatSize } from "@/utils/backupUtils";
import { backupService, Backup } from "@/services/backupCore";

interface ProjectStats {
  wordCount: number;
  backups: number;
  backupSize: string;
}

const DashboardPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const [stats, setStats] = useState<ProjectStats>({
    wordCount: 0,
    backups: 0,
    backupSize: "0 B",
  });
  const [backups, setBackups] = useState<Backup[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);

  /** Fetch backup stats and list */
  const refreshBackups = () => {
    const all = backupService.getBackups();
    const totalSize = all.reduce((acc, b) => acc + b.size, 0);
    setBackups(all);
    setStats((prev) => ({
      ...prev,
      backups: all.length,
      backupSize: formatSize(totalSize),
    }));
  };

  useEffect(() => {
    refreshBackups();
  }, []);

  /** Restore backup into app (dispatch or alert) */
  const handleRestore = (id: string) => {
    const restored = backupService.restoreBackup(id);
    if (restored) {
      alert(`Restored "${restored.title}" (apply to editor manually)`);
      // You could dispatch an event or integrate with WritingPanel here
    }
  };

  const handleDelete = (id: string) => {
    backupService.deleteBackup(id);
    refreshBackups();
  };

  const handleClearAll = () => {
    if (window.confirm("Clear ALL backups? This cannot be undone.")) {
      backupService.clearBackups();
      refreshBackups();
    }
  };

  /** Toggle auto-backup on/off (hooked to WritingPanel content/title) */
  const toggleAutoBackup = () => {
    if (!autoBackupEnabled) {
      // Dummy hooks — replace with real hooks from WritingPanel when integrated
      backupService.startAutoBackup(
        () => localStorage.getItem("writing_content") || "",
        () => "AutoBackup Draft",
        180000 // every 3 minutes
      );
    } else {
      backupService.stopAutoBackup();
    }
    setAutoBackupEnabled(!autoBackupEnabled);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Current View: {state.view}
      </p>

      {/* Backup Summary */}
      <div className="border rounded p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold">Backup Summary</h3>
        <p>Total Backups: {stats.backups}</p>
        <p>Total Size: {stats.backupSize}</p>
        <button
          onClick={toggleAutoBackup}
          className="px-4 py-2 mt-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {autoBackupEnabled ? "Stop Auto-Backup" : "Start Auto-Backup"}
        </button>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 mt-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
        >
          Clear All Backups
        </button>
      </div>

      {/* Backup List */}
      <div className="border rounded p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold mb-2">Saved Backups</h3>
        {backups.length === 0 ? (
          <p className="text-gray-500">No backups available.</p>
        ) : (
          <ul className="space-y-2">
            {backups.map((b) => (
              <li
                key={b.id}
                className="flex justify-between items-center border rounded p-2 bg-gray-100 dark:bg-gray-700"
              >
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.timestamp).toLocaleString()} —{" "}
                    {formatSize(b.size)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(b.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: "SET_VIEW", payload: View.Writing })}
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Go to Writing Panel
      </button>
    </div>
  );
};

export default DashboardPanel;
