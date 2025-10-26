/**
 * Preview Mode Analytics
 * Tracking events for free preview mode conversion funnel
 */

type PreviewCTAType = 'signup' | 'write' | 'export' | 'ai' | 'save';

/**
 * Track when a user opens the preview mode
 */
export function trackPreviewOpened(source?: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_opened', {
      source: source || 'direct',
      timestamp: Date.now(),
    });
  }
}

/**
 * Track when a user clicks a CTA in preview mode
 */
export function trackPreviewCTA(type: PreviewCTAType, location?: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_cta_click', {
      type,
      location: location || 'unknown',
      timestamp: Date.now(),
    });
  }
}

/**
 * Track when a user signs up after using preview mode
 */
export function trackPreviewSignedUp(source?: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_signed_up', {
      source: source || 'preview',
      timestamp: Date.now(),
    });
  }
}

/**
 * Track when user attempts to use a feature that requires signup
 */
export function trackPreviewFeatureBlocked(feature: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_feature_blocked', {
      feature,
      timestamp: Date.now(),
    });
  }
}

/**
 * Track time spent in preview mode
 */
export function trackPreviewTimeSpent(durationMs: number): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_time_spent', {
      duration_ms: durationMs,
      duration_seconds: Math.round(durationMs / 1000),
      timestamp: Date.now(),
    });
  }
}

/**
 * Track preview mode exit
 */
export function trackPreviewExited(reason: 'signup' | 'navigate_away' | 'close'): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_exited', {
      reason,
      timestamp: Date.now(),
    });
  }
}
