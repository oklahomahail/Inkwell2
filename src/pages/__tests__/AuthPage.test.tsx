import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import AuthPage from '../AuthPage';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: {} })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  },
}));

// Mock the useGo hook
vi.mock('@/utils/navigate', () => ({
  useGo: () => vi.fn(),
}));

describe('AuthPage', () => {
  it('renders sign-in page with correct title and button', () => {
    render(
      <MemoryRouter>
        <AuthPage mode="signin" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign in to Inkwell')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText(/confirm password/i)).not.toBeInTheDocument();
  });

  it('renders sign-up page with correct title, button, and confirm field', () => {
    render(
      <MemoryRouter>
        <AuthPage mode="signup" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Create your Inkwell account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
});
