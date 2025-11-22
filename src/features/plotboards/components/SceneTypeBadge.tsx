// src/features/plotboards/components/SceneTypeBadge.tsx
import React from 'react';

import type { SceneType } from '@/types/ai';

const sceneTypeStyles: Record<
  SceneType,
  { bg: string; text: string; label: string; emoji: string }
> = {
  conflict: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Conflict',
    emoji: '⚔️',
  },
  reveal: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    label: 'Reveal',
    emoji: '💡',
  },
  transition: {
    bg: 'bg-slate-100 dark:bg-slate-700/30',
    text: 'text-slate-700 dark:text-slate-400',
    label: 'Transition',
    emoji: '🔀',
  },
  action: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Action',
    emoji: '⚡',
  },
  emotional: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-400',
    label: 'Emotional',
    emoji: '❤️',
  },
  setup: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Setup',
    emoji: '🎬',
  },
  resolution: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Resolution',
    emoji: '✅',
  },
};

interface SceneTypeBadgeProps {
  type: SceneType;
  confidence?: number;
  showEmoji?: boolean;
  size?: 'sm' | 'md';
}

export const SceneTypeBadge: React.FC<SceneTypeBadgeProps> = ({
  type,
  confidence,
  showEmoji = false,
  size = 'sm',
}) => {
  const style = sceneTypeStyles[type];

  if (!style) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[0.65rem]',
    md: 'px-2.5 py-1 text-xs',
  };

  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : null;
  const title = confidencePercent
    ? `Scene type: ${style.label}, confidence: ${confidencePercent}%`
    : `Scene type: ${style.label}`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses[size]}`}
      title={title}
    >
      {showEmoji && <span className="text-[0.7em]">{style.emoji}</span>}
      <span>{style.label}</span>
      {confidencePercent !== null && confidencePercent < 70 && (
        <span className="opacity-60">({confidencePercent}%)</span>
      )}
    </span>
  );
};
