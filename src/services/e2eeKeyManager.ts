/**
 * E2EE Key Manager Service
 *
 * Manages the lifecycle of encryption keys for end-to-end encryption:
 * - DEK (Data Encryption Key) generation and storage
 * - Passphrase-based key derivation (Argon2id/PBKDF2)
 * - Key wrapping/unwrapping with master key
 * - IndexedDB-based key persistence
 * - Recovery Kit generation
 *
 * Architecture:
 * 1. User provides passphrase
 * 2. Derive MK (Master Key) from passphrase using Argon2id
 * 3. Generate random DEK (32 bytes)
 * 4. Wrap DEK with MK and store in IndexedDB
 * 5. Use unwrapped DEK for all data encryption/decryption
 * 6. Generate Recovery Kit for key backup
 */

import type { WrappedKeyRecord, RecoveryKit } from '@/types/crypto';
import devLog from '@/utils/devLog';

import {
  deriveMasterKey,
  generateDEK,
  wrapKey,
  unwrapKey,
  rederiveMK,
  buildRecoveryKit,
} from './cryptoService';

export interface E2EEConfig {
  projectId: string;
  passphrase: string;
  useInteractiveParams?: boolean; // Faster KDF for development
}

export interface KeyMetadata {
  projectId: string;
  wrappedKey: WrappedKeyRecord;
  createdAt: string;
  lastUsed: string;
  version: number;
}

/**
 * E2EE Key Manager
 *
 * Singleton service for managing encryption keys per project
 */
class E2EEKeyManagerService {
  private static readonly DB_NAME = 'inkwell_e2ee_keys';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'wrapped_keys';

  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // In-memory cache of unwrapped DEKs (cleared on lock/logout)
  private dekCache = new Map<string, Uint8Array>();

  // Track ongoing initialization to prevent race conditions
  private initializationLocks = new Map<string, Promise<RecoveryKit>>();

  /**
   * Initialize IndexedDB for key storage
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(
        E2EEKeyManagerService.DB_NAME,
        E2EEKeyManagerService.DB_VERSION,
      );

      request.onerror = () => {
        devLog.error('[E2EEKeyManager] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        devLog.log('[E2EEKeyManager] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for wrapped keys
        if (!db.objectStoreNames.contains(E2EEKeyManagerService.STORE_NAME)) {
          const store = db.createObjectStore(E2EEKeyManagerService.STORE_NAME, {
            keyPath: 'projectId',
          });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
          devLog.log('[E2EEKeyManager] Created wrapped_keys store');
        }
      };
    });

    return this.initPromise;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');
    return this.db;
  }

  /**
   * Initialize E2EE for a project
   * Generates new DEK, wraps it with passphrase-derived MK, and stores metadata
   */
  async initializeProject(config: E2EEConfig): Promise<RecoveryKit> {
    const { projectId, passphrase, useInteractiveParams = false } = config;

    devLog.log('[E2EEKeyManager] Initializing E2EE for project:', projectId);

    // Check if initialization is already in progress (must be synchronous check)
    const existingLock = this.initializationLocks.get(projectId);
    if (existingLock) {
      devLog.warn('[E2EEKeyManager] Initialization already in progress, waiting...');
      return existingLock;
    }

    // Create lock promise for this initialization BEFORE async operations
    const initPromise = (async () => {
      try {
        // Check if already initialized
        const existing = await this.getKeyMetadata(projectId);
        if (existing) {
          throw new Error('Project already has E2EE enabled. Use unlockProject() instead.');
        }

        // Step 1: Derive master key from passphrase
        const { mk, kdf } = await deriveMasterKey({
          passphrase,
          argon2Interactive: useInteractiveParams,
        });

        // Step 2: Generate random DEK
        const dek = await generateDEK();

        // Step 3: Wrap DEK with MK
        const wrappedKey = await wrapKey(dek, mk, kdf);

        // Step 4: Store wrapped key metadata
        const metadata: KeyMetadata = {
          projectId,
          wrappedKey,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          version: 1,
        };

        await this.saveKeyMetadata(metadata);

        // Step 5: Cache unwrapped DEK for immediate use
        this.dekCache.set(projectId, dek);

        // Step 6: Generate recovery kit
        const recoveryKit = buildRecoveryKit(projectId, wrappedKey);

        devLog.log('[E2EEKeyManager] E2EE initialized successfully');

        return recoveryKit;
      } finally {
        // Always clean up lock when done
        this.initializationLocks.delete(projectId);
      }
    })();

    // Store lock
    this.initializationLocks.set(projectId, initPromise);

    return initPromise;
  }

