import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  mode: 'signin' | 'signup';
  redirect?: string;
};

export default function AuthFooter({ mode, redirect = '/dashboard' }: Props) {
  const redirectParam =
    redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return (
    <div className="mt-4 text-center text-sm">
      <span className="opacity-80">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
      </span>{' '}
      <Link
        to={`/${mode === 'signin' ? 'sign-up' : 'sign-in'}${redirectParam}`}
        className="font-medium underline text-[#13294B]"
      >
        {mode === 'signin' ? 'Sign up' : 'Sign in'}
      </Link>
    </div>
  );
}
