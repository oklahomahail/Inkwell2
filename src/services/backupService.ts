// src/services/backupService.ts

/** Renamed string union for process status */
export type BackupProcessStatus = 'idle' | 'saving' | 'success' | 'error' | 'retrying';

/** Object describing overall backup stats */
export interface BackupStats {
  totalBackups: number;
  totalSize: string;
  lastBackup: number | null;
  autoBackupEnabled: boolean;
  storageWarning: boolean;
}

/** State of the BackupManager */
export interface BackupManagerState {
  status: BackupProcessStatus;
  lastSuccess: number | null;
  error: string | null;
  retryCount: number;
  retryDelayMs: number;
}

/** Backup data structure */
export interface Backup {
  id: string;
  type?: 'auto' | 'manual' | 'emergency';
  title?: string;
  description?: string;
  data: unknown;
  timestamp: number;
  size?: number;
  isCorrupted?: boolean;
}

type NotifyFn = (message: string, type?: 'info' | 'success' | 'error') => void;

const BACKUPS_KEY = 'app_backups';

// Simple lock mechanism for concurrent operations
let saveLock: Promise<void> | null = null;

// Utility functions
export async function getBackups(): Promise<Backup[]> {
  try {
    const json = localStorage.getItem(BACKUPS_KEY);
    if (!json) return [];
    return JSON.parse(json) as Backup[];
  } catch {
    return [];
  }
}

export async function saveBackup(backup: Backup): Promise<void> {
  // Wait for any pending save operations to complete
  while (saveLock) {
    await saveLock;
  }

  // Create a new lock for this operation
  saveLock = (async () => {
    const backups = await getBackups();
    backups.push(backup);
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
  })();

  try {
    await saveLock;
  } finally {
    saveLock = null;
  }
}

