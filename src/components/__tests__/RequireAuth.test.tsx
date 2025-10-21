import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RequireAuth from '../RequireAuth';

// Create a mock for useAuth
const mockUseAuth = vi.fn();

// Mock the necessary components and hooks
vi.mock('react-router-dom', () => ({
  Navigate: (props) => (
    <div data-testid="navigate" data-to={props.to}>
      Navigate to {props.to}
    </div>
  ),
  useLocation: () => ({ pathname: '/test' }),
}));

// Mock the AuthContext module
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock component for the protected route
const Dashboard = () => <div data-testid="dashboard">Dashboard Content</div>;

describe('RequireAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      user: null,
      session: null,
      signInWithEmail: vi.fn(),
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <RequireAuth>
        <Dashboard />
      </RequireAuth>,
    );

    expect(screen.getByText(/verifying access/i)).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to sign-in', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      user: null,
      session: null,
      signInWithEmail: vi.fn(),
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <RequireAuth>
        <Dashboard />
      </RequireAuth>,
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate').getAttribute('data-to')).toContain('/sign-in');
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { id: 'test-user', email: 'test@example.com' },
      session: { user: { id: 'test-user', email: 'test@example.com' } },
      signInWithEmail: vi.fn(),
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <RequireAuth>
        <Dashboard />
      </RequireAuth>,
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
});
