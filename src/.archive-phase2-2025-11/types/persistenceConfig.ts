/**
 * User-Defined Data Persistence Configuration Types
 *
 * This module defines the types for user-controlled data storage,
 * allowing users to choose where and how their writing data is stored.
 */

export enum PersistenceMode {
  /** All data stored locally in IndexedDB + LocalStorage only */
  LOCAL_ONLY = 'local-only',

  /** All data synced to cloud (Supabase), with local cache */
  CLOUD_SYNC = 'cloud-sync',

  /** Hybrid: local-first with optional cloud backup */
  HYBRID = 'hybrid',
}

export interface PersistenceSettings {
  /** Current persistence mode */
  mode: PersistenceMode;

  /** Auto-sync enabled (for cloud-sync and hybrid modes) */
  autoSync: boolean;

  /** Sync interval in milliseconds */
  syncInterval: number;

  /** Last successful sync timestamp */
  lastSyncAt: number | null;

  /** Cloud backup enabled (for hybrid mode) */
  cloudBackupEnabled: boolean;

  /** Backup frequency in milliseconds */
  backupInterval: number;

  /** Last successful backup timestamp */
  lastBackupAt: number | null;

  /** User preference for data export location */
  exportPreference: 'local' | 'cloud' | 'both';

  /** Encryption enabled for local storage */
  localEncryption: boolean;

  /** Encryption enabled for cloud storage */
  cloudEncryption: boolean;
}

export interface PersistenceStatus {
  /** Current mode */
  mode: PersistenceMode;

  /** Is currently syncing */
  isSyncing: boolean;

  /** Last sync result */
  lastSyncStatus: 'success' | 'error' | 'pending' | null;

  /** Last sync error message */
  lastSyncError: string | null;

  /** Local storage usage */
  localStorageUsed: number;

  /** Local storage available */
  localStorageAvailable: number;

  /** Cloud storage used (if applicable) */
  cloudStorageUsed: number | null;

  /** Cloud storage available (if applicable) */
  cloudStorageAvailable: number | null;

  /** Number of items pending sync */
  pendingSyncItems: number;

  /** Is connected to cloud (if applicable) */
  isCloudConnected: boolean;

  /** User authenticated for cloud (if applicable) */
  isAuthenticated: boolean;
}

export interface PersistenceMigration {
  /** Source mode */
  from: PersistenceMode;

  /** Target mode */
  to: PersistenceMode;

  /** Migration started timestamp */
  startedAt: number;

  /** Migration completed timestamp */
  completedAt: number | null;

  /** Migration status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /** Total items to migrate */
  totalItems: number;

  /** Items migrated */
  migratedItems: number;

  /** Migration errors */
  errors: string[];

  /** Migration warnings */
  warnings: string[];
}

export interface PersistenceCapabilities {
  /** Supports local-only mode */
  supportsLocalOnly: boolean;

  /** Supports cloud sync */
  supportsCloudSync: boolean;

  /** Supports hybrid mode */
  supportsHybrid: boolean;

  /** IndexedDB available */
  hasIndexedDB: boolean;

  /** LocalStorage available */
  hasLocalStorage: boolean;

  /** Estimated local storage quota */
  localQuota: number | null;

  /** In private/incognito mode */
  isPrivateMode: boolean;

  /** Storage persistence granted */
  isPersistent: boolean;

  /** Cloud authentication available */
  cloudAuthAvailable: boolean;

  /** Cloud storage accessible */
  cloudAccessible: boolean;
}

export interface DataSyncEvent {
  /** Event type */
  type:
    | 'sync-start'
    | 'sync-complete'
    | 'sync-error'
    | 'backup-start'
    | 'backup-complete'
    | 'backup-error';

  /** Event timestamp */
  timestamp: number;

  /** Associated mode */
  mode: PersistenceMode;

  /** Number of items synced/backed up */
  itemCount?: number;

  /** Error message if applicable */
  error?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export const DEFAULT_PERSISTENCE_SETTINGS: PersistenceSettings = {
  mode: PersistenceMode.LOCAL_ONLY,
  autoSync: false,
  syncInterval: 5 * 60 * 1000, // 5 minutes
  lastSyncAt: null,
  cloudBackupEnabled: false,
  backupInterval: 24 * 60 * 60 * 1000, // 24 hours
  lastBackupAt: null,
  exportPreference: 'local',
  localEncryption: false,
  cloudEncryption: false,
};
