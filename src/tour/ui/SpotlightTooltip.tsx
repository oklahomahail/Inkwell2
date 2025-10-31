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

/**
 * Get viewport dimensions including scroll position
 * Accounts for window scroll to ensure proper positioning
 */
function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX || window.pageXOffset,
    scrollY: window.scrollY || window.pageYOffset,
  };
}

/**
 * Enhanced clamp with minimum visible threshold
 * Ensures at least minVisiblePercent (default 80%) of the tooltip is visible
 * If a position would result in less visibility, snap to edge instead
 *
 * @param value - The desired position
 * @param min - Minimum allowed position
 * @param max - Maximum allowed position
 * @param minVisiblePercent - Minimum visible percentage (0-1)
 */
function clampWithMinVisible(value: number, min: number, max: number, minVisiblePercent = 0.8) {
  const range = max - min;
  const minVisible = range * minVisiblePercent;

  // If value would result in less than minVisiblePercent visible, force to min or max
  if (value < min + minVisible && value > min) {
    return min;
  }
  if (value > max - minVisible && value < max) {
    return max;
  }

  return Math.max(min, Math.min(max, value));
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

    const viewport = getViewportDimensions();
    const rect = card.getBoundingClientRect();
    const cardW = rect.width;
    const cardH = rect.height;

    // Account for fixed/sticky headers or footers
    const reservedTop = 60; // Typical header height
    const reservedBottom = 0; // No footer typically
    const margin = 12; // Minimum margin from viewport edge

    const effectiveVpH = viewport.height - reservedTop - reservedBottom;

    const tryPlacement = (p: TooltipPlacement) => {
      switch (p) {
        case 'top':
          return {
            left: clampWithMinVisible(
              anchorRect.x + anchorRect.width / 2 - cardW / 2,
              margin,
              viewport.width - cardW - margin,
            ),
            top: clampWithMinVisible(
              anchorRect.y - gap - cardH,
              reservedTop + margin,
              reservedTop + effectiveVpH - cardH - margin,
            ),
          };
        case 'bottom':
          return {
            left: clampWithMinVisible(
              anchorRect.x + anchorRect.width / 2 - cardW / 2,
              margin,
              viewport.width - cardW - margin,
            ),
            top: clampWithMinVisible(
              anchorRect.y + anchorRect.height + gap,
              reservedTop + margin,
              reservedTop + effectiveVpH - cardH - margin,
            ),
          };
        case 'left':
          return {
            left: clampWithMinVisible(
              anchorRect.x - gap - cardW,
              margin,
              viewport.width - cardW - margin,
            ),
            top: clampWithMinVisible(
              anchorRect.y + anchorRect.height / 2 - cardH / 2,
              reservedTop + margin,
              reservedTop + effectiveVpH - cardH - margin,
            ),
          };
        case 'right':
          return {
            left: clampWithMinVisible(
              anchorRect.x + anchorRect.width + gap,
              margin,
              viewport.width - cardW - margin,
            ),
            top: clampWithMinVisible(
              anchorRect.y + anchorRect.height / 2 - cardH / 2,
              reservedTop + margin,
              reservedTop + effectiveVpH - cardH - margin,
            ),
          };
        default:
          // Auto: prefer bottom, then top, right, left
          const bottomTop = {
            bottom: {
              left: clampWithMinVisible(
                anchorRect.x + anchorRect.width / 2 - cardW / 2,
                margin,
                viewport.width - cardW - margin,
              ),
              top: clampWithMinVisible(
                anchorRect.y + anchorRect.height + gap,
                reservedTop + margin,
                reservedTop + effectiveVpH - cardH - margin,
              ),
            },
            top: {
              left: clampWithMinVisible(
                anchorRect.x + anchorRect.width / 2 - cardW / 2,
                margin,
                viewport.width - cardW - margin,
              ),
              top: clampWithMinVisible(
                anchorRect.y - gap - cardH,
                reservedTop + margin,
                reservedTop + effectiveVpH - cardH - margin,
              ),
            },
            right: {
              left: clampWithMinVisible(
                anchorRect.x + anchorRect.width + gap,
                margin,
                viewport.width - cardW - margin,
              ),
              top: clampWithMinVisible(
                anchorRect.y + anchorRect.height / 2 - cardH / 2,
                reservedTop + margin,
                reservedTop + effectiveVpH - cardH - margin,
              ),
            },
            left: {
              left: clampWithMinVisible(
                anchorRect.x - gap - cardW,
                margin,
                viewport.width - cardW - margin,
              ),
              top: clampWithMinVisible(
                anchorRect.y + anchorRect.height / 2 - cardH / 2,
                reservedTop + margin,
                reservedTop + effectiveVpH - cardH - margin,
              ),
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
            const score = scorePlacement(
              c[1],
              cardW,
              cardH,
              viewport.width,
              effectiveVpH,
              reservedTop,
            );
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

  // Tab trap within tooltip
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const card = cardRef.current;
    if (!card) return;

    const focusables = card.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );

    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  const stepId = `tour-step-${step.id}`;
  const describedById = `${stepId}-desc`;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={stepId}
      aria-describedby={describedById}
      onKeyDown={handleKeyDown}
      className="fixed z-tour-tooltip max-w-sm max-h-[calc(100vh-120px)] overflow-auto rounded-2xl border bg-white text-gray-900 shadow-xl outline-none dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-700 pointer-events-auto"
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
                className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:focus:ring-blue-500"
                onClick={onPrev}
                aria-label="Previous"
              >
                {step.prevLabel ?? 'Back'}
              </button>
            )}
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:focus:ring-blue-500"
              onClick={onSkip}
              aria-label="Skip tour"
            >
              {step.skipLabel ?? 'Skip'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:focus:ring-blue-500"
              onClick={onClose}
              aria-label="Close tour"
            >
              {step.closeLabel ?? 'Close'}
            </button>
            <button
              type="button"
              data-primary
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-blue-500"
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

/**
 * Score placement options based on visible area and overflow
 * Rewards on-screen area and penalizes overflow
 * Now accounts for reserved header space at top of viewport
 *
 * @param pos - The position to score {left, top}
 * @param w - Width of the tooltip
 * @param h - Height of the tooltip
 * @param vpW - Viewport width
 * @param vpH - Effective viewport height (after reserved space)
 * @param reservedTop - Reserved space at top (e.g., header height)
 */
function scorePlacement(
  pos: { left: number; top: number },
  w: number,
  h: number,
  vpW: number,
  vpH: number,
  reservedTop = 0,
) {
  const right = pos.left + w;
  const bottom = pos.top + h;

  // Calculate visible width (left-right bounds)
  const visW = Math.max(0, Math.min(right, vpW) - Math.max(pos.left, 0));

  // Calculate visible height accounting for reserved top space
  const effectiveTop = Math.max(pos.top, reservedTop);
  const effectiveBottom = Math.min(bottom, reservedTop + vpH);
  const visH = Math.max(0, effectiveBottom - effectiveTop);

  const visibleArea = visW * visH;
  const overflow = w * h - visibleArea;

  // Penalize overflow more heavily (2x) to prefer fully visible positions
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
