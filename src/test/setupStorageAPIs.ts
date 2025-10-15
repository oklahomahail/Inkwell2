// @ts-nocheck
// Mock Storage Quota API and related functionality for tests
export function setupStorageAPIs() {
  // Mock Storage API
  const mockEstimate = {
    quota: 100 * 1024 * 1024, // 100MB
    usage: 10 * 1024 * 1024, // 10MB
    usageDetails: {
      localStorage: 10 * 1024 * 1024,
      indexedDB: 0,
      caches: 0,
      serviceWorkerRegistrations: 0,
    },
  };

  const mockStorageManager = {
    estimate: vi.fn().mockResolvedValue(mockEstimate),
    persisted: vi.fn().mockResolvedValue(true),
    persist: vi.fn().mockResolvedValue(true),
  };

  // Setup on multiple globals for robustness
  beforeEach(() => {
    Object.defineProperty(navigator, 'storage', {
      value: mockStorageManager,
      configurable: true,
    });
    Object.defineProperty(window, 'navigator', {
      value: { storage: mockStorageManager },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  return { mockStorageManager, mockEstimate };
}
