// Plot Board filtering system
// Provides comprehensive filtering capabilities for cards and columns

import { trace } from '../../../utils/trace';
import { PlotCard, PlotBoardFilters, PlotCardStatus, PlotCardPriority } from '../types';

/* ========= Filter Types ========= */

export interface FilterContext {
  searchTerm?: string;
  caseSensitive?: boolean;
  includeDescriptions?: boolean;
  includeNotes?: boolean;
}

export interface FilterResult<T> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: string[];
  performance: {
    duration: number;
    itemsProcessed: number;
  };
}

export interface FilterCriteria {
  field: keyof PlotCard;
  operator: FilterOperator;
  value: any;
  label: string;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  MATCHES_REGEX = 'matches_regex',
}

/* ========= Filter Engine ========= */

export class PlotCardFilterEngine {
  private filters: PlotBoardFilters;
  private context: FilterContext;

  constructor(filters: PlotBoardFilters = this.getEmptyFilters(), context: FilterContext = {}) {
    this.filters = filters;
    this.context = context;
  }

  /**
   * Get empty filters structure
   */
  getEmptyFilters(): PlotBoardFilters {
    return {
      statuses: [],
      priorities: [],
      tags: [],
      characters: [],
      chapters: [],
      dateRange: undefined,
    };
  }

  /**
   * Check if filters are empty
   */
  isEmpty(): boolean {
    const { statuses, priorities, tags, characters, chapters, dateRange } = this.filters;
    return (
      statuses.length === 0 &&
      priorities.length === 0 &&
      tags.length === 0 &&
      characters.length === 0 &&
      chapters.length === 0 &&
      !dateRange &&
      !this.context.searchTerm
    );
  }

  /**
   * Update filters
   */
  updateFilters(newFilters: Partial<PlotBoardFilters>) {
    this.filters = { ...this.filters, ...newFilters };
  }

