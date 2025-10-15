declare module '@/lib/router' {
  export function to(path: string): string;
}

declare module '@/services/featureFlagService.presets' {
  export const featureFlags: {
    isDebugMode?: () => boolean;
  };
}

declare type AnalyticsEvent = { timestamp: number } & Record<string, unknown>;
declare type AnalyticsStore = { events: AnalyticsEvent[] };

declare module '*.worker.ts' {
  const value: any;
  export default value;
}

// Removed invalid module augmentation for '@/types/writing' that shadowed real exports.
