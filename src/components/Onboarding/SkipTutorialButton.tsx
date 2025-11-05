/**
 * Skip Tutorial Button
 *
 * Allows users to skip the welcome project tutorial and start fresh.
 * Deletes the welcome project and marks the tour as seen.
 */

import { useState } from 'react';

import { skipTutorial, getWelcomeProjectId } from '@/onboarding/welcomeProject';

interface SkipTutorialButtonProps {
  className?: string;
  onSkip?: () => void;
}

export function SkipTutorialButton({ className, onSkip }: SkipTutorialButtonProps) {
  const [isSkipping, setIsSkipping] = useState(false);
  const welcomeProjectId = getWelcomeProjectId();

  // Don't show if no welcome project exists
  if (!welcomeProjectId) {
    return null;
  }

  const handleSkip = async () => {
    if (isSkipping) return;

    const confirmed = window.confirm(
      'Are you sure you want to skip the tutorial? The welcome project will be deleted.',
    );

    if (!confirmed) return;

    try {
      setIsSkipping(true);
      await skipTutorial();
      onSkip?.();

      // Reload to refresh UI (project list, etc.)
      window.location.reload();
    } catch (error) {
      console.error('[SkipTutorialButton] Error skipping tutorial:', error);
      alert('Failed to skip tutorial. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSkip}
      disabled={isSkipping}
      className={`text-sm underline opacity-80 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      aria-label="Skip tutorial and delete welcome project"
    >
      {isSkipping ? 'Skipping...' : 'Skip Tutorial'}
    </button>
  );
}

export default SkipTutorialButton;
