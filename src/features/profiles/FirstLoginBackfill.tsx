import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';

import { backfillProfilesForCurrentUser } from '../../utils/devBackfill';

const BACKFILL_KEY = 'inkwell.backfill.v1.completed';

export function FirstLoginBackfill() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    const done = localStorage.getItem(BACKFILL_KEY);
    if (done === 'true') return;

    (async () => {
      try {
        await backfillProfilesForCurrentUser(user.id);
        localStorage.setItem(BACKFILL_KEY, 'true');
      } catch (e) {
        console.error('Backfill failed:', e);
      }
    })();
  }, [isSignedIn, user?.id]);

  return null;
}
