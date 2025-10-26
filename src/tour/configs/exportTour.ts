/**
 * Export Features Tour Configuration
 *
 * Feature-specific tour for the export wizard and publishing features.
 */

import type { TourStep } from '../types';

export const EXPORT_TOUR_ID = 'inkwell-export-v1';

/**
 * Export tour steps
 *
 * Guides users through exporting their work in various formats.
 */
export const exportTourSteps: TourStep[] = [
  {
    id: 'export-intro',
    title: 'Export Your Masterpiece',
    body: 'Ready to share your work? Inkwell can export your story in multiple professional formats.',
    selectors: ['[data-tour-id="dashboard"]', 'main'],
    placement: 'bottom',
  },
  {
    id: 'export-button',
    title: 'Start Export',
    body: 'Click the export button or press ⌘E to open the export wizard.',
    selectors: [
      '[data-tour-id="export-button"]',
      '[aria-label*="Export"]',
      'button[title*="Export"]',
    ],
    placement: 'bottom',
  },
  {
    id: 'export-formats',
    title: 'Choose Your Format',
    body: 'Export to PDF for sharing, DOCX for editing, or EPUB for e-readers. Each format is optimized for its use case.',
    selectors: ['[data-tour-id="export-format-selector"]'],
    placement: 'right',
    spotlightPadding: 20,
  },
  {
    id: 'export-styles',
    title: 'Professional Styling',
    body: 'Choose from manuscript format, book layout, or screenplay styles. Each template follows industry standards.',
    selectors: ['[data-tour-id="export-style-selector"]'],
    placement: 'right',
  },
  {
    id: 'export-proofread',
    title: 'AI Proofreading (Optional)',
    body: 'Enable AI proofreading to catch typos, grammar issues, and style inconsistencies before export.',
    selectors: ['[data-tour-id="export-proofread-toggle"]'],
    placement: 'left',
  },
  {
    id: 'export-complete',
    title: "You're All Set!",
    body: 'Your exported files will be ready to download. You can export as many times as you need with different formats.',
    selectors: ['[data-tour-id="dashboard"]', 'main'],
    placement: 'bottom',
  },
];

/**
 * Full Export tour configuration
 */
export const exportTourConfig = {
  id: EXPORT_TOUR_ID,
  steps: exportTourSteps,
  version: 1,
};