  /**
   * Unlock a project's encryption using passphrase
   * Re-derives MK from passphrase and unwraps DEK
   */
  async unlockProject(projectId: string, passphrase: string): Promise<void> {
    devLog.log('[E2EEKeyManager] Unlocking project:', projectId);

    // Check if already unlocked
    if (this.dekCache.has(projectId)) {
      devLog.debug('[E2EEKeyManager] Project already unlocked');
      return;
    }

    // Get stored wrapped key
    const metadata = await this.getKeyMetadata(projectId);
    if (!metadata) {
      throw new Error('No encryption key found for project. Initialize E2EE first.');
    }

    // Re-derive master key from passphrase
    const mk = await rederiveMK(passphrase, metadata.wrappedKey.kdf_params);

    // Unwrap DEK
    try {
      const dek = await unwrapKey(metadata.wrappedKey, mk);

      // Cache unwrapped DEK
      this.dekCache.set(projectId, dek);

      // Update last used timestamp
      metadata.lastUsed = new Date().toISOString();
      await this.saveKeyMetadata(metadata);

      devLog.log('[E2EEKeyManager] Project unlocked successfully');
    } catch (error) {
      devLog.error('[E2EEKeyManager] Failed to unwrap key - wrong passphrase?', error);
      throw new Error('Failed to unlock project. Incorrect passphrase?');
    }
  }

  /**
   * Lock a project (clear DEK from memory)
   */
  lockProject(projectId: string): void {
    devLog.log('[E2EEKeyManager] Locking project:', projectId);
    this.dekCache.delete(projectId);
  }

  /**
   * Lock all projects (clear all DEKs from memory)
   */
  lockAll(): void {
    devLog.log('[E2EEKeyManager] Locking all projects');
    this.dekCache.clear();
  }

  /**
   * Get unwrapped DEK for a project (must be unlocked first)
   */
  getDEK(projectId: string): Uint8Array {
    const dek = this.dekCache.get(projectId);
    if (!dek) {
      throw new Error('Project is locked. Call unlockProject() first.');
    }
    return dek;
  }

  /**
   * Check if a project is unlocked
   */
  isUnlocked(projectId: string): boolean {
    return this.dekCache.has(projectId);
  }

  /**
   * Check if a project has E2EE enabled
   */
  async isE2EEEnabled(projectId: string): Promise<boolean> {
    const metadata = await this.getKeyMetadata(projectId);
    return metadata !== null;
  }

  /**
   * Import Recovery Kit (restore encryption from backup)
   */
  async importRecoveryKit(recoveryKit: RecoveryKit, passphrase: string): Promise<void> {
    devLog.log('[E2EEKeyManager] Importing Recovery Kit for project:', recoveryKit.project_id);

    // Validate recovery kit format
    if (recoveryKit.inkwell_recovery_kit !== 1) {
      throw new Error('Invalid Recovery Kit format');
    }

    // Re-derive master key from passphrase
    const mk = await rederiveMK(passphrase, recoveryKit.kdf);

    // Reconstruct wrapped key record
    const wrappedKey: WrappedKeyRecord = {
      wrapped_dek: recoveryKit.wrapped_dek,
      kdf_params: recoveryKit.kdf,
      crypto_version: 1,
    };

    // Test unwrapping (validate passphrase)
    try {
      const dek = await unwrapKey(wrappedKey, mk);

      // Store metadata
      const metadata: KeyMetadata = {
        projectId: recoveryKit.project_id,
        wrappedKey,
        createdAt: recoveryKit.created_at,
        lastUsed: new Date().toISOString(),
        version: 1,
      };

      await this.saveKeyMetadata(metadata);

      // Cache DEK
      this.dekCache.set(recoveryKit.project_id, dek);

      devLog.log('[E2EEKeyManager] Recovery Kit imported successfully');
    } catch (error) {
      devLog.error('[E2EEKeyManager] Failed to import Recovery Kit:', error);
      throw new Error('Failed to import Recovery Kit. Incorrect passphrase?');
    }
  }

