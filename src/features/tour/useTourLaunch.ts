import { useEffect } from 'react';

import { usePrefs } from '../../services/prefsService'; // Adjust import path as needed

import { useTourSafe } from './TourContext';

export function _useTourLaunchGate() {
  const { start, isActive } = useTourSafe();
  const { get, set } = usePrefs();

  useEffect(() => {
    if (isActive) return;
    if (get('tour.neverShow') === true) return;
    if (get('tour.launchedThisSession') === true) return;

    // Only one place in the app should call this:
    // e.g., <RootShell/> just after auth/profile load.
    set('tour.launchedThisSession', true);

    // Optionally show "What's New" OR start tour, not both.
    const showWhatsNew = false; // temporarily disabled
    if (!showWhatsNew) start();
  }, [isActive, get, set, start]);
}
