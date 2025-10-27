/**
 * AI Tools Tour
 *
 * Guides users through the AI-powered writing features in Inkwell.
 */

import type { SpotlightStep, TourConfig } from '../TourTypes';

const steps: SpotlightStep[] = [
  {
    target: '[data-tour-id="model-selector"]',
    title: 'AI Model Selector',
    content: 'Choose between Claude, GPT-4, or Gemini to power your AI writing assistant.',
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="assistant-panel"]',
    title: 'AI Assistant Panel',
    content: 'Draft new content, rewrite existing text, or brainstorm ideas with AI assistance.',
    placement: 'left',
  },
  {
    target: '[data-tour-id="privacy-hint"]',
    title: 'Privacy & Data',
    content:
      'Your text stays local on your device. AI calls are only made when you explicitly request assistance.',
    placement: 'top',
  },
];

export const aiToolsTour: TourConfig = {
  id: 'inkwell-ai-tools-v1',
  steps,
  showProgress: true,
  allowSkip: true,
};
