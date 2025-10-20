import React, { useEffect, useState } from 'react';
type Status = { available: boolean; enabled: boolean; status?: any };
type Metrics = { p50: number; p95: number; queries: number };
export default function DebugSearchPanel() {
  const [m, setM] = useState<Metrics>({ p50: 0, p95: 0, queries: 0 });
  const [status, setStatus] = useState<Status>({ available: false, enabled: false });
  const refresh = () => {
    const metrics = (window as any).debugSearch?.getPerformanceMetrics?.();
    const st = (window as any).debugSearch?.getWorkerStatus?.();
    if (metrics) setM(metrics);
    if (st) {
      setStatus({
        available: Boolean(st.available),
        enabled: Boolean(st.enabled),
        status: st.status,
      });
    }
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
  }, []);
  const enable = () => {
    (window as any).debugSearch?.enableWorker?.();
    refresh();
  };
  const disable = () => {
    (window as any).debugSearch?.disableWorker?.();
    refresh();
  };
  return (
    <div className="fixed bottom-3 right-3 z-50 bg-white/90 backdrop-blur border rounded-xl shadow p-3 text-sm space-y-2">
      {' '}
      <div className="font-medium">Search Debug</div>{' '}
      <div>Worker available: {String(status.available)}</div>{' '}
      <div>Worker enabled: {String(status.enabled)}</div>{' '}
      <div>
        {' '}
        P50: {m.p50.toFixed(2)} ms · P95: {m.p95.toFixed(2)} ms · n={m.queries}{' '}
      </div>{' '}
      <div className="flex gap-2">
        {' '}
        <button className="px-2 py-1 border rounded" onClick={enable}>
          {' '}
          Enable worker{' '}
        </button>{' '}
        <button className="px-2 py-1 border rounded" onClick={disable}>
          {' '}
          Disable worker{' '}
        </button>{' '}
      </div>{' '}
    </div>
  );
}
