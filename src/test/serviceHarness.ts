/**
 * Service Testing Harness
 *
 * Reusable mocks and utilities for testing service layer.
 * Promoted from Phase 1 model tests for Phase 2 service coverage.
 */

import { vi } from 'vitest';
import type { IDBFactory } from 'fake-indexeddb';

/**
 * IndexedDB Mock Harness
 *
 * Provides a controlled IndexedDB environment for testing.
 * Uses fake-indexeddb for realistic browser-like behavior.
 */
export class IndexedDBHarness {
  private originalIndexedDB: IDBFactory | undefined;

  setup() {
    // Store original IndexedDB
    this.originalIndexedDB = globalThis.indexedDB;

    // Import fake-indexeddb
    const FDBFactory = require('fake-indexeddb/lib/FDBFactory');

    // Replace global IndexedDB with a fresh fake instance
    globalThis.indexedDB = new FDBFactory();
  }

  teardown() {
    // Restore original IndexedDB
    if (this.originalIndexedDB) {
      globalThis.indexedDB = this.originalIndexedDB;
    }
  }

  /**
   * Clear all databases (for test isolation)
   * Recreates the IndexedDB instance to ensure clean state
   */
  async clearAll() {
    // The most reliable way to clear fake-indexeddb is to recreate it
    const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
    globalThis.indexedDB = new FDBFactory();
  }
}

/**
 * Supabase Mock Harness
 *
 * Provides controlled Supabase client mocking for service tests.
 */
export class SupabaseMockHarness {
  mockSupabase: ReturnType<typeof createSupabaseMock>;

  constructor() {
    this.mockSupabase = createSupabaseMock();
  }

  /**
   * Setup default success responses
   */
  setupDefaults() {
    this.mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);
  }

  /**
   * Mock successful select query
   */
  mockSelectSuccess(data: any[]) {
    this.mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data, error: null }),
    } as any);
  }

  /**
   * Mock failed query with error
   */
  mockQueryError(errorMessage: string) {
    this.mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      }),
    } as any);
  }

  /**
   * Mock network offline (all queries fail)
   */
  mockOffline() {
    this.mockSupabase.from.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error('Network request failed')),
    } as any);
  }

  reset() {
    vi.clearAllMocks();
  }
}

/**
 * Create Supabase client mock
 */
function createSupabaseMock() {
  return {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
  };
}

/**
 * Cache Mock Harness
 *
 * Provides spies for cache operations to verify invalidation logic.
 */
export class CacheMockHarness {
  invalidateSpy = vi.fn();
  invalidateProjectSpy = vi.fn();

  getMocks() {
    return {
      chapterCache: {
        invalidate: this.invalidateSpy,
        invalidateProject: this.invalidateProjectSpy,
        get: vi.fn(),
        set: vi.fn(),
      },
      CacheKeys: {
        chapterList: (projectId: string) => `chapters:list:${projectId}`,
        chapterMeta: (chapterId: string) => `chapter:meta:${chapterId}`,
        chapterDoc: (chapterId: string) => `chapter:doc:${chapterId}`,
      },
      withChapterListCache: vi.fn((projectId, fn) => fn()),
    };
  }

  reset() {
    this.invalidateSpy.mockClear();
    this.invalidateProjectSpy.mockClear();
  }
}

/**
 * Fake Timers Harness
 *
 * Provides controlled time manipulation for testing retries, debounces, etc.
 */
export class FakeTimersHarness {
  setup() {
    vi.useFakeTimers();
  }

  teardown() {
    vi.useRealTimers();
  }

  /**
   * Advance time by milliseconds
   */
  advance(ms: number) {
    vi.advanceTimersByTime(ms);
  }

  /**
   * Run all pending timers
   */
  runAll() {
    vi.runAllTimers();
  }

  /**
   * Run only pending immediate callbacks
   */
  runOnlyPending() {
    vi.runOnlyPendingTimers();
  }
}

/**
 * Network Mock Harness
 *
 * Simulates network conditions (online/offline, slow connection, etc.)
 */
export class NetworkMockHarness {
  private originalOnLine: boolean;

  constructor() {
    this.originalOnLine = navigator.onLine;
  }

  setOnline() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
  }

  setOffline() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  }

  restore() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: this.originalOnLine,
    });
  }
}

/**
 * Fetch Mock Harness
 *
 * Mocks fetch API for testing HTTP operations
 */
export class FetchMockHarness {
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  mockSuccess(data: any, status = 200) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    } as Response);
  }

  mockError(status = 500, message = 'Internal Server Error') {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message }),
      text: async () => message,
    } as Response);
  }

  mockNetworkError() {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network request failed'));
  }

  mockTimeout(delay = 5000) {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), delay);
        }),
    );
  }

  restore() {
    global.fetch = this.originalFetch;
  }
}

/**
 * Combined Service Test Harness
 *
 * Convenience class that combines all harnesses for easy service testing.
 */
export class ServiceTestHarness {
  indexedDB = new IndexedDBHarness();
  supabase = new SupabaseMockHarness();
  cache = new CacheMockHarness();
  timers = new FakeTimersHarness();
  network = new NetworkMockHarness();
  fetch = new FetchMockHarness();

  /**
   * Setup all harnesses
   */
  setupAll() {
    this.indexedDB.setup();
    this.supabase.setupDefaults();
  }

  /**
   * Teardown all harnesses
   */
  async teardownAll() {
    await this.indexedDB.clearAll();
    this.indexedDB.teardown();
    this.supabase.reset();
    this.cache.reset();
    this.network.restore();
    this.fetch.restore();
  }

  /**
   * Reset all mocks (for between tests)
   */
  resetAll() {
    this.supabase.reset();
    this.cache.reset();
  }
}
