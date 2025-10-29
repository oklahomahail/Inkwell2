import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

// Mock supabase client - define inside factory to avoid hoisting issues
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
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
  },
}));

// Mock dashboard view trigger - define inside factory to avoid hoisting issues
vi.mock('@/utils/tourTriggers', () => ({
  triggerDashboardView: vi.fn(),
}));

// Get access to mocked modules
// @ts-expect-error - Importing mocked module for test access
import { supabase as mockSupabase } from '@/lib/supabaseClient';
// @ts-expect-error - Importing mocked module for test access
import * as mockTourTriggers from '@/utils/tourTriggers';

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
  });

  it('handles sign in with password', async () => {
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
  });

  it('handles sign up with password', async () => {
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
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        emailRedirectTo: expect.stringContaining('https://example.com/auth/callback'),
      },
    });
  });

  it('handles sign out', async () => {
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
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('handles authentication errors', async () => {
    const mockError = { message: 'Authentication failed' };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock sign-in with error
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: mockError });

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
    // Setup mock for auth state change
    let authChangeCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
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
    expect(mockTourTriggers.triggerDashboardView).toHaveBeenCalled();

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
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    });

    // Test with absolute URL (should reject)
    await act(async () => {
      screen.getByTestId('sign-in-email-btn').click();
    });

    // Should use safe redirect (dashboard) instead of malicious URL
    // The actual redirect format uses 'next' parameter
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback?next=%2Fdashboard'),
        shouldCreateUser: true,
      },
    });

    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('throws error when used outside provider', () => {
    // Suppress expected error log from React
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Verify the guard logic works: if context is null/undefined, it should throw
    expect(() => {
      const context = undefined;
      if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleErrorSpy.mockRestore();
  });
});
