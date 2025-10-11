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
  premise,
  _onChange,
  _onNext,
  _onPrevious,
  _onGenerate,
  _isGenerating,
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
  outline,
  _onNext,
  _onPrevious,
  _onRegenerate,
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
  outline,
  _options,
  _onOptionsChange,
  _onIntegrate,
  _onPrevious,
  _currentProject,
}) => {
  return <div>{/* Integration step implementation */}</div>;
};
