// src/state/onboarding/onboardingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { analyticsService } from '../../services/analyticsService';

export type OnboardingStep = 'project' | 'chapter' | 'scene' | 'focusWrite' | 'export';

export interface ProjectOnboardingState {
  current: OnboardingStep;
  completed: Partial<Record<OnboardingStep, boolean>>;
  startedAt: number;
  stepStartTimes: Partial<Record<OnboardingStep, number>>;
  wordCount: number;
  targetWordCount: number;
  isInFirstDraftPath: boolean;
}

export interface OnboardingState {
  byProject: Record<string, ProjectOnboardingState>;
  globalSettings: {
    hasSeenWelcome: boolean;
    preferredUIMode: 'beginner' | 'pro';
    showFirstDraftPath: boolean;
  };
}

const FIRST_DRAFT_STEPS: OnboardingStep[] = ['project', 'chapter', 'scene', 'focusWrite', 'export'];
const TARGET_WORD_COUNT = 300;

const initialState: OnboardingState = {
  byProject: {},
  globalSettings: {
    hasSeenWelcome: false,
    preferredUIMode: 'beginner',
    showFirstDraftPath: true,
  },
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    initializeProject: (
      state: OnboardingState,
      action: PayloadAction<{ projectId: string; uiMode?: 'beginner' | 'pro' }>,
    ) => {
      const { projectId, uiMode = 'beginner' } = action.payload;

      if (!state.byProject[projectId]) {
        state.byProject[projectId] = {
          current: 'project',
          completed: {},
          startedAt: Date.now(),
          stepStartTimes: { project: Date.now() },
          wordCount: 0,
          targetWordCount: TARGET_WORD_COUNT,
          isInFirstDraftPath: uiMode === 'beginner',
        };

        // Track project creation
        analyticsService.track('A1_PROJECT_CREATED', {
          projectId,
          projectName: projectId,
        });
      }
    },

    advanceStep: (state: OnboardingState, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const project = state.byProject[projectId];

      if (!project || !project.isInFirstDraftPath) return;

      const currentIndex = FIRST_DRAFT_STEPS.indexOf(project.current);
      if (currentIndex < FIRST_DRAFT_STEPS.length - 1) {
        const nextStep = FIRST_DRAFT_STEPS[currentIndex + 1]!;
        project.current = nextStep;
        project.stepStartTimes[nextStep] = Date.now();

        // Track step advancement
        analyticsService.track('first_draft_step_started', {
          projectId,
          step: nextStep,
          stepIndex: currentIndex + 1,
        });
      }
    },

    markStepCompleted: (
      state: OnboardingState,
      action: PayloadAction<{ projectId: string; step: OnboardingStep }>,
    ) => {
      const { projectId, step } = action.payload;
      const project = state.byProject[projectId];

      if (!project) return;

      project.completed[step] = true;
      const stepStartTime = project.stepStartTimes[step] || project.startedAt;
      const stepDuration = Date.now() - stepStartTime;

      // Track step completion
      analyticsService.track('first_draft_step_completed', {
        projectId,
        step,
        stepIndex: FIRST_DRAFT_STEPS.indexOf(step),
        stepDuration: stepDuration,
      });

      // Track specific activation funnel events
      switch (step) {
        case 'scene':
          analyticsService.track('A2_SCENE_CREATED', {
            projectId,
            sceneType: 'first_scene',
          });
          break;

        case 'focusWrite':
          if (project.wordCount >= TARGET_WORD_COUNT) {
            analyticsService.track('A3_300_WORDS_SAVED', {
              projectId,
              wordCount: project.wordCount,
              timeToReach: Date.now() - project.startedAt,
            });
          }
          break;

        case 'export':
          analyticsService.track('A4_EXPORTED', {
            projectId,
            exportFormat: 'first_draft',
          });
          break;
      }

      // Auto-advance to next step if not at the end
      if (project.isInFirstDraftPath) {
        const currentIndex = FIRST_DRAFT_STEPS.indexOf(step);
        if (currentIndex < FIRST_DRAFT_STEPS.length - 1) {
          const nextStep = FIRST_DRAFT_STEPS[currentIndex + 1]!;
          project.current = nextStep;
          project.stepStartTimes[nextStep] = Date.now();
        } else {
          // Completed all steps
          project.isInFirstDraftPath = false;
          analyticsService.track('first_draft_path_completed', {
            projectId,
            totalDuration: Date.now() - project.startedAt,
            stepsCompleted: FIRST_DRAFT_STEPS.length,
          });
        }
      }
    },

    updateWordCount: (state, action: PayloadAction<{ projectId: string; wordCount: number }>) => {
      const { projectId, wordCount } = action.payload;
      const project = state.byProject[projectId];

      if (!project) return;

      const previousCount = project.wordCount;
      project.wordCount = wordCount;

      // Track first keystroke
      if (previousCount === 0 && wordCount > 0) {
        const timeToFirstKeystroke = Date.now() - project.startedAt;
        analyticsService.track('TIME_TO_FIRST_KEYSTROKE_MS', {
          projectId,
          timeMs: timeToFirstKeystroke,
        });
      }

      // Check if target reached for the first time
      if (previousCount < TARGET_WORD_COUNT && wordCount >= TARGET_WORD_COUNT) {
        if (!project.completed.focusWrite) {
          onboardingSlice.caseReducers.markStepCompleted(state, {
            type: 'onboarding/markStepCompleted',
            payload: { projectId, step: 'focusWrite' },
          });
        }
      }
    },

    trackFrictionIndicator: (
      state,
      action: PayloadAction<{
        projectId: string;
        indicator: 'panel_opened' | 'settings_visited' | 'power_tools_opened';
        details?: string;
      }>,
    ) => {
      const { projectId, indicator, details } = action.payload;
      const project = state.byProject[projectId];

      if (!project) return;

      // Track friction indicators during first draft path
      if (project.isInFirstDraftPath && !project.completed.focusWrite) {
        switch (indicator) {
          case 'panel_opened':
            analyticsService.track('PANELS_OPENED_BEFORE_FIRST_SAVE', {
              projectId,
              panelCount: 1,
              panels: [details || 'unknown'],
            });
            break;

          case 'settings_visited':
            analyticsService.track('SETTINGS_VISITS_BEFORE_DRAFT', {
              projectId,
              visitCount: 1,
            });
            break;

          case 'power_tools_opened':
            analyticsService.track('POWER_TOOLS_BEFORE_DRAFT', {
              projectId,
              from: 'menu',
            });
            break;
        }
      }
    },

    exitFirstDraftPath: (
      state,
      action: PayloadAction<{ projectId: string; reason: 'user_choice' | 'ui_mode_change' }>,
    ) => {
      const { projectId, reason } = action.payload;
      const project = state.byProject[projectId];

      if (!project) return;

      project.isInFirstDraftPath = false;

      analyticsService.track('first_draft_path_exited', {
        projectId,
        lastStep: project.current,
        exitReason: reason,
      });
    },

    updateGlobalSettings: (
      state,
      action: PayloadAction<Partial<OnboardingState['globalSettings']>>,
    ) => {
      Object.assign(state.globalSettings, action.payload);
    },

    checkForNudge: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const project = state.byProject[projectId];

      if (!project) return;

      const timeSinceCreation = Date.now() - project.startedAt;
      const fifteenMinutes = 15 * 60 * 1000;

      // If more than 15 minutes have passed and user hasn't reached A3 (300 words)
      if (
        timeSinceCreation > fifteenMinutes &&
        project.wordCount < TARGET_WORD_COUNT &&
        project.isInFirstDraftPath &&
        !project.completed.focusWrite
      ) {
        analyticsService.track('nudge_banner_shown', {
          projectId,
          nudgeType: 'comeback_reminder',
          timingMs: timeSinceCreation,
        });
      }
    },
  },
});

