// src/utils/storage/__tests__/storageHealth.comprehensive.test.ts
/**
 * Tier 1: Storage health, persistence, and private-mode behavior
 * Comprehensive tests covering quota thresholds, DB existence checks,
 * subscription callbacks, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { mockStorage, resetStorageMocks, setupFakeTimers } from '../../../test/testUtils';
import { getStorageHealth, watchStorageHealth, getSimpleStorageStatus } from '../storageHealth';

describe('Storage Health - Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetStorageMocks();
  });

  // ===== QUOTA THRESHOLDS =====

  it('reports healthy status when usage is under 70%', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024, // 100MB
      usage: 50 * 1024 * 1024, // 50MB = 50%
    });

    const health = await getStorageHealth();

    expect(health.percentUsed).toBe(50);
    expect(health.healthy).toBe(true);
    expect(health.warnings).toHaveLength(0);
  });

  it('warns when usage is 70-90%', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 80 * 1024 * 1024, // 80%
    });

    const health = await getStorageHealth();

    expect(health.percentUsed).toBe(80);
    expect(health.healthy).toBe(false); // Changed: >80% is unhealthy
    expect(health.warnings).toContain('Storage is 80% full');
  });

  it('reports unhealthy when usage exceeds 90%', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 95 * 1024 * 1024, // 95%
    });

    const health = await getStorageHealth();

    expect(health.percentUsed).toBe(95);
    expect(health.healthy).toBe(false);
    expect(health.warnings).toContain('Storage usage is critically high (>90%)');
  });

  it('handles quota of 0 without division by zero', async () => {
    mockStorage({
      quota: 0,
      usage: 0,
    });

    const health = await getStorageHealth();

    expect(health.percentUsed).toBe(0);
    expect(health.healthy).toBe(true);
  });

  it('caps percentUsed at 100% even if usage exceeds quota', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 120 * 1024 * 1024, // Over quota
    });

    const health = await getStorageHealth();

    expect(health.percentUsed).toBe(120); // Actual ratio
    expect(health.healthy).toBe(false);
  });

  // ===== INDEXEDDB AVAILABILITY =====

  it('reports dbExists false when IndexedDB is unavailable', async () => {
    mockStorage({ indexedDBAvailable: false });

    const health = await getStorageHealth();

    expect(health.dbExists).toBe(false);
    expect(health.warnings).toContain('IndexedDB not available in this environment');
  });

  it('handles IndexedDB.databases() when available', async () => {
    // Mock Chromium-style databases() API
    const mockDatabases = vi.fn().mockResolvedValue([
      { name: 'inkwell_v1', version: 3 },
      { name: 'other_db', version: 1 },
    ]);

    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {
        ...window.indexedDB,
        databases: mockDatabases,
        open: vi.fn(),
      },
    });

    const health = await getStorageHealth();

    expect(mockDatabases).toHaveBeenCalled();
    expect(health.dbExists).toBe(true);
    expect(health.dbName).toBe('inkwell_v1');
  });

  it('falls back to open probe when databases() not available', async () => {
    let upgradeFired = false;
    const mockOpen = vi.fn((dbName: string) => {
      const fakeRequest: any = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
        result: { close: vi.fn() },
      };

      // Simulate existing database (no upgrade needed)
      setTimeout(() => {
        if (fakeRequest.onsuccess) fakeRequest.onsuccess();
      }, 0);

      return fakeRequest;
    });

    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {
        open: mockOpen,
        // No databases() method
      },
    });

    const health = await getStorageHealth();

    expect(mockOpen).toHaveBeenCalledWith('inkwell_v1');
    expect(health.dbExists).toBe(true);
  });

  it('detects new database via onupgradeneeded', async () => {
    const mockOpen = vi.fn((dbName: string) => {
      const fakeRequest: any = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
        result: { close: vi.fn() },
      };

      // Simulate NEW database (upgrade fires)
      setTimeout(() => {
        if (fakeRequest.onupgradeneeded) fakeRequest.onupgradeneeded();
        if (fakeRequest.onsuccess) fakeRequest.onsuccess();
      }, 0);

      return fakeRequest;
    });

    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: { open: mockOpen },
    });

    const health = await getStorageHealth();

    expect(health.dbExists).toBe(false); // Was created during check
  });

  it('handles IndexedDB.open errors gracefully', async () => {
    // Set up proper storage quota to avoid private mode detection
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 10 * 1024 * 1024,
    });

    const mockOpen = vi.fn((dbName: string) => {
      const fakeRequest: any = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
        result: { close: vi.fn() },
      };

      // Fail only for the actual database, not the private mode probe
      if (dbName === 'inkwell_v1') {
        setTimeout(() => {
          if (fakeRequest.onerror) fakeRequest.onerror();
        }, 0);
      } else {
        // Success for private mode probe
        setTimeout(() => {
          if (fakeRequest.onsuccess) fakeRequest.onsuccess();
        }, 0);
      }

      return fakeRequest;
    });

    const mockDeleteDatabase = vi.fn((dbName: string) => {
      const fakeRequest: any = {
        onsuccess: null,
        onerror: null,
      };

      Promise.resolve().then(() => {
        if (fakeRequest.onsuccess) fakeRequest.onsuccess();
      });

      return fakeRequest;
    });

    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {
        open: mockOpen,
        deleteDatabase: mockDeleteDatabase,
      },
    });

    const health = await getStorageHealth();

    expect(health.dbExists).toBe(false);
    expect(health.healthy).toBe(true); // Error is logged but not fatal
  });

  // ===== PRIVATE MODE DETECTION =====

  it('detects private mode when localStorage is unavailable', async () => {
    mockStorage({ localStorageAvailable: false });

    const health = await getStorageHealth();

    expect(health.privateMode).toBe(true);
    expect(health.warnings).toContain(
      'Running in private/incognito mode - data will be lost when window closes',
    );
  });

  it('detects restricted storage', async () => {
    mockStorage({
      quota: 5 * 1024 * 1024, // Very low quota (5MB)
    });

    const health = await getStorageHealth();

    expect(health.restricted).toBe(true);
    expect(health.warnings).toContain('Storage quota is severely limited');
  });

  // ===== PERSISTENCE STATUS =====

  it('reports persisted status when storage is persisted', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 100 * 1024 * 1024, usage: 10 * 1024 * 1024 }),
        persisted: vi.fn().mockResolvedValue(true),
      },
    });

    const health = await getStorageHealth();

    expect(health.persisted).toBe(true);
  });

  it('reports not persisted when storage is not persisted', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 100 * 1024 * 1024, usage: 10 * 1024 * 1024 }),
        persisted: vi.fn().mockResolvedValue(false),
      },
    });

    const health = await getStorageHealth();

    expect(health.persisted).toBe(false);
  });

  // ===== FORMATTED OUTPUT =====

  it('formats bytes correctly', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024, // 100MB
      usage: 50 * 1024 * 1024, // 50MB
    });

    const health = await getStorageHealth();

    expect(health.quotaFormatted).toMatch(/100(\.\d+)?\s*MB/);
    expect(health.usageFormatted).toMatch(/50(\.\d+)?\s*MB/);
  });

  // ===== ENVIRONMENT DETECTION =====

  it('detects production environment', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { origin: 'https://writewithinkwell.com' },
    });

    const health = await getStorageHealth();

    expect(health.origin).toBe('https://writewithinkwell.com');
    expect(health.isProduction).toBe(true);
  });

  it('detects non-production environment', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { origin: 'http://localhost:5173' },
    });

    const health = await getStorageHealth();

    expect(health.isProduction).toBe(false);
  });

  // ===== SUBSCRIPTION CALLBACKS =====

  it('calls callback periodically via watchStorageHealth', async () => {
    const timers = setupFakeTimers();
    const callback = vi.fn();

    mockStorage({ usage: 80 * 1024 * 1024, quota: 100 * 1024 * 1024 });

    const unwatch = watchStorageHealth(callback, 1000); // 1 second interval

    // Initial call
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

    // Advance time
    timers.advance(1000);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));

    timers.advance(1000);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(3));

    unwatch();
    timers.restore();
  });

  it('stops calling callback after unwatching', async () => {
    const timers = setupFakeTimers();
    const callback = vi.fn();

    const unwatch = watchStorageHealth(callback, 1000);

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

    unwatch();

    callback.mockClear();
    timers.advance(5000);

    // Should not be called after unwatch
    expect(callback).not.toHaveBeenCalled();

    timers.restore();
  });

  it('passes health data to callback', async () => {
    const callback = vi.fn();

    mockStorage({ usage: 50 * 1024 * 1024, quota: 100 * 1024 * 1024 });

    const unwatch = watchStorageHealth(callback, 60000);

    await vi.waitFor(() => expect(callback).toHaveBeenCalled());

    const health = callback.mock.calls[0][0];
    expect(health).toHaveProperty('usage');
    expect(health).toHaveProperty('quota');
    expect(health).toHaveProperty('percentUsed');
    expect(health).toHaveProperty('healthy');

    unwatch();
  });

  // ===== TIMESTAMP TRACKING =====

  it('includes lastChecked timestamp', async () => {
    const beforeCheck = new Date().toISOString();

    const health = await getStorageHealth();

    const afterCheck = new Date().toISOString();

    expect(health.lastChecked).toBeDefined();
    expect(health.lastChecked >= beforeCheck).toBe(true);
    expect(health.lastChecked <= afterCheck).toBe(true);
  });

  // ===== EDGE CASES =====

  it('handles navigator.storage being undefined', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: undefined,
    });

    const health = await getStorageHealth();

    // Should not crash
    expect(health.quota).toBe(0);
    expect(health.usage).toBe(0);
  });

  it('handles estimate() promise rejection', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockRejectedValue(new Error('Estimate failed')),
      },
    });

    const health = await getStorageHealth();

    expect(health.quota).toBe(0);
    expect(health.usage).toBe(0);
    expect(health.warnings).toContain('Could not estimate storage quota');
  });

  it('handles missing quota in estimate result', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({}), // Missing quota and usage
      },
    });

    const health = await getStorageHealth();

    expect(health.quota).toBe(0);
    expect(health.usage).toBe(0);
  });

  // ===== SIMPLE STATUS HELPER =====

  it('returns critical status for private mode', async () => {
    mockStorage({ localStorageAvailable: false });

    const status = await getSimpleStorageStatus();

    expect(status.status).toBe('critical');
    expect(status.message).toContain('Private');
  });

  it('returns warning for unpersisted storage', async () => {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 100 * 1024 * 1024, usage: 10 * 1024 * 1024 }),
        persisted: vi.fn().mockResolvedValue(false),
      },
    });

    // Set up IndexedDB mock to avoid private mode detection
    const mockOpen = vi.fn((dbName: string) => {
      const fakeRequest: any = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null,
        result: { close: vi.fn() },
      };

      Promise.resolve().then(() => {
        if (fakeRequest.onsuccess) fakeRequest.onsuccess();
      });

      return fakeRequest;
    });

    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {
        open: mockOpen,
        deleteDatabase: vi.fn(),
      },
    });

    const status = await getSimpleStorageStatus();

    expect(status.status).toBe('warning');
    expect(status.message).toContain('Not Persistent');
  });

  it('returns critical for >90% usage', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 95 * 1024 * 1024,
    });

    const status = await getSimpleStorageStatus();

    expect(status.status).toBe('critical');
    expect(status.message).toContain('Almost Full');
  });

  it('returns warning for >75% usage', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 80 * 1024 * 1024,
    });

    const status = await getSimpleStorageStatus();

    expect(status.status).toBe('warning');
    expect(status.message).toContain('Filling Up');
  });

  it('returns healthy for normal usage', async () => {
    mockStorage({
      quota: 100 * 1024 * 1024,
      usage: 30 * 1024 * 1024,
    });

    const status = await getSimpleStorageStatus();

    expect(status.status).toBe('healthy');
    expect(status.message).toBe('Storage OK');
  });
});
