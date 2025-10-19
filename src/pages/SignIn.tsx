import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail } = useAuth();

  // Get redirect path from query params (set by ProtectedRoute)
  const redirectPath = searchParams.get('redirect') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error: signInError } = await signInWithEmail(email, redirectPath);
    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-inkwell-blue">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-700">
            We've sent a magic link to <strong>{email}</strong>. Click the link in your email to
            sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-inkwell-blue">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <img
            src="/brand/inkwell-lockup-dark.svg"
            alt="Inkwell logo"
            className="mx-auto mb-4 h-16"
          />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Inkwell</h2>
          <p className="mt-1 text-sm italic text-gray-600">find your story, weave it well</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                         focus:border-inkwell-blue focus:outline-none focus:ring-inkwell-blue"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-inkwell-blue px-4 py-2 font-medium text-white
                       transition-colors duration-150
                       hover:bg-inkwell-gold
                       focus:outline-none focus:ring-2 focus:ring-inkwell-gold focus:ring-offset-2"
          >
            Send magic link
          </button>
        </form>
      </div>
    </div>
  );
}
