// src/hooks/useFocusMode.ts
import { useEffect, useState } from 'react';

export const useFocusMode = () => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle focus mode with F11 or Cmd/Ctrl + Shift + F
      if (
        event.key === 'F11' ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F')
      ) {
        event.preventDefault();
        setIsFocusMode(prev => !prev);
      }

      // Exit focus mode with Escape
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  useEffect(() => {
    // Add/remove body class for global focus mode styles
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
      // Prevent scrolling on the body when in focus mode
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('focus-mode');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('focus-mode');
      document.body.style.overflow = '';
    };
  }, [isFocusMode]);

  return {
    isFocusMode,
    setIsFocusMode,
    toggleFocusMode: () => setIsFocusMode(prev => !prev),
  };
};