export async function restoreBackup(
  id: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const backups = await getBackups();
    const backup = backups.find((b) => b.id === id);
    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    if (!backup.data || backup.data === null || typeof backup.data !== 'object') {
      return { success: false, error: 'Invalid backup data format' };
    }

    // Check if the backup contains project data or writing chapters
    const data = backup.data as any;

    // Validate that the backup has at least some meaningful data
    const hasProjects = data.projects && Array.isArray(data.projects);
    const hasChapters = data.writingChapters && typeof data.writingChapters === 'object';
    const hasAppData = data.appData && typeof data.appData === 'object';

    if (!hasProjects && !hasChapters && !hasAppData) {
      return { success: false, error: 'Invalid backup data format' };
    }

    // Restore projects if present
    if (data.projects && Array.isArray(data.projects)) {
      try {
        // Create backup of current state first
        const currentProjects = localStorage.getItem('inkwell_enhanced_projects');
        if (currentProjects) {
          const emergencyBackup: Backup = {
            id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'emergency',
            title: 'Emergency Backup Before Restore',
            description: `Automatic backup created before restoring backup ${id}`,
            data: JSON.parse(currentProjects),
            timestamp: Date.now(),
          };
          await saveBackup(emergencyBackup);
        }

        // Restore the project data
        localStorage.setItem('inkwell_enhanced_projects', JSON.stringify(data.projects));
      } catch (error) {
        return {
          success: false,
          error: `Failed to restore projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Restore writing chapters if present
    if (data.writingChapters && typeof data.writingChapters === 'object') {
      try {
        for (const [projectId, chapters] of Object.entries(data.writingChapters)) {
          if (Array.isArray(chapters)) {
            const key = `inkwell_writing_chapters_${projectId}`;
            // Create emergency backup of current writing data
            const currentChapters = localStorage.getItem(key);
            if (currentChapters) {
              const emergencyBackup: Backup = {
                id: `emergency_chapters_${projectId}_${Date.now()}`,
                type: 'emergency',
                title: `Emergency Writing Backup - ${projectId}`,
                description: `Automatic backup of writing chapters before restore`,
                data: { projectId, chapters: JSON.parse(currentChapters) },
                timestamp: Date.now(),
              };
              await saveBackup(emergencyBackup);
            }

            localStorage.setItem(key, JSON.stringify(chapters));
          }
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to restore writing chapters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Restore general app data if present
    if (data.appData && typeof data.appData === 'object') {
      try {
        for (const [key, value] of Object.entries(data.appData)) {
          if (key.startsWith('inkwell_')) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        }
      } catch (error) {
        console.warn('Failed to restore some app data:', error);
      }
    }

    // Trigger a page reload to refresh the app state
    // This ensures all components pick up the restored data
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return {
      success: true,
      message: 'Backup restored successfully! The page will reload to apply changes.',
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deleteBackup(
  id: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    let backups = await getBackups();
    const initialLength = backups.length;
    backups = backups.filter((b) => b.id !== id);

    if (backups.length === initialLength) {
      return { success: false, error: 'Backup not found' };
    }

    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
    return { success: true, message: 'Backup deleted successfully' };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function exportBackup(
  id: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const backups = await getBackups();
    const backup = backups.find((b) => b.id === id);
    if (!backup) return { success: false, error: 'Backup not found' };

    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backup.id}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true, message: 'Backup exported successfully' };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function importBackup(
  file: File,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const text = await file.text();
    const backup: Backup = JSON.parse(text);

    // Validate backup structure
    if (!backup.id || !backup.timestamp || backup.data === undefined) {
      return { success: false, error: 'Invalid backup file format' };
    }

    // Check if backup already exists
    const existingBackups = await getBackups();
    if (existingBackups.some((b) => b.id === backup.id)) {
      return { success: false, error: 'Backup with this ID already exists' };
    }

    await saveBackup(backup);
    return { success: true, message: 'Backup imported successfully' };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message.includes('JSON')
          ? 'Invalid file format'
          : `Failed to import backup: ${error instanceof Error ? error.message : 'Invalid file format'}`,
    };
  }
}

export async function clearAllBackups(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    localStorage.removeItem(BACKUPS_KEY);
    return { success: true, message: 'All backups cleared successfully' };
  } catch (error) {
    return {
      success: false,
      error: `Failed to clear backups: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getBackupStatus(): Promise<BackupStats> {
  const backups = await getBackups();
  // Calculate total size based on individual backup sizes when available, or data size
  const totalSizeBytes =
    backups.length === 0
      ? 0
      : backups.reduce((total, backup) => {
          if (backup.size) return total + backup.size;
          return total + new Blob([JSON.stringify(backup.data)]).size;
        }, 0);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return {
    totalBackups: backups.length,
    totalSize: formatSize(totalSizeBytes),
    lastBackup: backups.length > 0 ? backups[backups.length - 1]!.timestamp : null,
    autoBackupEnabled: false, // TODO: Implement auto-backup functionality
    storageWarning: totalSizeBytes > 4 * 1024 * 1024, // Warn if over 4MB
  };
}

// Auto-backup functionality - Fixed type issue
let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoBackup(
  getAppData: () => string,
  getTitle: () => string,
  intervalMs: number = 300000, // Default 5 minutes
): void {
  if (autoBackupInterval) {
    stopAutoBackup();
  }

  autoBackupInterval = setInterval(async () => {
    try {
      const backup: Backup = {
        id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'auto',
        title: getTitle(),
        description: 'Automatic backup',
        data: getAppData(),
        timestamp: Date.now(),
      };

      await saveBackup(backup);
      console.log('Auto-backup created successfully');
    } catch (error) {
      console.error('Auto-backup failed:', error);
    }
  }, intervalMs);
}

export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
}

export async function createManualBackup(
  data?: unknown,
  title?: string,
  description?: string,
): Promise<{ success: boolean; backup?: Backup; error?: string }> {
  try {
    // If no data provided, create a comprehensive backup of current state
    let backupData = data;
    if (!data) {
      backupData = {
        // Backup all project data
        projects: JSON.parse(localStorage.getItem('inkwell_enhanced_projects') || '[]'),

        // Backup all writing chapters for all projects
        writingChapters: (() => {
          const chapters: Record<string, any> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('inkwell_writing_chapters_')) {
              const projectId = key.replace('inkwell_writing_chapters_', '');
              const data = localStorage.getItem(key);
              if (data) {
                try {
                  chapters[projectId] = JSON.parse(data);
                } catch (error) {
                  console.warn(
                    `Failed to backup writing chapters for project ${projectId}:`,
                    error,
                  );
                }
              }
            }
          }
          return chapters;
        })(),

        // Backup other app data
        appData: (() => {
          const appData: Record<string, any> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              key.startsWith('inkwell_') &&
              !key.startsWith('inkwell_enhanced_projects') &&
              !key.startsWith('inkwell_writing_chapters_')
            ) {
              const data = localStorage.getItem(key);
              if (data) {
                try {
                  appData[key] = JSON.parse(data);
                } catch {
                  // Store as string if it's not JSON
                  appData[key] = data;
                }
              }
            }
          }
          return appData;
        })(),

        // Metadata about the backup
        backupMetadata: {
          version: '1.0',
          createdBy: 'Inkwell Manual Backup',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        },
      };
    }

    const backup: Backup = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'manual',
      title: title || 'Manual Backup',
      description: description || 'User-created comprehensive backup',
      data: backupData,
      timestamp: Date.now(),
      size: new Blob([JSON.stringify(backupData)]).size,
    };

    await saveBackup(backup);
    return { success: true, backup };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Advanced BackupManager class for complex backup operations
