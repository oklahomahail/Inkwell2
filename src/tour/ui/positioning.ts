import type { Viewport } from './geometry';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export function choosePlacement(
  anchorRect: DOMRect,
  vp: Viewport,
  preferred: TooltipPlacement = 'auto',
  estimatedTooltipSize: { w: number; h: number } = { w: 320, h: 160 },
  gap = 12,
): TooltipPlacement {
  if (preferred !== 'auto') return preferred;

  const fitsBottom = anchorRect.bottom + gap + estimatedTooltipSize.h <= vp.h;
  const fitsTop = anchorRect.top - gap - estimatedTooltipSize.h >= 0;
  const fitsRight = anchorRect.right + gap + estimatedTooltipSize.w <= vp.w;
  const fitsLeft = anchorRect.left - gap - estimatedTooltipSize.w >= 0;

  if (fitsBottom) return 'bottom';
  if (fitsTop) return 'top';
  if (fitsRight) return 'right';
  if (fitsLeft) return 'left';
  // Fallback to the direction with the most available space
  const spaces = {
    bottom: vp.h - anchorRect.bottom,
    top: anchorRect.top,
    right: vp.w - anchorRect.right,
    left: anchorRect.left,
  };
  const sorted = Object.entries(spaces).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as TooltipPlacement) || 'bottom';
}

export function computeTooltipCoords(
  placement: TooltipPlacement,
  anchorRect: DOMRect,
  tooltipSize: { w: number; h: number },
  vp: Viewport,
  gap = 12,
  margin = 8,
): { left: number; top: number } {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const centers = {
    horizontal: anchorRect.x + anchorRect.width / 2 - tooltipSize.w / 2,
    vertical: anchorRect.y + anchorRect.height / 2 - tooltipSize.h / 2,
  };

  switch (placement) {
    case 'top':
      return {
        left: clamp(centers.horizontal, margin, vp.w - tooltipSize.w - margin),
        top: clamp(anchorRect.y - gap - tooltipSize.h, margin, vp.h - tooltipSize.h - margin),
      };
    case 'bottom':
      return {
        left: clamp(centers.horizontal, margin, vp.w - tooltipSize.w - margin),
        top: clamp(anchorRect.y + anchorRect.height + gap, margin, vp.h - tooltipSize.h - margin),
      };
    case 'left':
      return {
        left: clamp(anchorRect.x - gap - tooltipSize.w, margin, vp.w - tooltipSize.w - margin),
        top: clamp(centers.vertical, margin, vp.h - tooltipSize.h - margin),
      };
    case 'right':
      return {
        left: clamp(anchorRect.x + anchorRect.width + gap, margin, vp.w - tooltipSize.w - margin),
        top: clamp(centers.vertical, margin, vp.h - tooltipSize.h - margin),
      };
    default:
      // Should be resolved before calling, but fall back to bottom
      return {
        left: clamp(centers.horizontal, margin, vp.w - tooltipSize.w - margin),
        top: clamp(anchorRect.y + anchorRect.height + gap, margin, vp.h - tooltipSize.h - margin),
      };
  }
}
