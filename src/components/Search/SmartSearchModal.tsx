// src/components/Search/SmartSearchModal.tsx
import {
  Search,
  X,
  Filter,
  Star,
  Sparkles,
  BookOpen,
  User,
  Map,
  FileText,
  Edit3,
  Eye,
  Link,
  ArrowUpRight,
  Loader2,
  Settings,
  History,
  Bookmark,
  TrendingUp,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';

import { cn } from '../../lib/utils';
import {
  smartSearchService,
  SmartSearchResult,
  SearchSuggestion,
  SmartSearchOptions,
  SavedSearch,
} from '../../services/smartSearchService';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (_result: SmartSearchResult) => void;
  initialQuery?: string;
  focusMode?: 'research' | 'writing' | 'editing' | 'analysis';
}

type SearchView = 'search' | 'filters' | 'history' | 'saved';

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialQuery = '',
  focusMode,
}) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [queryTime, setQueryTime] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // UI state
  const [currentView, setCurrentView] = useState<SearchView>('search');
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [_showFilters, _setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SmartSearchOptions>({
    types: ['scene', 'chapter', 'character', 'plot'],
    maxResults: 20,
    minScore: 0.1,
    enableSemanticSearch: true,
    enableAdvancedQuery: true,
    ...(focusMode ? { userIntent: focusMode } : {}),
    projectId: currentProject?.id,
  });

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search service
  useEffect(() => {
    if (isOpen && currentProject?.id) {
      smartSearchService.initialize(currentProject.id);
    }
  }, [isOpen, currentProject?.id]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle query changes with debounce
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setSelectedResultIndex(-1);
      setSelectedSuggestionIndex(-1);

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce search
      debounceTimeoutRef.current = setTimeout(() => {
        if (newQuery.trim() || newQuery === '') {
          performSearch(newQuery, filters);
        }
      }, 300);
    },
    [filters],
  );

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, searchOptions: SmartSearchOptions) => {
      if (!currentProject?.id) return;

      setIsSearching(true);

      try {
        const searchResult = await smartSearchService.search(searchQuery, {
          ...searchOptions,
          projectId: currentProject.id,
          contextProject: currentProject as any, // TODO: Fix type conversion from Project to EnhancedProject
        });

        setResults(searchResult.results);
        setSuggestions(searchResult.suggestions);
        setTotalCount(searchResult.totalCount);
        setQueryTime(searchResult.queryTime);
        setHasMore(searchResult.hasMore);
      } catch (error) {
        console.error('Search failed:', error);
        showToast('Search failed. Please try again.', 'error');
        setResults([]);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [currentProject, showToast],
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<SmartSearchOptions>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      if (query.trim()) {
        performSearch(query, updatedFilters);
      }
    },
    [filters, query, performSearch],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.query);
      performSearch(suggestion.query, filters);
      setSelectedSuggestionIndex(-1);
    },
    [filters, performSearch],
  );

  // Handle result click
  const handleResultClick = useCallback(
    (result: SmartSearchResult) => {
      onNavigate?.(result);
      onClose();
    },
    [onNavigate, onClose],
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (suggestions.length > 0 && selectedSuggestionIndex < suggestions.length - 1) {
            setSelectedSuggestionIndex((prev) => prev + 1);
            setSelectedResultIndex(-1);
          } else if (results.length > 0 && selectedResultIndex < results.length - 1) {
            setSelectedResultIndex((prev) => prev + 1);
            setSelectedSuggestionIndex(-1);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (selectedResultIndex > 0) {
            setSelectedResultIndex((prev) => prev - 1);
          } else if (selectedSuggestionIndex > 0) {
            setSelectedSuggestionIndex((prev) => prev - 1);
          } else if (selectedResultIndex === 0) {
            setSelectedResultIndex(-1);
            setSelectedSuggestionIndex(suggestions.length - 1);
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          } else if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
            handleResultClick(results[selectedResultIndex]);
          } else if (query.trim()) {
            performSearch(query, filters);
          }
          break;

        case 'Tab':
          if (e.shiftKey) {
            e.preventDefault();
            setCurrentView((prev) => {
              const views: SearchView[] = ['search', 'filters', 'history', 'saved'];
              const currentIndex = views.indexOf(prev);
              return views[currentIndex > 0 ? currentIndex - 1 : views.length - 1] as SearchView;
            });
          } else {
            e.preventDefault();
            setCurrentView((prev) => {
              const views: SearchView[] = ['search', 'filters', 'history', 'saved'];
              const currentIndex = views.indexOf(prev);
              return views[(currentIndex + 1) % views.length] as SearchView;
            });
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    suggestions,
    results,
    selectedSuggestionIndex,
    selectedResultIndex,
    handleSuggestionClick,
    handleResultClick,
    query,
    filters,
    performSearch,
  ]);

  // Get search history
  const searchHistory = useMemo(() => {
    return smartSearchService.getSearchHistory();
  }, [currentView]);

  // Saved searches
  const savedSearches = useMemo(() => {
    return smartSearchService.getSavedSearches();
  }, [currentView]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={`Search your ${currentProject?.name || 'project'}...`}
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-500"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('search')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentView === 'search'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                Search
              </button>
              <button
                onClick={() => setCurrentView('filters')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentView === 'filters'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                <Filter className="w-3 h-3 mr-1 inline" />
                Filters
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentView === 'history'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                <History className="w-3 h-3 mr-1 inline" />
                History
              </button>
              <button
                onClick={() => setCurrentView('saved')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentView === 'saved'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                <Bookmark className="w-3 h-3 mr-1 inline" />
                Saved
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search View */}
            {currentView === 'search' && (
              <>
                {/* Query stats */}
                {(results.length > 0 || query.trim()) && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    {query.trim() ? (
                      <>
                        {totalCount} results for "{query}"
                        {queryTime > 0 && ` (${queryTime.toFixed(0)}ms)`}
                        {hasMore && ' • More results available'}
                      </>
                    ) : (
                      'Start typing to search...'
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Suggestions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={cn(
                            'px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-2',
                            selectedSuggestionIndex === index
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                          )}
                        >
                          {suggestion.type === 'correction' && '✨'}
                          {suggestion.type === 'semantic' && '🧠'}
                          {suggestion.type === 'completion' && '💡'}
                          {suggestion.type === 'related' && '🔗'}
                          {suggestion.query}
                          {suggestion.preview && (
                            <span className="text-xs opacity-75">• {suggestion.preview}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                <div ref={resultsRef} className="flex-1 overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {results.map((result, index) => (
                        <SearchResultCard
                          key={result.id}
                          result={result}
                          isSelected={selectedResultIndex === index}
                          onClick={() => handleResultClick(result)}
                          onQuickAction={handleQuickAction}
                        />
                      ))}
                    </div>
                  ) : query.trim() && !isSearching ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No results found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Search your project
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Find scenes, characters, plot notes, and more
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• Use quotes for exact phrases: "dark forest"</p>
                          <p>• Use + for required terms: magic +wizard</p>
                          <p>• Use - to exclude terms: character -villain</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Filters View */}
            {currentView === 'filters' && (
              <SearchFiltersPanel filters={filters} onFiltersChange={handleFilterChange} />
            )}

            {/* History View */}
            {currentView === 'history' && (
              <SearchHistoryPanel
                searchHistory={searchHistory}
                onQuerySelect={(query) => {
                  setQuery(query);
                  setCurrentView('search');
                  performSearch(query, filters);
                }}
              />
            )}

            {/* Saved View */}
            {currentView === 'saved' && (
              <SavedSearchesPanel
                savedSearches={savedSearches}
                onSearchSelect={(saved) => {
                  setQuery(saved.query);
                  setFilters({ ...filters, ...saved.options });
                  setCurrentView('search');
                  performSearch(saved.query, { ...filters, ...saved.options });
                }}
                onSaveCurrentSearch={() => {
                  if (query.trim()) {
                    const name = prompt('Save this search as:');
                    if (name) {
                      smartSearchService.saveSearch(name, query, filters);
                      showToast('Search saved successfully', 'success');
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Use ↑↓ to navigate, Enter to select, Tab to switch views</span>
            {filters.enableSemanticSearch && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI-powered search enabled
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'search' && query.trim() && (
              <button
                onClick={() => {
                  const name = prompt('Save this search as:');
                  if (name) {
                    smartSearchService.saveSearch(name, query, filters);
                    showToast('Search saved successfully', 'success');
                  }
                }}
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Star className="w-3 h-3" />
              </button>
            )}
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Result Card Component
interface SearchResultCardProps {
  result: SmartSearchResult;
  isSelected: boolean;
  onClick: () => void;
  onQuickAction: (action: () => void) => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  isSelected,
  onClick,
  onQuickAction,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scene':
        return <FileText className="w-4 h-4" />;
      case 'chapter':
        return <BookOpen className="w-4 h-4" />;
      case 'character':
        return <User className="w-4 h-4" />;
      case 'plot':
        return <Map className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border transition-all cursor-pointer group',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1 rounded',
              result.type === 'scene' &&
                'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
              result.type === 'chapter' &&
                'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
              result.type === 'character' &&
                'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
              result.type === 'plot' &&
                'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
            )}
          >
            {getTypeIcon(result.type)}
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">{result.title}</h3>
          {result.relevanceScore && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
              {Math.round(result.relevanceScore * 100)}% match
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {result.quickActions?.slice(0, 2).map((action) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(action.action);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title={action.label}
            >
              {action.icon === '✏️' && <Edit3 className="w-3 h-3" />}
              {action.icon === '👁️' && <Eye className="w-3 h-3" />}
              {action.icon === '🔗' && <Link className="w-3 h-3" />}
            </button>
          ))}
          <ArrowUpRight className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {result.contextSnippet && <span className="mr-2">{result.contextSnippet}</span>}
        {result.navigationPath}
      </div>

      <div
        className="text-sm text-gray-700 dark:text-gray-300"
        dangerouslySetInnerHTML={{
          __html: result.highlightedExcerpt || result.excerpt,
        }}
      />

      {result.suggestedActions && result.suggestedActions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {result.suggestedActions.slice(0, 2).map((action) => (
            <button
              key={action.id}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Search Filters Panel
interface SearchFiltersPanelProps {
  filters: SmartSearchOptions;
  onFiltersChange: (filters: Partial<SmartSearchOptions>) => void;
}

const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({ filters, onFiltersChange }) => {
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Search Filters
      </h2>

      {/* Content Types */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Types</h3>
        <div className="space-y-2">
          {[
            { value: 'scene', label: 'Scenes', icon: FileText },
            { value: 'chapter', label: 'Chapters', icon: BookOpen },
            { value: 'character', label: 'Characters', icon: User },
            { value: 'plot', label: 'Plot Notes', icon: Map },
          ].map((type) => (
            <label key={type.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.types?.includes(type.value as any) || false}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...(filters.types || []), type.value]
                    : (filters.types || []).filter((t) => t !== type.value);
                  onFiltersChange({ types: newTypes as any });
                }}
                className="rounded"
              />
              <type.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Search Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Settings
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.enableSemanticSearch || false}
              onChange={(e) => onFiltersChange({ enableSemanticSearch: e.target.checked })}
              className="rounded"
            />
            <Sparkles className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              AI-powered semantic search
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.enableAdvancedQuery || false}
              onChange={(e) => onFiltersChange({ enableAdvancedQuery: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Advanced query operators (+, -, "quotes")
            </span>
          </label>
        </div>
      </div>

      {/* Result Limits */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Result Limits</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Maximum results: {filters.maxResults || 20}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={filters.maxResults || 20}
              onChange={(e) => onFiltersChange({ maxResults: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Minimum relevance: {Math.round((filters.minScore || 0.1) * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={filters.minScore || 0.1}
              onChange={(e) => onFiltersChange({ minScore: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* User Intent */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Intent</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: undefined, label: 'General' },
            { value: 'research', label: 'Research' },
            { value: 'writing', label: 'Writing' },
            { value: 'editing', label: 'Editing' },
            { value: 'analysis', label: 'Analysis' },
          ].map((intent) => (
            <button
              key={intent.label}
              onClick={() => onFiltersChange({ userIntent: intent.value as any })}
              className={cn(
                'p-2 text-sm rounded border transition-colors',
                filters.userIntent === intent.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
              )}
            >
              {intent.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Search History Panel
interface SearchHistoryPanelProps {
  searchHistory: any;
  onQuerySelect: (query: string) => void;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  searchHistory,
  onQuerySelect,
}) => {
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <History className="w-5 h-5" />
        Search History
      </h2>

      {/* Recent Searches */}
      {searchHistory.recentSearches.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent</h3>
          <div className="space-y-2">
            {searchHistory.recentSearches.slice(0, 10).map((query: any) => (
              <button
                key={query.id}
                onClick={() => onQuerySelect(query.raw)}
                className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white">{query.raw}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(query.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {query.resultCount !== undefined && (
                  <span className="text-xs text-gray-500">{query.resultCount} results</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Terms */}
      {searchHistory.popularTerms.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Popular Terms
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.popularTerms.slice(0, 20).map((term: any) => (
              <button
                key={term.term}
                onClick={() => onQuerySelect(term.term)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {term.term} ({term.count})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Saved Searches Panel
interface SavedSearchesPanelProps {
  savedSearches: SavedSearch[];
  onSearchSelect: (saved: SavedSearch) => void;
  onSaveCurrentSearch: () => void;
}

const SavedSearchesPanel: React.FC<SavedSearchesPanelProps> = ({
  savedSearches,
  onSearchSelect,
  onSaveCurrentSearch,
}) => {
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Saved Searches
        </h2>
        <button
          onClick={onSaveCurrentSearch}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save Current
        </button>
      </div>

      {savedSearches.length > 0 ? (
        <div className="space-y-2">
          {savedSearches.map((saved) => (
            <button
              key={saved.id}
              onClick={() => onSearchSelect(saved)}
              className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white">{saved.name}</span>
                <span className="text-xs text-gray-500">
                  {saved.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">"{saved.query}"</div>
              {saved.resultCount && (
                <span className="text-xs text-gray-500">{saved.resultCount} results</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bookmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No saved searches yet</p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchModal;
