import React from 'react';

import { TourStep } from '@/types/tour';

export const StepWelcome: TourStep = {
  id: 'welcome',
  element: '.dashboard-welcome',
  title: 'Welcome to Inkwell!',
  content: (
    <div className="space-y-2">
      <p>
        Welcome to your writing dashboard! This is where you'll manage all your writing projects and
        access key features.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Let's take a quick tour to help you get started.
      </p>
    </div>
  ),
  placement: 'center',
};