export class BackupManager {
  private state: BackupManagerState = {
    status: 'idle',
    lastSuccess: null,
    error: null,
    retryCount: 0,
    retryDelayMs: 1000,
  };

  private isSaving = false;
  private maxRetries = 5;

  constructor(
    private backupFn: () => Promise<void>,
    private notify: NotifyFn,
  ) {}

  public getState(): BackupManagerState {
    return { ...this.state };
  }

  public async listBackups(): Promise<Backup[]> {
    return getBackups();
  }

  public async getStatus(): Promise<BackupStats> {
    return getBackupStatus();
  }

  public async restoreBackup(id: string) {
    return restoreBackup(id);
  }

  public async deleteBackup(id: string) {
    return deleteBackup(id);
  }

  public async exportBackup(id: string) {
    return exportBackup(id);
  }

  public async importBackup(file: File) {
    return importBackup(file);
  }

  public async clearAllBackups() {
    return clearAllBackups();
  }

  public async backup(): Promise<void> {
    if (this.isSaving) {
      this.notify('Backup already in progress. Please wait.', 'info');
      return;
    }

    this.isSaving = true;
    this.updateStatus('saving');
    this.notify('Starting backup...', 'info');

    try {
      await this.backupFn();
      this.updateStatus('success');
      this.state.lastSuccess = Date.now();
      this.state.error = null;
      this.state.retryCount = 0;
      this.state.retryDelayMs = 1000;
      this.notify('Backup successful!', 'success');
    } catch (error: any) {
      this.state.error = error?.message || 'Unknown error';
      this.updateStatus('error');
      this.notify(`Backup failed: ${this.state.error}`, 'error');
      await this.retryBackup();
    } finally {
      this.isSaving = false;
    }
  }

  private async retryBackup(): Promise<void> {
    if (this.state.retryCount >= this.maxRetries) {
      this.notify('Maximum backup retry attempts reached. Please try again later.', 'error');
      return;
    }

    this.state.retryCount++;
    this.updateStatus('retrying');
    this.notify(
      `Retrying backup (#${this.state.retryCount}) in ${this.state.retryDelayMs / 1000} seconds...`,
      'info',
    );

    await this.delay(this.state.retryDelayMs);
    this.state.retryDelayMs *= 2;
    await this.backup();
  }

  private updateStatus(status: BackupProcessStatus): void {
    this.state.status = status;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create and export the service instance
const backupService = new BackupManager(
  () => Promise.resolve(),
  () => {},
);

// Export as default
export default backupService;
