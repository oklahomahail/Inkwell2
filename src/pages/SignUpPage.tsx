import React from 'react';

import AuthPage from './AuthPage';

/**
 * SignUpPage renders the AuthPage component in "signup" mode.
 * This serves as the entry point for the /sign-up route.
 */
export default function SignUp() {
  return <AuthPage mode="signup" />;
}
