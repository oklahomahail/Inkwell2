// File: src/tour/hooks/useAnalytics.ts
// Analytics hook for tracking tour usage
import { useCallback } from 'react';

import devLog from '@/utils/devLog';

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') return;

    // Send to analytics service if available
    if ('analytics' in window) {
      (window as any).analytics.track(eventName, {
        ...properties,
        source: 'tour',
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      devLog.debug('[Tour Analytics]', { eventName, properties });
    }
  }, []);

  return {
    trackEvent,
  };
}
