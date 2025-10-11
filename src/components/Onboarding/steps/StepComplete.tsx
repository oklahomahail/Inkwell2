import React from 'react';

import type { StepProps } from './Step.types';

export default function StepComplete({ onComplete, stepIndex, totalSteps }: StepProps) {
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">You're all set</h2>
      <p className="mb-4">Jump in and start writing—your tools are ready.</p>
      <div className="text-sm opacity-70 mb-4">
        {stepIndex + 1} / {totalSteps}
      </div>
      <button className="px-4 py-2 rounded-xl border" onClick={onComplete}>
        Finish
      </button>
    </div>
  );
}
