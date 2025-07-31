// src/services/backupSetup.ts
import { BackupManager, saveBackup, type Backup } from "./backupService";

async function performActualBackup(): Promise<void> {
  const backup: Backup = {
    id: crypto.randomUUID(),
    type: "manual",
    title: `Backup ${new Date().toLocaleString()}`,
    description: "Manual backup from user",
    data: JSON.parse(localStorage.getItem("writing_content") || "{}"),
    timestamp: Date.now(),
    size: undefined,
    isCorrupted: false,
  };
  await saveBackup(backup);
}

function notifyUser(message: string, type: "info" | "success" | "error" = "info") {
  console.log(`[${type.toUpperCase()}] Backup: ${message}`);
}

export const backupManager = new BackupManager(performActualBackup, notifyUser);

export async function triggerBackup() {
  await backupManager.backup();
}

export function initializeBackupSystem() {
  console.log("Backup system initialized");
}

export function cleanupBackupSystem() {
  console.log("Backup system cleaned up");
}

let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

export function setupAutoBackup(intervalMs = 60000) {
  if (autoBackupInterval) clearInterval(autoBackupInterval);
  autoBackupInterval = setInterval(() => {
    backupManager.backup();
  }, intervalMs);
  notifyUser("Auto-backup enabled", "success");
}

export function stopAutoBackup() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
    notifyUser("Auto-backup disabled", "info");
  }
}

export {
  getBackups,
  restoreBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  clearAllBackups,
  getBackupStatus,
  createManualBackup,
  startAutoBackup,
  stopAutoBackup as stopAutoBackupService
} from "./backupService";
