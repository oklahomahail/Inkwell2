// Storage test setup with polyfills and adapters
import { vi } from 'vitest';

// Basic localStorage mock
const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((idx: number) => Array.from(store.keys())[idx] || null),
    length: store.size,
  };
};

// Basic indexedDB mock
const createIndexedDBMock = () => ({
  open: vi.fn(),
  deleteDatabase: vi.fn(),
});

// Install storage polyfills
beforeAll(() => {
  Object.defineProperty(global, 'localStorage', {
    value: createLocalStorageMock()
  });

  Object.defineProperty(global, 'indexedDB', {
    value: createIndexedDBMock()
  });
});

// Clear all mocks between tests
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});