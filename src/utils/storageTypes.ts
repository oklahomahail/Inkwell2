export type ChangeListener = (detail: {
  key?: string;
  newValue?: unknown;
  oldValue?: unknown;
}) => void;

export type ErrorListener = (detail: {
  op: 'set' | 'get' | 'remove' | 'clear' | 'estimate' | 'cleanup';
  key?: string;
  errorType: 'generic' | 'corruption' | 'quota';
  error?: unknown;
}) => void;

export type QuotaListener = (detail: {
  usage: number;
  quota: number;
  available: number;
  percentUsed: number;
  crossedThreshold: boolean;
}) => void;

export interface QuotaInfo {
  usage: number;
  quota: number;
  available: number;
  percentUsed: number; // 0..1
}

export interface Result<T = unknown> {
  ok: boolean;
  value?: T;
  error?: unknown;
  errorType?: 'generic' | 'corruption' | 'quota';
}

export interface StorageResult<T = string | undefined> {
  success: boolean;
  data?: T;
  error?: {
    type: 'error' | 'quota' | 'corruption';
    message: string;
  };
}

export type QuotaHandler = (detail: {
  usage: number;
  quota: number;
  available: number;
  percentUsed: number;
  crossedThreshold: boolean;
}) => void;

export type ErrorHandler = (detail: {
  op: 'set' | 'get' | 'remove' | 'clear' | 'estimate' | 'cleanup';
  key?: string;
  errorType: 'generic' | 'corruption' | 'quota';
  error?: unknown;
}) => void;

export interface IQuotaStorage {
  safeGetItem(key: string): StorageResult;
  safeSetItem(key: string, value: string): StorageResult;
  safeRemoveItem(key: string): StorageResult;
  getQuotaInfo(): Promise<QuotaInfo>;
  needsMaintenance(): Promise<boolean>;
  emergencyCleanup(): Promise<{ freedBytes: number; actions: string[] }>;
  onQuotaUpdate(handler: QuotaHandler): () => void;
  onStorageError(handler: ErrorHandler): () => void;
  clear(): void;
}
