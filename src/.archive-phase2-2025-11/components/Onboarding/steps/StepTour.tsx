import React from 'react';

import type { StepProps } from './Step.types';

export default function _StepTour({ onNext, onPrevious, stepIndex, totalSteps }: StepProps) {
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">Core Areas</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Projects & Chapters</li>
        <li>Timeline & Plot Boards</li>
        <li>AI Analysis & Exports</li>
      </ul>
      <div className="flex items-center justify-between">
        <button className="px-3 py-2 rounded-xl border" onClick={onPrevious}>
          Back
        </button>
        <div className="text-sm opacity-70">
          {stepIndex + 1} / {totalSteps}
        </div>
        <button className="px-3 py-2 rounded-xl border" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
