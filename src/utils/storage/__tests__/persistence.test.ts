import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ensurePersistentStorage,
  formatBytes,
  getStorageQuota,
  isStoragePersisted,
} from '../persistence';

describe('persistence utilities', () => {
  let mockNavigator: Partial<Navigator>;

  beforeEach(() => {
    mockNavigator = {};
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ensurePersistentStorage', () => {
    it('should return not supported when Storage API is unavailable', async () => {
      const result = await ensurePersistentStorage();
      expect(result).toEqual({
        persisted: false,
        requested: false,
        supported: false,
      });
    });

    it('should return already persisted when storage is already persistent', async () => {
      mockNavigator.storage = {
        persist: vi.fn().mockResolvedValue(true),
        persisted: vi.fn().mockResolvedValue(true),
        estimate: vi.fn(),
      };

      const result = await ensurePersistentStorage();
      expect(result).toEqual({
        persisted: true,
        requested: false,
        supported: true,
      });
      expect(mockNavigator.storage.persisted).toHaveBeenCalled();
      expect(mockNavigator.storage.persist).not.toHaveBeenCalled();
    });

    it('should request persistence and return granted when successful', async () => {
      mockNavigator.storage = {
        persist: vi.fn().mockResolvedValue(true),
        persisted: vi.fn().mockResolvedValue(false),
        estimate: vi.fn(),
      };

      const result = await ensurePersistentStorage();
      expect(result).toEqual({
        persisted: true,
        requested: true,
        supported: true,
      });
      expect(mockNavigator.storage.persisted).toHaveBeenCalled();
      expect(mockNavigator.storage.persist).toHaveBeenCalled();
    });

    it('should return not persisted when request is denied', async () => {
      mockNavigator.storage = {
        persist: vi.fn().mockResolvedValue(false),
        persisted: vi.fn().mockResolvedValue(false),
        estimate: vi.fn(),
      };

      const result = await ensurePersistentStorage();
      expect(result).toEqual({
        persisted: false,
        requested: true,
        supported: true,
      });
    });

    it('should handle errors gracefully', async () => {
      mockNavigator.storage = {
        persist: vi.fn().mockRejectedValue(new Error('Permission denied')),
        persisted: vi.fn().mockResolvedValue(false),
        estimate: vi.fn(),
      };

      const result = await ensurePersistentStorage();
      expect(result).toEqual({
        persisted: false,
        requested: true,
        supported: true,
      });
    });
  });

  describe('isStoragePersisted', () => {
    it('should return false when Storage API is unavailable', async () => {
      const result = await isStoragePersisted();
      expect(result).toBe(false);
    });

    it('should return true when storage is persisted', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn().mockResolvedValue(true),
        estimate: vi.fn(),
      };

      const result = await isStoragePersisted();
      expect(result).toBe(true);
    });

    it('should return false when storage is not persisted', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn().mockResolvedValue(false),
        estimate: vi.fn(),
      };

      const result = await isStoragePersisted();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn().mockRejectedValue(new Error('Failed')),
        estimate: vi.fn(),
      };

      const result = await isStoragePersisted();
      expect(result).toBe(false);
    });
  });

  describe('getStorageQuota', () => {
    it('should return null when Storage API is unavailable', async () => {
      const result = await getStorageQuota();
      expect(result).toBeNull();
    });

    it('should return quota information when available', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn(),
        estimate: vi.fn().mockResolvedValue({
          usage: 1024 * 1024 * 50, // 50 MB
          quota: 1024 * 1024 * 100, // 100 MB
        }),
      };

      const result = await getStorageQuota();
      expect(result).toEqual({
        usage: 1024 * 1024 * 50,
        quota: 1024 * 1024 * 100,
        percentUsed: 50,
      });
    });

    it('should handle zero quota', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn(),
        estimate: vi.fn().mockResolvedValue({
          usage: 0,
          quota: 0,
        }),
      };

      const result = await getStorageQuota();
      expect(result).toEqual({
        usage: 0,
        quota: 0,
        percentUsed: 0,
      });
    });

    it('should handle undefined values', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn(),
        estimate: vi.fn().mockResolvedValue({}),
      };

      const result = await getStorageQuota();
      expect(result).toEqual({
        usage: 0,
        quota: 0,
        percentUsed: 0,
      });
    });

    it('should return null on error', async () => {
      mockNavigator.storage = {
        persist: vi.fn(),
        persisted: vi.fn(),
        estimate: vi.fn().mockRejectedValue(new Error('Failed')),
      };

      const result = await getStorageQuota();
      expect(result).toBeNull();
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 2.25)).toBe('2.25 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatBytes(1024 * 1.234)).toBe('1.23 KB');
      expect(formatBytes(1024 * 1.236)).toBe('1.24 KB');
    });
  });
});
