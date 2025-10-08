import { vi } from 'vitest';

/**
 * Creates a fresh in-memory database mock with all required methods
 */
export function createMemoryDb() {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    list: vi.fn(),
  };
}

/**
 * Creates a typed mock for useMaybeDB hook
 * @param db - Optional database instance, defaults to createMemoryDb()
 */
export function mockUseMaybeDB(db = createMemoryDb()) {
  return vi.fn(() => db);
}

/**
 * Creates a mock that returns null (database unavailable)
 */
export function mockUseMaybeDBUnavailable() {
  return vi.fn(() => null);
}

/**
 * Sets up default successful database responses for common operations
 */
export function setupDbDefaults(db: ReturnType<typeof createMemoryDb>) {
  db.get.mockResolvedValue(null);
  db.put.mockResolvedValue(undefined);
  db.delete.mockResolvedValue(undefined);
  db.clear.mockResolvedValue(undefined);
  db.list.mockResolvedValue([]);
  return db;
}

/**
 * Creates a database mock that throws errors for testing error scenarios
 */
export function createFailingDb(errorMessage = 'Database error') {
  const error = new Error(errorMessage);
  return {
    get: vi.fn().mockRejectedValue(error),
    put: vi.fn().mockRejectedValue(error),
    delete: vi.fn().mockRejectedValue(error),
    clear: vi.fn().mockRejectedValue(error),
    list: vi.fn().mockRejectedValue(error),
  };
}
