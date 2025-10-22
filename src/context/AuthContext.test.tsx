import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

// Mock supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(() =>
      Promise.resolve({
        data: {
          session: { user: { id: 'test-user-id', email: 'test@example.com' } },
        },
      }),
    ),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })),
    signOut: vi.fn(() => Promise.resolve()),
    signInWithOtp: vi.fn(() => Promise.resolve({ error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    signUp: vi.fn(() => Promise.resolve({ error: null })),
  },
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock dashboard view trigger
const mockTriggerDashboardView = vi.fn();
vi.mock('@/utils/tourTriggers', () => ({
  triggerDashboardView: mockTriggerDashboardView,
}));

// Create a test component to access auth context
const TestComponent = () => {
  const { user, loading, signInWithEmail, signInWithPassword, signUpWithPassword, signOut } =
    useAuth();

  return (
    <div>
      <div data-testid="user-status">
        {loading ? 'Loading...' : user ? `User: ${user.email}` : 'No user'}
      </div>
      <button
        data-testid="sign-in-email-btn"
        onClick={() => signInWithEmail('test@example.com', '/dashboard')}
      >
        Sign In with Email
      </button>
      <button
        data-testid="sign-in-pwd-btn"
        onClick={() => signInWithPassword('test@example.com', 'password')}
      >
        Sign In with Password
      </button>
      <button
        data-testid="sign-up-btn"
        onClick={() => signUpWithPassword('test@example.com', 'password')}
      >
        Sign Up
      </button>
      <button data-testid="sign-out-btn" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const originalLocation = window.location;
  const mockLocation = {
    origin: 'https://example.com',
    href: 'https://example.com/test',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('provides auth context to children', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    expect(screen.getByTestId('user-status')).toHaveTextContent('User: test@example.com');
  });

  it('handles sign in with email', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Sign in with email
    await act(async () => {
      screen.getByTestId('sign-in-email-btn').click();
    });

    // Check that supabase.auth.signInWithOtp was called
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('https://example.com/auth/callback'),
        shouldCreateUser: true,
      },
    });

    // Verify logging
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[Auth] Magic link sent successfully! Check your email.',
    );

    consoleInfoSpy.mockRestore();
  });

  it('handles sign in with password', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Sign in with password
    await act(async () => {
      screen.getByTestId('sign-in-pwd-btn').click();
    });

    // Check that supabase.auth.signInWithPassword was called
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });

    // Verify logging
    expect(consoleInfoSpy).toHaveBeenCalledWith('[Auth] Password sign-in successful');

    consoleInfoSpy.mockRestore();
  });

  it('handles sign up with password', async () => {
    const { supabase } = await import('@/lib/supabaseClient');
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Sign up with password
    await act(async () => {
      screen.getByTestId('sign-up-btn').click();
    });

    // Check that supabase.auth.signUp was called
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        emailRedirectTo: expect.stringContaining('https://example.com/auth/callback'),
      },
    });

    // Verify logging
    expect(consoleInfoSpy).toHaveBeenCalledWith('[Auth] Password sign-up successful');

    consoleInfoSpy.mockRestore();
  });

  it('handles sign out', async () => {
    const { supabase } = await import('@/lib/supabaseClient');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Sign out
    await act(async () => {
      screen.getByTestId('sign-out-btn').click();
    });

    // Check that supabase.auth.signOut was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('handles authentication errors', async () => {
    const { supabase } = await import('@/lib/supabaseClient');
    const mockError = { message: 'Authentication failed' };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock sign-in with error
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ error: mockError });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Sign in with password (should fail)
    await act(async () => {
      screen.getByTestId('sign-in-pwd-btn').click();
    });

    // Verify error logging
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Auth] Password sign-in failed:',
      'Authentication failed',
    );

    consoleErrorSpy.mockRestore();
  });

  it('handles auth state changes', async () => {
    const { supabase } = await import('@/lib/supabaseClient');
    const { triggerDashboardView } = await import('@/utils/tourTriggers');

    // Setup mock for auth state change
    let authChangeCallback: any;
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Simulate sign-in event
    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: { id: 'new-user', email: 'new@example.com' } });
    });

    // Should trigger dashboard view
    expect(triggerDashboardView).toHaveBeenCalled();

    // Simulate password recovery event
    const hrefSpy = vi.spyOn(mockLocation, 'href', 'set');

    await act(async () => {
      authChangeCallback('PASSWORD_RECOVERY', { user: { id: 'user-id' } });
    });

    // Should redirect
    expect(hrefSpy).toHaveBeenCalledWith('/auth/update-password');

    hrefSpy.mockRestore();
  });

  it('validates safe redirects', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { supabase } = await import('@/lib/supabaseClient');

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Test with absolute URL (should be rejected)
    supabase.auth.signInWithOtp.mockClear();
    await act(async () => {
      const { signInWithEmail } = useAuth();
      await signInWithEmail('test@example.com', 'https://evil.com');
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        // Should use safe fallback /dashboard instead of evil.com
        emailRedirectTo: expect.stringContaining('next=%2Fdashboard'),
        shouldCreateUser: true,
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Auth] Rejected absolute URL redirect:',
      'https://evil.com',
    );

    consoleWarnSpy.mockRestore();
  });

  it('throws error when used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleErrorSpy.mockRestore();
  });
});
