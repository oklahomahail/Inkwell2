// src/components/Search/SearchResults.tsx
import { FileText, Loader2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { SearchResult } from '@/workers/searchWorker';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  selectedIndex: number;
  onResultClick: (result: SearchResult, index: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  query,
  selectedIndex,
  onResultClick,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-inkwell-gold dark:text-inkwell-gold-light animate-spin mx-auto mb-3" />
          <p className="text-body-sm text-inkwell-ink/60 dark:text-inkwell-dark-muted">
            Searching...
          </p>
        </div>
      </div>
    );
  }

  // Empty query state
  if (!query.trim()) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <FileText className="w-12 h-12 text-inkwell-ink/20 dark:text-inkwell-dark-muted/30 mx-auto mb-4" />
          <h3 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text mb-2">
            Search your project
          </h3>
          <p className="text-body-sm text-inkwell-ink/60 dark:text-inkwell-dark-muted mb-4">
            Find scenes, chapters, characters, and more across your entire project
          </p>
          <div className="text-caption text-inkwell-ink/50 dark:text-inkwell-dark-muted/70 space-y-1">
            <p className="font-medium mb-2">Tips:</p>
            <p>• Type at least 3 characters to search</p>
            <p>• Use specific keywords for better results</p>
            <p>• Search indexes your project content automatically</p>
          </div>
        </div>
      </div>
    );
  }

  // No results state
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="w-12 h-12 text-inkwell-ink/20 dark:text-inkwell-dark-muted/30 mx-auto mb-4" />
          <h3 className="text-heading-sm font-serif text-inkwell-ink dark:text-inkwell-dark-text mb-2">
            No results found
          </h3>
          <p className="text-body-sm text-inkwell-ink/60 dark:text-inkwell-dark-muted">
            Try different keywords or check your spelling
          </p>
        </div>
      </div>
    );
  }

  // Results list
  return (
    <div className="space-y-2">
      <div className="px-4 py-2 text-caption text-inkwell-ink/60 dark:text-inkwell-dark-muted border-b border-inkwell-panel/30 dark:border-inkwell-dark-elevated">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>
      <div className="px-2 pb-2 space-y-1">
        {results.map((result, index) => (
          <SearchResultItem
            key={result.projectId}
            result={result}
            isSelected={selectedIndex === index}
            onClick={() => onResultClick(result, index)}
            query={query}
          />
        ))}
      </div>
    </div>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps & { query: string }> = ({
  result,
  isSelected,
  onClick,
  query,
}) => {
  // Helper function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="bg-inkwell-gold/30 dark:bg-inkwell-gold-light/30 text-inkwell-ink dark:text-inkwell-dark-text font-medium rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
      </>
    );
  };

  const getMatchTypeLabel = (type: SearchResult['matchType']) => {
    switch (type) {
      case 'name':
        return 'Title';
      case 'description':
        return 'Description';
      case 'genre':
        return 'Genre';
      case 'content':
        return 'Content';
      default:
        return 'Match';
    }
  };

  const getMatchTypeColor = (type: SearchResult['matchType']) => {
    switch (type) {
      case 'name':
        return 'bg-inkwell-gold/10 text-inkwell-gold dark:bg-inkwell-gold-light/10 dark:text-inkwell-gold-light border-inkwell-gold/20 dark:border-inkwell-gold-light/20';
      case 'description':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'genre':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'content':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-inkwell-panel/30 text-inkwell-ink dark:bg-inkwell-dark-elevated dark:text-inkwell-dark-text border-inkwell-panel dark:border-inkwell-dark-elevated';
    }
  };

  const relevancePercentage = Math.round((result.relevance / 100) * 100); // Normalize if needed

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-all duration-200',
        'border hover:shadow-md group',
        isSelected
          ? 'bg-inkwell-gold/10 dark:bg-inkwell-gold-light/10 border-inkwell-gold dark:border-inkwell-gold-light shadow-sm'
          : 'bg-white dark:bg-inkwell-dark-surface border-inkwell-panel/30 dark:border-inkwell-dark-elevated hover:border-inkwell-panel dark:hover:border-inkwell-dark-elevated/80',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-body font-medium text-inkwell-ink dark:text-inkwell-dark-text truncate mb-1">
            {result.projectName}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium border',
                getMatchTypeColor(result.matchType),
              )}
            >
              {getMatchTypeLabel(result.matchType)}
            </span>
            {relevancePercentage > 0 && (
              <span className="text-caption text-inkwell-ink/50 dark:text-inkwell-dark-muted/70">
                {relevancePercentage}% match
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isSelected
              ? 'bg-inkwell-gold/20 dark:bg-inkwell-gold-light/20'
              : 'bg-inkwell-panel/20 dark:bg-inkwell-dark-elevated/50 group-hover:bg-inkwell-panel/40 dark:group-hover:bg-inkwell-dark-elevated',
          )}
        >
          <FileText
            className={cn(
              'w-4 h-4',
              isSelected
                ? 'text-inkwell-gold dark:text-inkwell-gold-light'
                : 'text-inkwell-ink/40 dark:text-inkwell-dark-muted',
            )}
          />
        </div>
      </div>

      {result.snippet && (
        <p className="text-body-sm text-inkwell-ink/70 dark:text-inkwell-dark-muted line-clamp-2">
          {highlightText(result.snippet, query)}
        </p>
      )}
    </button>
  );
};
