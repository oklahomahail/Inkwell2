import React from 'react';

import { TourStep } from '@/types/tour';

export const StepQuickActions: TourStep = {
  id: 'quick-actions',
  selectors: ['.quick-actions-bar'],
  title: 'Quick Actions',
  content: (
    <div className="space-y-2">
      <p>
        These quick actions help you create new content and access your most-used tools instantly.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Try clicking "New Project" to start writing right away!
      </p>
    </div>
  ),
  placement: 'bottom',
};
