import { useEffect, useRef } from 'react';

import { trapFocus, restoreFocus, announceLive } from './a11y';
import { SpotlightPortal } from './portal';
import SpotlightMask from './SpotlightMask';
import SpotlightTooltip from './SpotlightTooltip';
import { useSpotlightUI } from './useSpotlightUI';

/**
 * SpotlightOverlay
 *
 * Main orchestrator for the Spotlight Tour UI.
 * - Subscribes to TourService state via useSpotlightUI
 * - Resolves the current target element via data-tour-id
 * - Renders the mask and tooltip overlay
 * - Handles keyboard navigation (←/→/Esc)
 * - Manages focus trap and screen reader announcements
 *
 * Mount once near the app root, after all contexts are available.
 */
export default function SpotlightOverlay() {
  const portalRef = useRef<HTMLElement | null>(null);
  const { isActive, currentStep, index, total, anchorRect, placement, next, prev, skip, close } =
    useSpotlightUI();

  // Establish portal root on mount
  useEffect(() => {
    const root = document.getElementById('spotlight-root');
    if (root) portalRef.current = root;
  }, []);

  // Focus trap and screen reader announcements
  useEffect(() => {
    if (!isActive || !currentStep) {
      restoreFocus();
      return;
    }

    const root = document.getElementById('spotlight-root');
    if (!root) return;

    const cleanup = trapFocus(root);
    announceLive(`Starting tour. Step ${index + 1} of ${total}. ${currentStep.title}`);

    return () => {
      cleanup();
      restoreFocus();
    };
  }, [isActive, currentStep, index, total]);

  // Announce step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;
    announceLive(`Step ${index + 1} of ${total}. ${currentStep.title}`);
  }, [isActive, index, total, currentStep]);

  // Global keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const onKey = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (index > 0) prev();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, next, prev, close, index]);

  // Early return if tour is not active - this prevents rendering any overlay elements
  if (!isActive || !currentStep || !portalRef.current || !anchorRect) return null;

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
      className="fixed inset-0 z-[10000]"
      style={{ pointerEvents: 'none' }}
      data-tour-active="true"
    >
      <SpotlightMask anchorRect={anchorRect} padding={12} radius={14} opacity={0.5} />
      <SpotlightTooltip
        step={{
          ...currentStep,
          targetId: currentStep.selectors[0] || '',
        }}
        index={index}
        total={total}
        anchorRect={anchorRect}
        placement={placement}
        onNext={next}
        onPrev={prev}
        onSkip={skip}
        onClose={close}
      />
    </div>
  );

  return <SpotlightPortal>{overlay}</SpotlightPortal>;
}
