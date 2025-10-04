// Enhanced AI Story Architect Flow
// Comprehensive UI for generating story outlines with Claude integration

import {
  Wand2,
  BookOpen,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Target,
  Eye,
  ChevronRight,
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import {
  storyArchitectService,
  type StoryPremise,
  type GeneratedOutline,
} from '@/services/storyArchitectService';
import { timelineService } from '@/services/timelineService';

interface StoryArchitectFlowProps {
  onComplete?: (outline: GeneratedOutline) => void;
  onClose?: () => void;
  initialProject?: any;
}

type FlowStep = 'premise' | 'options' | 'generating' | 'review' | 'integration';

interface StepperProps {
  currentStep: FlowStep;
  completedSteps: Set<FlowStep>;
}

const stepOrder: FlowStep[] = ['premise', 'options', 'generating', 'review', 'integration'];

const Stepper: React.FC<StepperProps> = ({ currentStep, completedSteps }) => {
  const steps = [
    { id: 'premise', label: 'Story Premise', icon: BookOpen },
    { id: 'options', label: 'Options', icon: Settings },
    { id: 'generating', label: 'Generation', icon: Sparkles },
    { id: 'review', label: 'Review', icon: Eye },
    { id: 'integration', label: 'Integration', icon: Target },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.has(step.id as FlowStep);
        const isAccessible =
          stepOrder.indexOf(step.id as FlowStep) <= stepOrder.indexOf(currentStep);

        return (
          <React.Fragment key={step.id}>
            <div
              className={`
              flex flex-col items-center relative
              ${isAccessible ? 'opacity-100' : 'opacity-40'}
            `}
            >
              <div
                className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all
                ${
                  isActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                }
              `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <StepIcon
                    className={`w-6 h-6 ${
                      isActive
                        ? 'text-purple-500'
                        : isAccessible
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : isAccessible
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`
                w-16 h-0.5 mx-4 mt-6 transition-all
                ${
                  isCompleted &&
                  steps[index + 1] &&
                  steps[index + 1] &&
                  completedSteps.has(steps[index + 1]!.id as FlowStep)
                    ? 'bg-green-500'
                    : isAccessible
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const StoryArchitectFlow: React.FC<StoryArchitectFlowProps> = ({
  onComplete,
  onClose,
  initialProject,
}) => {
  const { currentProject, updateProject } = useAppContext();
  const { showToast } = useToast();

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('premise');
  const [completedSteps, setCompletedSteps] = useState<Set<FlowStep>>(new Set());

  // Generation state
  const [premise, setPremise] = useState<StoryPremise>({
    title: initialProject?.name || '',
    genre: initialProject?.genre || '',
    premise: initialProject?.description || '',
    targetLength: 'novel',
    tone: '',
    themes: [],
    setting: '',
    focusType: 'balanced',
    povStyle: 'single-pov',
    characterCount: 'moderate',
    relationshipFocus: [],
    characterDevelopmentDepth: 'moderate',
    narrativePerspective: 'third-limited',
  });

  const [generatedOutline, setGeneratedOutline] = useState<GeneratedOutline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [integrationOptions, setIntegrationOptions] = useState({
    replaceProject: false,
    mergeCharacters: true,
    generateTimeline: true,
    createChapters: true,
    preserveExisting: true,
  });

  // Check if Story Architect is available
  const isAvailable = storyArchitectService.isAvailable();
  const setupMessage = storyArchitectService.getSetupMessage();

  // Validate premise step
  const isPremiseValid = useCallback(() => {
    const validation = storyArchitectService.validateRequest(premise);
    return validation.isValid;
  }, [premise]);

  // Generate outline with progress tracking
  const handleGenerate = useCallback(async () => {
    if (!isPremiseValid()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsGenerating(true);
    setCurrentStep('generating');
    setGenerateProgress(0);
    setGenerateStatus('Initializing story generation...');

    const estimatedTime = storyArchitectService.getEstimatedGenerationTime(premise.targetLength);
    setEstimatedTime(estimatedTime);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setGenerateProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 85);

        if (newProgress < 20) {
          setGenerateStatus('Analyzing story premise...');
        } else if (newProgress < 40) {
          setGenerateStatus('Developing character arcs...');
        } else if (newProgress < 60) {
          setGenerateStatus('Structuring plot progression...');
        } else if (newProgress < 80) {
          setGenerateStatus('Generating scenes and chapters...');
        } else {
          setGenerateStatus('Finalizing story outline...');
        }

        return newProgress;
      });
    }, 1000);

    try {
      const outline = await storyArchitectService.generateOutline(premise);

      clearInterval(progressInterval);
      setGenerateProgress(100);
      setGenerateStatus('Story generation complete!');

      setTimeout(() => {
        setGeneratedOutline(outline);
        setIsGenerating(false);
        setCurrentStep('review');
        setCompletedSteps((prev) => new Set([...prev, 'premise', 'options', 'generating']));
        showToast('Story outline generated successfully!', 'success');
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setCurrentStep('options');

      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setGenerateStatus(`Error: ${errorMessage}`);
      showToast(errorMessage, 'error');

      console.error('Story generation error:', error);
    }
  }, [premise, isPremiseValid, showToast]);

  // Handle integration with project and timeline
  const handleIntegration = useCallback(async () => {
    if (!generatedOutline || !currentProject) {
      showToast('No outline or project to integrate with', 'error');
      return;
    }

    try {
      setCurrentStep('integration');

      let updatedProject = currentProject;

      // Update project with outline data
      if (integrationOptions.replaceProject || integrationOptions.mergeCharacters) {
        const projectUpdate = storyArchitectService.convertToProject(
          generatedOutline,
          currentProject as any,
        );

        if (integrationOptions.replaceProject) {
          updatedProject = { ...currentProject, ...projectUpdate } as any;
        } else if (integrationOptions.mergeCharacters) {
          // Merge characters without replacing everything
          updatedProject = {
            ...currentProject,
            characters: [
              ...(currentProject.characters || []),
              ...(projectUpdate.characters || []),
            ] as any,
            description: projectUpdate.description || currentProject.description,
            genre: (projectUpdate as any).genre || (currentProject as any).genre,
          } as any;
        }
      }

      // Generate chapters and scenes
      if (integrationOptions.createChapters) {
        const chaptersAndScenes = storyArchitectService.generateChaptersAndScenes(generatedOutline);

        if (integrationOptions.preserveExisting) {
          // Add to existing chapters
          updatedProject.chapters = [...(currentProject.chapters || []), ...chaptersAndScenes];
        } else {
          // Replace chapters
          updatedProject.chapters = chaptersAndScenes;
        }
      }

      // Update project
      await updateProject(updatedProject);

      // Generate timeline if requested
      if (integrationOptions.generateTimeline) {
        const timelineItems = timelineService.generateTimelineFromOutline(
          generatedOutline,
          currentProject.id,
        );
        await timelineService.saveProjectTimeline(currentProject.id, timelineItems);
        showToast('Timeline generated from story outline', 'success');
      }

      setCompletedSteps((prev) => new Set([...prev, 'review', 'integration']));
      showToast('Story outline integrated successfully!', 'success');

      // Call completion callback
      if (onComplete) {
        onComplete(generatedOutline);
      }
    } catch (error) {
      console.error('Integration error:', error);
      showToast('Failed to integrate story outline', 'error');
    }
  }, [generatedOutline, currentProject, integrationOptions, updateProject, showToast, onComplete]);

  // Step navigation
  const goToNextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  }, [currentStep]);

  // Auto-advance from completed premise
  useEffect(() => {
    if (currentStep === 'premise' && isPremiseValid()) {
      setCompletedSteps((prev) => new Set([...prev, 'premise']));
    }
  }, [currentStep, isPremiseValid]);

  if (!isAvailable) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Setup Required</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">{setupMessage}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Story Architect
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate comprehensive story outlines with Claude AI
                </p>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isGenerating}
              >
                ✕
              </button>
            )}
          </div>

          <Stepper currentStep={currentStep} completedSteps={completedSteps} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'premise' && (
            <PremiseStep
              premise={premise}
              onChange={setPremise}
              isValid={isPremiseValid()}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'options' && (
            <OptionsStep
              premise={premise}
              onChange={setPremise}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}

          {currentStep === 'generating' && (
            <GeneratingStep
              progress={generateProgress}
              status={generateStatus}
              estimatedTime={estimatedTime}
              onCancel={() => {
                setIsGenerating(false);
                setCurrentStep('options');
              }}
            />
          )}

          {currentStep === 'review' && generatedOutline && (
            <ReviewStep
              outline={generatedOutline}
              onNext={goToNextStep}
              onPrevious={() => setCurrentStep('options')}
              onRegenerate={handleGenerate}
            />
          )}

          {currentStep === 'integration' && generatedOutline && (
            <IntegrationStep
              outline={generatedOutline}
              options={integrationOptions}
              onOptionsChange={setIntegrationOptions}
              onIntegrate={handleIntegration}
              onPrevious={goToPreviousStep}
              currentProject={currentProject}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Individual step components would be defined here...
// For brevity, I'll include just the interfaces and a couple key ones:

interface PremiseStepProps {
  premise: StoryPremise;
  onChange: (premise: StoryPremise) => void;
  isValid: boolean;
  onNext: () => void;
}

const PremiseStep: React.FC<PremiseStepProps> = ({ premise, onChange, isValid, onNext }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Tell me about your story
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Provide the basic details about your story and I'll generate a comprehensive outline with
          characters, chapters, and scenes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Story Title *
            </label>
            <input
              type="text"
              value={premise.title}
              onChange={(e) => onChange({ ...premise, title: e.target.value })}
              placeholder="Enter your story title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre *
            </label>
            <select
              value={premise.genre}
              onChange={(e) => onChange({ ...premise, genre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select genre...</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Thriller">Thriller</option>
              <option value="Horror">Horror</option>
              <option value="Literary Fiction">Literary Fiction</option>
              <option value="Historical Fiction">Historical Fiction</option>
              <option value="Young Adult">Young Adult</option>
              <option value="Middle Grade">Middle Grade</option>
              <option value="Contemporary Fiction">Contemporary Fiction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Length *
            </label>
            <select
              value={premise.targetLength}
              onChange={(e) =>
                onChange({
                  ...premise,
                  targetLength: e.target.value as StoryPremise['targetLength'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="short">Short Story (10k-40k words)</option>
              <option value="novella">Novella (40k-70k words)</option>
              <option value="novel">Novel (70k-120k words)</option>
              <option value="epic">Epic Novel (120k+ words)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tone/Mood *
            </label>
            <input
              type="text"
              value={premise.tone}
              onChange={(e) => onChange({ ...premise, tone: e.target.value })}
              placeholder="e.g., Dark and mysterious, Light-hearted adventure, Romantic comedy"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Story Premise *
          </label>
          <textarea
            value={premise.premise}
            onChange={(e) => onChange({ ...premise, premise: e.target.value })}
            placeholder="Describe your story premise in 2-3 sentences. What is the main conflict? Who is the protagonist? What's at stake?"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{premise.premise.length}/500 characters</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Next: Advanced Options
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface GeneratingStepProps {
  progress: number;
  status: string;
  estimatedTime: number;
  onCancel: () => void;
}

const GeneratingStep: React.FC<GeneratingStepProps> = ({
  progress,
  status,
  estimatedTime,
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
            className="text-purple-500 transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Generating Your Story
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 max-w-md">{status}</p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Estimated time: ~{estimatedTime} seconds</span>
        </div>
      </div>

      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        Cancel Generation
      </button>
    </div>
  );
};

// Import the additional step components
import { OptionsStep, ReviewStep, IntegrationStep } from './StoryArchitectSteps';

export default StoryArchitectFlow;
