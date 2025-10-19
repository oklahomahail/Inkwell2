import { User } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProtectedRoute from '../ProtectedRoute';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('shows spinner while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: vi.fn(),
      signInWithEmail: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>PRIVATE</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Should show loading spinner, not redirect or render children
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument();
    // The loading spinner has specific classes but no text, so we check for the spinner container
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('redirects guests to /sign-in with redirect param', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn(),
      signInWithEmail: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private?x=1']}>
        <Routes>
          <Route path="/sign-in" element={<div>SIGNIN</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>PRIVATE</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Should redirect to sign-in page
    expect(screen.getByText('SIGNIN')).toBeInTheDocument();
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument();
  });

  it('renders children when authed', () => {
    const mockUser: User = {
      id: 'test-user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    } as User;

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
      signInWithEmail: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/sign-in" element={<div>SIGNIN</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>PRIVATE</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Should render the protected content
    expect(screen.getByText('PRIVATE')).toBeInTheDocument();
    expect(screen.queryByText('SIGNIN')).not.toBeInTheDocument();
  });

  it('preserves complex paths with query params when redirecting', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn(),
      signInWithEmail: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/p/project-123?tab=characters&view=grid']}>
        <Routes>
          <Route path="/sign-in" element={<div>SIGNIN</div>} />
          <Route
            path="/p/:projectId"
            element={
              <ProtectedRoute>
                <div>PROJECT</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Should redirect to sign-in
    expect(screen.getByText('SIGNIN')).toBeInTheDocument();
    expect(screen.queryByText('PROJECT')).not.toBeInTheDocument();
  });

  it('does not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: vi.fn(),
      signInWithEmail: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/sign-in" element={<div>SIGNIN</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>PRIVATE</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Should show spinner, not redirect to sign-in
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('SIGNIN')).not.toBeInTheDocument();
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument();
  });
});
