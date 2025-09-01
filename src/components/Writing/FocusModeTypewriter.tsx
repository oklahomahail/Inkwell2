// src/components/Writing/FocusModeTypewriter.tsx (top ~100 lines fixed)
import React, { useEffect, useRef, useState } from 'react';
import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';

interface TypewriterModeProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

/**
 * Typewriter Mode Component - Implements caret-centered scrolling with paragraph dimming
 *
 * Key features:
 * - Keeps the active line centered in the viewport
 * - Dims non-active paragraphs for focus
 * - Smooth scrolling that follows the cursor
 * - Never obscures the caret or selection
 */
export const TypewriterMode: React.FC<TypewriterModeProps> = ({
  children,
  isActive,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeParagraph, setActiveParagraph] = useState<HTMLElement | null>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);

  // Optional hook usage (kept in case you wire additional behaviors)
  useAdvancedFocusMode?.();

  // Tags we consider as "paragraph-like" blocks for focusing
  const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

  const getBlockAncestor = (node: Node | null): HTMLElement | null => {
    let cur: Node | null = node;
    while (cur) {
      if (cur.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((cur as Element).tagName)) {
        return cur as HTMLElement;
      }
      cur = cur.parentNode;
    }
    return null;
  };

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    let rafId = 0;
    let lastCaretY: number | null = null;

    const handleCaretChange = () => {
      const root = containerRef.current;
      if (!root) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      // Ignore if selection is outside our container
      if (!root.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      const paragraphEl = getBlockAncestor(sel.anchorNode);

      // Update active paragraph class (for dimming via CSS)
      if (paragraphEl && paragraphEl !== activeParagraph) {
        setActiveParagraph(paragraphEl);
      }

      // Center the viewport on the caret if it moved significantly (~50px)
      const caretY = rect.top + window.scrollY;
      if (lastCaretY === null || Math.abs(caretY - lastCaretY) > 50) {
        lastCaretY = caretY;
        const viewportH = window.innerHeight;
        const targetY = Math.max(0, caretY - viewportH / 2);

        window.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      }
    };

    const scheduleCaretCheck = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleCaretChange);
    };

    // Event listeners for caret/selection movement
    document.addEventListener('selectionchange', scheduleCaretCheck);
    document.addEventListener('keyup', scheduleCaretCheck);
    document.addEventListener('click', scheduleCaretCheck);

    // Initial check
    scheduleCaretCheck();

    return () => {
      document.removeEventListener('selectionchange', scheduleCaretCheck);
      document.removeEventListener('keyup', scheduleCaretCheck);
      document.removeEventListener('click', scheduleCaretCheck);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isActive, activeParagraph]);

  // Reflect active paragraph with a CSS class for dimming
  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev && prev !== activeParagraph) {
      prev.classList.remove('tw-active');
    }
    if (activeParagraph) {
      activeParagraph.classList.add('tw-active');
    }
    prevActiveRef.current = activeParagraph ?? null;
  }, [activeParagraph]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
