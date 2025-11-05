/**
 * User Persistence Service
 *
 * Central service for managing user-defined data persistence preferences.
 * Allows users to control where and how their writing data is stored.
 */

import { supabase } from '@/lib/supabaseClient';
import {
  type PersistenceMode,
  type PersistenceSettings,
  type PersistenceStatus,
  type PersistenceMigration,
  type PersistenceCapabilities,
  type DataSyncEvent,
  DEFAULT_PERSISTENCE_SETTINGS,
} from '@/types/persistenceConfig';
import devLog from '@/utils/devLog';
import { isLikelyPrivateMode } from '@/utils/storage/privateMode';

const STORAGE_KEY_SETTINGS = 'inkwell_persistence_settings';
const STORAGE_KEY_MIGRATION = 'inkwell_persistence_migration';

class UserPersistenceService {
  private settings: PersistenceSettings;
  private listeners: Set<(settings: PersistenceSettings) => void> = new Set();
  private syncListeners: Set<(event: DataSyncEvent) => void> = new Set();
  private migrationInProgress: PersistenceMigration | null = null;

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Get current persistence settings
   */
  getSettings(): PersistenceSettings {
    return { ...this.settings };
  }

  /**
   * Get current persistence mode
   */
  getMode(): PersistenceMode {
    return this.settings.mode;
  }

  /**
   * Update persistence settings
   */
  async updateSettings(updates: Partial<PersistenceSettings>): Promise<void> {
    const newSettings = { ...this.settings, ...updates };

    // Validate settings before applying
    const validation = await this.validateSettings(newSettings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
    }

    // Check if mode is changing
    const modeChanging = updates.mode && updates.mode !== this.settings.mode;

    if (modeChanging) {
      // Trigger migration if needed
      await this.migrateMode(this.settings.mode, updates.mode!);
    }

    this.settings = newSettings;
    this.saveSettings();
    this.notifyListeners();

    devLog.log('Persistence settings updated:', { updates });
  }

  /**
   * Set persistence mode
   */
  async setMode(mode: PersistenceMode): Promise<void> {
    await this.updateSettings({ mode });
  }

  /**
   * Get current persistence status
   */
  async getStatus(): Promise<PersistenceStatus> {
    const capabilities = await this.getCapabilities();
    const localQuota = await this.getLocalStorageQuota();

    return {
      mode: this.settings.mode,
      isSyncing: false, // Will be implemented with sync manager
      lastSyncStatus: this.settings.lastSyncAt ? 'success' : null,
      lastSyncError: null,
      localStorageUsed: localQuota.usage,
      localStorageAvailable: localQuota.quota,
      cloudStorageUsed: null, // TODO: Implement cloud storage tracking
      cloudStorageAvailable: null,
      pendingSyncItems: 0, // TODO: Implement with sync queue
      isCloudConnected: capabilities.cloudAccessible,
      isAuthenticated: await this.isAuthenticated(),
    };
  }

