// src/components/Onboarding/TourOverlay.tsx
import React, { useCallback, useMemo, useState } from 'react';

import { loadTourPreset } from './presetLoaderHelper';

import type { TourType } from './steps/Step.types';

type Props = { tourType?: TourType; onClose?: () => void };

export default function TourOverlay({ tourType = 'full-onboarding', onClose }: Props) {
  const steps = useMemo(() => loadTourPreset(tourType), [tourType]);
  const total = steps.length;
  const [i, setI] = useState(0);

  const onNext = useCallback(() => setI((x) => Math.min(total - 1, x + 1)), [total]);
  const onPrevious = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const onComplete = useCallback(() => {
    // TODO: persist completion via tutorial storage if desired
    onClose?.();
  }, [onClose]);

  const Step = steps[i];
  if (!Step) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/30">
      <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="bg-white rounded-2xl shadow-xl mx-auto md:min-w-[560px]">
          <Step
            stepIndex={i}
            totalSteps={total}
            onNext={onNext}
            onPrevious={onPrevious}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
