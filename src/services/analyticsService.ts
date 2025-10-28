import devLog from "@/utils/devLog";
// Privacy-first analytics service for Inkwell
// Collects minimal, anonymized data to improve user experience

interface BaseEvent {
  sessionId: string;
  userId?: string; // Optional, hashed if provided
  profileId?: string; // Profile identifier for profile-specific analytics
  version: string;
  platform: string;
  createdAt: number; // Consistent timestamp field
}

// Critical events for tour adaptation and drop-off analysis
export interface AnalyticsEvents {
  // Onboarding & Tour Events
  tour_started: BaseEvent & {
    tourType: 'first_time' | 'feature_tour' | 'help_requested';
    entryPoint: string;
  };

  tour_step_completed: BaseEvent & {
    tourType: string;
    stepIndex: number;
    stepName: string;
    timeOnStep: number; // milliseconds
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

  // Core Feature Adoption
  feature_first_use: BaseEvent & {
    featureName:
      | 'plot_boards'
      | 'timeline'
      | 'analytics'
      | 'export'
      | 'claude_assistant'
      | 'writing_mode';
    discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut';
    timeToFirstUse?: number; // Time from app start to first use
  };

  writing_session_started: BaseEvent & {
    projectType: 'new' | 'existing';
    wordCount: number;
    entryMethod: 'dashboard' | 'quick_write' | 'project_list' | 'recent';
  };

  writing_session_ended: BaseEvent & {
    sessionDuration: number; // milliseconds
    wordsWritten: number;
    savedManually: boolean;
    exitMethod: 'navigation' | 'close' | 'timeout' | 'error';
  };

  // Drop-off Analysis Events
  app_abandoned: BaseEvent & {
    lastActiveView: string;
    timeSpentInApp: number;
    actionsCompleted: number;
    hasActiveProject: boolean;
  };

  // AI-related events
  ai_config_initialized: BaseEvent & {
    provider: string;
    model: string;
  };

  ai_config_updated: BaseEvent & {
    provider: string;
    updatedFields: string[];
  };

  ai_config_cleared: BaseEvent & {
    previousProvider?: string;
    reason?: string;
  };

  // AI Setup Events
  ai_setup_abandoned: BaseEvent & {
    projectId?: string;
    requestedAction: string;
    step: string;
    reason: string;
  };

  ai_setup_mock_selected: BaseEvent & {
    projectId?: string;
    requestedAction: string;
    reason: string;
  };

  ai_provider_selected: BaseEvent & {
    provider: string;
    projectId?: string;
    requestedAction: string;
  };

  ai_setup_completed: BaseEvent & {
    provider: string;
    projectId?: string;
    requestedAction: string;
    setupDuration: number;
  };

  ai_action_requested: BaseEvent & {
    action: string;
    hasSelectedText: boolean;
    projectId?: string;
  };

  // Power Tools Menu Events
  power_menu_opened: BaseEvent & {
    source: 'keyboard' | 'click';
    projectId?: string;
  };

  POWER_TOOLS_BEFORE_DRAFT: BaseEvent & {
    templateId?: string;
    from?: 'menu' | 'shortcut';
    projectId?: string;
  };

  power_tool_used: BaseEvent & {
    tool: string;
    success?: boolean;
    projectId?: string;
  };

  ai_request_retry_success: BaseEvent & {
    context: string;
    attempts: number;
    duration: number;
  };

  ai_circuit_breaker_opened: BaseEvent & {
    context: string;
    failureCount: number;
    lastError: string;
  };

  ai_request_retry_exhausted: BaseEvent & {
    context: string;
    attempts: number;
    lastError: string;
  };

  ai_circuit_breaker_manual_reset: BaseEvent & {
    previousFailureCount?: number;
    state?: string;
  };

  ai_status_changed: BaseEvent & {
    statusCode: string;
    isHealthy: boolean;
    provider: string;
  };

  ai_feedback_notification: BaseEvent & {
    type: string;
    title: string;
    persistent: boolean;
  };

  // Plot analysis events
  plot_analysis_run: BaseEvent & {
    projectId: string;
    scenes: number;
    model: string;
    qualityScore: number;
    issuesFound: number;
  };

  plot_analysis_failed: BaseEvent & {
    projectId: string;
    scenes: number;
    error: string;
  };

  plot_issue_resolved: BaseEvent & {
    issueId: string;
    issueType: string;
    projectId?: string;
  };

  // Export Analytics Events
  export_wizard_opened: BaseEvent & {
    projectId: string;
    source: 'menu' | 'badge' | 'keyboard' | 'dashboard';
    projectWordCount: number;
    projectChapterCount: number;
  };

  export_format_selected: BaseEvent & {
    projectId: string;
    format: 'PDF' | 'DOCX' | 'EPUB';
    previousFormat?: string;
  };

  export_style_selected: BaseEvent & {
    projectId: string;
    format: string;
    style: string;
    previousStyle?: string;
  };

  export_proofread_toggled: BaseEvent & {
    projectId: string;
    enabled: boolean;
    reason?: 'time_saving' | 'confidence' | 'requirement';
  };

  export_started: BaseEvent & {
    projectId: string;
    format: 'PDF' | 'DOCX' | 'EPUB';
    style: string;
    includeProofread: boolean;
    projectWordCount: number;
    projectChapterCount: number;
  };

  export_progress: BaseEvent & {
    projectId: string;
    format: string;
    phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing';
    percentage: number;
  };

  export_completed: BaseEvent & {
    projectId: string;
    format: 'PDF' | 'DOCX' | 'EPUB';
    durationMs: number;
    artifactSize: number;
    includeProofread: boolean;
    proofreadSuggestions?: number;
    success: boolean;
  };

  export_failed: BaseEvent & {
    projectId: string;
    format: 'PDF' | 'DOCX' | 'EPUB';
    phase: string;
    error: string;
    durationMs: number;
  };

  export_downloaded: BaseEvent & {
    projectId: string;
    format: string;
    fileName: string;
    fileSize: number;
    timeToDownload: number; // Time from export completion to download
  };

  export_wizard_abandoned: BaseEvent & {
    projectId: string;
    lastStep: 'format' | 'style' | 'proofread' | 'review';
    timeInWizard: number;
    reason?: 'close' | 'navigation' | 'error';
  };

  export_readiness_checked: BaseEvent & {
    projectId: string;
    readinessScore: number;
    isReady: boolean;
    blockingIssues: string[];
    wordCount: number;
    chapterCount: number;
  };

  proofreading_report_generated: BaseEvent & {
    projectId: string;
    suggestionCount: number;
    gradeLevel: number;
    categories: string[];
    processingTime: number;
  };

  proofreading_suggestion_applied: BaseEvent & {
    projectId: string;
    suggestionId: string;
    category: 'grammar' | 'style' | 'clarity' | 'tone';
    severity: 'note' | 'suggestion' | 'warning';
  };

  // Nudge and engagement events
  nudge_clicked: BaseEvent & {
    projectId?: string;
    nudgeType: string;
    action?: string;
    wordCount?: number;
    currentStep?: string;
  };

  nudge_dismissed: BaseEvent & {
    projectId?: string;
    nudgeType: string;
    wordCount?: number;
    currentStep?: string;
    timeSinceCreation?: number;
  };

  power_tools_quick_access: BaseEvent & {
    source: 'click' | 'keyboard';
    projectId?: string;
  };

  // First draft and onboarding events
  first_draft_step_viewed: BaseEvent & {
    step: string;
    stepIndex: number;
    projectId?: string;
  };

  first_draft_path_completed: BaseEvent & {
    projectId?: string;
    totalDuration: number;
    stepsCompleted: number;
  };

  first_draft_step_started: BaseEvent & {
    step: string;
    stepIndex: number;
    projectId?: string;
  };

  first_draft_step_completed: BaseEvent & {
    step: string;
    stepIndex: number;
    projectId?: string;
    stepDuration: number;
  };

  first_draft_path_exited: BaseEvent & {
    projectId?: string;
    lastStep: string;
    exitReason: string;
  };

  // Activation funnel events
  A1_PROJECT_CREATED: BaseEvent & {
    projectId?: string;
    projectName?: string;
  };

  A2_SCENE_CREATED: BaseEvent & {
    projectId?: string;
    sceneType?: string;
  };

  A3_300_WORDS_SAVED: BaseEvent & {
    projectId?: string;
    wordCount: number;
    timeToReach: number;
  };

  A4_EXPORTED: BaseEvent & {
    projectId?: string;
    exportFormat?: string;
  };

  // UI and settings events
  ui_mode_changed: BaseEvent & {
    oldMode: string;
    newMode: string;
    reason?: string;
  };

  ui_mode_change_failed: BaseEvent & {
    attemptedMode: string;
    error: string;
  };

  // Performance tracking
  TIME_TO_FIRST_KEYSTROKE_MS: BaseEvent & {
    projectId?: string;
    timeMs: number;
  };

  PANELS_OPENED_BEFORE_FIRST_SAVE: BaseEvent & {
    projectId?: string;
    panelCount: number;
    panels: string[];
  };

  SETTINGS_VISITS_BEFORE_DRAFT: BaseEvent & {
    projectId?: string;
    visitCount: number;
  };

  nudge_banner_shown: BaseEvent & {
    projectId?: string;
    nudgeType: string;
    timingMs?: number;
  };

  // Feature flag events
  feature_flag_changed: BaseEvent & {
    flag: string;
    enabled: boolean;
    category: string;
  };

  demo_mode_enabled: BaseEvent & {
    overrides: string[];
  };

  demo_mode_disabled: BaseEvent & {
    previousFlags?: string[];
    reason?: string;
  };

  feature_flags_reset: BaseEvent & {
    previousFlags?: string[];
    reason?: string;
  };
}

export type EventName = keyof AnalyticsEvents;
export type EventData<T extends EventName> = AnalyticsEvents[T];

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled = true;
  private eventQueue: Array<{ name: EventName; data: Record<string, unknown> }> = [];
  private sessionStartTime = Date.now();
  private lastActivityTime = Date.now();
  private activeView = 'dashboard';
  private lastTourStartHash: string | null = null;

