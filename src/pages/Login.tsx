import { useState } from 'react';

import Logo from '@/components/Logo';

export default function Login() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (!data.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      const q = new URLSearchParams(location.search);
      const next = q.get('next') || '/';
      location.replace(next);
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Brand */}
      <div className="hidden md:flex items-center justify-center bg-inkwell-navy p-8">
        <div className="text-center">
          <Logo variant="wordmark-dark" size={64} className="mx-auto mb-8 drop-shadow-lg" />
          <h2 className="text-2xl font-light text-white/90 mb-4">Professional Writing Studio</h2>
          <p className="text-white/70 max-w-md leading-relaxed">
            Craft extraordinary stories with tools designed for serious writers.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center bg-white dark:bg-gray-900 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8 md:hidden">
            <Logo variant="wordmark-light" size={48} className="mx-auto mb-4" />
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Enter your access code to continue</p>
            </div>

            <div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-inkwell-navy focus:border-transparent transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-inkwell-navy hover:bg-inkwell-navy-700 disabled:opacity-60 text-white py-3 font-medium transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? 'Checking…' : 'Enter Inkwell'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Need help? Contact your Inkwell administrator.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
