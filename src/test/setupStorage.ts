// setupStorage.ts
import { StorageHelper } from './storageHelper';
import { TestErrorHandler } from '../utils/testErrorHandler';

import { vi } from 'vitest';

// Mock storage functions
const mockStorage = {
  getItem: vi.fn((key: string) => {
    if (TestErrorHandler.isEnabled()) {
      throw new Error('Storage error');
    }
    return StorageHelper.getItem(key) || null;
  }),

  setItem: vi.fn((key: string, value: string) => {
    if (TestErrorHandler.isEnabled()) {
      if (TestErrorHandler.isQuotaExceeded()) {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      throw new Error('Storage error');
    }
    StorageHelper.setItem(key, value);
  }),

  removeItem: vi.fn((key: string) => {
    try {
      // Check test error conditions
      if (TestErrorHandler.isEnabled() && key === 'error-key') {
        throw new Error('Storage error');
      }

      // Forward to test storage helper
      return StorageHelper.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }),

  clear: vi.fn(() => {
    try {
      return StorageHelper.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }),

  get length() {
    return Object.keys(mockStorage).length;
  },

  key: vi.fn((index: number) => {
    try {
      return Object.keys(mockStorage)[index] || null;
    } catch (error) {
      console.error('Storage key error:', error);
      return null;
    }
  }),
};

// Initialize storage mock
beforeEach(() => {
  // Reset storage state
  StorageHelper.reset();

  // Reset error handler state
  TestErrorHandler.disable();
  TestErrorHandler.setQuotaExceeded(false);

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  // Reset storage mocks
  vi.clearAllMocks();
});
