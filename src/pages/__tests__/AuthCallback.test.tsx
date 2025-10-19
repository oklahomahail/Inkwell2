import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, vi, expect, beforeEach } from 'vitest';

import { supabase } from '@/lib/supabaseClient';
import AuthCallback from '@/pages/AuthCallback';

vi.mock('@/lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        exchangeCodeForSession: vi.fn(),
      },
    },
  };
});

function AppShell() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profiles" element={<div>PROFILES</div>} />
      <Route path="/sign-in" element={<div>SIGNIN</div>} />
    </Routes>
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exchanges code and forwards to next', async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter initialEntries={['/auth/callback?code=abc&next=%2Fprofiles']}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Signing you in/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PROFILES')).toBeInTheDocument();
    });

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('redirects to /sign-in on missing code', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AppShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('SIGNIN')).toBeInTheDocument();
    });
  });

  it('redirects to /sign-in when exchange fails', async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({
      data: null,
      error: new Error('boom'),
    });

    render(
      <MemoryRouter initialEntries={['/auth/callback?code=abc&next=%2Fprofiles']}>
        <AppShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('SIGNIN')).toBeInTheDocument();
    });
  });

  it('handles token_hash parameter as alternative to code', async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter initialEntries={['/auth/callback?token_hash=xyz&next=%2Fprofiles']}>
        <AppShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('PROFILES')).toBeInTheDocument();
    });

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('xyz');
  });

  it('defaults to /profiles when next parameter is missing', async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter initialEntries={['/auth/callback?code=abc']}>
        <AppShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Should navigate to default path (/profiles)
      expect(screen.getByText('PROFILES')).toBeInTheDocument();
    });

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });
});
