import React, { useEffect } from 'react';

import AuthPage from './AuthPage';

/**
 * SignInPage renders the AuthPage component in "signin" mode.
 * This serves as the entry point for the /sign-in route.
 */
export default function SignIn() {
  useEffect(() => {
    // Add debugging to help diagnose rendering issues
    console.log('[SignInPage] Rendering SignIn component');

    // Report rendering status to the window for debugging
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('inkwell:debug', {
          detail: { component: 'SignInPage', status: 'rendered' },
        }),
      );
    }
  }, []);

  return <AuthPage mode="signin" />;
}
