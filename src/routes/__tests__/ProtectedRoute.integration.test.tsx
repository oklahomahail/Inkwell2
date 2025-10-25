// src/routes/__tests__/ProtectedRoute.integration.test.tsx
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

// Mock the auth context
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute - Integration Tests', () => {
  it('shows loading state while checking authentication', () => {
    // Set up mock to return loading state
    (useAuth as any).mockReturnValue({
      loading: true,
      session: null,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Should show loading indicator
    expect(screen.getByText(/Verifying access/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to sign-in when no session exists', () => {
    // Mock navigate function
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        Navigate: (props: any) => {
          mockNavigate(props.to);
          return null;
        },
      };
    });

    // Set up mock to return not authenticated state
    (useAuth as any).mockReturnValue({
      loading: false,
      session: null,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Should redirect with proper encoded redirect URL
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/sign-in?redirect=%2Fdashboard'),
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    // Set up mock to return authenticated state
    (useAuth as any).mockReturnValue({
      loading: false,
      session: { user: { id: 'test-user' } },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Should render the protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('properly encodes complex URLs for redirect', () => {
    // Mock navigate function
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        Navigate: (props: any) => {
          mockNavigate(props.to);
          return null;
        },
      };
    });

    // Set up mock to return not authenticated state
    (useAuth as any).mockReturnValue({
      loading: false,
      session: null,
    });

    render(
      <MemoryRouter initialEntries={['/projects/123?view=writing&tab=2#section-1']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Should encode the full path including query and hash
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining(
        '/sign-in?redirect=%2Fprojects%2F123%3Fview%3Dwriting%26tab%3D2%23section-1',
      ),
    );
  });
});
