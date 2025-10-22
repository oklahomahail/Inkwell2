// IMPORTANT: define hoisted mocks FIRST
import { waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Import the profile context mock
import '../../test/utils/mockProfileContext';

const h = vi.hoisted(() => {
  return {
    exchange: vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Missing or invalid code' },
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    navigateSpy: vi.fn(),
  };
});

// Mock Supabase (must not capture non-hoisted top-level vars)
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: h.exchange,
      getSession: h.getSession,
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock the navigation wrapper (never mock react-router directly)
vi.mock('../../utils/navigate', () => ({ useGo: () => h.navigateSpy }));

import { renderWithRouter } from '../../test/utils/renderWithRouter';
import AuthCallback from '../AuthCallback';

describe('AuthCallback – missing code', () => {
  it('redirects to /sign-in on missing code', async () => {
    renderWithRouter(<AuthCallback />, { initialEntries: ['/auth/callback'] });

    await waitFor(() => {
      expect(h.navigateSpy).toHaveBeenCalledWith('/sign-in?error=callback&reason=auth_failed', {
        replace: true,
      });
    });
  });
});
