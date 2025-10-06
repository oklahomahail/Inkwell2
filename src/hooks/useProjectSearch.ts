// src/hooks/useProjectSearch.ts
import { useMemo, useState } from 'react';

import { Project } from '../domain/types';

import { useProjectMetadata } from './useProjectMetadata';

export interface SearchFilters {
  query: string;
  tags: string[];
  genres: string[];
  favorites: boolean;
  sortBy: 'name' | 'updated' | 'created' | 'wordCount' | 'lastOpened' | 'timeSpent';
  sortOrder: 'asc' | 'desc';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchResult {
  project: Project;
  relevanceScore: number;
  matchedFields: string[];
}

const defaultFilters: SearchFilters = {
  query: '',
  tags: [],
  genres: [],
  favorites: false,
  sortBy: 'updated',
  sortOrder: 'desc',
};

// Fuzzy matching algorithm - simple but effective
const fuzzyMatch = (
  query: string,
  text: string,
  threshold = 0.6,
): { score: number; matched: boolean } => {
  if (!query || !text) return { score: 0, matched: false };

  const normalizedQuery = query.toLowerCase();
  const normalizedText = text.toLowerCase();

  // Exact match gets highest score
  if (normalizedText.includes(normalizedQuery)) {
    const exactMatchScore = normalizedQuery.length / normalizedText.length;
    return { score: Math.max(0.8, exactMatchScore), matched: true };
  }

  // Character-by-character fuzzy matching
  let queryIndex = 0;
  let textIndex = 0;
  let matches = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  while (queryIndex < normalizedQuery.length && textIndex < normalizedText.length) {
    if (normalizedQuery[queryIndex] === normalizedText[textIndex]) {
      matches++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
    textIndex++;
  }

  // Calculate score based on matches and consecutive matches
  const matchRatio = matches / normalizedQuery.length;
  const consecutiveBonus = (maxConsecutive / normalizedQuery.length) * 0.5;
  const score = matchRatio + consecutiveBonus;

  return { score, matched: score >= threshold };
};

// Extract searchable text from project
const getProjectSearchText = (project: Project): { [field: string]: string } => {
  const wordCount = project.metadata?.totalWordCount || 0;

  return {
    name: project.name || '',
    description: project.description || '',
    content:
      project.chapters?.map((c) => c.scenes?.map((s) => s.content).join(' ')).join(' ') || '',
    genre: project.metadata?.genre || '',
    chapters: project.chapters?.map((c) => c.title).join(' ') || '',
    characters: project.characters?.map((c) => `${c.name} ${c.role}`).join(' ') || '',
    wordCountText: wordCount.toString(),
  };
};

export const useProjectSearch = (projects: Project[]) => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const {
    getProjectMetadata,
    getAllTags,
    getFavoriteProjectIds: _getFavoriteProjectIds,
    getProjectIdsByTag: _getProjectIdsByTag,
  } = useProjectMetadata();

  // Get all available options for filters
  const filterOptions = useMemo(() => {
    const genres = new Set<string>();
    const allTags = new Set(getAllTags());

    projects.forEach((project) => {
      const genre = project.metadata?.genre;
      if (genre) genres.add(genre);

      // Add tags from metadata
      const metadata = getProjectMetadata(project.id);
      metadata.tags.forEach((tag) => allTags.add(tag));
    });

    return {
      genres: Array.from(genres).sort(),
      tags: Array.from(allTags).sort(),
    };
  }, [projects, getAllTags, getProjectMetadata]);

  // Perform search with current filters
  const searchResults = useMemo((): SearchResult[] => {
    let results = projects
      .map((project) => {
        const metadata = getProjectMetadata(project.id);
        const searchText = getProjectSearchText(project);

        let relevanceScore = 0;
        const matchedFields: string[] = [];

        // Text search
        if (filters.query) {
          const query = filters.query.trim();
          if (query) {
            // Search in different fields with different weights
            const fieldWeights = {
              name: 3,
              description: 2,
              content: 1,
              genre: 2,
              chapters: 1.5,
              characters: 1.5,
            };

            let hasTextMatch = false;

            Object.entries(fieldWeights).forEach(([field, weight]) => {
              const text = searchText[field];
              if (text) {
                const { score, matched } = fuzzyMatch(query, text);
                if (matched) {
                  relevanceScore += score * weight;
                  matchedFields.push(field);
                  hasTextMatch = true;
                }
              }
            });

            // Also search in tags
            metadata.tags.forEach((tag) => {
              const { score, matched } = fuzzyMatch(query, tag);
              if (matched) {
                relevanceScore += score * 2; // Tags get high weight
                matchedFields.push('tags');
                hasTextMatch = true;
              }
            });

            // If no text match, exclude from results
            if (!hasTextMatch) {
              return null;
            }
          }
        } else {
          // No query, base relevance on recency
          relevanceScore =
            metadata.lastOpened > 0
              ? (metadata.lastOpened / Date.now()) * 10
              : (project.updatedAt.getTime() / Date.now()) * 10;
        }

        return {
          project,
          metadata,
          relevanceScore,
          matchedFields,
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);

    // Apply filters
    results = results.filter((result) => {
      const { project, metadata } = result;

      // Filter by favorites
      if (filters.favorites && !metadata.isFavorite) {
        return false;
      }

      // Filter by tags
      if (filters.tags.length > 0) {
        const hasRequiredTags = filters.tags.every((tag) =>
          metadata.tags.includes(tag.toLowerCase()),
        );
        if (!hasRequiredTags) {
          return false;
        }
      }

      // Filter by genres
      if (filters.genres.length > 0) {
        const projectGenre = project.metadata?.genre;
        if (!projectGenre || !filters.genres.includes(projectGenre)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange) {
        const projectDate = new Date(project.updatedAt);
        if (projectDate < filters.dateRange.start || projectDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    // Sort results
    results.sort((a, b) => {
      const { project: projectA, metadata: metadataA } = a;
      const { project: projectB, metadata: metadataB } = b;

      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = projectA.name.localeCompare(projectB.name);
          break;
        case 'updated':
          comparison =
            new Date(projectB.updatedAt).getTime() - new Date(projectA.updatedAt).getTime();
          break;
        case 'created':
          comparison =
            new Date(projectB.createdAt).getTime() - new Date(projectA.createdAt).getTime();
          break;
        case 'wordCount': {
          const wordsA = projectA.metadata?.totalWordCount || 0;
          const wordsB = projectB.metadata?.totalWordCount || 0;
          comparison = wordsB - wordsA;
          break;
        }
        case 'lastOpened':
          comparison = metadataB.lastOpened - metadataA.lastOpened;
          break;
        case 'timeSpent':
          comparison = metadataB.totalTimeSpent - metadataA.totalTimeSpent;
          break;
        default:
          // If no query, sort by relevance score
          comparison = b.relevanceScore - a.relevanceScore;
      }

      return filters.sortOrder === 'desc' ? comparison : -comparison;
    });

    return results.map((result) => ({
      project: result.project,
      relevanceScore: result.relevanceScore,
      matchedFields: result.matchedFields,
    }));
  }, [projects, filters, getProjectMetadata]);

  // Update filter functions
  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const setQuery = (query: string) => {
    updateFilters({ query });
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const toggleGenre = (genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const toggleFavorites = () => {
    updateFilters({ favorites: !filters.favorites });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const setSorting = (sortBy: SearchFilters['sortBy'], sortOrder?: SearchFilters['sortOrder']) => {
    updateFilters({
      sortBy,
      sortOrder:
        sortOrder || (filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc'),
    });
  };

  // Quick filter presets
  const applyQuickFilter = (preset: 'recent' | 'favorites' | 'untagged' | 'mostWorked') => {
    switch (preset) {
      case 'recent':
        setFilters((prev) => ({
          ...prev,
          query: '',
          tags: [],
          genres: [],
          favorites: false,
          sortBy: 'lastOpened',
          sortOrder: 'desc',
        }));
        break;
      case 'favorites':
        setFilters((prev) => ({
          ...prev,
          query: '',
          tags: [],
          genres: [],
          favorites: true,
          sortBy: 'updated',
          sortOrder: 'desc',
        }));
        break;
      case 'untagged':
        // This would need to be handled in the filter logic
        setFilters((prev) => ({
          ...prev,
          query: '',
          tags: [],
          genres: [],
          favorites: false,
          sortBy: 'updated',
          sortOrder: 'desc',
        }));
        break;
      case 'mostWorked':
        setFilters((prev) => ({
          ...prev,
          query: '',
          tags: [],
          genres: [],
          favorites: false,
          sortBy: 'timeSpent',
          sortOrder: 'desc',
        }));
        break;
    }
  };

  // Get search statistics
  const searchStats = useMemo(() => {
    const totalResults = searchResults.length;
    const hasActiveFilters =
      filters.query !== '' ||
      filters.tags.length > 0 ||
      filters.genres.length > 0 ||
      filters.favorites;

    return {
      totalResults,
      totalProjects: projects.length,
      hasActiveFilters,
      filteredOut: projects.length - totalResults,
    };
  }, [searchResults.length, projects.length, filters]);

  return {
    // Results
    results: searchResults,

    // Filter state
    filters,
    filterOptions,

    // Filter actions
    updateFilters,
    setQuery,
    toggleTag,
    toggleGenre,
    toggleFavorites,
    clearFilters,
    setSorting,
    applyQuickFilter,

    // Stats
    searchStats,
  };
};