export const {
  initializeProject,
  advanceStep,
  markStepCompleted,
  updateWordCount,
  trackFrictionIndicator,
  exitFirstDraftPath,
  updateGlobalSettings,
  checkForNudge,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;

// Selectors
export const selectProjectOnboarding = (
  state: { onboarding: OnboardingState },
  projectId: string,
) => state.onboarding.byProject[projectId];

export const selectIsInFirstDraftPath = (
  state: { onboarding: OnboardingState },
  projectId: string,
) => state.onboarding.byProject[projectId]?.isInFirstDraftPath ?? false;

export const selectCurrentStep = (state: { onboarding: OnboardingState }, projectId: string) =>
  state.onboarding.byProject[projectId]?.current ?? 'project';

export const selectStepProgress = (state: { onboarding: OnboardingState }, projectId: string) => {
  const project = state.onboarding.byProject[projectId];
  if (!project) return { current: 0, total: 0, percentage: 0 };

  const currentIndex = FIRST_DRAFT_STEPS.indexOf(project.current);
  const completedCount = Object.keys(project.completed).length;

  return {
    current: completedCount,
    total: FIRST_DRAFT_STEPS.length,
    percentage: Math.round((completedCount / FIRST_DRAFT_STEPS.length) * 100),
    currentStepIndex: currentIndex,
  };
};

export const selectWordCountProgress = (
  state: { onboarding: OnboardingState },
  projectId: string,
) => {
  const project = state.onboarding.byProject[projectId];
  if (!project) return { current: 0, target: TARGET_WORD_COUNT, percentage: 0 };

  return {
    current: project.wordCount,
    target: project.targetWordCount,
    percentage: Math.min(Math.round((project.wordCount / project.targetWordCount) * 100), 100),
    hasReachedTarget: project.wordCount >= project.targetWordCount,
  };
};

export const selectGlobalOnboardingSettings = (state: { onboarding: OnboardingState }) =>
  state.onboarding.globalSettings;

export const selectShouldShowNudge = (
  state: { onboarding: OnboardingState },
  projectId: string,
) => {
  const project = state.onboarding.byProject[projectId];
  if (!project) return false;

  const timeSinceCreation = Date.now() - project.startedAt;
  const fifteenMinutes = 15 * 60 * 1000;

  return (
    timeSinceCreation > fifteenMinutes &&
    project.wordCount < TARGET_WORD_COUNT &&
    project.isInFirstDraftPath &&
    !project.completed.focusWrite
  );
};
