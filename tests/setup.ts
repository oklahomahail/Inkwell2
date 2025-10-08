// tests/setup.ts
import { vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// ---- Enhanced mock for database factory with direct interface
vi.mock('../data/dbFactory', async (importOriginal) => {
  const actual = await importOriginal<any>();

  // Simple in-memory database that matches the expected interface
  function createMemoryDb() {
    const data = new Map<string, any>();
    return {
      async get(key: string) {
        return data.get(key) ?? null;
      },
      async put(key: string, value: any) {
        data.set(key, value);
      },
      async delete(key: string) {
        data.delete(key);
      },
      async clear() {
        data.clear();
      },
      async list() {
        return Array.from(data.values());
      },
    };
  }

  const useMaybeDB = vi.fn(() => createMemoryDb());

  return {
    ...actual,
    useMaybeDB,
    __TESTING__: { createMemoryDb },
  };
});

// ---- Type-safe mock for useProfile
vi.mock('../context/ProfileContext', () => ({
  useProfile: vi.fn(() => ({
    activeProfile: { id: 'test-profile', name: 'Test Profile' },
    profiles: [{ id: 'test-profile', name: 'Test Profile' }],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

// ---- Enhanced localStorage spies
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Export for use in tests
export { localStorageMock };
