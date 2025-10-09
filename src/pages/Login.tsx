import { useState } from 'react';

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
    <div className="min-h-screen grid place-items-center bg-slate-950 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-slate-900 p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-semibold text-white">Inkwell access</h1>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          className="w-full rounded-xl bg-slate-800 text-white px-3 py-2 outline-none"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white py-2"
        >
          {loading ? 'Checking…' : 'Enter'}
        </button>
        <p className="text-xs text-slate-400">Need help, contact your Inkwell admin.</p>
      </form>
    </div>
  );
}
