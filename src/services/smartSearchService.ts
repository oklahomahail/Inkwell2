// @ts-nocheck
// src/services/smartSearchService.ts
import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/writing';

import claudeService from './claudeService';
import { enhancedSearchService, SearchResult, SearchOptions } from './enhancedSearchService';

// Enhanced search types
export interface SmartSearchOptions extends SearchOptions {
  // Semantic search options
  enableSemanticSearch?: boolean;
  similarityThreshold?: number;

  // Query parsing options
  enableAdvancedQuery?: boolean;
  parseQuotes?: boolean;
  parseOperators?: boolean;

  // Result enhancement
  includeRelatedResults?: boolean;
  includeSuggestions?: boolean;
  maxSuggestions?: number;

  // Context options
  contextProject?: EnhancedProject;
  contextChapter?: Chapter;
  userIntent?: 'research' | 'writing' | 'editing' | 'analysis';
}

export interface SmartSearchResult extends SearchResult {
  // Enhanced result data
  similarity?: number;
  relatedResults?: SearchResult[];
  highlightedExcerpt?: string;
  contextSnippet?: string;

  // Metadata enhancements
  relevanceScore?: number;
  semanticTags?: string[];
  suggestedActions?: SearchAction[];

  // Navigation helpers
  navigationPath?: string;
  quickActions?: QuickAction[];
}

export interface SearchSuggestion {
  id: string;
  query: string;
  type: 'completion' | 'correction' | 'semantic' | 'related';
  score: number;
  preview?: string;
  resultCount?: number;
}

export interface SearchAction {
  id: string;
  label: string;
  action: string;
  icon?: string;
  shortcut?: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  action: () => void;
  icon?: string;
}

export interface SearchQuery {
  id: string;
  raw: string;
  parsed: {
    terms: string[];
    phrases: string[];
    operators: {
      must: string[];
      mustNot: string[];
      should: string[];
    };
    filters: {
      types?: string[];
      dateRange?: { start?: Date; end?: Date };
      wordRange?: { min?: number; max?: number };
      status?: string[];
    };
  };
  timestamp: number;
  resultCount?: number;
}

export interface SearchHistory {
  queries: SearchQuery[];
  popularTerms: { term: string; count: number; lastUsed: Date }[];
  recentSearches: SearchQuery[];
  savedSearches: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  options: SmartSearchOptions;
  createdAt: Date;
  lastUsed?: Date;
  resultCount?: number;
}

interface SearchCache {
  query: string;
  options: string; // serialized options
  results: SmartSearchResult[];
  timestamp: number;
  ttl: number;
}

class SmartSearchService {
  private searchHistory: SearchHistory = {
    queries: [],
    popularTerms: [],
    recentSearches: [],
    savedSearches: [],
  };

  private cache = new Map<string, SearchCache>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_HISTORY_SIZE = 1000;

  // Initialize search service
  async initialize(projectId: string): Promise<void> {
    await enhancedSearchService.initializeProject(projectId);
    await this.loadSearchHistory(projectId);
  }

  // Main smart search method
  async search(
    query: string,
    options: SmartSearchOptions = {},
  ): Promise<{
    results: SmartSearchResult[];
    suggestions: SearchSuggestion[];
    totalCount: number;
    queryTime: number;
    hasMore: boolean;
  }> {
    const startTime = performance.now();

    // Check cache first
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.getCachedResults(cacheKey);
    if (cached) {
      return {
        results: cached,
        suggestions: await this.generateSuggestions(query, options),
        totalCount: cached.length,
        queryTime: performance.now() - startTime,
        hasMore: false,
      };
    }

    try {
      // Parse the query
      const parsedQuery = this.parseQuery(query);
      this.addToHistory(parsedQuery);

      // Get base results from enhanced search
      const baseResults = await enhancedSearchService.search(query, {
        ...options,
        maxResults: (options.maxResults || 20) * 2, // Get more for filtering
      });

      // Enhance results with smart features
      const enhancedResults = await this.enhanceResults(baseResults, query, parsedQuery, options);

      // Apply smart filtering and ranking
      const smartResults = this.applySmartRanking(enhancedResults, query, parsedQuery, options);

      // Limit to requested number
      const finalResults = smartResults.slice(0, options.maxResults || 20);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(query, options);

      // Cache results
      this.cacheResults(cacheKey, finalResults);

      const queryTime = performance.now() - startTime;

      return {
        results: finalResults,
        suggestions,
        totalCount: smartResults.length,
        queryTime,
        hasMore: smartResults.length > finalResults.length,
      };
    } catch (error) {
      console.error('Smart search failed:', error);

      // Fallback to basic search
      const fallbackResults = await enhancedSearchService.search(query, options);
      return {
        results: fallbackResults.map(this.basicToSmartResult),
        suggestions: [],
        totalCount: fallbackResults.length,
        queryTime: performance.now() - startTime,
        hasMore: false,
      };
    }
  }

