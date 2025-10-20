import React from 'react';

import type { StoryPremise, GeneratedOutline } from '@/services/storyArchitectService';

// Options Step Component
interface OptionsStepProps {
  premise: StoryPremise;
  onChange: (_premise: StoryPremise) => void;
  onNext: () => void;
  onPrevious: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const OptionsStep: React.FC<OptionsStepProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  premise,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrevious,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGenerate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isGenerating,
}) => {
  return <div>{/* Options step implementation */}</div>;
};

// Review Step Component
interface ReviewStepProps {
  outline: GeneratedOutline;
  onNext: () => void;
  onPrevious: () => void;
  onRegenerate: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outline,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrevious,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRegenerate,
}) => {
  return <div>{/* Review step implementation */}</div>;
};

// Integration Step Component
interface IntegrationStepProps {
  outline: GeneratedOutline;
  options: {
    replaceProject: boolean;
    mergeCharacters: boolean;
    generateTimeline: boolean;
    createChapters: boolean;
    preserveExisting: boolean;
  };
  onOptionsChange: (_options: any) => void;
  onIntegrate: () => void;
  onPrevious: () => void;
  currentProject: any;
}

export const IntegrationStep: React.FC<IntegrationStepProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outline,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOptionsChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onIntegrate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrevious,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentProject,
}) => {
  return <div>{/* Integration step implementation */}</div>;
};
