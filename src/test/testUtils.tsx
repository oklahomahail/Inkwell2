// src/test/testUtils.tsx
/**
 * Shared test utilities for the Inkwell test suite.
 * Provides reusable harnesses for providers, mocks, and common test patterns.
 */

import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import type { AppState } from '@/context/AppContext';

// ===== MOCK FACTORIES =====

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-123',
    email: 'test@inkwell.app',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  } as User;
}

export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: createMockUser(overrides?.user),
    ...overrides,
  } as Session;
}

// ===== STORAGE MOCKS =====

export interface MockStorageOptions {
  quota?: number;
  usage?: number;
  indexedDBAvailable?: boolean;
  localStorageAvailable?: boolean;
}

export function mockStorage(options: MockStorageOptions = {}) {
  const {
    quota = 50 * 1024 * 1024, // 50MB default
    usage = 0,
    indexedDBAvailable = true,
    localStorageAvailable = true,
  } = options;

  // Mock navigator.storage.estimate
  const estimateMock = vi.fn().mockResolvedValue({
    quota,
    usage,
    usageDetails: {},
  });

  Object.defineProperty(navigator, 'storage', {
    writable: true,
    value: {
      estimate: estimateMock,
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
    },
  });

  // Mock IndexedDB if needed
  if (!indexedDBAvailable) {
    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: undefined,
    });
  }

  // Mock localStorage if needed
  if (!localStorageAvailable) {
    const throwError = () => {
      throw new Error('QuotaExceededError');
    };
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn(),
        setItem: throwError,
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
    });
  }

  return { estimateMock };
}

export function resetStorageMocks() {
  vi.restoreAllMocks();

  // Reset navigator.storage to working defaults
  Object.defineProperty(navigator, 'storage', {
    writable: true,
    value: {
      estimate: vi.fn().mockResolvedValue({
        quota: 100 * 1024 * 1024, // Use 100MB to avoid private mode detection
        usage: 0,
      }),
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
    },
  });

  // Reset localStorage to working state
  const localStorageMock: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
      }),
      length: 0,
      key: vi.fn(),
    },
  });

  // Reset IndexedDB to available state
  if (typeof window !== 'undefined' && !(window as any).indexedDB) {
    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {}, // Minimal mock that exists
    });
  }
}

// ===== ANALYTICS MOCK =====

export interface MockAnalyticsService {
  track: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  page: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

export function createMockAnalytics(): MockAnalyticsService {
  return {
    track: vi.fn().mockResolvedValue(undefined),
    identify: vi.fn().mockResolvedValue(undefined),
    page: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
  };
}

// ===== EVENT BUS MOCK =====

export interface MockEventBus {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
}

export function createMockEventBus(): MockEventBus {
  const listeners = new Map<string, Set<Function>>();

  return {
    on: vi.fn((event: string, handler: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: Function) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: vi.fn((event: string, ...args: any[]) => {
      listeners.get(event)?.forEach((handler) => handler(...args));
    }),
    once: vi.fn((event: string, handler: Function) => {
      const wrapper = (...args: any[]) => {
        handler(...args);
        listeners.get(event)?.delete(wrapper);
      };
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(wrapper);
    }),
  };
}

// ===== NETWORK MOCKS =====

export function mockOnlineStatus(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: online,
  });
}

export function simulateNetworkEvent(type: 'online' | 'offline') {
  mockOnlineStatus(type === 'online');
  window.dispatchEvent(new Event(type));
}

// ===== PROVIDER HARNESS =====

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routerProps?: Partial<MemoryRouterProps>;
  authState?: {
    user?: User | null;
    session?: Session | null;
    loading?: boolean;
  };
  appState?: Partial<AppState>;
  skipAuth?: boolean;
  skipApp?: boolean;
  skipRouter?: boolean;
}

/**
 * Renders a component wrapped in all necessary providers.
 * Use this for integration tests that need full context.
 *
 * @example
 * ```tsx
 * renderWithProviders(<MyComponent />, {
 *   route: '/dashboard',
 *   authState: { user: createMockUser() },
 *   appState: { theme: 'dark' }
 * });
 * ```
 */
export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const {
    route = '/',
    routerProps = {},
    authState,
    appState,
    skipAuth = false,
    skipApp = false,
    skipRouter = false,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    let content = children;

    // Wrap in AppProvider if needed
    // Note: AppProvider doesn't accept initialState - it manages its own state
    // Tests can use the context hooks to manipulate state after mount
    if (!skipApp) {
      content = <AppProvider>{content}</AppProvider>;
    }

    // Wrap in AuthProvider if needed
    if (!skipAuth) {
      // If custom auth state provided, we need to mock the supabase client
      if (authState) {
        const mockSupabase = (globalThis as any).__mockSupabase;
        if (mockSupabase) {
          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: authState.session ?? null },
            error: null,
          });
        }
      }
      content = <AuthProvider>{content}</AuthProvider>;
    }

    // Wrap in Router if needed
    if (!skipRouter) {
      content = (
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {content}
        </MemoryRouter>
      );
    }

    return content;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ===== FAKE TIMERS HELPER =====

export function setupFakeTimers() {
  vi.useFakeTimers();
  return {
    advance: (ms: number) => vi.advanceTimersByTime(ms),
    runAll: () => vi.runAllTimers(),
    restore: () => vi.useRealTimers(),
  };
}

// ===== ASYNC HELPERS =====

export function waitForPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

export async function flushPromises() {
  await waitForPromises();
}
