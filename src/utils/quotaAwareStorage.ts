// src/utils/quotaAwareStorage.ts
import type { IQuotaStorage, StorageResult } from './storageTypes';

type ErrorType = 'generic' | 'corruption' | 'quota';
type Op = 'set' | 'get' | 'remove' | 'clear' | 'estimate' | 'cleanup';

type QuotaInfo = {
  quota: number;
  usage: number;
  available: number;
  percentUsed: number;
};

function isQuotaExceeded(err: unknown) {
  if (!err || typeof err !== 'object') return false;
  const e = err as any;
  return (
    e?.name === 'QuotaExceededError' || e?.code === 22 || /quota/i.test(String(e?.message ?? ''))
  );
}

function bytesOfString(s: string): number {
  try {
    const { Buffer } = require('buffer');
    return Buffer.byteLength(s, 'utf8');
  } catch {
    return s.length * 2;
  }
}

function snapshotLocalStorageBytes(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      total += bytesOfString(key);
      const v = localStorage.getItem(key);
      if (v != null) total += bytesOfString(v);
    }
    return total;
  } catch {
    return 0;
  }
}

export function createQuotaStorage(
  _namespace: string = 'inkwell',
  nearLimitThreshold: number = 0.1,
): IQuotaStorage {
  let lastNear = false;

  type QuotaListener = (
    info: QuotaInfo & { isNearLimit: boolean; crossedThreshold: boolean },
  ) => void;
  type ErrorHandler = (err: {
    op: Op;
    key?: string;
    errorType: ErrorType;
    error?: unknown;
  }) => void;

  const quotaListeners = new Set<QuotaListener>();
  const errorListeners = new Set<ErrorHandler>();

  const emitError = (payload: Parameters<ErrorHandler>[0]) => {
    for (const cb of errorListeners) {
      try {
        cb(payload);
      } catch {
        /* swallow */
      }
    }
  };

  const getQuotaInfo = async (): Promise<QuotaInfo> => {
    try {
      const nav = (globalThis as any).navigator;
      if (nav?.storage?.estimate) {
        const est = await nav.storage.estimate();
        const quota = Number(est.quota ?? 0);
        const usage = Number(est.usage ?? 0);
        const available = Math.max(quota - usage, 0);
        const percentUsed = quota > 0 ? usage / quota : 0;
        return { quota, usage, available, percentUsed };
      }
    } catch {
      /* ignore */
    }
    const usage = snapshotLocalStorageBytes();
    const quota = 5 * 1024 * 1024;
    const available = Math.max(quota - usage, 0);
    const percentUsed = quota > 0 ? usage / quota : 0;
    return { quota, usage, available, percentUsed };
  };

  const maybeNotifyQuota = async () => {
    const info = await getQuotaInfo();
    const isNearLimit = info.percentUsed >= nearLimitThreshold;
    const crossedThreshold = !lastNear && isNearLimit;
    lastNear = isNearLimit;
    if (quotaListeners.size) {
      const payload = { ...info, isNearLimit, crossedThreshold };
      for (const cb of quotaListeners) {
        try {
          cb(payload);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const api: IQuotaStorage = {
    // --- Safe ops (sync results) ---
    safeSetItem(key: string, value: string): StorageResult {
      try {
        // write raw value — tests expect exact equality
        localStorage.setItem(key, value);
        // fire-and-forget quota update
        void maybeNotifyQuota();
        return { success: true };
      } catch (e) {
        const errorType: ErrorType = isQuotaExceeded(e) ? 'quota' : 'generic';
        emitError({ op: 'set', key, errorType, error: e });
        return {
          success: false,
          error: { type: errorType, message: (e as Error)?.message } as any,
        };
      }
    },

    safeGetItem(key: string): StorageResult<string | undefined> {
      try {
        const v = localStorage.getItem(key);
        return { success: true, data: v === null ? undefined : v };
      } catch (e) {
        // tests treat get failures as "corruption"
        emitError({ op: 'get', key, errorType: 'corruption', error: e });
        return {
          success: false,
          error: { type: 'corruption', message: (e as Error)?.message } as any,
        };
      }
    },

    safeRemoveItem(key: string): StorageResult {
      try {
        localStorage.removeItem(key);
        return { success: true };
      } catch (e) {
        emitError({ op: 'remove', key, errorType: 'generic', error: e });
        return {
          success: false,
          error: { type: 'generic', message: (e as Error)?.message } as any,
        };
      }
    },

    clear(): StorageResult {
      try {
        localStorage.clear();
        return { success: true };
      } catch (e) {
        emitError({ op: 'clear', errorType: 'generic', error: e });
        return {
          success: false,
          error: { type: 'generic', message: (e as Error)?.message } as any,
        };
      }
    },

    // --- Quota / maintenance (async in the interface) ---
    async getQuotaInfo() {
      return getQuotaInfo();
    },

    async needsMaintenance() {
      const info = await getQuotaInfo();
      return info.percentUsed >= nearLimitThreshold;
    },

    async emergencyCleanup() {
      const actions: string[] = [];
      let freedBytes = 0;
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('temp_') || k.startsWith('cache_')) toRemove.push(k);
        }
        for (const k of toRemove) {
          const v = localStorage.getItem(k);
          if (v != null) freedBytes += bytesOfString(k) + bytesOfString(v);
          localStorage.removeItem(k);
        }
        if (toRemove.length > 0) actions.push(`Cleared ${toRemove.length} temporary/cache items`);
        void maybeNotifyQuota();
        return { freedBytes, actions };
      } catch (e) {
        actions.push('Emergency cleanup failed');
        emitError({ op: 'cleanup', errorType: 'generic', error: e });
        return { freedBytes: 0, actions };
      }
    },

    // --- Listeners ---
    onQuotaUpdate(cb: QuotaListener) {
      quotaListeners.add(cb);
      return () => quotaListeners.delete(cb);
    },

    onStorageError(cb: ErrorHandler) {
      errorListeners.add(cb);
      return () => errorListeners.delete(cb);
    },
  };

  return api;
}

// Default singleton used by tests and app
const quotaAwareStorage = createQuotaStorage('inkwell', 0.1);
export default quotaAwareStorage;