  /**
   * Get device/browser capabilities
   */
  async getCapabilities(): Promise<PersistenceCapabilities> {
    const hasIndexedDB = 'indexedDB' in window;
    const hasLocalStorage = this.checkLocalStorage();
    const isPrivate = await isLikelyPrivateMode();
    const isPersistent = await this.checkPersistence();
    const cloudAccessible = await this.checkCloudAccess();
    const cloudAuthAvailable = Boolean(supabase);

    let localQuota = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        localQuota = estimate.quota || null;
      } catch (error) {
        devLog.warn('Failed to estimate storage quota:', error);
      }
    }

    return {
      supportsLocalOnly: hasIndexedDB || hasLocalStorage,
      supportsCloudSync: cloudAccessible && cloudAuthAvailable,
      supportsHybrid: (hasIndexedDB || hasLocalStorage) && cloudAccessible,
      hasIndexedDB,
      hasLocalStorage,
      localQuota,
      isPrivateMode: isPrivate,
      isPersistent,
      cloudAuthAvailable,
      cloudAccessible,
    };
  }

  /**
   * Migrate data between persistence modes
   */
  private async migrateMode(from: PersistenceMode, to: PersistenceMode): Promise<void> {
    devLog.log('Starting persistence mode migration:', { from, to });

    const migration: PersistenceMigration = {
      from,
      to,
      startedAt: Date.now(),
      completedAt: null,
      status: 'in-progress',
      totalItems: 0,
      migratedItems: 0,
      errors: [],
      warnings: [],
    };

    this.migrationInProgress = migration;
    this.saveMigration(migration);

    try {
      // Migration logic based on mode change
      if (from === 'local-only' && to === 'cloud-sync') {
        await this.migrateLocalToCloud();
      } else if (from === 'cloud-sync' && to === 'local-only') {
        await this.migrateCloudToLocal();
      } else if (to === 'hybrid') {
        // Hybrid mode works with both, so just enable cloud backup
        await this.enableCloudBackup();
      }

      migration.status = 'completed';
      migration.completedAt = Date.now();
    } catch (error) {
      migration.status = 'failed';
      migration.errors.push(error instanceof Error ? error.message : 'Unknown error');
      devLog.error('Migration failed:', error);
      throw error;
    } finally {
      this.migrationInProgress = null;
      this.saveMigration(migration);
    }
  }

  /**
   * Migrate from local-only to cloud sync
   */
  private async migrateLocalToCloud(): Promise<void> {
    devLog.log('Migrating data from local to cloud...');

    // Check authentication
    if (!(await this.isAuthenticated())) {
      throw new Error('Cloud sync requires authentication');
    }

    // TODO: Implement actual migration logic
    // 1. Load all projects from localStorage/IndexedDB
    // 2. Upload to Supabase
    // 3. Verify upload success
    // 4. Mark local data as synced

    devLog.log('Local to cloud migration completed');
  }

  /**
   * Migrate from cloud sync to local-only
   */
  private async migrateCloudToLocal(): Promise<void> {
    devLog.log('Migrating data from cloud to local...');

    // TODO: Implement actual migration logic
    // 1. Download all projects from Supabase
    // 2. Save to localStorage/IndexedDB
    // 3. Verify save success
    // 4. Optionally clear cloud data

    devLog.log('Cloud to local migration completed');
  }

  /**
   * Enable cloud backup for hybrid mode
   */
  private async enableCloudBackup(): Promise<void> {
    devLog.log('Enabling cloud backup...');

    if (!(await this.isAuthenticated())) {
      devLog.warn('Cloud backup enabled but user not authenticated');
      return;
    }

    // TODO: Implement backup logic
    // Hybrid mode keeps working locally but backs up to cloud periodically
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(callback: (settings: PersistenceSettings) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to sync events
   */
  subscribeSyncEvents(callback: (event: DataSyncEvent) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  /**
   * Trigger manual sync (for cloud-sync and hybrid modes)
   */
  async triggerSync(): Promise<void> {
    if (this.settings.mode === 'local-only') {
      devLog.warn('Manual sync called in local-only mode');
      return;
    }

    const event: DataSyncEvent = {
      type: 'sync-start',
      timestamp: Date.now(),
      mode: this.settings.mode,
    };
    this.notifySyncListeners(event);

    try {
      // TODO: Implement actual sync logic
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Placeholder

      const completeEvent: DataSyncEvent = {
        type: 'sync-complete',
        timestamp: Date.now(),
        mode: this.settings.mode,
        itemCount: 0, // TODO: Track actual item count
      };
      this.notifySyncListeners(completeEvent);

      // Update last sync time
      this.settings.lastSyncAt = Date.now();
      this.saveSettings();
    } catch (error) {
      const errorEvent: DataSyncEvent = {
        type: 'sync-error',
        timestamp: Date.now(),
        mode: this.settings.mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.notifySyncListeners(errorEvent);
      throw error;
    }
  }

  /**
   * Trigger manual backup (for hybrid mode)
   */
  async triggerBackup(): Promise<void> {
    if (this.settings.mode !== 'hybrid' || !this.settings.cloudBackupEnabled) {
      devLog.warn('Manual backup called but not applicable');
      return;
    }

    const event: DataSyncEvent = {
      type: 'backup-start',
      timestamp: Date.now(),
      mode: this.settings.mode,
    };
    this.notifySyncListeners(event);

    try {
      // TODO: Implement actual backup logic
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Placeholder

      const completeEvent: DataSyncEvent = {
        type: 'backup-complete',
        timestamp: Date.now(),
        mode: this.settings.mode,
        itemCount: 0, // TODO: Track actual item count
      };
      this.notifySyncListeners(completeEvent);

      // Update last backup time
      this.settings.lastBackupAt = Date.now();
      this.saveSettings();
    } catch (error) {
      const errorEvent: DataSyncEvent = {
        type: 'backup-error',
        timestamp: Date.now(),
        mode: this.settings.mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.notifySyncListeners(errorEvent);
      throw error;
    }
  }

  // ===== Private Helpers =====

  private loadSettings(): PersistenceSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      devLog.warn('Failed to load persistence settings:', error);
    }

    // Return defaults from the imported constant
    return { ...DEFAULT_PERSISTENCE_SETTINGS } as PersistenceSettings;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      devLog.error('Failed to save persistence settings:', error);
    }
  }

  private saveMigration(migration: PersistenceMigration): void {
    try {
      localStorage.setItem(STORAGE_KEY_MIGRATION, JSON.stringify(migration));
    } catch (error) {
      devLog.error('Failed to save migration status:', error);
    }
  }

  private async validateSettings(
    settings: PersistenceSettings,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const capabilities = await this.getCapabilities();

    // Validate mode against capabilities
    if (settings.mode === 'cloud-sync' && !capabilities.supportsCloudSync) {
      errors.push('Cloud sync not available (check authentication and connectivity)');
    }

    if (settings.mode === 'hybrid' && !capabilities.supportsHybrid) {
      errors.push('Hybrid mode not available');
    }

    if (settings.mode === 'local-only' && !capabilities.supportsLocalOnly) {
      errors.push('Local storage not available (private mode or quota exceeded)');
    }

    // Validate sync interval
    if (settings.syncInterval < 1000) {
      errors.push('Sync interval must be at least 1 second');
    }

    // Validate backup interval
    if (settings.backupInterval < 60000) {
      errors.push('Backup interval must be at least 1 minute');
    }

    return { valid: errors.length === 0, errors };
  }

  private checkLocalStorage(): boolean {
    try {
      const testKey = '__inkwell_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private async checkPersistence(): Promise<boolean> {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  private async checkCloudAccess(): Promise<boolean> {
    try {
      // Check if Supabase is configured and accessible
      if (!supabase) return false;

      // Try a simple health check (without authentication)
      const { error } = await supabase.from('projects').select('id').limit(0);

      return !error || error.code === 'PGRST301'; // No auth is fine, just checking connectivity
    } catch {
      return false;
    }
  }

  private async isAuthenticated(): Promise<boolean> {
    try {
      if (!supabase) return false;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session !== null;
    } catch {
      return false;
    }
  }

  private async getLocalStorageQuota(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      } catch (error) {
        devLog.warn('Failed to get storage quota:', error);
      }
    }

    return { usage: 0, quota: 0 };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.settings);
      } catch (error) {
        devLog.error('Error in persistence settings listener:', error);
      }
    });
  }

  private notifySyncListeners(event: DataSyncEvent): void {
    this.syncListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        devLog.error('Error in sync event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const userPersistenceService = new UserPersistenceService();
