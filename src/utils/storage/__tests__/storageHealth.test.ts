import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as persistence from '../persistence';
import * as privateMode from '../privateMode';
import { DB_NAME, DB_VERSION, getStorageHealth, watchStorageHealth } from '../storageHealth';

describe('storageHealth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStorageHealth', () => {
    beforeEach(() => {
      vi.spyOn(persistence, 'isStoragePersisted').mockResolvedValue(true);
      vi.spyOn(privateMode, 'isLikelyPrivateMode').mockResolvedValue(false);
      vi.spyOn(privateMode, 'isRestrictedStorage').mockResolvedValue(false);
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue({
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        percentUsed: 50,
      });
      vi.spyOn(persistence, 'formatBytes').mockImplementation((bytes) => `${bytes}B`);

      // Mock indexedDB.databases
      Object.defineProperty(global, 'indexedDB', {
        value: {
          databases: vi.fn().mockResolvedValue([{ name: DB_NAME, version: DB_VERSION }]),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should return healthy status with good conditions', async () => {
      const health = await getStorageHealth();

      expect(health.dbName).toBe(DB_NAME);
      expect(health.dbVersion).toBe(DB_VERSION);
      expect(health.dbExists).toBe(true);
      expect(health.persisted).toBe(true);
      expect(health.privateMode).toBe(false);
      expect(health.restricted).toBe(false);
      expect(health.usage).toBe(50 * 1024 * 1024);
      expect(health.quota).toBe(100 * 1024 * 1024);
      expect(health.percentUsed).toBe(50);
      expect(health.warnings).toEqual([]);
      expect(health.healthy).toBe(true);
    });

    it('should detect private mode warning', async () => {
      vi.spyOn(privateMode, 'isLikelyPrivateMode').mockResolvedValue(true);

      const health = await getStorageHealth();

      expect(health.privateMode).toBe(true);
      expect(health.healthy).toBe(false);
      expect(health.warnings).toContain(
        'Running in private/incognito mode - data will be lost when window closes',
      );
    });

    it('should detect high storage usage warning', async () => {
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue({
        usage: 85 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        percentUsed: 85,
      });

      const health = await getStorageHealth();

      expect(health.percentUsed).toBe(85);
      expect(health.healthy).toBe(false);
      expect(health.warnings).toContain('Storage is 85% full');
    });

    it('should detect non-persisted storage warning', async () => {
      vi.spyOn(persistence, 'isStoragePersisted').mockResolvedValue(false);

      const health = await getStorageHealth();

      expect(health.persisted).toBe(false);
      expect(health.healthy).toBe(false);
      expect(health.warnings).toContain(
        'Storage not persistent - may be cleared under storage pressure',
      );
    });

    it('should detect missing database warning', async () => {
      Object.defineProperty(global, 'indexedDB', {
        value: {
          databases: vi.fn().mockResolvedValue([]),
        },
        writable: true,
        configurable: true,
      });

      const health = await getStorageHealth();

      expect(health.dbExists).toBe(false);
      // DB not existing doesn't make it unhealthy, just adds a warning
      expect(health.warnings).toContain('Database initializing... refresh if this persists');
    });

    it('should handle null quota information', async () => {
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue(null);

      const health = await getStorageHealth();

      expect(health.usage).toBe(0);
      expect(health.quota).toBe(0);
      expect(health.percentUsed).toBe(0);
    });

    it('should accumulate multiple warnings', async () => {
      vi.spyOn(privateMode, 'isLikelyPrivateMode').mockResolvedValue(true);
      vi.spyOn(persistence, 'isStoragePersisted').mockResolvedValue(false);
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue({
        usage: 90 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        percentUsed: 90,
      });

      const health = await getStorageHealth();

      expect(health.healthy).toBe(false);
      expect(health.warnings.length).toBeGreaterThan(1);
      expect(health.warnings).toContain(
        'Running in private/incognito mode - data will be lost when window closes',
      );
      expect(health.warnings).toContain('Storage is 90% full');
      // Note: "Storage not persistent" warning is only shown when NOT in private mode
    });

    it('should handle restricted storage', async () => {
      vi.spyOn(privateMode, 'isRestrictedStorage').mockResolvedValue(true);

      const health = await getStorageHealth();

      expect(health.restricted).toBe(true);
      expect(health.healthy).toBe(false);
    });
  });

  describe('watchStorageHealth', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(persistence, 'isStoragePersisted').mockResolvedValue(true);
      vi.spyOn(privateMode, 'isLikelyPrivateMode').mockResolvedValue(false);
      vi.spyOn(privateMode, 'isRestrictedStorage').mockResolvedValue(false);
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue({
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        percentUsed: 50,
      });
      vi.spyOn(persistence, 'formatBytes').mockImplementation((bytes) => `${bytes}B`);

      Object.defineProperty(global, 'indexedDB', {
        value: {
          databases: vi.fn().mockResolvedValue([{ name: DB_NAME, version: DB_VERSION }]),
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should call callback with initial health report', async () => {
      const callback = vi.fn();
      const stop = watchStorageHealth(callback);

      // Wait for initial call
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          dbName: DB_NAME,
          dbVersion: DB_VERSION,
          healthy: expect.any(Boolean),
        }),
      );

      stop();
    });

    it('should call callback periodically', async () => {
      const callback = vi.fn();
      const stop = watchStorageHealth(callback);

      // Wait for initial call
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      // Advance time by 60 seconds
      await vi.advanceTimersByTimeAsync(60000);

      expect(callback).toHaveBeenCalledTimes(2);

      // Advance again
      await vi.advanceTimersByTimeAsync(60000);

      expect(callback).toHaveBeenCalledTimes(3);

      stop();
    });

    it('should stop calling callback after stop is called', async () => {
      const callback = vi.fn();
      const stop = watchStorageHealth(callback);

      // Wait for initial call
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      // Stop watching
      stop();

      // Advance time
      await vi.advanceTimersByTimeAsync(120000);

      // Should still be 1 (no additional calls)
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should detect changes in storage health', async () => {
      const callback = vi.fn();
      const stop = watchStorageHealth(callback);

      // Wait for initial call
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      // Change storage conditions
      vi.spyOn(persistence, 'getStorageQuota').mockResolvedValue({
        usage: 90 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        percentUsed: 90,
      });

      // Advance time
      await vi.advanceTimersByTimeAsync(60000);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          percentUsed: 90,
          healthy: false,
        }),
      );

      stop();
    });
  });
});
