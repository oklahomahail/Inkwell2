import React, { useState } from 'react';

import type { StepProps } from './Step.types';

export default function _StepFeedback({
  onComplete,
  onPrevious,
  stepIndex,
  totalSteps,
}: StepProps) {
  const [text, setText] = useState('');
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">Got 10 seconds?</h2>
      <p className="mb-4">Tell us what would make Inkwell perfect for you.</p>
      <textarea
        className="w-full rounded-xl border p-3 mb-4"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Optional feedback"
      />
      <div className="flex items-center justify-between">
        <button className="px-3 py-2 rounded-xl border" onClick={onPrevious}>
          Back
        </button>
        <div className="text-sm opacity-70">
          {stepIndex + 1} / {totalSteps}
        </div>
        <button className="px-3 py-2 rounded-xl border" onClick={onComplete}>
          Done
        </button>
      </div>
    </div>
  );
}
