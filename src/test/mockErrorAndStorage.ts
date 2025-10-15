// @ts-nocheck
import { vi } from 'vitest';

// error handler
export const logError = vi.fn();
export const logStorageError = vi.fn();

vi.mock('@/utils/errorHandler', () => ({
  logStorageError,
  logError,
}));

// quota-aware storage in-memory shim
export const mockStore = new Map<string, string>();
export const storageStore = mockStore;

export const mockQuotaAwareStorage = {
  safeGetItem: vi.fn((k: string) => mockStore.get(k) ?? null),
  safeSetItem: vi.fn((k: string, v: string) => {
    mockStore.set(k, v);
  }),
  safeRemoveItem: vi.fn((k: string) => {
    mockStore.delete(k);
  }),
  getQuotaInfo: vi.fn().mockResolvedValue({
    quota: 5_000_000,
    usage: 1_000,
    available: 4_999_000,
    percentUsed: 0.0002,
  }),
  needsMaintenance: vi.fn().mockResolvedValue(false),
  emergencyCleanup: vi.fn().mockResolvedValue({ freedBytes: 0, actions: [] }),
  onQuotaUpdate: vi.fn().mockReturnValue(() => {}),
  onStorageError: vi.fn().mockReturnValue(() => {}),
};

vi.mock('@/utils/storageAccess', () => ({
  getLocalStorage: () => globalThis.localStorage,
  quotaAwareStorage: mockQuotaAwareStorage,
  __store: mockStore,
}));

// Export mock for tests
export { mockQuotaAwareStorage as quotaAwareStorage };

// Create mock functions
const mockFns = {
  getItem: vi.fn((k: string) => mockStore.get(k) ?? null),
  setItem: vi.fn((k: string, v: string) => {
    mockStore.set(k, v);
  }),
  removeItem: vi.fn((k: string) => {
    mockStore.delete(k);
  }),
  clear: vi.fn(() => {
    mockStore.clear();
  }),
  key: vi.fn((index: number) => Array.from(mockStore.keys())[index] || null),
};

// Mock localStorage API
export const mockLocalStorage = {
  getItem: vi.fn((k: string) => (mockStore.has(k) ? mockStore.get(k)! : null)),
  setItem: vi.fn((k: string, v: string) => mockStore.set(k, String(v))),
  removeItem: vi.fn((k: string) => mockStore.delete(k)),
  clear: vi.fn(() => mockStore.clear()),
  key: vi.fn((i: number) => Array.from(mockStore.keys())[i] ?? null),
  get length() {
    return mockStore.size;
  },
};

// make it available globally for tests
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

// Export values directly
export { mockFns };

// Setup mock function implementations
function setupMockFns() {
  mockFns.getItem.mockImplementation((k: string) => mockStore.get(k) ?? null);
  mockFns.setItem.mockImplementation((k: string, v: string) => {
    mockStore.set(k, v);
  });
  mockFns.removeItem.mockImplementation((k: string) => {
    mockStore.delete(k);
  });
  mockFns.clear.mockImplementation(() => {
    mockStore.clear();
  });
  mockFns.key.mockImplementation((i: number) => Array.from(mockStore.keys())[i] ?? null);
}

// Use this in beforeEach to setup localStorage mock
export function setupLocalStorage() {
  // Reset state
  mockStore.clear();
  vi.clearAllMocks();
  setupMockFns();

  // Mock global storage APIs
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  // Clear error logger
  vi.mocked(logStorageError).mockClear();
}
