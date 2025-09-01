// src/types/search.ts
export type SearchMode = 'default' | 'phrase';

export interface SearchOptions {
  types?: Array<'scene' | 'chapter' | 'character' | 'plot'>;
  maxResults?: number;
  minScore?: number;
  mode?: SearchMode; // NEW
}
