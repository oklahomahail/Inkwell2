import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { devBackfill } from '@/utils/devBackfill';

const { backfillProfilesForCurrentUser } = devBackfill();

const BACKFILL_KEY = 'inkwell.backfill.v1.completed';

export function FirstLoginBackfill() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const done = localStorage.getItem(BACKFILL_KEY);
    if (done === 'true') return;

    (async () => {
      try {
        await backfillProfilesForCurrentUser();
        localStorage.setItem(BACKFILL_KEY, 'true');
      } catch (e) {
        console.error('Backfill failed:', e);
      }
    })();
  }, [user?.id]);

  return null;
}
