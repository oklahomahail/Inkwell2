// File: src/tour/types.ts
// Base types for the enhanced tour system with stable step configuration

export type TourPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TourStep {
  id: string;
  route?: string;
  selectors: string[];
  spotlightPadding?: number;
  placement?: TourPlacement;
  beforeNavigate?: () => void | Promise<void>;
  onAdvance?: () => void;
  title: string;
  body: string;
}

export interface TourConfig {
  version: number;
  steps: TourStep[];
  fallbackPlacement?: TourPlacement;
  defaultSpotlightPadding?: number;
  timeoutMs?: number;
  analyticsEnabled?: boolean;
}

export interface TourState {
  version: number;
  completedAt?: number;
  lastStep?: string;
}

export type TourAnalytics = {
  track: (event: string, properties?: Record<string, unknown>) => void;
};

export type TourRouter = {
  currentPath: () => string;
  go: (path: string) => Promise<void> | void;
};
