// File: src/tour/components/Spotlight.tsx
// Tour spotlight overlay with portal and scroll lock

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { getIdealPlacement } from '../targets';

import type { TourPlacement } from '../types';

interface SpotlightProps {
  targetElement: HTMLElement | null;
  children?: React.ReactNode;
  placement?: TourPlacement;
  padding?: number;
  onClose?: () => void;
  isActive?: boolean;
}

export function Spotlight({
  targetElement,
  children,
  placement: preferredPlacement,
  padding = 4,
  onClose,
  isActive = true,
}: SpotlightProps) {
  const [container] = useState(() => {
    if (typeof document === 'undefined') return null;
    const div = document.createElement('div');
    div.id = 'tour-spotlight-root';
    return div;
  });

  useEffect(() => {
    if (!container) return;

    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  useEffect(() => {
    if (!isActive) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  if (!container || !targetElement || !isActive) return null;

  const rect = targetElement.getBoundingClientRect();
  const placement = getIdealPlacement(targetElement, preferredPlacement);
  const boxShadow = `0 0 0 9999px rgba(0, 0, 0, 0.75)`;

  const spotlight = {
    position: 'fixed' as const,
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    borderRadius: '4px',
    boxShadow,
    pointerEvents: 'none' as const,
    transition: 'all 200ms ease-in-out',
    zIndex: 100000,
  };

  const contentStyle = {
    position: 'absolute' as const,
    zIndex: 100001,
    ...getContentPosition(placement, rect, padding),
  };

  return createPortal(
    <div
      className="fixed inset-0 z-tour-backdrop flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div style={spotlight} />
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    container,
  );
}

function getContentPosition(placement: TourPlacement, rect: DOMRect, padding: number) {
  const gap = 12;
  const base = {
    top: rect.top + padding,
    left: rect.left + padding,
    width: 300,
  };

  switch (placement) {
    case 'top':
      return {
        ...base,
        top: rect.top - gap,
        transform: 'translateY(-100%)',
      };
    case 'bottom':
      return {
        ...base,
        top: rect.bottom + gap,
      };
    case 'left':
      return {
        ...base,
        left: rect.left - gap - 300,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        ...base,
        left: rect.right + gap,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
  }
}
