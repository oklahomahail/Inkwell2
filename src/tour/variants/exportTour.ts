/**
 * Export Tour
 *
 * Walks users through the export and template system.
 */

import type { SpotlightStep, TourConfig } from '../TourTypes';

const steps: SpotlightStep[] = [
  {
    target: '[data-tour-id="export-open"]',
    title: 'Export Your Work',
    content: 'Click the Export button in the top bar to access export options.',
    placement: 'bottom',
    onNext: async () => {
      // Auto-open export modal when user clicks Next
      const exportButton = document.querySelector<HTMLButtonElement>(
        '[data-tour-id="export-open"]',
      );
      if (exportButton && !document.querySelector('[data-tour-id="export-template"]')) {
        exportButton.click();
        // Wait for modal to open and render
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    },
  },
  {
    target: '[data-tour-id="export-template"]',
    title: 'Choose a Template',
    content:
      'Select from templates like Manuscript Format, Synopsis, or Analysis Summary to format your export.',
    placement: 'left',
  },
  {
    target: '[data-tour-id="export-run"]',
    title: 'Generate PDF',
    content: 'Click to generate a professional, ready-to-share PDF file.',
    placement: 'left',
  },
];

export const exportTour: TourConfig = {
  id: 'inkwell-export-v1',
  steps,
  showProgress: true,
  allowSkip: true,
};
