import { useEffect, useState } from 'react';

import { isStoragePersisted } from '@/utils/storage/persistence';
import { isLikelyPrivateMode } from '@/utils/storage/privateMode';

/**
 * Hook that warns users before leaving if they're in private mode or have unsaved changes
 * This helps prevent data loss in incognito/private windows
 */
export function usePrivateModeWarning(hasUnsavedChanges: boolean = false) {
  const [isPrivateOrNonPersistent, setIsPrivateOrNonPersistent] = useState(false);

  useEffect(() => {
    // Check if we're in a risky storage environment
    Promise.all([isLikelyPrivateMode(), isStoragePersisted()])
      .then(([privateMode, persisted]) => {
        setIsPrivateOrNonPersistent(privateMode || !persisted);
      })
      .catch((error) => {
        console.error('[usePrivateModeWarning] Failed to check storage status:', error);
      });
  }, []);

  useEffect(() => {
    // Only warn if we're in a risky environment AND there are unsaved changes
    if (!isPrivateOrNonPersistent && !hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers require returnValue to be set
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPrivateOrNonPersistent, hasUnsavedChanges]);

  return { isPrivateOrNonPersistent };
}

/**
 * Hook specifically for editor components that tracks if there are unsaved changes
 */
export function useEditorUnloadWarning(
  isDirty: boolean,
  lastSavedAt: Date | null,
  autoSaveEnabled: boolean = true,
) {
  const [hasRecentChanges, setHasRecentChanges] = useState(false);

  useEffect(() => {
    if (!isDirty || !lastSavedAt || !autoSaveEnabled) {
      setHasRecentChanges(false);
      return;
    }

    // Consider changes "recent" if they're less than 5 seconds old
    const timeSinceLastSave = Date.now() - lastSavedAt.getTime();
    setHasRecentChanges(timeSinceLastSave < 5000);
  }, [isDirty, lastSavedAt, autoSaveEnabled]);

  usePrivateModeWarning(hasRecentChanges);

  return { hasRecentChanges };
}
