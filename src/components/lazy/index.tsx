// Lazy loading registry for major features
import React from 'react';

// Plot Boards - Heavy kanban board feature
export const LazyPlotBoards = React.lazy(() =>
  import(
    /* webpackChunkName: "plot-boards" */
    '../../features/plotboards'
  )
    .then((module) => ({ default: module.PlotBoards }))
    .catch((error) => {
      console.error('Failed to load PlotBoards:', error);
      return { default: () => <div>Failed to load Plot Boards</div> };
    }),
);

// Timeline View - Complex timeline management
export const LazyTimelineView = React.lazy(() =>
  import(
    /* webpackChunkName: "timeline-view" */
    '../../components/Views/TimelineView'
  ).catch((error) => {
    console.error('Failed to load TimelineView:', error);
    return { default: () => <div>Failed to load Timeline View</div> };
  }),
);

// Analytics View - Heavy charting and calculations
export const LazyAnalyticsView = React.lazy(() =>
  import(
    /* webpackChunkName: "analytics-view" */
    '../../components/Analytics/WritingAnalyticsView'
  ).catch((error) => {
    console.error('Failed to load Analytics View:', error);
    return { default: () => <div>Failed to load Analytics View</div> };
  }),
);

// Timeline Panel - Sidebar panel component
export const LazyTimelinePanel = React.lazy(() =>
  import(
    /* webpackChunkName: "timeline-panel" */
    '../../components/Panels/TimelinePanel'
  ).catch((error) => {
    console.error('Failed to load Timeline Panel:', error);
    return { default: () => <div>Failed to load Timeline Panel</div> };
  }),
);

// Performance Charts - Heavy visualization library (if it exists)
export const LazyPerformanceChart = React.lazy(() =>
  import(
    /* webpackChunkName: "performance-chart" */
    '../../components/PerformanceChart'
  ).catch(() => {
    // Fallback if PerformanceChart doesn't exist
    return {
      default: () => (
        <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-gray-500">Chart component not available</span>
        </div>
      ),
    };
  }),
);

// Phrase Hygiene Widget - Text analysis component (if it exists)
export const LazyPhraseHygieneWidget = React.lazy(() =>
  import(
    /* webpackChunkName: "phrase-hygiene" */
    '../../components/Analytics/PhraseHygieneWidget'
  ).catch(() => {
    // Fallback if component doesn't exist
    return {
      default: () => (
        <div className="p-4 bg-gray-100 rounded">
          <span className="text-gray-500">Phrase hygiene widget not available</span>
        </div>
      ),
    };
  }),
);

// Export preload functions for strategic loading
export const preloadHeavyFeatures = {
  plotBoards: () => import('../../features/plotboards').catch(() => {}),
  timeline: () => import('../../components/Views/TimelineView').catch(() => {}),
  analytics: () => import('../../components/Analytics/WritingAnalyticsView').catch(() => {}),
};

// Preload critical features based on user behavior
export function preloadOnUserIdle() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload most commonly accessed features first
      preloadHeavyFeatures.analytics();

      requestIdleCallback(() => {
        preloadHeavyFeatures.timeline();

        requestIdleCallback(() => {
          preloadHeavyFeatures.plotBoards();
        });
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadHeavyFeatures.analytics();
    }, 2000);
  }
}
