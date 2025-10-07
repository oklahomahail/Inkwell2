// Utilities for lazy loading and code splitting
import React, { Suspense } from 'react';

import { LazyLoadingFallback } from '../components/common/LazyLoadingFallback';

// Higher-order component for wrapping lazy components with error boundaries and fallbacks
export function withLazyLoading<P extends Record<string, any>>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback?: React.ComponentType,
  displayName?: string,
) {
  const WrappedComponent: React.FC<P> = (props) => {
    const FallbackComponent = fallback || LazyLoadingFallback;

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = displayName || `LazyLoaded(${LazyComponent.name || 'Component'})`;

  return WrappedComponent;
}

// Preloader function to warm up lazy chunks
export function preloadLazyComponent<T>(
  lazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
): Promise<{ default: React.ComponentType<T> }> {
  return (lazyComponent as any)._payload._result || (lazyComponent as any)();
}

// Hook for preloading components based on user interactions
export function usePreloadOnHover<T>(
  lazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
) {
  const preload = React.useCallback(() => {
    preloadLazyComponent(lazyComponent).catch(() => {
      // Silently fail - the component will load when needed
    });
  }, [lazyComponent]);

  return preload;
}

// Hook for preloading with intersection observer (for viewport-based loading)
export function usePreloadOnIntersection<T>(
  lazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
  options?: IntersectionObserverInit,
) {
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const targetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target || hasIntersected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setHasIntersected(true);
          preloadLazyComponent(lazyComponent).catch(() => {
            // Silently fail
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [lazyComponent, hasIntersected, options]);

  return targetRef;
}

// Create a route-level lazy component with error handling
export function createRouteLazyComponent<P extends Record<string, any>>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType,
  options?: {
    displayName?: string;
    preload?: boolean;
  },
) {
  const LazyComponent = React.lazy(importFunc);

  if (options?.preload) {
    // Preload after a short delay
    setTimeout(() => {
      preloadLazyComponent(LazyComponent).catch(() => {
        // Silently fail
      });
    }, 100);
  }

  return withLazyLoading(LazyComponent, fallback, options?.displayName);
}

// Chunk naming utilities for better debugging
export const createChunkName = (feature: string, component?: string) => {
  return component ? `${feature}-${component}` : feature;
};

// Performance monitoring for lazy loading
let lazyLoadMetrics: Record<string, { startTime: number; endTime?: number }> = {};

export function trackLazyLoadStart(componentName: string) {
  lazyLoadMetrics[componentName] = { startTime: performance.now() };
}

export function trackLazyLoadEnd(componentName: string) {
  if (lazyLoadMetrics[componentName]) {
    lazyLoadMetrics[componentName].endTime = performance.now();
    const duration =
      lazyLoadMetrics[componentName].endTime! - lazyLoadMetrics[componentName].startTime;

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Log to performance API for monitoring
      performance.mark(`lazy-load-${componentName}-end`);
      try {
        performance.measure(`lazy-load-${componentName}`, {
          start: performance.timeOrigin + lazyLoadMetrics[componentName].startTime,
          end: performance.timeOrigin + lazyLoadMetrics[componentName].endTime!,
        });
      } catch (_e) {
        // Ignore performance measurement errors
      }
    }

    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Lazy loaded ${componentName} in ${duration.toFixed(2)}ms`);
    }
  }
}

export function getLazyLoadMetrics() {
  return lazyLoadMetrics;
}
