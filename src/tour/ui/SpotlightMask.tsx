import React from 'react';

type SpotlightMaskProps = {
  anchorRect: DOMRect;
  padding?: number;
  radius?: number;
  opacity?: number; // 0 to 1
  onClickBackdrop?: () => void;
};

export default function SpotlightMask({
  anchorRect,
  padding = 12,
  radius = 14,
  opacity = 0.5,
  onClickBackdrop,
}: SpotlightMaskProps) {
  // Compute the hole rectangle with padding
  const x = Math.max(anchorRect.x - padding, 0);
  const y = Math.max(anchorRect.y - padding, 0);
  const w = Math.min(anchorRect.width + padding * 2, window.innerWidth);
  const h = Math.min(anchorRect.height + padding * 2, window.innerHeight);

  // The mask uses even-odd fill rule. First path is the full-screen rect, second is the rounded "hole".
  return (
    <div
      className="fixed inset-0 z-tour-spotlight pointer-events-none"
      aria-hidden="true"
      onClick={onClickBackdrop}
    >
      <svg
        className="w-full h-full pointer-events-none"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        preserveAspectRatio="none"
      >
        <path
          d={`
            M0 0 H${window.innerWidth} V${window.innerHeight} H0 V0
            M${x} ${y + radius}
            a ${radius} ${radius} 0 0 1 ${radius} -${radius}
            H ${x + w - radius}
            a ${radius} ${radius} 0 0 1 ${radius} ${radius}
            V ${y + h - radius}
            a ${radius} ${radius} 0 0 1 -${radius} ${radius}
            H ${x + radius}
            a ${radius} ${radius} 0 0 1 -${radius} -${radius}
            Z
          `}
          fill={`rgba(0,0,0,${opacity})`}
          fillRule="evenodd"
        />
      </svg>

      {/* Focus ring highlight box for visual emphasis */}
      <div
        className="pointer-events-none fixed ring-2 ring-blue-500/70"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: radius,
          boxShadow: '0 0 0 4px rgba(59,130,246,0.25)',
        }}
      />
    </div>
  );
}
