import { useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

import { SyncQueue, SyncItem } from './queue';

const BATCH = 100;
const INTERVAL_MS = 5_000;

export function useSyncManager(db: IDBDatabase | null, enabled: boolean) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!db || !enabled) return;

    async function tick() {
      if (!db) return;
      try {
        setStatus('syncing');
        const batch = await SyncQueue.dequeueBatch(db, BATCH);
        if (!batch.length) {
          setStatus('idle');
          return;
        }
        await pushBatch(batch);
        await SyncQueue.acknowledge(
          db,
          batch.map((b) => b.id),
        );
        setStatus('idle');
      } catch (e) {
        console.warn('sync error', e);
        setStatus('error');
      }
    }

    timer.current = window.setInterval(tick, INTERVAL_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [db, enabled]);

  return { status };
}

async function pushBatch(batch: SyncItem[]) {
  const groups = groupBy(batch, (b) => b.table);

  for (const [table, items] of Object.entries(groups)) {
    const upserts = items.filter((i) => i.op === 'upsert').map((i) => i.payload);
    const deletes = items.filter((i) => i.op === 'delete').map((i) => i.payload);

    // Use bulk RPC for efficiency if batch is large
    if (upserts.length > 50) {
      const rpcName = `bulk_upsert_${table}`;
      const { error } = await supabase.rpc(rpcName as any, { rows: JSON.stringify(upserts) });
      if (error) throw error;
    } else if (upserts.length) {
      const { error } = await supabase.from(table).upsert(upserts as any[], { onConflict: 'id' });
      if (error) throw error;
    }

    if (deletes.length) {
      const ids = (deletes as any[]).map((d) => d.id);
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    }
  }
}

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, cur) => {
      const k = key(cur);
      (acc[k] ||= []).push(cur);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}
