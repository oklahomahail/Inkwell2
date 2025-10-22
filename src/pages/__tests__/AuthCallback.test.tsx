// Hoisted mocks so vi.mock factories can reference them safely
import { waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Import the mock utility (this should be hoisted before ProfileContext is imported)
import '../../test/utils/mockProfileContext';

const h = vi.hoisted(() => {
  return {
    exchange: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    navigateSpy: vi.fn(),
  };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: h.exchange,
      getSession: h.getSession,
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('../../utils/navigate', () => ({ useGo: () => h.navigateSpy }));

import { renderWithRouter } from '../../test/utils/renderWithRouter';
import AuthCallback from '../AuthCallback';

// Get the mock API to update mock values

// OPTIONAL: if your helper logs "Blocked unsafe redirect"
const warnSpy = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

function renderWithRoutes(initialEntry: string) {
  return renderWithRouter(
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<div>DASHBOARD</div>} />
      <Route path="/sign-in" element={<div>SIGNIN</div>} />
    </Routes>,
    { initialEntries: [initialEntry] },
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset hoisted spies’ state
    h.exchange.mockReset();
    h.getSession.mockReset();
    h.navigateSpy.mockReset();

    h.exchange.mockResolvedValue({ data: { session: {} }, error: null });
    h.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('redirects to /sign-in on missing code', async () => {
    h.exchange.mockResolvedValueOnce({ data: null, error: { message: 'Missing or invalid code' } });
    renderWithRoutes('/auth/callback');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/sign-in?error=callback&reason=auth_failed', {
        replace: true,
      }),
    );
  });

  it('exchanges code and forwards to next', async () => {
    renderWithRoutes('/auth/callback?code=abc&redirect=/dashboard');

    await waitFor(() => {
      // AuthCallback reads full URL string; we just assert we navigated correctly
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('redirects to /sign-in when exchange fails', async () => {
    h.exchange.mockResolvedValueOnce({ data: null, error: { message: 'Auth error' } });

    renderWithRoutes('/auth/callback?code=abc');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/sign-in?error=callback', { replace: true }),
    );
  });

  it('handles token_hash parameter as alternative to code', async () => {
    renderWithRoutes('/auth/callback?token_hash=xyz&redirect=/dashboard');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
  });

  it('Security: rejects absolute URL redirects (https://)', async () => {
    const w = warnSpy();

    renderWithRoutes('/auth/callback?code=abc&redirect=https://evil.com');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
    expect(w).toHaveBeenCalled(); // from normalizeSafeRedirect
    w.mockRestore();
  });

  it('Security: rejects protocol-relative URL redirects (//)', async () => {
    const w = warnSpy();

    renderWithRoutes('/auth/callback?code=abc&redirect=//evil.com');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
    expect(w).toHaveBeenCalled();
    w.mockRestore();
  });

  it('Security: allows valid same-origin paths with query', async () => {
    renderWithRoutes('/auth/callback?code=abc&redirect=/dashboard?tab=settings');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard?tab=settings', { replace: true }),
    );
  });

  it('defaults to /dashboard when redirect is missing', async () => {
    renderWithRoutes('/auth/callback?code=abc');

    await waitFor(() =>
      expect(h.navigateSpy).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
  });
});
