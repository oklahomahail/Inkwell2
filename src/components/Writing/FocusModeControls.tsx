import { Focus, Timer, Target } from 'lucide-react';
import React from 'react';

import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';

interface FocusModeControlsProps {
  currentWordCount: number;
  className?: string;
}

export const FocusModeControls: React.FC<FocusModeControlsProps> = ({
  currentWordCount,
  className = '',
}) => {
  const { isFocusMode, enableFocusMode, settings, sprint, startSprint, formatTime } =
    useAdvancedFocusMode();

  if (isFocusMode) {
    return null; // Controls are handled by the focus mode overlay
  }

  return (
    <div className={`focus-mode-controls ${className}`}>
      <button
        onClick={enableFocusMode}
        className="focus-control-btn primary"
        title="Enter Focus Mode (F11)"
      >
        <Focus className="w-4 h-4" />
        Focus Mode
      </button>

      <div className="focus-controls-divider" />

      <button
        onClick={() => startSprint(currentWordCount)}
        className="focus-control-btn secondary"
        title="Start Writing Sprint (⌘⇧S)"
        disabled={sprint.isActive}
      >
        <Timer className="w-4 h-4" />
        {sprint.isActive ? `${formatTime(sprint.remainingTime)}` : 'Sprint'}
      </button>

      {sprint.isActive && (
        <div className="sprint-progress-mini">
          <Target className="w-4 h-4" />
          <span>
            {currentWordCount - sprint.wordsAtStart} / {sprint.target}
          </span>
        </div>
      )}
    </div>
  );
};