  /**
   * Export Recovery Kit for backup
   */
  async exportRecoveryKit(projectId: string): Promise<RecoveryKit> {
    const metadata = await this.getKeyMetadata(projectId);
    if (!metadata) {
      throw new Error('No encryption key found for project');
    }

    return buildRecoveryKit(projectId, metadata.wrappedKey);
  }

  /**
   * Change passphrase for a project
   * Re-wraps DEK with new passphrase-derived MK
   */
  async changePassphrase(
    projectId: string,
    oldPassphrase: string,
    newPassphrase: string,
  ): Promise<RecoveryKit> {
    devLog.log('[E2EEKeyManager] Changing passphrase for project:', projectId);

    // Get existing metadata
    const metadata = await this.getKeyMetadata(projectId);
    if (!metadata) {
      throw new Error('No encryption key found for project');
    }

    // Re-derive old MK and unwrap DEK
    const oldMK = await rederiveMK(oldPassphrase, metadata.wrappedKey.kdf_params);
    const dek = await unwrapKey(metadata.wrappedKey, oldMK);

    // Derive new MK from new passphrase
    const { mk: newMK, kdf: newKdf } = await deriveMasterKey({ passphrase: newPassphrase });

    // Re-wrap DEK with new MK
    const newWrappedKey = await wrapKey(dek, newMK, newKdf);

    // Update metadata
    metadata.wrappedKey = newWrappedKey;
    metadata.lastUsed = new Date().toISOString();
    await this.saveKeyMetadata(metadata);

    // Update cache
    this.dekCache.set(projectId, dek);

    devLog.log('[E2EEKeyManager] Passphrase changed successfully');

    return buildRecoveryKit(projectId, newWrappedKey);
  }

  /**
   * Disable E2EE for a project (removes wrapped key)
   * WARNING: This does not decrypt existing data!
   */
  async disableE2EE(projectId: string): Promise<void> {
    devLog.warn('[E2EEKeyManager] Disabling E2EE for project:', projectId);

    const db = await this.getDB();
    const tx = db.transaction(E2EEKeyManagerService.STORE_NAME, 'readwrite');
    const store = tx.objectStore(E2EEKeyManagerService.STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    this.dekCache.delete(projectId);
    devLog.log('[E2EEKeyManager] E2EE disabled');
  }

  /**
   * List all projects with E2EE enabled
   */
  async listE2EEProjects(): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction(E2EEKeyManagerService.STORE_NAME, 'readonly');
    const store = tx.objectStore(E2EEKeyManagerService.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ Private Helper Methods ============

  private async saveKeyMetadata(metadata: KeyMetadata): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(E2EEKeyManagerService.STORE_NAME, 'readwrite');
    const store = tx.objectStore(E2EEKeyManagerService.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getKeyMetadata(projectId: string): Promise<KeyMetadata | null> {
    const db = await this.getDB();
    const tx = db.transaction(E2EEKeyManagerService.STORE_NAME, 'readonly');
    const store = tx.objectStore(E2EEKeyManagerService.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * For testing: reset singleton state
   */
  async _reset(): Promise<void> {
    this.dekCache.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;

    // Delete the database
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(E2EEKeyManagerService.DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const e2eeKeyManager = new E2EEKeyManagerService();
export default e2eeKeyManager;
