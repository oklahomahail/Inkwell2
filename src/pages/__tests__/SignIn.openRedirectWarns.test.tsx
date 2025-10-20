import { Routes, Route } from 'react-router-dom';
import { vi, it, expect } from 'vitest';

import { renderWithRouter } from '../../test/utils/renderWithRouter';
import SignIn from '../SignIn';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: {
        signInWithOtp: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    }),
  };
});

// Our navigate wrapper is irrelevant for this test; keep it inert.
vi.mock('@/utils/navigate', () => ({ useGo: () => vi.fn() }));

// Directly mock the supabaseClient import to ensure it's properly mocked
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

it('warns and normalizes when redirect is unsafe on SignIn', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const ui = (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
    </Routes>
  );

  renderWithRouter(ui, {
    initialEntries: ['/sign-in?redirect=https://evil.com'],
  });

  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0][0]).toMatch(/unsafe redirect/i);
  expect(warn.mock.calls[0][1]).toBe('https://evil.com');

  warn.mockRestore();
});
