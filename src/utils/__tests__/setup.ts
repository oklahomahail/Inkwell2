// Mock localStorage for tests
const localStorageMock = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock the storage API
globalThis.navigator.storage = {
  estimate: vi.fn().mockResolvedValue({
    quota: 100 * 1024 * 1024, // 100MB
    usage: 10 * 1024 * 1024, // 10MB
  }),
};

// Mock the localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Ensure TEST_MODE is set
process.env.NODE_ENV = 'test';
