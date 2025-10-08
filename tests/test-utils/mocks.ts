import { vi } from 'vitest';

import { useProfile } from '../../src/context/ProfileContext';
import { useMaybeDB } from '../../src/data/dbFactory';

import { createMemoryDb, setupDbDefaults } from './db';
import { createTestProfile } from './profile';

/**
 * Type-safe mock for useProfile hook
 */
export const mockUseProfileHook = useProfile as unknown as vi.Mock;

/**
 * Type-safe mock for useMaybeDB hook
 */
export const mockUseMaybeDBHook = useMaybeDB as unknown as vi.Mock;

/**
 * Sets up standard mock implementations for tutorial storage tests
 */
export function setupStandardMocks() {
  // Create a fresh memory database
  const mockDb = setupDbDefaults(createMemoryDb());

  // Mock the database hook
  mockUseMaybeDBHook.mockReturnValue(mockDb);

  // Mock the profile hook with a default test profile
  mockUseProfileHook.mockReturnValue({
    activeProfile: createTestProfile('test-profile'),
    profiles: [createTestProfile('test-profile')],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: null,
  });

  // Setup localStorage spy
  const localStorageSpy = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageSpy,
    writable: true,
  });

  return {
    mockDb,
    localStorageSpy,
    cleanup: () => {
      mockUseMaybeDBHook.mockReset();
      mockUseProfileHook.mockReset();
      vi.clearAllMocks();
    },
  };
}

/**
 * Sets up mocks for no-active-profile scenarios
 */
export function setupNoProfileMocks() {
  // Mock unavailable database
  mockUseMaybeDBHook.mockReturnValue(null);

  // Mock no active profile
  mockUseProfileHook.mockReturnValue({
    activeProfile: null,
    profiles: [],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: null,
  });

  return {
    cleanup: () => {
      mockUseMaybeDBHook.mockReset();
      mockUseProfileHook.mockReset();
    },
  };
}

/**
 * Sets up mocks for error scenarios
 */
export function setupErrorMocks(errorMessage = 'Test error') {
  const error = new Error(errorMessage);

  // Mock failing database
  const failingDb = {
    get: vi.fn().mockRejectedValue(error),
    put: vi.fn().mockRejectedValue(error),
    delete: vi.fn().mockRejectedValue(error),
    clear: vi.fn().mockRejectedValue(error),
    list: vi.fn().mockRejectedValue(error),
  };

  mockUseMaybeDBHook.mockReturnValue(failingDb);

  // Mock profile hook with error
  mockUseProfileHook.mockReturnValue({
    activeProfile: null,
    profiles: [],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error,
  });

  return {
    failingDb,
    error,
    cleanup: () => {
      mockUseMaybeDBHook.mockReset();
      mockUseProfileHook.mockReset();
    },
  };
}
