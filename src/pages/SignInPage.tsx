import React from 'react';

import AuthPage from './AuthPage';

/**
 * SignInPage renders the AuthPage component in "signin" mode.
 * This serves as the entry point for the /sign-in route.
 */
export default function SignIn() {
  return <AuthPage mode="signin" />;
}
