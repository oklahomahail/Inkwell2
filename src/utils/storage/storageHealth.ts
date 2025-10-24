/**
 * Storage Health Monitoring
 * Combines all storage checks into a comprehensive health report
 */

import { formatBytes, getStorageQuota, isStoragePersisted } from './persistence';
import { isLikelyPrivateMode, isRestrictedStorage } from './privateMode';

export interface StorageHealth {
  // Database info
  dbName: string;
  dbVersion: number;
  dbExists: boolean;

  // Persistence status
  persisted: boolean;
  privateMode: boolean;
  restricted: boolean;

  // Quota info
  usage: number;
  quota: number;
  percentUsed: number;
  usageFormatted: string;
  quotaFormatted: string;

  // Environment
  origin: string;
  isProduction: boolean;

  // Timestamps
  lastChecked: string;
  lastAutosaveAt?: string;

  // Overall health
  healthy: boolean;
  warnings: string[];
}

const DB_NAME = 'inkwell_v1';
const DB_VERSION = 3;
const EXPECTED_PROD_ORIGIN = 'https://inkwell.leadwithnexus.com';

/**
 * Check if IndexedDB database exists
 */
async function checkDatabaseExists(dbName: string): Promise<boolean> {
  if (!indexedDB.databases) {
    // Fallback: try to open and check
    return new Promise((resolve) => {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => {
        const exists = req.result.objectStoreNames.length > 0;
        req.result.close();
        resolve(exists);
      };
      req.onerror = () => resolve(false);
    });
  }

  const databases = await indexedDB.databases();
  return databases.some((db) => db.name === dbName);
}

/**
 * Get comprehensive storage health status
 */
export async function getStorageHealth(): Promise<StorageHealth> {
  const [persisted, privateMode, restricted, quotaInfo, dbExists] = await Promise.all([
    isStoragePersisted(),
    isLikelyPrivateMode(),
    isRestrictedStorage(),
    getStorageQuota(),
    checkDatabaseExists(DB_NAME),
  ]);

  const usage = quotaInfo?.usage || 0;
  const quota = quotaInfo?.quota || 0;
  const percentUsed = quotaInfo?.percentUsed || 0;

  const warnings: string[] = [];
  let healthy = true;

  // Check for issues
  if (privateMode) {
    warnings.push('Running in private/incognito mode - data will be lost when window closes');
    healthy = false;
  }

  if (!persisted && !privateMode) {
    warnings.push('Storage not persistent - may be cleared under storage pressure');
    healthy = false;
  }

  if (restricted) {
    warnings.push('Storage quota is severely limited');
    healthy = false;
  }

  if (percentUsed > 80) {
    warnings.push(`Storage is ${Math.round(percentUsed)}% full`);
    healthy = false;
  }

  if (!dbExists) {
    warnings.push('Database not yet initialized');
  }

  const origin = window.location.origin;
  const isProduction = origin === EXPECTED_PROD_ORIGIN;

  if (import.meta.env.PROD && !isProduction) {
    warnings.push(`Running on unexpected origin: ${origin}`);
  }

  // Try to get last autosave timestamp from localStorage
  let lastAutosaveAt: string | undefined;
  try {
    const stored = localStorage.getItem('inkwell:lastAutosave');
    if (stored) {
      lastAutosaveAt = stored;
    }
  } catch {
    // Ignore
  }

  return {
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    dbExists,
    persisted,
    privateMode,
    restricted,
    usage,
    quota,
    percentUsed,
    usageFormatted: formatBytes(usage),
    quotaFormatted: formatBytes(quota),
    origin,
    isProduction,
    lastChecked: new Date().toISOString(),
    lastAutosaveAt,
    healthy,
    warnings,
  };
}

/**
 * Get a simplified health status for UI display
 */
export async function getSimpleStorageStatus(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: string;
}> {
  const health = await getStorageHealth();

  if (health.privateMode) {
    return {
      status: 'critical',
      message: 'Private Mode',
      details: 'Data will be deleted when you close this window',
    };
  }

  if (!health.persisted) {
    return {
      status: 'warning',
      message: 'Storage Not Persistent',
      details: 'Data may be cleared if browser runs low on space',
    };
  }

  if (health.percentUsed > 90) {
    return {
      status: 'critical',
      message: 'Storage Almost Full',
      details: `${Math.round(health.percentUsed)}% of quota used`,
    };
  }

  if (health.percentUsed > 75) {
    return {
      status: 'warning',
      message: 'Storage Filling Up',
      details: `${Math.round(health.percentUsed)}% of quota used`,
    };
  }

  return {
    status: 'healthy',
    message: 'Storage OK',
    details: `${health.usageFormatted} of ${health.quotaFormatted} used`,
  };
}

/**
 * Subscribe to storage health changes
 */
export function watchStorageHealth(
  callback: (health: StorageHealth) => void,
  intervalMs: number = 60000, // Check every minute
): () => void {
  let active = true;

  const check = async () => {
    if (!active) return;
    const health = await getStorageHealth();
    callback(health);
  };

  // Initial check
  check();

  // Periodic checks
  const interval = setInterval(check, intervalMs);

  // Cleanup
  return () => {
    active = false;
    clearInterval(interval);
  };
}
