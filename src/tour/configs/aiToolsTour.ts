/**
 * AI Tools Tour Configuration
 *
 * Feature-specific tour for introducing AI capabilities in Inkwell.
 */

import type { TourStep } from '../types';

export const AI_TOOLS_TOUR_ID = 'inkwell-ai-tools-v1';

/**
 * AI Tools tour steps
 *
 * Guides users through AI-powered features like Claude Assistant,
 * plot analysis, and character insights.
 */
export const aiToolsTourSteps: TourStep[] = [
  {
    id: 'ai-intro',
    title: 'AI-Powered Writing Tools',
    body: "Inkwell includes powerful AI features to help you write, analyze, and improve your story. Let's explore them!",
    selectors: ['[data-tour-id="dashboard"]', 'main'],
    placement: 'bottom',
  },
  {
    id: 'claude-assistant',
    title: 'Claude Assistant',
    body: 'Get instant help with plot development, character creation, and writing suggestions from your AI assistant.',
    selectors: [
      '[data-tour-id="claude-assistant"]',
      '[aria-label*="Claude"]',
      'button[title*="AI"]',
    ],
    placement: 'left',
  },
  {
    id: 'plot-analysis',
    title: 'Plot Analysis',
    body: 'Analyze your story structure, identify plot holes, and get suggestions for improving narrative flow.',
    selectors: ['[data-tour-id="plot-analysis"]', '[aria-label*="Analysis"]'],
    placement: 'bottom',
  },
  {
    id: 'character-insights',
    title: 'Character Development',
    body: 'Track character arcs, analyze dialogue patterns, and ensure consistent character voices throughout your story.',
    selectors: ['[data-tour-id="character-analytics"]', '[aria-label*="Character"]'],
    placement: 'bottom',
  },
  {
    id: 'ai-settings',
    title: 'Customize AI Preferences',
    body: 'Configure your AI assistant, choose models, and set preferences in Settings > AI Configuration.',
    selectors: ['[data-tour-id="settings"]', '[aria-label*="Settings"]'],
    placement: 'left',
  },
];

/**
 * Full AI Tools tour configuration
 */
export const aiToolsTourConfig = {
  id: AI_TOOLS_TOUR_ID,
  steps: aiToolsTourSteps,
  version: 1,
};
