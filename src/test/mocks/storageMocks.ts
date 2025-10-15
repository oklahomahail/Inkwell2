// @ts-nocheck
import { vi } from 'vitest';

// Complete mock of SnapshotService API
export const mockSnapshotService = {
  // Singleton export
  createSnapshot: vi.fn().mockResolvedValue({
    id: 'mock-snapshot-1',
    projectId: 'test-project',
    version: '1.0',
    createdAt: Date.now(),
    isAutomatic: false,
  }),
  getSnapshots: vi.fn().mockResolvedValue([]),
  restoreSnapshot: vi.fn(),
  deleteSnapshot: vi.fn().mockResolvedValue(true),
  startAutoSnapshots: vi.fn(),
  stopAutoSnapshots: vi.fn(),
  getSnapshotStorageUsage: vi.fn().mockResolvedValue({
    totalSize: 0,
    snapshotCount: 0,
    byProject: {},
  }),
  emergencyCleanup: vi.fn().mockResolvedValue({
    freedBytes: 0,
    actions: [],
  }),
};

// Complete mock of QuotaAwareStorage API
export const mockQuotaAwareStorage = {
  safeGetItem: vi.fn().mockReturnValue({ success: true, data: null }),
  safeSetItem: vi.fn().mockResolvedValue({ success: true }),
  safeRemoveItem: vi.fn().mockReturnValue({ success: true }),
  getQuotaInfo: vi.fn().mockResolvedValue({
    quota: 5_000_000,
    usage: 1_000,
    available: 4_999_000,
    percentUsed: 0.0002,
  }),
  needsMaintenance: vi.fn().mockResolvedValue(false),
  emergencyCleanup: vi.fn().mockResolvedValue({
    freedBytes: 0,
    actions: ['No cleanup needed'],
  }),
  onQuotaUpdate: vi.fn().mockReturnValue(() => {}),
  onStorageError: vi.fn().mockReturnValue(() => {}),
};

// Mock localStorage for tests
export const mockStorage = {
  data: new Map<string, string>(),
  mockGetFailure: false,
  mockSetFailure: false,
};

export const mockLocalStorage = {
  data: mockStorage.data,
  getItem: vi.fn((key: string) => {
    if (mockStorage.mockGetFailure) throw new Error('Storage error');
    return mockStorage.data.get(key) || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    if (mockStorage.mockSetFailure) throw new Error('Storage error');
    mockStorage.data.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockStorage.data.delete(key);
  }),
  clear: vi.fn(() => {
    mockStorage.data.clear();
  }),
  key: vi.fn((index: number) => Array.from(mockStorage.data.keys())[index] || null),
  get length() {
    return mockStorage.data.size;
  },
};

// Complete mock of ConnectivityService API
export const mockConnectivityService = {
  isOnline: true,
  getQueue: vi.fn().mockResolvedValue([]),
  getStatus: vi.fn().mockReturnValue({
    isOnline: true,
    lastOnline: new Date(),
    lastOffline: null,
    queuedWrites: 0,
    connectionType: 'wifi',
  }),
  onStatusChange: vi.fn((cb) => {
    setTimeout(
      () =>
        cb({
          isOnline: true,
          lastOnline: new Date(),
          lastOffline: null,
          queuedWrites: 0,
          connectionType: 'wifi',
        }),
      0,
    );
    return () => {};
  }),
  queueWrite: vi.fn().mockResolvedValue({ success: true }),
  clearQueue: vi.fn().mockResolvedValue(undefined),
};