  // Privacy settings
  private readonly RETENTION_DAYS = 30;
  private readonly BATCH_SIZE = 10;
  private readonly STORAGE_KEY = 'inkwell_analytics';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPrivacySettings();
    this.setupSessionTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPrivacySettings() {
    // Check for user consent and privacy preferences
    const savedPreferences = localStorage.getItem('inkwell_privacy_preferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      this.isEnabled = preferences.analytics !== false;
    }

    // Check for Do Not Track
    if (navigator.doNotTrack === '1') {
      this.isEnabled = false;
      devLog.debug('Analytics disabled due to Do Not Track preference');
    }
  }

  private setupSessionTracking() {
    // Track page visibility for session management
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackAppAbandon();
      } else {
        this.lastActivityTime = Date.now();
      }
    });

    // Track beforeunload for drop-off analysis
    window.addEventListener('beforeunload', () => {
      this.trackAppAbandon();
      this.flush(); // Send any pending events
    });

    // Periodic cleanup of old data
    this.cleanupOldData();
  }

  private getBaseEvent(profileId?: string): BaseEvent {
    return {
      createdAt: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId ?? undefined,
      profileId: profileId ?? undefined,
      version: import.meta.env.REACT_APP_VERSION || '1.0.0',
      platform: this.getPlatform(),
    };
  }

  private getPlatform(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'mobile';
    if (ua.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  // Public API for tracking events
  track<T extends EventName>(
    eventName: T,
    eventData: Omit<EventData<T>, keyof BaseEvent> & { profileId?: string },
  ): void {
    if (!this.isEnabled) return;

    const { profileId, ...restData } = eventData;
    const event = {
      ...this.getBaseEvent(profileId),
      ...restData,
    };

    // Store event locally for batch processing
    this.eventQueue.push({ name: eventName, data: event });

    // Log in development for debugging
    if (import.meta.env.DEV) {
      devLog.debug(`[Analytics] ${eventName}:`, event);
    }

    // Batch send events
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }

    // Store locally for offline analysis
    this.storeEventLocally(eventName, event);
  }

  // Convenience methods for common events
  trackTourStarted(tourType: 'first_time' | 'feature_tour' | 'help_requested', entryPoint: string) {
    // Create hash for deduplication
    const hash = `${tourType}|${entryPoint}|${this.sessionId}`;
    if (hash === this.lastTourStartHash) {
      console.debug('[Analytics] Deduping duplicate tour_started event:', { tourType, entryPoint });
      return; // Skip duplicate events
    }
    this.lastTourStartHash = hash;

    // Log legacy analytics for debugging
    if (import.meta.env.DEV) {
      devLog.debug('Legacy analytics event: tour_started', { tourType, entryPoint });
    }

    this.track('tour_started', { tourType, entryPoint });
  }

  trackTourStepCompleted(
    tourType: string,
    stepIndex: number,
    stepName: string,
    timeOnStep: number,
  ) {
    this.track('tour_step_completed', { tourType, stepIndex, stepName, timeOnStep });
  }

  trackTourAbandoned(
    tourType: string,
    lastStepCompleted: number,
    totalStepsInTour: number,
    timeBeforeAbandon: number,
  ) {
    this.track('tour_abandoned', {
      tourType,
      lastStepCompleted,
      totalStepsInTour,
      timeBeforeAbandon,
    });
  }

  trackTourCompleted(
    tourType: string,
    totalSteps: number,
    totalTime: number,
    stepsSkipped: number,
  ) {
    this.track('tour_completed', { tourType, totalSteps, totalTime, stepsSkipped });
  }

  trackFeatureFirstUse(
    featureName:
      | 'plot_boards'
      | 'timeline'
      | 'analytics'
      | 'export'
      | 'claude_assistant'
      | 'writing_mode',
    discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut',
    timeToFirstUse?: number,
  ) {
    this.track('feature_first_use', { featureName, discoveryMethod, timeToFirstUse });
  }

  trackWritingSessionStarted(
    projectType: 'new' | 'existing',
    wordCount: number,
    entryMethod: 'dashboard' | 'quick_write' | 'project_list' | 'recent',
  ) {
    this.track('writing_session_started', { projectType, wordCount, entryMethod });
  }

  trackWritingSessionEnded(
    sessionDuration: number,
    wordsWritten: number,
    savedManually: boolean,
    exitMethod: 'navigation' | 'close' | 'timeout' | 'error',
  ) {
    this.track('writing_session_ended', {
      sessionDuration,
      wordsWritten,
      savedManually,
      exitMethod,
    });
  }

  // Plot analysis tracking methods
  trackPlotAnalysisRun(
    projectId: string,
    scenes: number,
    model: string,
    qualityScore: number,
    issuesFound: number,
  ) {
    this.track('plot_analysis_run', {
      projectId,
      scenes,
      model,
      qualityScore,
      issuesFound,
    });
  }

  trackPlotIssueResolved(issueId: string, issueType: string, projectId?: string) {
    this.track('plot_issue_resolved', {
      issueId,
      issueType,
      projectId,
    });
  }

  // Internal tracking methods
  setActiveView(view: string) {
    this.activeView = view;
    this.lastActivityTime = Date.now();
  }

  setUserId(userId: string | null) {
    // Hash user ID for privacy if provided
    this.userId = userId ? this.hashString(userId) : null;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private trackAppAbandon() {
    const timeSpentInApp = Date.now() - this.sessionStartTime;
    const actionsCompleted = this.eventQueue.length;

    this.track('app_abandoned', {
      lastActiveView: this.activeView,
      timeSpentInApp,
      actionsCompleted,
      hasActiveProject: this.hasActiveProject(),
    });
  }

  private hasActiveProject(): boolean {
    // Simple check for active project - this could be enhanced
    const projects = localStorage.getItem('inkwell_enhanced_projects');
    return projects ? JSON.parse(projects).length > 0 : false;
  }

  private storeEventLocally(eventName: string, eventData: Partial<AnalyticsEvent>) {
    try {
      const storageKey = `${this.STORAGE_KEY}_${eventName}`;
      const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');

      existingData.push({
        ...eventData,
        stored: Date.now(),
      });

      // Keep only recent events
      const cutoffTime = Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const recentEvents = existingData.filter((event: any) => event.timestamp > cutoffTime);

      localStorage.setItem(storageKey, JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  private cleanupOldData() {
    try {
      const cutoffTime = Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.STORAGE_KEY)) {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          const recentData = data.filter((event: any) => event.timestamp > cutoffTime);

          if (recentData.length !== data.length) {
            localStorage.setItem(key, JSON.stringify(recentData));
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup old analytics data:', error);
    }
  }

  // Batch send events (in a real app, this would send to your analytics endpoint)
  private flush() {
    if (this.eventQueue.length === 0) return;

    // In development, just log the events
    if (import.meta.env.DEV) {
      devLog.debug('[Analytics] Flushing events:', this.eventQueue);
    }

    // In production, you would send these to your analytics service
    // Example:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events: this.eventQueue })
    // });

    this.eventQueue = [];
  }

  // Get aggregated analytics for admin/debug purposes
  getLocalAnalytics(): AnalyticsStore {
    const analytics: Record<string, any[]> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.STORAGE_KEY)) {
        const eventName = key.replace(`${this.STORAGE_KEY}_`, '');
        analytics[eventName] = JSON.parse(localStorage.getItem(key) || '[]');
      }
    });

    return { events: (analytics.traces || []).map((t) => ({ timestamp: t.timestamp, ...t })) };
  }

  // Privacy controls
  disable() {
    this.isEnabled = false;
    this.clearAllData();

    localStorage.setItem(
      'inkwell_privacy_preferences',
      JSON.stringify({
        analytics: false,
        updated: Date.now(),
      }),
    );
  }

  enable() {
    this.isEnabled = true;

    localStorage.setItem(
      'inkwell_privacy_preferences',
      JSON.stringify({
        analytics: true,
        updated: Date.now(),
      }),
    );
  }

  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  clearAllData() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    this.eventQueue = [];
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for external use
export type { AnalyticsEvent, AnalyticsStore } from '@/types/analytics';

// React hook for analytics
function _useAnalytics() {
  return {
    track: analyticsService.track.bind(analyticsService),
    trackTourStarted: analyticsService.trackTourStarted.bind(analyticsService),
    trackTourStepCompleted: analyticsService.trackTourStepCompleted.bind(analyticsService),
    trackTourAbandoned: analyticsService.trackTourAbandoned.bind(analyticsService),
    trackTourCompleted: analyticsService.trackTourCompleted.bind(analyticsService),
    trackFeatureFirstUse: analyticsService.trackFeatureFirstUse.bind(analyticsService),
    trackWritingSessionStarted: analyticsService.trackWritingSessionStarted.bind(analyticsService),
    trackWritingSessionEnded: analyticsService.trackWritingSessionEnded.bind(analyticsService),
    setActiveView: analyticsService.setActiveView.bind(analyticsService),
    setUserId: analyticsService.setUserId.bind(analyticsService),
    isEnabled: analyticsService.isAnalyticsEnabled(),
  };
}

// Legacy compatibility exports
export interface AnalyticsData {
  createdAt: number;
  eventType: string;
  data: Record<string, unknown>;
}

function _trackEvent(event: string, data?: Record<string, unknown>) {
  const normalizedData = {
    ...data,
    createdAt: Date.now(),
  };
  analyticsService.track(event as EventName, normalizedData);
}

function _initializeAnalytics() {
  devLog.debug('Analytics initialized');
}

function _getAnalyticsData(): AnalyticsData[] {
  return [];
}

// Export wrapper functions
export const useAnalytics = _useAnalytics;
export const trackEvent = _trackEvent;
export const initializeAnalytics = _initializeAnalytics;
export const getAnalyticsData = _getAnalyticsData;

/** @deprecated Use trackEvent instead */
export const track = trackEvent;

export default {
  trackEvent,
  track, // Backward compatibility for tests
  initializeAnalytics,
  getAnalyticsData,
  service: analyticsService,
  useAnalytics,
};
