// src/hooks/useFocusMode.ts - Clean, comprehensive focus mode hook
import { useState, useCallback, useEffect } from 'react';

interface FocusModeState {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  enableFocusMode: () => void;
  disableFocusMode: () => void;
}

export function useFocusMode(): FocusModeState {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const enableFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const disableFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle focus mode with F11 or Cmd/Ctrl + Shift + F
      if (
        event.key === 'F11' ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F')
      ) {
        event.preventDefault();
        toggleFocusMode();
      }

      // Exit focus mode with Escape
      if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        disableFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleFocusMode, disableFocusMode]);

  // Apply focus mode styles and behavior
  useEffect(() => {
    if (isFocusMode) {
      // Add focus mode class to body
      document.body.classList.add('focus-mode');

      // Prevent body scrolling in focus mode
      document.body.style.overflow = 'hidden';

      // Store original title and update it
      const originalTitle = document.title;
      document.title = `${originalTitle} - Focus Mode`;

      // Cleanup function
      return () => {
        document.body.classList.remove('focus-mode');
        document.body.style.overflow = '';
        document.title = originalTitle;
      };
    } else {
      // Ensure cleanup when focus mode is disabled
      document.body.classList.remove('focus-mode');
      document.body.style.overflow = '';
    }
  }, [isFocusMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('focus-mode');
      document.body.style.overflow = '';
    };
  }, []);

  return {
    isFocusMode,
    toggleFocusMode,
    enableFocusMode,
    disableFocusMode,
  };
}

// Export as default for convenience
export default useFocusMode;
