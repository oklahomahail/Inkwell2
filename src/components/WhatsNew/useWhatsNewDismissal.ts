// src/components/WhatsNew/useWhatsNewDismissal.ts - Profile-specific dismissal state

import { useState, useEffect } from 'react';

import { useProfileContext } from '../../context/ProfileContext';

const WHATS_NEW_VERSION = '1.2.0'; // Update this when you want to show again

interface WhatsNewState {
  version: string;
  dismissedAt: string;
}

export function useWhatsNewDismissal() {
  const { activeProfile } = useProfileContext();
  const [isDismissed, setIsDismissed] = useState(false);

  // Generate storage key for current profile
  const getStorageKey = () => {
    if (!activeProfile) return 'whats_new_global';
    return `whats_new_${activeProfile.id}`;
  };

  // Load dismissal state on profile change
  useEffect(() => {
    if (!activeProfile) {
      setIsDismissed(true); // Don't show on profile picker
      return;
    }

    const storageKey = getStorageKey();

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const whatsNewState: WhatsNewState = JSON.parse(stored);

        // Check if current version has been dismissed
        const hasBeenDismissed = whatsNewState.version === WHATS_NEW_VERSION;
        setIsDismissed(hasBeenDismissed);
      } else {
        // Never dismissed for this profile
        setIsDismissed(false);
      }
    } catch (error) {
      console.warn("Failed to load What's New dismissal state:", error);
      setIsDismissed(false);
    }
  }, [activeProfile]);

  // Dismiss function
  const dismissWhatsNew = () => {
    if (!activeProfile) return;

    const storageKey = getStorageKey();
    const whatsNewState: WhatsNewState = {
      version: WHATS_NEW_VERSION,
      dismissedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(whatsNewState));
      setIsDismissed(true);
    } catch (error) {
      console.warn("Failed to save What's New dismissal state:", error);
    }
  };

  // Reset function (for testing or when showing new features)
  const resetWhatsNew = () => {
    if (!activeProfile) return;

    const storageKey = getStorageKey();
    try {
      localStorage.removeItem(storageKey);
      setIsDismissed(false);
    } catch (error) {
      console.warn("Failed to reset What's New state:", error);
    }
  };

  return {
    isDismissed,
    dismissWhatsNew,
    resetWhatsNew,
    currentVersion: WHATS_NEW_VERSION,
  };
}
