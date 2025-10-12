import React from 'react';

import { TourStep } from '@/types/tour';

export const StepFinish: TourStep = {
  id: 'finish',
  element: 'body',
  title: "You're All Set!",
  content: (
    <div className="space-y-2">
      <p>
        That's the basics of Inkwell! You're ready to start writing and creating amazing content.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Need help later? Click the help icon in the top menu to revisit this tour or access our
        guides.
      </p>
    </div>
  ),
  placement: 'center',
};