  // Semantic search using Claude
  async semanticSearch(
    query: string,
    options: SmartSearchOptions = {},
  ): Promise<SmartSearchResult[]> {
    if (!options.enableSemanticSearch || !claudeService.isConfigured()) {
      return [];
    }

    try {
      // Get base search results
      const baseResults = await enhancedSearchService.search(query, {
        ...options,
        maxResults: 50, // Get more candidates for semantic ranking
      });

      if (baseResults.length === 0) return [];

      // Use Claude to enhance semantic understanding
      const semanticPrompt = this.buildSemanticPrompt(query, baseResults, options);
      const semanticResponse = await claudeService.sendMessage(semanticPrompt);

      // Parse Claude's semantic analysis
      const semanticAnalysis = this.parseSemanticResponse(semanticResponse.content);

      // Re-rank results based on semantic similarity
      return this.applySemantic排名(baseResults, query, semanticAnalysis, options);
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  // Generate smart search suggestions
  async generateSuggestions(
    query: string,
    options: SmartSearchOptions = {},
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    if (!query.trim()) {
      // Show recent and popular searches when no query
      suggestions.push(...this.getRecentSearchSuggestions());
      suggestions.push(...this.getPopularSearchSuggestions());
      return suggestions.slice(0, options.maxSuggestions || 5);
    }

    try {
      // Completion suggestions
      suggestions.push(...this.generateCompletionSuggestions(query));

      // Correction suggestions
      suggestions.push(...this.generateCorrectionSuggestions(query));

      // Semantic suggestions (if enabled and Claude available)
      if (options.enableSemanticSearch && claudeService.isConfigured()) {
        suggestions.push(...(await this.generateSemanticSuggestions(query, options)));
      }

      // Related term suggestions
      suggestions.push(...this.generateRelatedSuggestions(query));

      // Sort by relevance and limit
      return suggestions.sort((a, b) => b.score - a.score).slice(0, options.maxSuggestions || 8);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  // Parse advanced query syntax
  private parseQuery(query: string): SearchQuery {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();

    // Initialize parsed structure
    const parsed = {
      terms: [] as string[],
      phrases: [] as string[],
      operators: {
        must: [] as string[],
        mustNot: [] as string[],
        should: [] as string[],
      },
      filters: {} as any,
    };

    let remaining = query.trim();

    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(remaining)) !== null) {
      if (match[1]) parsed.phrases.push(match[1]);
      remaining = remaining.replace(match[0], ' ');
    }

    // Extract operators
    const operatorRegex = /([+-])(\w+)/g;
    while ((match = operatorRegex.exec(remaining)) !== null) {
      const operator = match[1];
      const term = match[2];

      if (operator === '+') {
        if (term) parsed.operators.must.push(term);
      } else {
        if (term) parsed.operators.mustNot.push(term);
      }

      remaining = remaining.replace(match[0], ' ');
    }

    // Extract remaining terms
    const terms = remaining
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term.toLowerCase());

    parsed.terms.push(...terms);

    return {
      id,
      raw: query,
      parsed,
      timestamp,
    };
  }

  // Enhance search results with smart features
  private async enhanceResults(
    baseResults: SearchResult[],
    query: string,
    parsedQuery: SearchQuery,
    options: SmartSearchOptions,
  ): Promise<SmartSearchResult[]> {
    const enhanced: SmartSearchResult[] = [];

    for (const result of baseResults) {
      const smartResult: SmartSearchResult = {
        ...result,
        relevanceScore: this.calculateRelevanceScore(result, query, parsedQuery),
        highlightedExcerpt: this.createHighlightedExcerpt(result, parsedQuery),
        contextSnippet: this.generateContextSnippet(result, options),
        navigationPath: this.getNavigationPath(result),
        quickActions: this.generateQuickActions(result),
        suggestedActions: this.generateSuggestedActions(result, query),
      };

      enhanced.push(smartResult);
    }

    return enhanced;
  }

  // Apply smart ranking algorithm
  private applySmartRanking(
    results: SmartSearchResult[],
    query: string,
    parsedQuery: SearchQuery,
    options: SmartSearchOptions,
  ): SmartSearchResult[] {
    return results.sort((a, b) => {
      // Base relevance score
      let scoreA = a.relevanceScore || a.score;
      let scoreB = b.relevanceScore || b.score;

      // Boost exact phrase matches
      if (parsedQuery.parsed.phrases.length > 0) {
        for (const phrase of parsedQuery.parsed.phrases) {
          if (a.content.toLowerCase().includes(phrase.toLowerCase())) scoreA *= 1.5;
          if (b.content.toLowerCase().includes(phrase.toLowerCase())) scoreB *= 1.5;
        }
      }

      // Boost recent content
      if (a.metadata?.lastModified && b.metadata?.lastModified) {
        const daysDiffA =
          (Date.now() - new Date(a.metadata.lastModified).getTime()) / (1000 * 60 * 60 * 24);
        const daysDiffB =
          (Date.now() - new Date(b.metadata.lastModified).getTime()) / (1000 * 60 * 60 * 24);

        // Boost newer content slightly
        if (daysDiffA < 7) scoreA *= 1.1;
        if (daysDiffB < 7) scoreB *= 1.1;
      }

      // Boost by user intent
      if (options.userIntent) {
        scoreA *= this.getIntentBoost(a, options.userIntent);
        scoreB *= this.getIntentBoost(b, options.userIntent);
      }

      return scoreB - scoreA;
    });
  }

  // Generate context snippet for results
  private generateContextSnippet(result: SearchResult, options: SmartSearchOptions): string {
    if (options.contextChapter && result.chapterId === options.contextChapter.id) {
      return `From current chapter: ${options.contextChapter.title}`;
    }

    if (result.type === 'character') {
      return 'Character profile';
    }

    if (result.type === 'scene') {
      return `Scene • ${result.metadata?.wordCount || 0} words`;
    }

    if (result.type === 'chapter') {
      return `Chapter • ${result.metadata?.wordCount || 0} words`;
    }

    return '';
  }

  // Generate navigation path for results
  private getNavigationPath(result: SearchResult): string {
    const path = [];

    if (result.type === 'scene' && result.chapterId) {
      path.push('Chapter', result.chapterId);
      path.push('Scene', result.id);
    } else if (result.type === 'chapter') {
      path.push('Chapter', result.id);
    } else if (result.type === 'character') {
      path.push('Characters', result.id);
    }

    return path.join(' > ');
  }

  // Generate quick actions for results
  private generateQuickActions(result: SearchResult): QuickAction[] {
    const actions: QuickAction[] = [];

    if (result.type === 'scene' || result.type === 'chapter') {
      actions.push({
        id: 'edit',
        _label: 'Edit',
        _action: () => this.navigateToEdit(result),
        icon: '✏️',
      });

      actions.push({
        id: 'view',
        _label: 'View',
        _action: () => this.navigateToView(result),
        icon: '👁️',
      });
    }

    if (result.type === 'character') {
      actions.push({
        id: 'view-profile',
        _label: 'View Profile',
        _action: () => this.navigateToCharacter(result),
        icon: '👤',
      });
    }

    actions.push({
      id: 'copy-link',
      _label: 'Copy Link',
      _action: () => this.copyResultLink(result),
      icon: '🔗',
    });

    return actions;
  }

  // Generate suggested actions based on search context
  private generateSuggestedActions(result: SearchResult, query: string): SearchAction[] {
    const actions: SearchAction[] = [];

    // Writing-focused actions
    if (query.toLowerCase().includes('character') || result.type === 'character') {
      actions.push({
        id: 'analyze-character',
        label: 'Analyze Character Arc',
        action: 'character-analysis',
        icon: '📊',
        shortcut: ['⌘', 'A'],
      });
    }

    if (result.type === 'scene') {
      actions.push({
        id: 'continue-scene',
        label: 'Continue Writing',
        action: 'continue-writing',
        icon: '✍️',
        shortcut: ['⌘', 'E'],
      });
    }

    return actions;
  }

  // Cache management
  private getCacheKey(query: string, options: SmartSearchOptions): string {
    const optionsStr = JSON.stringify({
      types: options.types,
      maxResults: options.maxResults,
      minScore: options.minScore,
      enableSemanticSearch: options.enableSemanticSearch,
      projectId: options.projectId,
    });
    return `${query}:${optionsStr}`;
  }

  private getCachedResults(cacheKey: string): SmartSearchResult[] | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.results;
  }

