// src/components/Search/SearchBar.tsx
import { Search as SearchIcon, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useNavigation } from '@/context/NavContext';

type FirstResult = { projectId: string; chapterId: string; sceneId: string };

export interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  className?: string;
  /** Pass the current first result if you want Enter to navigate to it */
  firstResult?: FirstResult | null;
  /** Navigate to firstResult on submit (defaults to true if firstResult provided) */
  navigateOnSubmit?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isSearching = false,
  placeholder = 'Search scenes, characters, plot notes...',
  className = '',
  firstResult = null,
  navigateOnSubmit,
}) => {
  const [query, setQuery] = useState('');
  const { navigateToView, navigateToScene } = useNavigation();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;

      onSearch(q);

      // If caller provided a firstResult, optionally jump to it.
      const shouldNavigate = navigateOnSubmit ?? Boolean(firstResult);
      if (shouldNavigate && firstResult) {
        navigateToView('writing');
        navigateToScene(firstResult.projectId, firstResult.chapterId, firstResult.sceneId);
      }
    },
    [query, onSearch, firstResult, navigateOnSubmit, navigateToScene, navigateToView],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={`search-bar ${className}`} role="search">
      <div className="search-input-container relative flex items-center">
        <SearchIcon className="search-icon absolute left-3 h-4 w-4 opacity-70" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input w-full pl-9 pr-8 py-2 rounded border outline-none"
          disabled={isSearching}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear absolute right-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching && (
        <div className="search-loading mt-2 text-sm opacity-70">
          <div className="search-spinner inline-block animate-spin mr-2">⏳</div>
          Searching…
        </div>
      )}
    </form>
  );
};

export default SearchBar;
