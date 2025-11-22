// src/hooks/useSearch.ts
import { useState, useEffect, useCallback } from 'react';

import { SearchService } from '@/services/searchService';
import type { SearchResult } from '@/workers/searchWorker';

import { useDebounce } from './useDebounce';

export interface UseSearchOptions {
  /** Debounce delay in ms (default: 300) */
  debounceDelay?: number;
  /** Minimum query length to trigger search (default: 2) */
  minLength?: number;
}

export interface UseSearchReturn {
  /** Current search results */
  results: SearchResult[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Perform immediate search (bypasses debounce) */
  search: (query: string) => Promise<void>;
  /** Clear results */
  clear: () => void;
}

/**
 * Hook for performing full-text search with debouncing
 *
 * @param query - Search query string
 * @param options - Search options
 * @returns Search state and controls
 *
 * @example
 * ```tsx
 * const { results, isLoading } = useSearch(searchQuery);
 * ```
 */
export function useSearch(query: string, options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceDelay = 300, minLength = 2 } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceDelay);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Clear results if query is too short
      if (searchQuery.length < minLength) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await SearchService.search(searchQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minLength],
  );

  // Automatic search on debounced query change
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    results,
    isLoading,
    error,
    search: performSearch,
    clear,
  };
}
