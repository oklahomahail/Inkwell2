import { vi } from 'vitest';

// Minimal, reusable mock supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(() =>
      Promise.resolve({
        data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
      }),
    ),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signOut: vi.fn(() => Promise.resolve()),
    signInWithOtp: vi.fn(() => Promise.resolve({ error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    signUp: vi.fn(() => Promise.resolve({ error: null })),
  },
};

// Mock module by alias path so all tests can import it
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// If you also reference tour triggers in many tests:
const triggerDashboardView = vi.fn();
vi.mock('@/utils/tourTriggers', () => ({
  triggerDashboardView,
}));

// Expose for tests that want to tweak behavior:
(globalThis as any).__mockSupabase = mockSupabase;
(globalThis as any).__triggerDashboardView = triggerDashboardView;

// Fix TypeScript error by using proper environment variable assignment
// TypeScript needs to know these properties are allowed on import.meta
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

// Provide safe env defaults for tests that read import.meta.env:
import.meta.env = {
  ...import.meta.env,
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test_anon_key',
};
