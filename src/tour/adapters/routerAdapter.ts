/**
 * Tour Router Adapter
 *
 * Handles route-based tour steps and anchor resolution after navigation.
 * Mount this hook once near the app root to keep tour anchors in sync with route changes.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Re-resolve spotlight anchors whenever the route changes.
 * This ensures tour targets are found after navigation.
 *
 * Mount once near the app root:
 * ```tsx
 * export default function App() {
 *   useTourRouterAdapter();
 *   return <YourApp />;
 * }
 * ```
 */
export function useTourRouterAdapter(): void {
  const location = useLocation();

  useEffect(() => {
    // Give the new route a tick to render before measuring elements
    const rafId = requestAnimationFrame(() => {
      // TODO: Call TourService.refreshAnchors() when that method is available
      // For now, this is a placeholder for the integration point
      if (process.env.NODE_ENV === 'development') {
        console.log('[TourRouter] Route changed, would refresh anchors:', location.pathname);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname, location.search, location.hash]);
}
