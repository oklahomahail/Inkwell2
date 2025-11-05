export interface BaseEvent {
  timestamp: number;
  sessionId: string;
  userId?: string;
  profileId?: string;
  version: string;
  platform: string;
}

// Critical events for tour adaptation and drop-off analysis
export interface AnalyticsEvents {
  tour_started: BaseEvent & {
    tourType: 'first_time' | 'feature_tour' | 'help_requested';
    entryPoint: string;
  };

  tour_step_completed: BaseEvent & {
    tourType: string;
    stepIndex: number;
    stepName: string;
    timeOnStep: number;
  };

  tour_abandoned: BaseEvent & {
    tourType: string;
    lastStepCompleted: number;
    totalStepsInTour: number;
    timeBeforeAbandon: number;
  };

  tour_completed: BaseEvent & {
    tourType: string;
    totalSteps: number;
    totalTime: number;
    stepsSkipped: number;
  };

  feature_first_use: BaseEvent & {
    featureName: string;
    discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut';
    timeToFirstUse?: number;
  };
}

export type EventName = keyof AnalyticsEvents;
export type EventData<T extends EventName> = AnalyticsEvents[T];
