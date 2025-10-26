/**
 * Storage Health Monitoring
 * Combines all storage checks into a comprehensive health report
 */

import { formatBytes, getStorageQuota, isStoragePersisted } from './persistence';
import { isLikelyPrivateMode, isRestrictedStorage } from './privateMode';

/**
 * Check if IndexedDB is available in the current environment
 * @returns true if indexedDB is available, false otherwise
 */
function hasIDB(): boolean {
  // Avoid ReferenceError in SSR/tests
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}

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

export const DB_NAME = 'inkwell_v1';
export const DB_VERSION = 3;
const EXPECTED_PROD_ORIGIN = 'https://inkwell.leadwithnexus.com';

/**
 * Check whether an IndexedDB database exists.
 * Must not throw in non-browser or test environments.
 */
async function checkDatabaseExists(dbName: string): Promise<boolean> {
  if (!hasIDB()) return false;

  const idb: IDBFactory = (globalThis as any).indexedDB;

  // Some browsers (Chromium) expose non-standard indexedDB.databases()

  const maybeDatabases = (idb as any).databases;

  if (typeof maybeDatabases === 'function') {
    try {
      const dbs = await maybeDatabases.call(idb);
      return Array.isArray(dbs) && dbs.some((d: { name?: string }) => d?.name === dbName);
    } catch {
      // Fall through to open-probe
    }
  }

  // Fallback: try open/close without creating schema
  return new Promise((resolve) => {
    let existed = true;
    // Open without version to avoid upgrade if present
    const req = idb.open(dbName);
    req.onupgradeneeded = () => {
      existed = false;
    };
    req.onsuccess = () => {
      req.result.close();
      resolve(existed);
    };
    req.onerror = () => resolve(false);
    // Some engines fire onblocked; treat as not existing to be safe in tests
    req.onblocked = () => resolve(false);
  });
}

/**
 * Get comprehensive storage health status
 */
export async function getStorageHealth(): Promise<StorageHealth> {
  // Early return when IndexedDB is not available (SSR, tests, etc.)
  if (!hasIDB()) {
    return {
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      dbExists: false,
      persisted: false,
      privateMode: false,
      restricted: false,
      usage: 0,
      quota: 0,
      percentUsed: 0,
      usageFormatted: '0 B',
      quotaFormatted: '0 B',
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      isProduction: false,
      lastChecked: new Date().toISOString(),
      lastAutosaveAt: undefined,
      healthy: false,
      warnings: ['IndexedDB not available in this environment'],
    };
  }

  const [persisted, privateMode, restricted, quotaInfo, dbExists] = await Promise.all([
    isStoragePersisted(),
    isLikelyPrivateMode(),
    isRestrictedStorage(),
    getStorageQuota().catch(() => null), // Don't let quota errors break the whole health check
    checkDatabaseExists(DB_NAME).catch(() => false), // Don't let DB check errors break health
  ]);

  const usage = quotaInfo?.usage || 0;
  const quota = quotaInfo?.quota || 0;
  const percentUsed = quotaInfo?.percentUsed || 0;

  const warnings: string[] = [];

  // Threshold logic expected by tests:
  // < 70% => healthy
  // 70-90% => not healthy (for backwards compat)
  // > 90% => critical/not healthy
  let healthy = percentUsed < 70;

  // Check for issues - these affect 'healthy' flag
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

  // Storage usage warnings with exact messages expected by comprehensive tests
  if (percentUsed > 90) {
    warnings.push('Storage usage is critically high (>90%)');
    healthy = false;
  } else if (percentUsed >= 70 && percentUsed <= 90) {
    warnings.push(`Storage is ${Math.round(percentUsed)}% full`);
    healthy = false;
  }

  // Check for quota estimation errors
  if (quotaInfo === null && typeof navigator !== 'undefined' && navigator.storage) {
    warnings.push('Could not estimate storage quota');
  }

  if (!dbExists && hasIDB()) {
    warnings.push('Database not yet initialized');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
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

  // Precedence for simple status:
  // 1. Private mode is critical (takes highest priority)
  // 2. Percentage > 90% is critical
  // 3. Percentage >= 70% is warning
  // 4. Not persisted is warning (only if usage is OK)
  // 5. Otherwise healthy

  if (health.privateMode) {
    return {
      status: 'critical',
      message: 'Private Mode',
      details: 'Data will be deleted when you close this window',
    };
  }

  if (health.percentUsed > 90) {
    return {
      status: 'critical',
      message: 'Almost Full',
      details: `${Math.round(health.percentUsed)}% of quota used`,
    };
  }

  if (health.percentUsed >= 70) {
    return {
      status: 'warning',
      message: 'Filling Up',
      details: `${Math.round(health.percentUsed)}% of quota used`,
    };
  }

  if (!health.persisted) {
    return {
      status: 'warning',
      message: 'Not Persistent',
      details: 'Data may be cleared if browser runs low on space',
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
