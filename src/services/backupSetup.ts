// src/services/backupSetup.ts
// Try importing everything as a namespace first
import * as BackupService from "./backupServices";

// Then destructure what we need
const { BackupManager, saveBackup } = BackupService;
type Backup = BackupService.Backup;

/**
 * Real backup function that creates and saves a backup.
 */
async function performActualBackup(): Promise<void> {
  // Construct a Backup object with proper type literals
  const backup: Backup = {
    id: crypto.randomUUID(),
    type: "manual", // Must be one of the literal union: "manual" | "auto" | "emergency"
    title: `Backup ${new Date().toLocaleString()}`,
    description: "Manual backup from user",
    data: JSON.parse(localStorage.getItem("writing_content") || "{}"),
    timestamp: Date.now(),
    size: undefined,       // Optional: calculate if you want
    isCorrupted: false,    // Optional flag
  };

  // Save the backup using the consolidated backupService
  await saveBackup(backup);
}

/**
 * Simple notification function — replace with your UI toast/snackbar
 */
function notifyUser(message: string, type: "info" | "success" | "error" = "info") {
  console.log(`[${type.toUpperCase()}] Backup: ${message}`);
}

// Create and export the singleton BackupManager instance
export const backupManager = new BackupManager(performActualBackup, notifyUser);

// Manual backup trigger for UI
export async function triggerBackup() {
  await backupManager.backup();
}

// Auto-backup interval ID holder
let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Enable auto backup every intervalMs milliseconds (default 1 minute)
 */
export function setupAutoBackup(intervalMs = 60000) {
  if (autoBackupInterval) clearInterval(autoBackupInterval);
  autoBackupInterval = setInterval(() => {
    backupManager.backup();
  }, intervalMs);
  notifyUser("Auto-backup enabled", "success");
}

/**
 * Disable auto backup
 */
export function stopAutoBackup() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
    notifyUser("Auto-backup disabled", "info");
  }
}

// Re-export useful functions from backupService for convenience
export const {
  getBackups,
  restoreBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  clearAllBackups,
  getBackupStatus,
  createManualBackup,
  startAutoBackup,
  stopAutoBackup: stopAutoBackupService
} = BackupService;