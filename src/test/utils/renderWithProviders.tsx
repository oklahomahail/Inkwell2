/**
 * Test utility for rendering components with all necessary providers
 */
import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext, AuthContextType } from '@/context/AuthContext';
import { User } from '@supabase/supabase-js';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authOverride?: Partial<AuthContextType>;
  initialRoute?: string;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  signInWithEmail: async () => ({ error: null }),
  signOut: async () => {},
  refreshSession: async () => {},
};

/**
 * Renders a component with all necessary providers for testing
 *
 * @example
 * ```tsx
 * render(<MyComponent />, {
 *   authOverride: {
 *     user: { id: 'test-user', email: 'test@example.com' },
 *     loading: false,
 *   }
 * })
 * ```
 */
export function render(
  ui: React.ReactElement,
  { authOverride, initialRoute = '/', ...renderOptions }: CustomRenderOptions = {},
) {
  const authValue = { ...defaultAuthContext, ...authOverride };

  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </BrowserRouter>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates a mock authenticated user for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { render as default };