  private cacheResults(cacheKey: string, results: SmartSearchResult[]): void {
    // Limit cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      query: cacheKey.split(':')[0] || '',
      options: cacheKey.split(':')[1] || '',
      results,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    });
  }

  // Search history management
  private addToHistory(query: SearchQuery): void {
    // Add to recent searches
    this.searchHistory.recentSearches.unshift(query);
    this.searchHistory.recentSearches = this.searchHistory.recentSearches.slice(0, 20);

    // Add to full query history
    this.searchHistory.queries.unshift(query);
    this.searchHistory.queries = this.searchHistory.queries.slice(0, this.MAX_HISTORY_SIZE);

    // Update popular terms
    this.updatePopularTerms(query);
  }

  private updatePopularTerms(query: SearchQuery): void {
    const allTerms = [
      ...query.parsed.terms,
      ...query.parsed.phrases,
      ...query.parsed.operators.must,
      ...query.parsed.operators.should,
    ];

    for (const term of allTerms) {
      const existing = this.searchHistory.popularTerms.find((t) => t.term === term);
      if (existing) {
        existing.count++;
        existing.lastUsed = new Date();
      } else {
        this.searchHistory.popularTerms.push({
          term,
          count: 1,
          lastUsed: new Date(),
        });
      }
    }

    // Sort by popularity and keep top 100
    this.searchHistory.popularTerms.sort((a, b) => b.count - a.count);
    this.searchHistory.popularTerms = this.searchHistory.popularTerms.slice(0, 100);
  }

  // Suggestion generation methods
  private getRecentSearchSuggestions(): SearchSuggestion[] {
    return this.searchHistory.recentSearches.slice(0, 3).map((query, index) => ({
      id: `recent-${query.id}`,
      query: query.raw,
      type: 'completion',
      score: 1.0 - index * 0.1,
      preview: `${query.resultCount || 0} results`,
    }));
  }

  private getPopularSearchSuggestions(): SearchSuggestion[] {
    return this.searchHistory.popularTerms.slice(0, 3).map((term, index) => ({
      id: `popular-${term.term}`,
      query: term.term,
      type: 'completion',
      score: 0.8 - index * 0.1,
      preview: `Popular search • Used ${term.count} times`,
    }));
  }

  private generateCompletionSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Find matching terms from popular searches
    for (const term of this.searchHistory.popularTerms) {
      if (
        term.term.toLowerCase().startsWith(queryLower) &&
        term.term.toLowerCase() !== queryLower
      ) {
        suggestions.push({
          id: `completion-${term.term}`,
          query: term.term,
          type: 'completion',
          score: Math.min(term.count / 10, 1.0),
          preview: `Used ${term.count} times`,
        });
      }
    }

    return suggestions.slice(0, 3);
  }

  private generateCorrectionSuggestions(query: string): SearchSuggestion[] {
    // Simple correction suggestions (could be enhanced with proper spellcheck)
    const suggestions: SearchSuggestion[] = [];

    // Check against popular terms for similar spelling
    for (const term of this.searchHistory.popularTerms.slice(0, 20)) {
      const similarity = this.calculateStringSimilarity(
        query.toLowerCase(),
        term.term.toLowerCase(),
      );
      if (similarity > 0.6 && similarity < 1.0) {
        suggestions.push({
          id: `correction-${term.term}`,
          query: term.term,
          type: 'correction',
          score: similarity,
          preview: `Did you mean "${term.term}"?`,
        });
      }
    }

    return suggestions.slice(0, 2);
  }

  private async generateSemanticSuggestions(
    query: string,
    _options: SmartSearchOptions,
  ): Promise<SearchSuggestion[]> {
    try {
      const prompt = `Based on the search query "${query}" in a creative writing context, suggest 3 related search terms that a writer might want to explore. Return only the search terms, one per line.`;

      const response = await claudeService.sendMessage(prompt, {
        maxTokens: 100,
      });

      const terms = response.content
        .split('\n')
        .filter((term: string) => term.trim())
        .slice(0, 3);

      return terms.map((term, _index) => ({
        id: `semantic-${index}`,
        query: term.trim(),
        type: 'semantic',
        score: 0.7 - index * 0.1,
        preview: 'Related concept',
      }));
    } catch (error) {
      console.error('Failed to generate semantic suggestions:', error);
      return [];
    }
  }

  private generateRelatedSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/);

    // Find queries that share terms with current query
    for (const historicalQuery of this.searchHistory.queries.slice(0, 50)) {
      const historicalTerms = historicalQuery.parsed.terms;
      const sharedTerms = queryTerms.filter((term) => historicalTerms.includes(term));

      if (sharedTerms.length > 0 && historicalQuery.raw.toLowerCase() !== query.toLowerCase()) {
        const relevance = sharedTerms.length / Math.max(queryTerms.length, historicalTerms.length);

        suggestions.push({
          id: `related-${historicalQuery.id}`,
          query: historicalQuery.raw,
          type: 'related',
          score: relevance,
          preview: `${historicalQuery.resultCount || 0} results`,
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 2);
  }

  // Helper methods
  private basicToSmartResult(result: SearchResult): SmartSearchResult {
    return {
      ...result,
      relevanceScore: result.score,
      highlightedExcerpt: result.excerpt,
      contextSnippet: '',
      navigationPath: this.getNavigationPath(result),
      quickActions: this.generateQuickActions(result),
      suggestedActions: [],
    };
  }

  private calculateRelevanceScore(
    result: SearchResult,
    query: string,
    parsedQuery: SearchQuery,
  ): number {
    let score = result.score;

    // Boost for exact phrase matches
    const content = result.content.toLowerCase();
    const title = result.title.toLowerCase();

    for (const phrase of parsedQuery.parsed.phrases) {
      if (content.includes(phrase.toLowerCase())) score *= 1.3;
      if (title.includes(phrase.toLowerCase())) score *= 1.5;
    }

    return score;
  }

  private createHighlightedExcerpt(result: SearchResult, parsedQuery: SearchQuery): string {
    let excerpt = result.excerpt || result.content.substring(0, 200);

    // Highlight all search terms
    const allTerms = [
      ...parsedQuery.parsed.terms,
      ...parsedQuery.parsed.phrases,
      ...parsedQuery.parsed.operators.must,
      ...parsedQuery.parsed.operators.should,
    ];

    for (const term of allTerms) {
      const regex = new RegExp(`\\b(${this.escapeRegExp(term)})\\b`, 'gi');
      excerpt = excerpt.replace(regex, '<mark>$1</mark>');
    }

    return excerpt;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}|[\]\\]/g, '\\$&'); // $& refers to the matched string
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      if (matrix[0]) matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]?.[j - 1] ?? 0;
        } else {
          matrix[i]![j] = Math.min(
            (matrix[i - 1]?.[j - 1] ?? 0) + 1,
            (matrix[i]?.[j - 1] ?? 0) + 1,
            (matrix[i - 1]?.[j] ?? 0) + 1,
          );
        }
      }
    }

    return matrix[str2.length]?.[str1.length] ?? 0;
  }

  private getIntentBoost(result: SmartSearchResult, intent: string): number {
    switch (intent) {
      case 'research':
        return result.type === 'character' || result.type === 'plot' ? 1.2 : 1.0;
      case 'writing':
        return result.type === 'scene' ? 1.3 : 1.0;
      case 'editing':
        return result.type === 'chapter' ? 1.2 : 1.0;
      case 'analysis':
        return result.type === 'character' ? 1.3 : 1.0;
      default:
        return 1.0;
    }
  }

  // Navigation methods (to be implemented based on your routing)
  private navigateToEdit(result: SearchResult): void {
    console.log('Navigate to edit:', result.id);
    // Implement navigation to edit view
  }

  private navigateToView(result: SearchResult): void {
    console.log('Navigate to view:', result.id);
    // Implement navigation to view
  }

  private navigateToCharacter(result: SearchResult): void {
    console.log('Navigate to character:', result.id);
    // Implement navigation to character profile
  }

  private copyResultLink(result: SearchResult): void {
    // Generate and copy link to result
    const link = `inkwell://result/${result.type}/${result.id}`;
    navigator.clipboard?.writeText(link).catch(console.error);
  }

  // Claude integration helpers
  private buildSemanticPrompt(
    query: string,
    results: SearchResult[],
    options: SmartSearchOptions,
  ): string {
    const contextInfo = options.contextProject ? `Project: ${options.contextProject.name}` : '';
    const resultSummary = results
      .slice(0, 5)
      .map((r) => `${r.type}: ${r.title} - ${r.excerpt.substring(0, 100)}`)
      .join('\n');

    return `As a writing assistant, analyze this search query: "${query}"

Context: ${contextInfo}
Search intent: ${options.userIntent || 'general'}

Current search results:
${resultSummary}

Please provide:
1. Semantic similarity scores (0-1) for each result
2. Related concepts the user might want to explore
3. Suggested refinements to the search query

Format your response as JSON.`;
  }

  private parseSemanticResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      // Fallback parsing for non-JSON responses
      return {
        similarities: [],
        relatedConcepts: [],
        suggestions: [],
      };
    }
  }

  private applySemantic排名(
    results: SearchResult[],
    query: string,
    analysis: any,
    _options: SmartSearchOptions,
  ): SmartSearchResult[] {
    // Apply semantic analysis to re-rank results
    return results
      .map((term, index) => ({
        ...this.basicToSmartResult(result),
        similarity: analysis.similarities?.[index] || result.score,
      }))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  }

  // Public API for search history
  async loadSearchHistory(projectId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(`inkwell-search-history-${projectId}`);
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  async saveSearchHistory(projectId: string): Promise<void> {
    try {
      localStorage.setItem(
        `inkwell-search-history-${projectId}`,
        JSON.stringify(this.searchHistory),
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  getSearchHistory(): SearchHistory {
    return this.searchHistory;
  }

  clearSearchHistory(): void {
    this.searchHistory = {
      queries: [],
      popularTerms: [],
      recentSearches: [],
      savedSearches: [],
    };
  }

  // Saved searches
  saveSearch(name: string, query: string, options: SmartSearchOptions): SavedSearch {
    const savedSearch: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      query,
      options,
      createdAt: new Date(),
    };

    this.searchHistory.savedSearches.push(savedSearch);
    return savedSearch;
  }

  deleteSavedSearch(id: string): void {
    this.searchHistory.savedSearches = this.searchHistory.savedSearches.filter((s) => s.id !== id);
  }

  getSavedSearches(): SavedSearch[] {
    return this.searchHistory.savedSearches;
  }
}

// Export singleton instance
export const smartSearchService = new SmartSearchService();

// For debugging
declare global {
  interface Window {
    smartSearchService?: SmartSearchService;
  }
}

if (typeof window !== 'undefined') {
  window.smartSearchService = smartSearchService;
}
