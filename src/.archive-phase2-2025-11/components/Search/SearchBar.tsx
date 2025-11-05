import { Search, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useNavigation } from '@/context/NavContext';

interface SearchBarProps {
  onSearch: (_query: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isSearching = false,
  placeholder = 'Search scenes, characters, plot notes...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const _navigation = useNavigation();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={`search-bar ${className}`}>
      <div className="search-input-container">
        <Search className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          disabled={isSearching}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isSearching && (
        <div className="search-loading">
          <div className="search-spinner" />
        </div>
      )}
    </form>
  );
};
