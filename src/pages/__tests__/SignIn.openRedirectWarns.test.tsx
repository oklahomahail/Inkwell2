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
      from: vi.fn(),
    }),
  };
});

// Our navigate wrapper is irrelevant for this test; keep it inert.
vi.mock('@/utils/navigate', () => ({ useGo: () => vi.fn() }));

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
