// src/components/Onboarding/FirstDraftPath.tsx
import { CheckCircle, Circle, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useProfile } from '../../context/ProfileContext';
import { analyticsService } from '../../services/analyticsService';
import {
  OnboardingStep,
  selectProjectOnboarding,
  selectCurrentStep,
  selectStepProgress,
  selectWordCountProgress,
  selectIsInFirstDraftPath,
  markStepCompleted,
  advanceStep,
  exitFirstDraftPath,
} from '../../state/onboarding/onboardingSlice';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Progress } from '../ui/progress';

interface FirstDraftPathProps {
  projectId: string;
  onStepComplete?: (step: OnboardingStep) => void;
  onPathComplete?: () => void;
  onExitPath?: () => void;
}

interface StepData {
  key: OnboardingStep;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

const STEPS_DATA: StepData[] = [
  {
    key: 'project',
    title: 'Create your project',
    description: 'Set up a container for your book',
    icon: '📚',
    estimatedTime: '1 min',
  },
  {
    key: 'chapter',
    title: 'Add your first chapter',
    description: 'Create a section to organize scenes',
    icon: '📑',
    estimatedTime: '1 min',
  },
  {
    key: 'scene',
    title: 'Add your first scene',
    description: 'Create a place where writing happens',
    icon: '✍️',
    estimatedTime: '1 min',
  },
  {
    key: 'focusWrite',
    title: 'Write for five minutes',
    description: 'Get 300 words on the page',
    icon: '🎯',
    estimatedTime: '5 min',
  },
  {
    key: 'export',
    title: 'Export a snippet',
    description: 'Save a copy of your work',
    icon: '📤',
    estimatedTime: '1 min',
  },
];

export function FirstDraftPath({
  projectId,
  onStepComplete,
  onPathComplete,
  onExitPath,
}: FirstDraftPathProps) {
  const dispatch = useDispatch();
  const { activeProfileId } = useProfile();
  const projectOnboarding = useSelector((state: any) =>
    selectProjectOnboarding(state, activeProfileId || 'anonymous', projectId),
  );
  const currentStep = useSelector((state: any) =>
    selectCurrentStep(state, activeProfileId || 'anonymous', projectId),
  );
  const stepProgress = useSelector((state: any) =>
    selectStepProgress(state, activeProfileId || 'anonymous', projectId),
  );
  const wordProgress = useSelector((state: any) =>
    selectWordCountProgress(state, activeProfileId || 'anonymous', projectId),
  );
  const isInFirstDraftPath = useSelector((state: any) =>
    selectIsInFirstDraftPath(state, activeProfileId || 'anonymous', projectId),
  );

  const [_startTime] = useState(Date.now());

  useEffect(() => {
    if (!projectOnboarding) return;

    // Track step starts
    analyticsService.track('first_draft_step_viewed', {
      profileId: activeProfileId || 'anonymous',
      projectId,
      step: currentStep,
      stepIndex: STEPS_DATA.findIndex((s) => s.key === currentStep),
    });
  }, [currentStep, projectId, projectOnboarding]);

  const handleStepComplete = (step: OnboardingStep) => {
    dispatch(markStepCompleted({ profileId: activeProfileId || 'anonymous', projectId, step }));
    onStepComplete?.(step);

    // Check if this was the final step
    if (step === 'export') {
      handlePathComplete();
    }
  };

  const handleAdvanceStep = () => {
    dispatch(advanceStep({ profileId: activeProfileId || 'anonymous', projectId }));
  };

  const handlePathComplete = () => {
    analyticsService.track('first_draft_path_completed', {
      profileId: activeProfileId || 'anonymous',
      projectId,
      totalDuration: Date.now() - (projectOnboarding?.startedAt || Date.now()),
      stepsCompleted: STEPS_DATA.length,
    });
    onPathComplete?.();
  };

  const handleExitPath = () => {
    dispatch(
      exitFirstDraftPath({
        profileId: activeProfileId || 'anonymous',
        projectId,
        reason: 'user_choice',
      }),
    );
    onExitPath?.();
  };

  if (!isInFirstDraftPath || !projectOnboarding) {
    return null;
  }

  const isCurrentStep = (stepKey: OnboardingStep) => stepKey === currentStep;
  const isCompleted = (stepKey: OnboardingStep) => !!projectOnboarding.completed[stepKey];
  const isPending = (stepKey: OnboardingStep) => {
    const stepIndex = STEPS_DATA.findIndex((s) => s.key === stepKey);
    const currentIndex = STEPS_DATA.findIndex((s) => s.key === currentStep);
    return stepIndex > currentIndex;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Inkwell</h1>
        <p className="text-lg text-gray-600 mb-4">
          You are five steps from a first saved scene. We will keep the screen simple and move one
          step at a time.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>~15 minutes</span>
          </div>
          <div>
            <Progress value={stepProgress.percentage} className="w-32" />
          </div>
          <span>
            {stepProgress.current} of {stepProgress.total} complete
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS_DATA.map((stepData, index) => {
          const completed = isCompleted(stepData.key);
          const current = isCurrentStep(stepData.key);
          const _pending = isPending(stepData.key);

          return (
            <Card
              key={stepData.key}
              className={`transition-all duration-200 ${
                current
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : completed
                    ? 'bg-green-50 border-green-200'
                    : 'opacity-60'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Step icon/status */}
                  <div className="flex-shrink-0">
                    {completed ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : current ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    ) : (
                      <Circle className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`font-semibold ${
                            completed
                              ? 'text-green-800'
                              : current
                                ? 'text-blue-900'
                                : 'text-gray-700'
                          }`}
                        >
                          {stepData.icon} {stepData.title}
                        </h3>
                        <p
                          className={`text-sm ${
                            completed
                              ? 'text-green-600'
                              : current
                                ? 'text-blue-700'
                                : 'text-gray-500'
                          }`}
                        >
                          {stepData.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xs ${
                            completed
                              ? 'text-green-600'
                              : current
                                ? 'text-blue-600'
                                : 'text-gray-400'
                          }`}
                        >
                          {stepData.estimatedTime}
                        </div>
                        {current && stepData.key === 'focusWrite' && (
                          <div className="text-xs text-blue-600 mt-1">
                            {wordProgress.current}/{wordProgress.target} words
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for focus write step */}
                    {current && stepData.key === 'focusWrite' && (
                      <div className="mt-3">
                        <Progress value={wordProgress.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Keep writing...</span>
                          <span>{wordProgress.percentage}% complete</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {current && (
                      <div className="mt-4 flex space-x-3">
                        <Button
                          onClick={() => handleStepComplete(stepData.key)}
                          disabled={stepData.key === 'focusWrite' && !wordProgress.hasReachedTarget}
                        >
                          {stepData.key === 'focusWrite' && !wordProgress.hasReachedTarget
                            ? 'Keep writing...'
                            : `Complete ${stepData.title.toLowerCase()}`}
                        </Button>

                        {index < STEPS_DATA.length - 1 && (
                          <Button variant="outline" onClick={handleAdvanceStep}>
                            Skip for now
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Completed state */}
                    {completed && (
                      <div className="mt-4 text-sm text-green-600 font-medium">✓ Completed</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Success message */}
      {stepProgress.percentage === 100 && (
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Congratulations!</h3>
            <p className="text-green-700 mb-4">
              You created a project, added a chapter, wrote your first scene, and exported a
              snippet. Nice work.
            </p>
            <div className="space-x-3">
              <Button onClick={handlePathComplete}>Continue writing</Button>
              <Button
                variant="outline"
                onClick={() => {
                  // This would switch to Pro mode
                  handlePathComplete();
                }}
              >
                Switch to Pro view
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit option (subtle) */}
      <div className="mt-8 text-center">
        <button
          onClick={handleExitPath}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          I'm experienced, skip to full interface
        </button>
      </div>
    </div>
  );
}

// Minimal checklist component for in-panel display
export function FirstDraftChecklist({
  projectId,
  className = '',
}: {
  projectId: string;
  className?: string;
}) {
  const { activeProfileId } = useProfile();
  const stepProgress = useSelector((state: any) =>
    selectStepProgress(state, activeProfileId || 'anonymous', projectId),
  );
  const currentStep = useSelector((state: any) =>
    selectCurrentStep(state, activeProfileId || 'anonymous', projectId),
  );
  const isInFirstDraftPath = useSelector((state: any) =>
    selectIsInFirstDraftPath(state, activeProfileId || 'anonymous', projectId),
  );

  if (!isInFirstDraftPath) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-blue-900">First Draft Path</h4>
        <div className="text-sm text-blue-700">
          {stepProgress.current}/{stepProgress.total}
        </div>
      </div>

      <Progress value={stepProgress.percentage} className="h-2 mb-3" />

      <div className="space-y-2">
        {STEPS_DATA.map((step, index) => (
          <div
            key={step.key}
            className={`flex items-center text-sm ${
              step.key === currentStep ? 'text-blue-800 font-medium' : 'text-blue-600'
            }`}
          >
            <div className="w-4 h-4 mr-2 flex items-center justify-center">
              {stepProgress.current > index ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : step.key === currentStep ? (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              ) : (
                <Circle className="w-3 h-3 text-blue-400" />
              )}
            </div>
            <span>{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
