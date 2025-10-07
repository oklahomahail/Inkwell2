// Error boundary system exports
export {
  AppErrorBoundary,
  withErrorBoundary,
  FeatureErrorBoundary,
  ComponentErrorBoundary,
} from './AppErrorBoundary';

export {
  PlotBoardErrorFallback,
  TimelineErrorFallback,
  AnalyticsErrorFallback,
  EditorErrorFallback,
  ImageErrorFallback,
  SettingsErrorFallback,
  GenericPanelErrorFallback,
  getPanelErrorFallback,
} from './PanelErrorFallbacks';

export type { PanelErrorProps } from './PanelErrorFallbacks';

// Re-export error info types for convenience
export type { ErrorInfo } from 'react';
