// src/types/search.ts

export type SearchMode = 'default' | 'phrase';

export interface BaseSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface BaseSearchOptions {
  projectId: string;
  maxResults?: number;
  minScore?: number;
}

export interface SearchOptions extends BaseSearchOptions {
  types?: Array<'scene' | 'chapter' | 'character' | 'plot'>;
  mode?: SearchMode;
}

export interface SearchStats {
  totalDocuments: number;
  indexSize: number;
  lastUpdated?: string;
}

export interface SearchRequest {
  query: string;
  options: BaseSearchOptions;
}

export interface SearchResponse {
  results: BaseSearchResult[];
  totalResults: number;
  latencyMs: number;
}
