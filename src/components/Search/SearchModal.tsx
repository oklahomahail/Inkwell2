// src/components/Search/SearchModal.tsx
import { Search, X } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/workers/searchWorker';

import { SearchResults } from './SearchResults';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { state } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading } = useSearch(query, {
    debounceDelay: 300,
    minLength: 3,
  });

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      // TODO: Navigate to the result
      // For now, we'll just close the modal and could add navigation logic
      // eslint-disable-next-line no-console
      console.log('Navigate to:', result);
      onClose();
    },
    [onClose],
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleResultClick]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div
          className={cn(
            'bg-white dark:bg-inkwell-dark-surface',
            'rounded-xl shadow-2xl',
            'w-full max-w-2xl max-h-[70vh]',
            'flex flex-col overflow-hidden',
            'border border-inkwell-panel/30 dark:border-inkwell-dark-elevated',
            'pointer-events-auto',
            'animate-in slide-in-from-top-4 duration-300',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-inkwell-panel/30 dark:border-inkwell-dark-elevated">
            <Search className="w-5 h-5 text-inkwell-ink/40 dark:text-inkwell-dark-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder={`Search ${currentProject?.name || 'your project'}...`}
              className={cn(
                'flex-1 bg-transparent border-none outline-none',
                'text-body text-inkwell-ink dark:text-inkwell-dark-text',
                'placeholder-inkwell-ink/40 dark:placeholder-inkwell-dark-muted',
              )}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  'text-inkwell-ink/40 dark:text-inkwell-dark-muted',
                  'hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated',
                  'hover:text-inkwell-ink dark:hover:text-inkwell-dark-text',
                )}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg transition-colors flex-shrink-0',
                'text-inkwell-ink/60 dark:text-inkwell-dark-muted',
                'hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated',
                'hover:text-inkwell-ink dark:hover:text-inkwell-dark-text',
              )}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            <SearchResults
              results={results}
              isLoading={isLoading}
              query={query}
              selectedIndex={selectedIndex}
              onResultClick={handleResultClick}
            />
          </div>

          {/* Footer */}
          <div
            className={cn(
              'px-4 py-3 border-t border-inkwell-panel/30 dark:border-inkwell-dark-elevated',
              'text-caption text-inkwell-ink/50 dark:text-inkwell-dark-muted/70',
              'flex items-center justify-between',
            )}
          >
            <div className="flex items-center gap-4">
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
            </div>
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </>
  );
};
