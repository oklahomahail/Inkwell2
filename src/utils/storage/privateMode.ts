/**
 * Private Mode Detection Utilities
 * Detects if the app is running in incognito/private browsing mode
 */

/**
 * Detect if the browser is likely in private/incognito mode.
 * This uses multiple heuristics as there's no single reliable API.
 */
export async function isLikelyPrivateMode(): Promise<boolean> {
  // Chrome/Edge Incognito allows storage API but with very limited quota
  if (navigator.storage?.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      // Private modes often report tiny quotas (<80MB is suspicious)
      if (quota && quota < 80 * 1024 * 1024) {
        return true;
      }
    } catch {
      // If estimate() fails, might be private mode
      return true;
    }
  }

  // Safari Private: IndexedDB throws or has issues
  try {
    const testDbName = 'inkwell_private_probe';
    const req = indexedDB.open(testDbName);

    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => {
        req.result.close();
        indexedDB.deleteDatabase(testDbName);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB failed - likely Safari private mode
    return true;
  }

  // Additional checks for older browsers
  try {
    // Try to detect if localStorage quota is severely limited
    const testKey = '__inkwell_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch {
    // localStorage blocked - likely private mode
    return true;
  }

  return false;
}

/**
 * Check if running in a known private browsing mode.
 * This is less comprehensive but faster than isLikelyPrivateMode.
 */
export function isKnownPrivateMode(): boolean {
  // Firefox exposes this directly
  // @ts-ignore - Firefox specific
  if ('mozInnerScreenX' in window && window.mozInnerScreenX === null) {
    return true;
  }

  // Some browsers set navigator properties
  // @ts-ignore - Some browsers expose this
  if (navigator.brave?.isBrave && !navigator.webdriver) {
    return false; // Brave normal mode
  }

  return false;
}

/**
 * Get a user-friendly message about private mode
 */
export function getPrivateModeWarning(): string {
  return `You're in a private/incognito window. Your work will be deleted when you close all private windows. For important projects, please use a normal browser window.`;
}

/**
 * Detect if we're in a restricted storage environment
 */
export async function isRestrictedStorage(): Promise<boolean> {
  const privateMode = await isLikelyPrivateMode();
  if (privateMode) return true;

  // Check if storage is severely limited
  const quota = await navigator.storage?.estimate?.();
  if (quota?.quota && quota.quota < 50 * 1024 * 1024) {
    // Less than 50MB indicates restrictions
    return true;
  }

  return false;
}