  /**
   * Update context
   */
  updateContext(newContext: Partial<FilterContext>) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Filter cards based on current criteria
   */
  filterCards(cards: PlotCard[]): FilterResult<PlotCard> {
    const startTime = performance.now();
    trace.log('Starting card filtering', 'performance', 'debug', {
      totalCards: cards.length,
      filtersActive: !this.isEmpty(),
    });

    const appliedFilters: string[] = [];
    let filteredCards = [...cards];

    // If no filters active, return all cards
    if (this.isEmpty()) {
      return {
        items: filteredCards,
        totalCount: cards.length,
        filteredCount: cards.length,
        appliedFilters: [],
        performance: {
          duration: performance.now() - startTime,
          itemsProcessed: cards.length,
        },
      };
    }

    // Apply status filters
    if (this.filters.statuses.length > 0) {
      filteredCards = filteredCards.filter((card) => this.filters.statuses.includes(card.status));
      appliedFilters.push(`Status: ${this.filters.statuses.join(', ')}`);
    }

    // Apply priority filters
    if (this.filters.priorities.length > 0) {
      filteredCards = filteredCards.filter((card) =>
        this.filters.priorities.includes(card.priority),
      );
      appliedFilters.push(`Priority: ${this.filters.priorities.join(', ')}`);
    }

    // Apply tag filters
    if (this.filters.tags.length > 0) {
      filteredCards = filteredCards.filter((card) =>
        this.filters.tags.some((filterTag) => card.tags.includes(filterTag)),
      );
      appliedFilters.push(`Tags: ${this.filters.tags.join(', ')}`);
    }

    // Apply character filters (via sceneId/chapterId)
    if (this.filters.characters.length > 0) {
      filteredCards = filteredCards.filter((card) => {
        // This would need integration with character data
        // For now, we'll check if character names appear in card descriptions
        return this.filters.characters.some(
          (character) =>
            card.description?.toLowerCase().includes(character.toLowerCase()) ||
            card.notes?.toLowerCase().includes(character.toLowerCase()),
        );
      });
      appliedFilters.push(`Characters: ${this.filters.characters.join(', ')}`);
    }

    // Apply chapter filters
    if (this.filters.chapters.length > 0) {
      filteredCards = filteredCards.filter(
        (card) => card.chapterId && this.filters.chapters.includes(card.chapterId),
      );
      appliedFilters.push(`Chapters: ${this.filters.chapters.length} selected`);
    }

    // Apply date range filter
    if (this.filters.dateRange) {
      const { from, to } = this.filters.dateRange;
      filteredCards = filteredCards.filter((card) => {
        const cardDate = new Date(card.updatedAt);
        return cardDate >= from && cardDate <= to;
      });
      appliedFilters.push(`Date: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`);
    }

    // Apply search term
    if (this.context.searchTerm) {
      filteredCards = this.applySearchFilter(filteredCards);
      appliedFilters.push(`Search: "${this.context.searchTerm}"`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    trace.log('Card filtering completed', 'performance', 'debug', {
      originalCount: cards.length,
      filteredCount: filteredCards.length,
      duration: `${duration.toFixed(2)}ms`,
      filtersApplied: appliedFilters.length,
    });

    return {
      items: filteredCards,
      totalCount: cards.length,
      filteredCount: filteredCards.length,
      appliedFilters,
      performance: {
        duration,
        itemsProcessed: cards.length,
      },
    };
  }

  /**
   * Apply text search filter
   */
  private applySearchFilter(cards: PlotCard[]): PlotCard[] {
    const searchTerm = this.context.searchTerm;
    if (!searchTerm) return cards;

    const caseSensitive = this.context.caseSensitive || false;
    const includeDescriptions = this.context.includeDescriptions !== false;
    const includeNotes = this.context.includeNotes !== false;

    const normalizeText = (text: string) => (caseSensitive ? text : text.toLowerCase());

    const normalizedSearchTerm = normalizeText(searchTerm);

    return cards.filter((card) => {
      // Always search in title
      if (normalizeText(card.title).includes(normalizedSearchTerm)) {
        return true;
      }

      // Search in description if enabled
      if (includeDescriptions && card.description) {
        if (normalizeText(card.description).includes(normalizedSearchTerm)) {
          return true;
        }
      }

      // Search in notes if enabled
      if (includeNotes && card.notes) {
        if (normalizeText(card.notes).includes(normalizedSearchTerm)) {
          return true;
        }
      }

      // Search in tags
      if (card.tags.some((tag) => normalizeText(tag).includes(normalizedSearchTerm))) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get filter statistics
   */
  getFilterStats(allCards: PlotCard[]): {
    availableStatuses: { value: PlotCardStatus; count: number; label: string }[];
    availablePriorities: { value: PlotCardPriority; count: number; label: string }[];
    availableTags: { value: string; count: number }[];
    availableChapters: { value: string; count: number; title: string }[];
    dateRange: { earliest: Date; latest: Date } | null;
  } {
    const statusCounts = new Map<PlotCardStatus, number>();
    const priorityCounts = new Map<PlotCardPriority, number>();
    const tagCounts = new Map<string, number>();
    const chapterCounts = new Map<string, number>();
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    allCards.forEach((card) => {
      // Count statuses
      statusCounts.set(card.status, (statusCounts.get(card.status) || 0) + 1);

      // Count priorities
      priorityCounts.set(card.priority, (priorityCounts.get(card.priority) || 0) + 1);

      // Count tags
      card.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Count chapters
      if (card.chapterId) {
        chapterCounts.set(card.chapterId, (chapterCounts.get(card.chapterId) || 0) + 1);
      }

      // Track date range
      const cardDate = new Date(card.updatedAt);
      if (!earliestDate || cardDate < earliestDate) {
        earliestDate = cardDate;
      }
      if (!latestDate || cardDate > latestDate) {
        latestDate = cardDate;
      }
    });

    // Format status options
    const availableStatuses = Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        value: status,
        count,
        label: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      }))
      .sort((a, b) => b.count - a.count);

    // Format priority options
    const availablePriorities = Array.from(priorityCounts.entries())
      .map(([priority, count]) => ({
        value: priority,
        count,
        label: priority.replace(/\b\w/g, (l) => l.toUpperCase()),
      }))
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (
          (priorityOrder[b.value as keyof typeof priorityOrder] || 0) -
          (priorityOrder[a.value as keyof typeof priorityOrder] || 0)
        );
      });

    // Format tag options
    const availableTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        value: tag,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    // Format chapter options
    const availableChapters = Array.from(chapterCounts.entries())
      .map(([chapterId, count]) => ({
        value: chapterId,
        count,
        title: `Chapter ${chapterId}`, // Would be enhanced with actual chapter titles
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      availableStatuses,
      availablePriorities,
      availableTags,
      availableChapters,
      dateRange: earliestDate && latestDate ? { earliest: earliestDate, latest: latestDate } : null,
    };
  }

  /**
   * Create filter from criteria
   */
  static createFromCriteria(criteria: FilterCriteria[]): PlotCardFilterEngine {
    const filters: PlotBoardFilters = {
      statuses: [],
      priorities: [],
      tags: [],
      characters: [],
      chapters: [],
    };

    const context: FilterContext = {};

    criteria.forEach((criterion) => {
      switch (criterion.field) {
        case 'status':
          if (criterion.operator === FilterOperator.IN) {
            filters.statuses = Array.isArray(criterion.value) ? criterion.value : [criterion.value];
          }
          break;
        case 'priority':
          if (criterion.operator === FilterOperator.IN) {
            filters.priorities = Array.isArray(criterion.value)
              ? criterion.value
              : [criterion.value];
          }
          break;
        case 'tags':
          if (
            criterion.operator === FilterOperator.CONTAINS ||
            criterion.operator === FilterOperator.IN
          ) {
            filters.tags = Array.isArray(criterion.value) ? criterion.value : [criterion.value];
          }
          break;
        // Additional field mappings would go here
      }
    });

    return new PlotCardFilterEngine(filters, context);
  }

  /**
   * Export current filter configuration
   */
  exportConfig(): { filters: PlotBoardFilters; context: FilterContext } {
    return {
      filters: { ...this.filters },
      context: { ...this.context },
    };
  }

  /**
   * Import filter configuration
   */
  importConfig(config: { filters: PlotBoardFilters; context: FilterContext }) {
    this.filters = { ...config.filters };
    this.context = { ...config.context };
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount(): number {
    let count = 0;

    if (this.filters.statuses.length > 0) count++;
    if (this.filters.priorities.length > 0) count++;
    if (this.filters.tags.length > 0) count++;
    if (this.filters.characters.length > 0) count++;
    if (this.filters.chapters.length > 0) count++;
    if (this.filters.dateRange) count++;
    if (this.context.searchTerm) count++;

    return count;
  }

  /**
   * Clear all filters
   */
  clearAll() {
    this.filters = this.getEmptyFilters();
    this.context = {};
  }

  /**
   * Clear specific filter
   */
  clearFilter(filterType: keyof PlotBoardFilters | 'search') {
    if (filterType === 'search') {
      this.context.searchTerm = undefined;
    } else if (filterType === 'dateRange') {
      this.filters.dateRange = undefined;
    } else if (Array.isArray(this.filters[filterType])) {
      (this.filters[filterType] as any[]).length = 0;
    }
  }
}

/* ========= Preset Filters ========= */

export const PRESET_FILTERS = {
  /**
   * Show only incomplete cards
   */
  incomplete: (): PlotCardFilterEngine => {
    return new PlotCardFilterEngine({
      statuses: [
        PlotCardStatus.IDEA,
        PlotCardStatus.OUTLINED,
        PlotCardStatus.DRAFT,
        PlotCardStatus.REVISION,
      ],
      priorities: [],
      tags: [],
      characters: [],
      chapters: [],
    });
  },

  /**
   * Show only high priority cards
   */
  highPriority: (): PlotCardFilterEngine => {
    return new PlotCardFilterEngine({
      statuses: [],
      priorities: [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL],
      tags: [],
      characters: [],
      chapters: [],
    });
  },

  /**
   * Show recently updated cards (last 7 days)
   */
  recentlyUpdated: (): PlotCardFilterEngine => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return new PlotCardFilterEngine({
      statuses: [],
      priorities: [],
      tags: [],
      characters: [],
      chapters: [],
      dateRange: {
        from: sevenDaysAgo,
        to: new Date(),
      },
    });
  },

  /**
   * Show cards needing attention
   */
  needsAttention: (): PlotCardFilterEngine => {
    return new PlotCardFilterEngine({
      statuses: [PlotCardStatus.IDEA, PlotCardStatus.REVISION],
      priorities: [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL],
      tags: [],
      characters: [],
      chapters: [],
    });
  },
};
