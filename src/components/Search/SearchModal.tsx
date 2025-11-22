// src/components/Search/SearchModal.tsx
import { Search, X, Clock } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/workers/searchWorker';

import { SearchResults } from './SearchResults';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'inkwell_recent_searches';
const MAX_RECENT_SEARCHES = 10;

// Helper functions for recent searches
const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  if (!query.trim()) return;

  const recent = getRecentSearches();
  const filtered = recent.filter((q) => q.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save recent search:', error);
  }
};

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { state, setCurrentProjectId, setView } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentProjectOnly, setCurrentProjectOnly] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: allResults, isLoading } = useSearch(query, {
    debounceDelay: 300,
    minLength: 3,
  });

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId);

  // Filter results to current project if toggle is on
  const results =
    currentProjectOnly && state.currentProjectId
      ? allResults.filter((result) => result.projectId === state.currentProjectId)
      : allResults;

  // Focus input when modal opens and load recent searches
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(-1);
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      // Save to recent searches
      if (query) {
        saveRecentSearch(query);
      }

      // Navigate to the project
      setCurrentProjectId(result.projectId);
      setView(View.Writing);

      // Close the search modal
      onClose();
    },
    [onClose, setCurrentProjectId, setView, query],
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

          {/* Filter Toggle */}
          {currentProject && (
            <div className="px-4 py-2 border-b border-inkwell-panel/30 dark:border-inkwell-dark-elevated bg-inkwell-parchment/30 dark:bg-inkwell-dark-bg/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentProjectOnly}
                  onChange={(e) => setCurrentProjectOnly(e.target.checked)}
                  className="rounded border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-gold dark:text-inkwell-gold-light focus:ring-inkwell-gold dark:focus:ring-inkwell-gold-light"
                />
                <span className="text-sm text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                  Search only in <span className="font-medium">{currentProject.name}</span>
                </span>
              </label>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!query && recentSearches.length > 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-inkwell-ink/40 dark:text-inkwell-dark-muted" />
                    <h3 className="text-body-sm font-medium text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                      Recent Searches
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem(RECENT_SEARCHES_KEY);
                      setRecentSearches([]);
                    }}
                    className="text-caption text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        'text-body-sm text-inkwell-ink dark:text-inkwell-dark-text',
                        'hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated',
                      )}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <SearchResults
                results={results}
                isLoading={isLoading}
                query={query}
                selectedIndex={selectedIndex}
                onResultClick={handleResultClick}
              />
            )}
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
