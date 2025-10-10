// src/hooks/useSmartSearch.ts
import { useState, useCallback, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';

import { SmartSearchResult } from '../services/smartSearchService';

interface UseSmartSearchOptions {
  onNavigate?: (result: SmartSearchResult) => void;
  defaultQuery?: string;
  focusMode?: 'research' | 'writing' | 'editing' | 'analysis';
}

export const useSmartSearch = (options: UseSmartSearchOptions = {}) => {
  const { onNavigate, defaultQuery = '', focusMode } = options;
  const { currentProject } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);

  // Open search modal
  const openSearch = useCallback((initialQuery?: string, _mode?: typeof focusMode) => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
    setIsOpen(true);
  }, []);

  // Close search modal
  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle navigation from search results
  const handleNavigate = useCallback(
    (result: SmartSearchResult) => {
      if (onNavigate) {
        onNavigate(result);
      } else {
        // Default navigation behavior
        console.log('Navigate to:', result);

        // You can implement default navigation logic here
        // For example, routing to different views based on result type
        switch (result.type) {
          case 'scene':
            // Navigate to scene editor
            break;
          case 'chapter':
            // Navigate to chapter view
            break;
          case 'character':
            // Navigate to character profile
            break;
          case 'plot':
            // Navigate to plot notes
            break;
        }
      }

      closeSearch();
    },
    [onNavigate, closeSearch],
  );

  // Reset query when project changes
  useEffect(() => {
    setQuery(defaultQuery);
  }, [currentProject?.id, defaultQuery]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+Shift+F or Ctrl+Shift+F to open search
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'f') {
        event.preventDefault();
        openSearch();
        return;
      }

      // Cmd+K or Ctrl+K as alternative (if command palette doesn't handle it)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && !isOpen) {
        // Only handle if search isn't already open and no other modals are open
        const hasOpenModal = document.querySelector('[role="dialog"]');
        if (!hasOpenModal) {
          event.preventDefault();
          openSearch();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, isOpen]);

  return {
    // State
    isOpen,
    query,
    currentProject,

    // Actions
    openSearch,
    closeSearch,
    setQuery,
    handleNavigate,

    // Computed
    isAvailable: !!currentProject,

    // Options
    focusMode,
  };
};

export default useSmartSearch;
