import React from 'react';

import { TourStep } from '@/types/tour';

export const StepProjectCard: TourStep = {
  id: 'project-card',
  selectors: ['.project-card-demo'],
  title: 'Project Management',
  content: (
    <div className="space-y-2">
      <p>
        Each project card shows key information about your writing. Click to open, or use the menu
        to access additional options.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You can organize projects into collections and track your progress here.
      </p>
    </div>
  ),
  placement: 'right',
};
