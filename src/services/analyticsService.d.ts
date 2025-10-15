import { BaseEvent, EventName, EventData } from './analyticsTypes';

export interface AnalyticsData {
  createdAt: number;
  eventType: string;
  data: Record<string, unknown>;
}

export interface AnalyticsService {
  trackEvent(event: string, data?: Record<string, unknown>): void;
  track<T extends EventName>(
    eventName: T,
    eventData: Omit<EventData<T>, keyof BaseEvent> & { profileId?: string },
  ): void;
  trackTourStepCompleted(
    tourType: string,
    stepIndex: number,
    stepName: string,
    timeOnStep: number,
  ): void;
  trackTourStarted(
    tourType: 'first_time' | 'feature_tour' | 'help_requested',
    entryPoint: string,
  ): void;
}

export interface AnalyticsHook {
  track: AnalyticsService['track'];
  trackEvent: (event: string, data?: Record<string, unknown>) => void;
  initializeAnalytics: () => void;
  getAnalyticsData: () => AnalyticsData[];
  service: AnalyticsService;
  useAnalytics: () => {
    track: AnalyticsService['track'];
    trackTourStarted: AnalyticsService['trackTourStarted'];
    trackTourStepCompleted: AnalyticsService['trackTourStepCompleted'];
    trackTourAbandoned: (
      tourType: string,
      lastStepCompleted: number,
      totalStepsInTour: number,
      timeBeforeAbandon: number,
    ) => void;
    trackTourCompleted: (
      tourType: string,
      totalSteps: number,
      totalTime: number,
      stepsSkipped: number,
    ) => void;
    trackFeatureFirstUse: (
      featureName: string,
      discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut',
      timeToFirstUse?: number,
    ) => void;
    trackWritingSessionStarted: (
      projectType: 'new' | 'existing',
      wordCount: number,
      entryMethod: 'dashboard' | 'quick_write' | 'project_list' | 'recent',
    ) => void;
    trackWritingSessionEnded: (
      sessionDuration: number,
      wordsWritten: number,
      savedManually: boolean,
      exitMethod: 'navigation' | 'close' | 'timeout' | 'error',
    ) => void;
    setActiveView: (view: string) => void;
    setUserId: (userId: string | null) => void;
    isEnabled: boolean;
  };
}

// Export singleton instance
export declare const analyticsService: AnalyticsService;

// React hook for analytics
export declare const useAnalytics: () => ReturnType<AnalyticsHook['useAnalytics']>;
export declare const trackEvent: AnalyticsService['trackEvent'];
export declare const initializeAnalytics: () => void;
export declare const getAnalyticsData: () => AnalyticsData[];
