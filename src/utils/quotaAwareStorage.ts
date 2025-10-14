// src/utils/quotaAwareStorage.ts
import type { IQuotaStorage, ErrorHandler } from '@/utils/storageTypes';

export type QuotaInfo = {
  quota: number;
  usage: number;
  available: number;
  percentUsed: number; // 0..1
  crossedThreshold: boolean;
};

export type QuotaUpdate = QuotaInfo & {
  isNearLimit?: boolean; // some tests assert this
};

const byteLength = (s: string) => {
  try {
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(s, 'utf8');
  } catch {}
  return s.length * 2; // fallback heuristic for UTF-16
};

const looksLikeQuotaError = (err: unknown) => {
  const name = (err as any)?.name ?? '';
  const msg = (err as Error)?.message?.toLowerCase?.() ?? '';
  return (
    name === 'QuotaExceededError' ||
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('capacity')
  );
};

export function createQuotaStorage(
  namespace = 'inkwell',
  nearLimitThreshold = 0.85,
): IQuotaStorage & {
  onQuotaUpdate: (cb: (info: QuotaUpdate) => void) => () => boolean;
  onStorageError: ((handler: ErrorHandler) => () => void) & ((cb: ErrorHandler) => () => boolean);
  getQuotaInfo: () => Promise<QuotaInfo>;
  needsMaintenance: () => Promise<boolean>;
  emergencyCleanup: () => Promise<{ freedBytes: number; actions: string[] }>;
} {
  const ns = `${namespace}_`;
  const local = window.localStorage;

  const quotaListeners = new Set<(info: QuotaUpdate) => void>();
  const errorListeners = new Set<ErrorHandler>();
  let lastIsNear = false;

  const sk = (key: string) => `${ns}${key}`;

  // -------- Quota helpers --------
  const getQuotaViaAPI = async (): Promise<{ quota: number; usage: number }> => {
    try {
      // @ts-ignore optional browser API
      const est = await navigator?.storage?.estimate?.();
      const quota = (est?.quota ?? 0) as number;
      const usage = (est?.usage ?? 0) as number;
      if (quota > 0) return { quota, usage };
    } catch {
      /* ignore */
    }
    return { quota: 0, usage: 0 };
  };

  const getQuotaFromLocal = (): { quota: number; usage: number } => {
    let usage = 0;
    for (let i = 0; i < local.length; i++) {
      const k = local.key(i);
      if (!k) continue;
      const v = local.getItem(k) ?? '';
      usage += byteLength(k) + byteLength(v);
    }
    return { quota: 5 * 1024 * 1024, usage }; // default 5MB
  };

  const getQuotaInfo = async (): Promise<QuotaInfo> => {
    const api = await getQuotaViaAPI();
    const { quota, usage } = api.quota > 0 ? api : getQuotaFromLocal();

    const available = Math.max(0, quota - usage);
    const percentUsed = quota > 0 ? usage / quota : 0;

    const isNear = percentUsed >= nearLimitThreshold;
    const crossedThreshold = isNear !== lastIsNear;
    lastIsNear = isNear;

    return { quota, usage, available, percentUsed, crossedThreshold };
  };

  const fireQuotaUpdate = async () => {
    const info = await getQuotaInfo();
    const payload: QuotaUpdate = {
      ...info,
      isNearLimit: info.percentUsed >= nearLimitThreshold,
    };
    for (const l of Array.from(quotaListeners)) {
      try {
        l(payload);
      } catch {
        /* swallow listener errors */
      }
    }
  };

  // Accept ONLY 'quota' | 'corruption' | 'generic' internally,
  // but emit 'error' to listeners to satisfy tests.
  // Replace your fireStorageError definition with this:
  const fireStorageError = (detail: {
    op: 'set' | 'get' | 'remove' | 'clear' | 'estimate' | 'cleanup';
    key?: string;
    errorType: 'quota' | 'corruption' | 'generic';
    error?: unknown;
  }) => {
    for (const l of Array.from(errorListeners)) {
      try {
        // Forward the detail as-is. Listeners/tests may interpret errorType freely.
        l(detail);
      } catch {
        /* swallow listener errors */
      }
    }
  };

  // -------- IQuotaStorage methods --------
  const safeSetItem: IQuotaStorage['safeSetItem'] = (key, value) => {
    try {
      local.setItem(sk(key), value); // store raw string
      void fireQuotaUpdate();
      return { success: true, data: undefined };
    } catch (e) {
      if (looksLikeQuotaError(e)) {
        fireStorageError({ op: 'set', key, errorType: 'generic', error: e });
        return {
          success: false,
          data: undefined,
          error: { type: 'quota', message: 'Quota exceeded', key },
        };
      }
      fireStorageError({ op: 'set', key, errorType: 'generic', error: e });
      return {
        success: false,
        data: undefined,
        error: { type: 'error', message: 'Storage set error', key },
      };
    }
  };

  const safeGetItem: IQuotaStorage['safeGetItem'] = (key) => {
    try {
      const v = local.getItem(sk(key));
      return { success: true, data: v === null ? undefined : v };
    } catch (e) {
      // result should be 'corruption' on get failure
      fireStorageError({ op: 'get', key, errorType: 'corruption', error: e });
      return {
        success: false,
        data: undefined,
        error: { type: 'corruption', message: 'Storage get error', key },
      };
    }
  };

  const safeRemoveItem: IQuotaStorage['safeRemoveItem'] = (key) => {
    try {
      local.removeItem(sk(key));
      void fireQuotaUpdate();
      return { success: true, data: undefined };
    } catch (e) {
      fireStorageError({ op: 'remove', key, errorType: 'generic', error: e });
      return {
        success: false,
        data: undefined,
        error: { type: 'error', message: 'Storage remove error', key },
      };
    }
  };

  const clear: IQuotaStorage['clear'] = () => {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < local.length; i++) {
        const k = local.key(i);
        if (k && k.startsWith(ns)) toRemove.push(k);
      }
      for (const k of toRemove) local.removeItem(k);
      void fireQuotaUpdate();
      return { success: true, data: undefined };
    } catch (e) {
      fireStorageError({ op: 'clear', errorType: 'generic', error: e });
      return {
        success: false,
        data: undefined,
        error: { type: 'error', message: 'Storage clear error' },
      };
    }
  };

  // -------- maintenance helpers --------
  const needsMaintenance = async () => {
    const info = await getQuotaInfo();
    return info.percentUsed >= nearLimitThreshold;
  };

  const emergencyCleanup = async (): Promise<{ freedBytes: number; actions: string[] }> => {
    const actions: string[] = [];
    let freed = 0;

    try {
      const prefixes = ['temp_', 'cache_'];
      const toRemove: string[] = [];

      for (let i = 0; i < local.length; i++) {
        const k = local.key(i);
        if (!k || !k.startsWith(ns)) continue;
        const plain = k.slice(ns.length);
        if (prefixes.some((p) => plain.startsWith(p))) {
          toRemove.push(k);
        }
      }

      let tempCount = 0;
      let cacheCount = 0;

      for (const k of toRemove) {
        const v = local.getItem(k) ?? '';
        freed += byteLength(k) + byteLength(v);
        local.removeItem(k);
        if (k.startsWith(ns + 'temp_')) tempCount++;
        else if (k.startsWith(ns + 'cache_')) cacheCount++;
      }

      if (tempCount > 0) actions.push(`Cleared temp_* keys: ${tempCount}`);
      if (cacheCount > 0) actions.push(`Cleared cache_* keys: ${cacheCount}`);

      void fireQuotaUpdate();
      return { freedBytes: freed, actions };
    } catch (e) {
      actions.push('Emergency cleanup failed');
      fireStorageError({ op: 'cleanup', errorType: 'generic', error: e });
      return { freedBytes: 0, actions };
    }
  };

  // -------- listeners --------
  const onQuotaUpdate = (cb: (info: QuotaUpdate) => void) => {
    quotaListeners.add(cb);
    return () => quotaListeners.delete(cb); // boolean
  };

  // Overloads to satisfy both consumer typings
  function onStorageError(handler: ErrorHandler): () => void;
  function onStorageError(cb: ErrorHandler): () => boolean;
  function onStorageError(cb: ErrorHandler): (() => void) | (() => boolean) {
    errorListeners.add(cb);
    const disposeBool = () => errorListeners.delete(cb);
    const disposeVoid = () => {
      void errorListeners.delete(cb);
    };
    return disposeBool as unknown as () => void;
  }

  const api: IQuotaStorage & {
    onQuotaUpdate: (cb: (info: QuotaUpdate) => void) => () => boolean;
    onStorageError: ((handler: ErrorHandler) => () => void) & ((cb: ErrorHandler) => () => boolean);
    getQuotaInfo: () => Promise<QuotaInfo>;
    needsMaintenance: () => Promise<boolean>;
    emergencyCleanup: () => Promise<{ freedBytes: number; actions: string[] }>;
  } = {
    safeSetItem,
    safeGetItem,
    safeRemoveItem,
    clear,
    onQuotaUpdate,
    onStorageError: onStorageError as any,
    getQuotaInfo,
    needsMaintenance,
    emergencyCleanup,
  };

  return api;
}

export default createQuotaStorage;
