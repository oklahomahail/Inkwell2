/**
 * Storage Persistence Utilities
 * Ensures browser storage persists across sessions and won't be automatically cleared
 */

export interface StoragePersistenceResult {
  persisted: boolean;
  requested: boolean;
  supported: boolean;
}

/**
 * Request persistent storage from the browser.
 * This is a best-effort request - browsers may grant or deny based on various factors.
 * Call this once at app boot to maximize chances of storage persistence.
 */
export async function ensurePersistentStorage(): Promise<StoragePersistenceResult> {
  const result: StoragePersistenceResult = {
    persisted: false,
    requested: false,
    supported: false,
  };

  if (!navigator.storage || !navigator.storage.persist) {
    console.warn('[Inkwell] Storage Persistence API not supported by this browser');
    return result;
  }

  result.supported = true;

  try {
    // Check if already persisted
    const persisted = await navigator.storage.persisted();
    if (persisted) {
      result.persisted = true;
      console.log('[Inkwell] Storage is already persistent');
      return result;
    }

    // Request persistence
    result.requested = true;
    const granted = await navigator.storage.persist();
    result.persisted = granted;

    if (granted) {
      console.log('[Inkwell] ✅ Storage persistence granted - your data is safe!');
    } else {
      console.warn(
        '[Inkwell] ⚠️ Storage persistence not granted - data may be cleared if storage pressure occurs',
      );
    }
  } catch (error) {
    console.error('[Inkwell] Failed to request persistent storage:', error);
  }

  return result;
}

/**
 * Check if storage is currently persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (!navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentUsed };
  } catch {
    return null;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
