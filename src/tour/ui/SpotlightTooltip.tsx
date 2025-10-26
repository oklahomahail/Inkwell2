import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

type SpotlightTooltipProps = {
  step: {
    id: string;
    title: string;
    description?: string;
    targetId: string;
    placement?: TooltipPlacement;
    nextLabel?: string;
    prevLabel?: string;
    skipLabel?: string;
    closeLabel?: string;
  };
  index: number;
  total: number;
  anchorRect: DOMRect;
  placement?: TooltipPlacement;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  gap?: number; // space between anchor and tooltip
};

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

export default function SpotlightTooltip({
  step,
  index,
  total,
  anchorRect,
  placement = 'auto',
  onNext,
  onPrev,
  onSkip,
  onClose,
  gap = 12,
}: SpotlightTooltipProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>('bottom');

  // Compute position after we know the tooltip size.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const rect = card.getBoundingClientRect();
    const cardW = rect.width;
    const cardH = rect.height;

    const tryPlacement = (p: TooltipPlacement) => {
      switch (p) {
        case 'top':
          return {
            left: clamp(anchorRect.x + anchorRect.width / 2 - cardW / 2, 8, vpW - cardW - 8),
            top: clamp(anchorRect.y - gap - cardH, 8, vpH - cardH - 8),
          };
        case 'bottom':
          return {
            left: clamp(anchorRect.x + anchorRect.width / 2 - cardW / 2, 8, vpW - cardW - 8),
            top: clamp(anchorRect.y + anchorRect.height + gap, 8, vpH - cardH - 8),
          };
        case 'left':
          return {
            left: clamp(anchorRect.x - gap - cardW, 8, vpW - cardW - 8),
            top: clamp(anchorRect.y + anchorRect.height / 2 - cardH / 2, 8, vpH - cardH - 8),
          };
        case 'right':
          return {
            left: clamp(anchorRect.x + anchorRect.width + gap, 8, vpW - cardW - 8),
            top: clamp(anchorRect.y + anchorRect.height / 2 - cardH / 2, 8, vpH - cardH - 8),
          };
        default:
          // Auto: prefer bottom, then top, right, left
          const bottomTop = {
            bottom: {
              left: clamp(anchorRect.x + anchorRect.width / 2 - cardW / 2, 8, vpW - cardW - 8),
              top: clamp(anchorRect.y + anchorRect.height + gap, 8, vpH - cardH - 8),
            },
            top: {
              left: clamp(anchorRect.x + anchorRect.width / 2 - cardW / 2, 8, vpW - cardW - 8),
              top: clamp(anchorRect.y - gap - cardH, 8, vpH - cardH - 8),
            },
            right: {
              left: clamp(anchorRect.x + anchorRect.width + gap, 8, vpW - cardW - 8),
              top: clamp(anchorRect.y + anchorRect.height / 2 - cardH / 2, 8, vpH - cardH - 8),
            },
            left: {
              left: clamp(anchorRect.x - gap - cardW, 8, vpW - cardW - 8),
              top: clamp(anchorRect.y + anchorRect.height / 2 - cardH / 2, 8, vpH - cardH - 8),
            },
          };
          // Choose the first position that keeps most of the card in view.
          const candidates: Array<[TooltipPlacement, { left: number; top: number }]> = [
            ['bottom', bottomTop.bottom],
            ['top', bottomTop.top],
            ['right', bottomTop.right],
            ['left', bottomTop.left],
          ];
          let best: [TooltipPlacement, { left: number; top: number }] = candidates[0] || [
            'bottom',
            { left: 0, top: 0 },
          ];
          let bestScore = -Infinity;
          for (const c of candidates) {
            const score = scorePlacement(c[1], cardW, cardH, vpW, vpH);
            if (score > bestScore) {
              best = c;
              bestScore = score;
            }
          }
          setResolvedPlacement(best[0]);
          return best[1];
      }
    };

    const chosen = tryPlacement(placement);
    setCoords(chosen);
    if (placement !== 'auto') setResolvedPlacement(placement);
  }, [anchorRect.x, anchorRect.y, anchorRect.width, anchorRect.height, gap, placement]);

  // Move keyboard focus into the card when it appears.
  useEffect(() => {
    const card = cardRef.current;
    if (card) {
      const btn = card.querySelector<HTMLButtonElement>('[data-primary]');
      (btn ?? card).focus();
    }
  }, []);

  const stepId = `tour-step-${step.id}`;
  const describedById = `${stepId}-desc`;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={stepId}
      aria-describedby={describedById}
      className="fixed z-[9999] max-w-sm rounded-2xl border bg-white text-gray-900 shadow-xl outline-none dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-700 pointer-events-auto"
      style={{ left: coords.left, top: coords.top }}
    >
      <div className="p-4">
        <div className="text-xs text-gray-500 dark:text-neutral-400">
          Step {index + 1} of {total}
        </div>

        <h2 id={stepId} className="mt-1 text-base font-semibold leading-tight">
          {step.title}
        </h2>

        {step.description ? (
          <p
            id={describedById}
            className="mt-2 text-sm leading-5 text-gray-700 dark:text-neutral-300"
          >
            {step.description}
          </p>
        ) : (
          <span id={describedById} className="sr-only">
            No additional description
          </span>
        )}

        {/* Arrow pointer */}
        <Arrow placement={resolvedPlacement} />

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700"
                onClick={onPrev}
                aria-label="Previous"
              >
                {step.prevLabel ?? 'Back'}
              </button>
            )}
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700"
              onClick={onSkip}
              aria-label="Skip tour"
            >
              {step.skipLabel ?? 'Skip'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700"
              onClick={onClose}
              aria-label="Close tour"
            >
              {step.closeLabel ?? 'Close'}
            </button>
            <button
              type="button"
              data-primary
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
              onClick={onNext}
              aria-label="Next"
            >
              {index + 1 === total ? 'Finish' : (step.nextLabel ?? 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple score that rewards on-screen area and penalizes overflow.
function scorePlacement(
  pos: { left: number; top: number },
  w: number,
  h: number,
  vpW: number,
  vpH: number,
) {
  const right = pos.left + w;
  const bottom = pos.top + h;
  const visW = Math.max(0, Math.min(right, vpW) - Math.max(pos.left, 0));
  const visH = Math.max(0, Math.min(bottom, vpH) - Math.max(pos.top, 0));
  const visibleArea = visW * visH;
  const overflow = w * h - visibleArea;
  return visibleArea - overflow * 2;
}

function Arrow({ placement }: { placement: TooltipPlacement }) {
  // Render a small directional triangle. Positioned using translate utilities.
  const base = 'absolute w-0 h-0 border-transparent';
  const common = 'border-[8px]';
  switch (placement) {
    case 'top':
      return (
        <span
          className={`${base} ${common} left-1/2 -translate-x-1/2 -bottom-2 border-t-white dark:border-t-neutral-900`}
          style={{
            borderTopColor: 'currentcolor',
            borderTopWidth: 8,
            borderLeftWidth: 8,
            borderRightWidth: 8,
          }}
        />
      );
    case 'bottom':
      return (
        <span
          className={`${base} ${common} left-1/2 -translate-x-1/2 -top-2 border-b-white dark:border-b-neutral-900`}
          style={{
            borderBottomColor: 'currentcolor',
            borderBottomWidth: 8,
            borderLeftWidth: 8,
            borderRightWidth: 8,
          }}
        />
      );
    case 'left':
      return (
        <span
          className={`${base} ${common} top-1/2 -translate-y-1/2 -right-2 border-l-white dark:border-l-neutral-900`}
          style={{
            borderLeftColor: 'currentcolor',
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderLeftWidth: 8,
          }}
        />
      );
    case 'right':
      return (
        <span
          className={`${base} ${common} top-1/2 -translate-y-1/2 -left-2 border-r-white dark:border-r-neutral-900`}
          style={{
            borderRightColor: 'currentcolor',
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderRightWidth: 8,
          }}
        />
      );
    default:
      return null;
  }
}
