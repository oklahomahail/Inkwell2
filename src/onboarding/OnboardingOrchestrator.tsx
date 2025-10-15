import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { featureFlags } from '@/services/featureFlagService.presets';

import { useSpotlightTour } from './useSpotlightTour';

export function OnboardingOrchestrator() {
  const location = useLocation();
  const tour = useSpotlightTour();
  const { pathname, search } = location;

  useEffect(() => {
    if (!(featureFlags as any).spotlightTour) return;

    // Check if we're on the dashboard view in /profiles
    const searchParams = new URLSearchParams(search);
    const isDashboard = pathname === '/profiles' && searchParams.get('view') === 'dashboard';
    if (!isDashboard) return;

    // Check session and local storage guards
    if (sessionStorage.getItem('tour:session_started') === 'true') return;
    if (localStorage.getItem('tour:never_show') === 'true') return;

    // Start the tour and mark session
    tour.start();
    sessionStorage.setItem('tour:session_started', 'true');
  }, [pathname, search, tour]);

  return null;
}
