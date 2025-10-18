import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

type Rect = { top: number; left: number; width: number; height: number };

interface TourOverlayProps {
  isActive: boolean;
  targetEl: HTMLElement | null; // resolved from selector fallbacks
  title: string;
  content: string;
  actions?: Array<{ label: string; onClick: () => void }>;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
  highlightPulse?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export default function InkwellTourOverlay(props: TourOverlayProps) {
  const {
    isActive,
    targetEl,
    title,
    content,
    actions,
    onNext,
    onPrev,
    onClose,
    stepIndex,
    totalSteps,
    highlightPulse,
    placement = 'bottom',
  } = props;

  const portalRoot = document.body;
  const focusRef = useRef<HTMLButtonElement>(null);

  // Compute bounding rect for spotlight mask
  const rect: Rect | null = useMemo(() => {
    if (!targetEl) return null;
    const r = targetEl.getBoundingClientRect();
    return {
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
    };
  }, [targetEl]);

  // Compute popover position based on placement and viewport constraints
  const popoverStyle = useMemo(() => {
    if (!rect) {
      // Center fallback when no target
      return {
        top: window.scrollY + 120,
        left: Math.max(24, (window.innerWidth - 448) / 2),
      };
    }

    const gap = 16;
    const popoverWidth = 448; // max-w-md
    const popoverHeight = 240; // estimate

    let top = rect.top;
    let left = rect.left;

    switch (placement) {
      case 'bottom':
        top = rect.top + rect.height + gap;
        break;
      case 'top':
        top = rect.top - popoverHeight - gap;
        break;
      case 'left':
        left = rect.left - popoverWidth - gap;
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        break;
      case 'right':
        left = rect.left + rect.width + gap;
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        break;
      case 'center':
        top = window.scrollY + (window.innerHeight - popoverHeight) / 2;
        left = (window.innerWidth - popoverWidth) / 2;
        break;
    }

    // Clamp within viewport bounds (mobile-friendly)
    const maxLeft = window.innerWidth - popoverWidth - 24;
    const maxTop = window.scrollY + window.innerHeight - popoverHeight - 24;

    return {
      top: Math.max(window.scrollY + 24, Math.min(top, maxTop)),
      left: Math.max(24, Math.min(left, maxLeft)),
    };
  }, [rect, placement]);

  useEffect(() => {
    if (!isActive) return;

    // Scroll target into view smoothly (handle scroll containers)
    if (targetEl) {
      // Check if target is in a scrollable container
      let scrollParent = targetEl.parentElement;
      while (scrollParent && scrollParent !== document.body) {
        const overflowY = window.getComputedStyle(scrollParent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          scrollParent.scrollTo({
            top: targetEl.offsetTop - scrollParent.offsetTop - scrollParent.clientHeight / 2,
            behavior: 'smooth',
          });
          break;
        }
        scrollParent = scrollParent.parentElement;
      }

      // Also scroll window if needed
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Focus the primary button for a11y
    const t = setTimeout(() => focusRef.current?.focus(), 50);

    // ESC to close, arrows to navigate
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowRight' && stepIndex < totalSteps - 1) {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isActive, targetEl, onNext, onPrev, onClose, stepIndex, totalSteps]);

  if (!isActive) return null;

  // Compute spotlight radius (responsive to target size)
  const spotlightRadius = rect ? Math.max(rect.width, rect.height) / 2 + 12 : 0;
  const spotlightCenterX = rect ? rect.left + rect.width / 2 : 0;
  const spotlightCenterY = rect ? rect.top + rect.height / 2 : 0;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[1000] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Spotlight mask (hole) */}
      {rect && (
        <div
          aria-hidden
          className="fixed z-[1001] pointer-events-none transition-all duration-300"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Mask with a hole where the target is
            WebkitMaskImage: `radial-gradient(circle at ${spotlightCenterX}px ${spotlightCenterY}px, transparent 0, transparent ${spotlightRadius}px, black ${spotlightRadius + 1}px)`,
            maskImage: `radial-gradient(circle at ${spotlightCenterX}px ${spotlightCenterY}px, transparent 0, transparent ${spotlightRadius}px, black ${spotlightRadius + 1}px)`,
            background: 'rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Pulse ring on target (optional) */}
      {rect && highlightPulse && (
        <div
          aria-hidden
          className="fixed z-[1002] rounded-2xl ring-2 ring-blue-400/80 animate-inkwell-pulse pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      {/* Popover */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="fixed z-[1003] max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-5 md:p-6 transition-all duration-300"
        style={popoverStyle}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Step {stepIndex + 1} of {totalSteps}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <h2 id="tour-title" className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{content}</p>

        {/* Actions + Navigation */}
        <div className="flex flex-wrap gap-2">
          {actions?.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-sm font-medium text-blue-700 dark:text-blue-200 transition-colors"
            >
              {a.label}
            </button>
          ))}
          {stepIndex < totalSteps - 1 ? (
            <button
              ref={focusRef}
              onClick={onNext}
              className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              ref={focusRef}
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Finish Tour
            </button>
          )}
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Helpful fallback when target is missing */}
        {!targetEl && (
          <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-800 dark:text-yellow-200">
            💡 Cannot find this element? Try opening the menu or navigating to the relevant section.
          </div>
        )}
      </div>
    </>,
    portalRoot,
  );
}
