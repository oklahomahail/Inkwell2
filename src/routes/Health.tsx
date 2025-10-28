import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

export default function Health() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: sErr } = await supabase.auth.getSession();
        if (sErr) throw sErr;
        const authed = Boolean(sessionData.session);

        const { error: qErr } = await supabase
          .from('projects')
          .select('id', { head: true, count: 'exact' })
          .limit(0);
        if (qErr) throw qErr;

        setStatus('ok');
        setDetails(`auth=${authed ? 'yes' : 'no'}, query=head-select ok`);
      } catch (e: any) {
        setStatus('error');
        setDetails(e?.message || 'unknown error');
      }
    })();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Health</h1>
      <p className="mt-2">
        Status: <strong>{status}</strong>
      </p>
      {details && <pre className="mt-2 whitespace-pre-wrap text-sm">{details}</pre>}
      <p className="mt-4 text-sm opacity-75">Note: run while signed in to fully exercise RLS.</p>
    </main>
  );
}
