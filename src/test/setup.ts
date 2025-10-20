import { vi } from 'vitest';

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

// Default Supabase mock (override per-test as needed)
vi.mock('@/lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      },
    },
  };
});
