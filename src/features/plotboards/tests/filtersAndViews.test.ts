// Comprehensive tests for Plot Boards filtering and saved views system
// Tests filter logic, view persistence, and performance

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock trace utility
vi.mock('../../../utils/trace', () => ({
  trace: vi.fn(),
}));
import { PlotCardFilterEngine, PRESET_FILTERS } from '../filters/filtering';
import { schemaVersionManager } from '../schema/versioning';
import {
  PlotCard,
  PlotBoardFilters,
  PlotCardStatus,
  PlotCardPriority,
  PlotBoardSorting,
  PlotBoardGrouping,
} from '../types';
import { SavedViewManager, DEFAULT_VIEWS } from '../views/savedViews';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Helper function to create test cards
const createTestCard = (overrides: Partial<PlotCard> = {}): PlotCard => ({
  id: 'card-' + Math.random().toString(36).substr(2, 9),
  columnId: 'col1',
  title: 'Test Card',
  description: 'Test description',
  status: PlotCardStatus.IDEA,
  priority: PlotCardPriority.MEDIUM,
  tags: ['test', 'example'],
  order: 0,
  wordCount: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper function to create test cards with different properties
const createTestCardSet = (): PlotCard[] => [
  createTestCard({
    id: 'card1',
    title: 'High Priority Card',
    status: PlotCardStatus.IDEA,
    priority: PlotCardPriority.HIGH,
    tags: ['urgent', 'character'],
    wordCount: 500,
    description: 'This involves the main character',
    updatedAt: new Date('2024-01-15'),
  }),
  createTestCard({
    id: 'card2',
    title: 'Draft Chapter',
    status: PlotCardStatus.DRAFT,
    priority: PlotCardPriority.MEDIUM,
    tags: ['chapter', 'plot'],
    wordCount: 1200,
    chapterId: 'chapter1',
    updatedAt: new Date('2024-01-10'),
  }),
  createTestCard({
    id: 'card3',
    title: 'Completed Scene',
    status: PlotCardStatus.COMPLETE,
    priority: PlotCardPriority.LOW,
    tags: ['scene', 'dialogue'],
    wordCount: 800,
    description: 'Contains important dialogue between characters',
    updatedAt: new Date('2024-01-20'),
  }),
  createTestCard({
    id: 'card4',
    title: 'Critical Plot Point',
    status: PlotCardStatus.REVISION,
    priority: PlotCardPriority.CRITICAL,
    tags: ['plot', 'climax'],
    wordCount: 300,
    notes: 'Needs major revision for pacing',
    updatedAt: new Date('2024-01-12'),
  }),
  createTestCard({
    id: 'card5',
    title: 'Outlined Subplot',
    status: PlotCardStatus.OUTLINED,
    priority: PlotCardPriority.MEDIUM,
    tags: ['subplot', 'romance'],
    wordCount: 600,
    updatedAt: new Date('2024-01-18'),
  }),
];

describe('PlotCardFilterEngine', () => {
  let filterEngine: PlotCardFilterEngine;
  let testCards: PlotCard[];

  beforeEach(() => {
    testCards = createTestCardSet();
    filterEngine = new PlotCardFilterEngine();
  });

  describe('Basic Filtering', () => {
    it('should return all cards when no filters are applied', () => {
      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(5);
      expect(result.filteredCount).toBe(5);
      expect(result.totalCount).toBe(5);
      expect(result.appliedFilters).toHaveLength(0);
    });

    it('should filter by status correctly', () => {
      filterEngine.updateFilters({
        statuses: [PlotCardStatus.DRAFT, PlotCardStatus.COMPLETE],
        priorities: [],
        tags: [],
        characters: [],
        chapters: [],
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(2);
      expect(result.appliedFilters).toContain('Status: draft, complete');
      expect(
        result.items.every((card) =>
          [PlotCardStatus.DRAFT, PlotCardStatus.COMPLETE].includes(card.status),
        ),
      ).toBe(true);
    });

    it('should filter by priority correctly', () => {
      filterEngine.updateFilters({
        statuses: [],
        priorities: [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL],
        tags: [],
        characters: [],
        chapters: [],
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(2);
      expect(result.appliedFilters).toContain('Priority: high, critical');
      expect(
        result.items.every((card) =>
          [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL].includes(card.priority),
        ),
      ).toBe(true);
    });

    it('should filter by tags correctly', () => {
      filterEngine.updateFilters({
        statuses: [],
        priorities: [],
        tags: ['plot'],
        characters: [],
        chapters: [],
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(2);
      expect(result.appliedFilters).toContain('Tags: plot');
      expect(result.items.every((card) => card.tags.includes('plot'))).toBe(true);
    });

    it('should filter by chapter correctly', () => {
      filterEngine.updateFilters({
        statuses: [],
        priorities: [],
        tags: [],
        characters: [],
        chapters: ['chapter1'],
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].chapterId).toBe('chapter1');
    });

    it('should filter by date range correctly', () => {
      const from = new Date('2024-01-12');
      const to = new Date('2024-01-18');

      filterEngine.updateFilters({
        statuses: [],
        priorities: [],
        tags: [],
        characters: [],
        chapters: [],
        dateRange: { from, to },
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(3);
      expect(result.appliedFilters).toContain('Date: 1/11/2024 - 1/17/2024');
    });
  });

  describe('Search Filtering', () => {
    it('should search in card titles', () => {
      filterEngine.updateContext({ searchTerm: 'High Priority' });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('High Priority Card');
      expect(result.appliedFilters).toContain('Search: "High Priority"');
    });

    it('should search in descriptions when enabled', () => {
      filterEngine.updateContext({
        searchTerm: 'main character',
        includeDescriptions: true,
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toContain('main character');
    });

    it('should search in notes when enabled', () => {
      filterEngine.updateContext({
        searchTerm: 'major revision',
        includeNotes: true,
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].notes).toContain('major revision');
    });

    it('should support case-sensitive search', () => {
      filterEngine.updateContext({
        searchTerm: 'HIGH',
        caseSensitive: true,
      });

      let result = filterEngine.filterCards(testCards);
      expect(result.items).toHaveLength(0);

      filterEngine.updateContext({
        searchTerm: 'HIGH',
        caseSensitive: false,
      });

      result = filterEngine.filterCards(testCards);
      expect(result.items).toHaveLength(1);
    });

    it('should search in tags', () => {
      filterEngine.updateContext({ searchTerm: 'urgent' });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tags).toContain('urgent');
    });
  });

  describe('Combined Filtering', () => {
    it('should apply multiple filters correctly', () => {
      filterEngine.updateFilters({
        statuses: [PlotCardStatus.DRAFT, PlotCardStatus.REVISION],
        priorities: [PlotCardPriority.MEDIUM, PlotCardPriority.CRITICAL],
        tags: [],
        characters: [],
        chapters: [],
      });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(2);
      expect(result.appliedFilters).toHaveLength(2);
      expect(
        result.items.every(
          (card) =>
            [PlotCardStatus.DRAFT, PlotCardStatus.REVISION].includes(card.status) &&
            [PlotCardPriority.MEDIUM, PlotCardPriority.CRITICAL].includes(card.priority),
        ),
      ).toBe(true);
    });

    it('should combine filters and search', () => {
      filterEngine.updateFilters({
        statuses: [PlotCardStatus.REVISION],
        priorities: [],
        tags: [],
        characters: [],
        chapters: [],
      });
      filterEngine.updateContext({ searchTerm: 'Critical' });

      const result = filterEngine.filterCards(testCards);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PlotCardStatus.REVISION);
      expect(result.items[0].title).toContain('Critical');
    });
  });

  describe('Filter Statistics', () => {
    it('should calculate filter statistics correctly', () => {
      const stats = filterEngine.getFilterStats(testCards);

      expect(stats.availableStatuses).toHaveLength(5);
      expect(stats.availablePriorities).toHaveLength(4);
      expect(stats.availableTags.length).toBeGreaterThan(0);
      expect(stats.dateRange).toBeDefined();

      // Check status counts
      const ideaStatus = stats.availableStatuses.find((s) => s.value === PlotCardStatus.IDEA);
      expect(ideaStatus?.count).toBe(1);

      // Check priority order (should be critical, high, medium, low)
      expect(stats.availablePriorities[0].value).toBe(PlotCardPriority.CRITICAL);
      expect(stats.availablePriorities[1].value).toBe(PlotCardPriority.HIGH);
    });

    it('should calculate date range correctly', () => {
      const stats = filterEngine.getFilterStats(testCards);

      expect(stats.dateRange?.earliest).toEqual(new Date('2024-01-10'));
      expect(stats.dateRange?.latest).toEqual(new Date('2024-01-20'));
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        createTestCard({
          id: `card-${i}`,
          title: `Card ${i}`,
          status: i % 2 === 0 ? PlotCardStatus.IDEA : PlotCardStatus.DRAFT,
          priority: i % 4 === 0 ? PlotCardPriority.HIGH : PlotCardPriority.MEDIUM,
          tags: [`tag-${i % 10}`, 'performance-test'],
        }),
      );

      filterEngine.updateFilters({
        statuses: [PlotCardStatus.IDEA],
        priorities: [],
        tags: ['performance-test'],
        characters: [],
        chapters: [],
      });

      const startTime = performance.now();
      const result = filterEngine.filterCards(largeDataset);
      const endTime = performance.now();

      expect(result.items).toHaveLength(500);
      expect(result.performance.duration).toBeLessThan(100); // Should complete in under 100ms
      expect(endTime - startTime).toBeLessThan(200); // Including test overhead
    });
  });

  describe('Preset Filters', () => {
    it('should have working incomplete preset', () => {
      const incompleteFilter = PRESET_FILTERS.incomplete();
      const result = incompleteFilter.filterCards(testCards);

      expect(result.items).toHaveLength(4); // All except complete
      expect(result.items.every((card) => card.status !== PlotCardStatus.COMPLETE)).toBe(true);
    });

    it('should have working high priority preset', () => {
      const highPriorityFilter = PRESET_FILTERS.highPriority();
      const result = highPriorityFilter.filterCards(testCards);

      expect(result.items).toHaveLength(2); // High and critical priority
      expect(
        result.items.every((card) =>
          [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL].includes(card.priority),
        ),
      ).toBe(true);
    });

    it('should have working recently updated preset', () => {
      const recentFilter = PRESET_FILTERS.recentlyUpdated();
      // This is hard to test without mocking dates, but we can verify it exists and runs
      const result = recentFilter.filterCards(testCards);

      expect(result).toBeDefined();
      expect(result.appliedFilters.some((filter) => filter.includes('Date:'))).toBe(true);
    });

    it('should have working needs attention preset', () => {
      const needsAttentionFilter = PRESET_FILTERS.needsAttention();
      const result = needsAttentionFilter.filterCards(testCards);

      expect(result.items).toHaveLength(2); // Idea+high, revision+critical
      expect(
        result.items.every(
          (card) =>
            [PlotCardStatus.IDEA, PlotCardStatus.REVISION].includes(card.status) &&
            [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL].includes(card.priority),
        ),
      ).toBe(true);
    });
  });

  describe('Filter Management', () => {
    it('should clear filters correctly', () => {
      filterEngine.updateFilters({
        statuses: [PlotCardStatus.DRAFT],
        priorities: [PlotCardPriority.HIGH],
        tags: ['test'],
        characters: [],
        chapters: [],
      });
      filterEngine.updateContext({ searchTerm: 'test' });

      expect(filterEngine.getActiveFilterCount()).toBe(4);

      filterEngine.clearAll();

      expect(filterEngine.getActiveFilterCount()).toBe(0);
      expect(filterEngine.isEmpty()).toBe(true);
    });

    it('should clear specific filters', () => {
      filterEngine.updateFilters({
        statuses: [PlotCardStatus.DRAFT],
        priorities: [PlotCardPriority.HIGH],
        tags: ['test'],
        characters: [],
        chapters: [],
      });

      filterEngine.clearFilter('statuses');

      const config = filterEngine.exportConfig();
      expect(config.filters.statuses).toHaveLength(0);
      expect(config.filters.priorities).toHaveLength(1);
    });

    it('should export and import configuration', () => {
      const originalFilters = {
        statuses: [PlotCardStatus.DRAFT],
        priorities: [PlotCardPriority.HIGH],
        tags: ['test'],
        characters: [],
        chapters: [],
      };
      const originalContext = { searchTerm: 'test search' };

      filterEngine.updateFilters(originalFilters);
      filterEngine.updateContext(originalContext);

      const config = filterEngine.exportConfig();
      const newEngine = new PlotCardFilterEngine();
      newEngine.importConfig(config);

      const newConfig = newEngine.exportConfig();

      expect(newConfig.filters).toEqual(originalFilters);
      expect(newConfig.context).toEqual(originalContext);
    });
  });
});

describe('SavedViewManager', () => {
  let viewManager: SavedViewManager;
  const testBoardId = 'test-board-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    viewManager = new SavedViewManager(testBoardId, { persistToStorage: false });
  });

  describe('Initialization', () => {
    it('should initialize with default views', () => {
      const allViews = viewManager.getAllViews();
      const defaultViews = allViews.filter((v) => v.view.isDefault);

      expect(defaultViews).toHaveLength(DEFAULT_VIEWS.length);
      expect(defaultViews[0].view.boardId).toBe(testBoardId);
    });

    it('should set initial current view', () => {
      const currentView = viewManager.getCurrentView();

      expect(currentView).toBeDefined();
      expect(currentView?.view.id).toBe('default-all');
    });
  });

  describe('View Management', () => {
    it('should create new view correctly', async () => {
      const filters: PlotBoardFilters = {
        statuses: [PlotCardStatus.DRAFT],
        priorities: [],
        tags: [],
        characters: [],
        chapters: [],
      };
      const sorting: PlotBoardSorting = { field: 'title', direction: 'asc' };
      const grouping: PlotBoardGrouping = { enabled: false, field: 'status' };

      const viewId = await viewManager.createView('Test View', filters, sorting, grouping);

      expect(viewId).toBeDefined();

      const view = viewManager.getView(viewId);
      expect(view?.view.name).toBe('Test View');
      expect(view?.view.filters.statuses).toEqual([PlotCardStatus.DRAFT]);
      expect(view?.view.isDefault).toBe(false);
    });

    it('should update existing view', async () => {
      const viewId = await viewManager.createView(
        'Test View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      const success = await viewManager.updateView(viewId, {
        name: 'Updated Test View',
        filters: {
          statuses: [PlotCardStatus.COMPLETE],
          priorities: [],
          tags: [],
          characters: [],
          chapters: [],
        },
      });

      expect(success).toBe(true);

      const updatedView = viewManager.getView(viewId);
      expect(updatedView?.view.name).toBe('Updated Test View');
      expect(updatedView?.view.filters.statuses).toEqual([PlotCardStatus.COMPLETE]);
    });

    it('should delete custom view', async () => {
      const viewId = await viewManager.createView(
        'Test View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      const success = await viewManager.deleteView(viewId);

      expect(success).toBe(true);
      expect(viewManager.getView(viewId)).toBe(null);
    });

    it('should not delete default view', async () => {
      await expect(viewManager.deleteView('default-all')).rejects.toThrow(
        'Cannot delete default views',
      );
    });

    it('should duplicate view', async () => {
      const originalId = await viewManager.createView(
        'Original View',
        {
          statuses: [PlotCardStatus.DRAFT],
          priorities: [],
          tags: [],
          characters: [],
          chapters: [],
        },
        { field: 'title', direction: 'desc' },
        { enabled: true, field: 'priority' },
      );

      const duplicateId = await viewManager.duplicateView(originalId);

      const original = viewManager.getView(originalId);
      const duplicate = viewManager.getView(duplicateId);

      expect(duplicate?.view.name).toBe('Original View (Copy)');
      expect(duplicate?.view.filters).toEqual(original?.view.filters);
      expect(duplicate?.view.sorting).toEqual(original?.view.sorting);
      expect(duplicate?.view.grouping).toEqual(original?.view.grouping);
      expect(duplicate?.view.id).not.toBe(originalId);
    });
  });

  describe('View Selection', () => {
    it('should set current view', async () => {
      const viewId = await viewManager.createView(
        'Test View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      const success = viewManager.setCurrentView(viewId);

      expect(success).toBe(true);
      expect(viewManager.getCurrentView()?.view.id).toBe(viewId);
    });

    it('should fail to set non-existent view', () => {
      const success = viewManager.setCurrentView('non-existent-id');

      expect(success).toBe(false);
      expect(viewManager.getCurrentView()?.view.id).not.toBe('non-existent-id');
    });
  });

  describe('Import/Export', () => {
    it('should export view configuration', async () => {
      const viewId = await viewManager.createView(
        'Export Test',
        {
          statuses: [PlotCardStatus.DRAFT],
          priorities: [],
          tags: ['export'],
          characters: [],
          chapters: [],
        },
        { field: 'updatedAt', direction: 'desc' },
        { enabled: true, field: 'status' },
      );

      const exportData = viewManager.exportView(viewId);

      expect(exportData).toBeDefined();

      const parsed = JSON.parse(exportData!);
      expect(parsed.version).toBe('1.2.0');
      expect(parsed.view.name).toBe('Export Test');
      expect(parsed.view.filters.statuses).toEqual([PlotCardStatus.DRAFT]);
      expect(parsed.view.id).toBeUndefined(); // Should be removed for import
      expect(parsed.view.boardId).toBeUndefined(); // Should be removed for import
    });

    it('should import view configuration', async () => {
      const importData = JSON.stringify({
        version: '1.2.0',
        view: {
          name: 'Imported View',
          filters: {
            statuses: [PlotCardStatus.COMPLETE],
            priorities: [],
            tags: [],
            characters: [],
            chapters: [],
          },
          sorting: { field: 'title', direction: 'asc' },
          grouping: { enabled: false, field: 'status' },
        },
        filterContext: { searchTerm: 'imported' },
        layoutSettings: { columnWidth: 300, showDescriptions: false },
      });

      const viewId = await viewManager.importView(importData);

      const imported = viewManager.getView(viewId);
      expect(imported?.view.name).toBe('Imported View');
      expect(imported?.view.filters.statuses).toEqual([PlotCardStatus.COMPLETE]);
      expect(imported?.filterContext.searchTerm).toBe('imported');
      expect(imported?.layoutSettings?.columnWidth).toBe(300);
    });
  });

  describe('Storage Persistence', () => {
    it('should save to localStorage when enabled', async () => {
      const persistentManager = new SavedViewManager(testBoardId, { persistToStorage: true });

      await persistentManager.createView(
        'Persistent View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `plotboard-views-${testBoardId}`,
        expect.stringContaining('Persistent View'),
      );
    });

    it('should load from localStorage on initialization', () => {
      const storedData = JSON.stringify({
        version: '1.2.0',
        boardId: testBoardId,
        currentViewId: 'stored-view-1',
        views: [
          {
            view: {
              id: 'stored-view-1',
              boardId: testBoardId,
              name: 'Stored View',
              filters: { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
              sorting: { field: 'order', direction: 'asc' },
              grouping: { enabled: false, field: 'status' },
              isDefault: false,
            },
            filterContext: {},
            layoutSettings: { columnWidth: 320 },
          },
        ],
      });

      mockLocalStorage.getItem.mockReturnValue(storedData);

      const loadingManager = new SavedViewManager(testBoardId, { persistToStorage: true });

      expect(loadingManager.getView('stored-view-1')).toBeDefined();
      expect(loadingManager.getCurrentView()?.view.id).toBe('stored-view-1');
    });
  });

  describe('View Search and Statistics', () => {
    it('should search views by name', async () => {
      await viewManager.createView(
        'Project Alpha View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );
      await viewManager.createView(
        'Project Beta View',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );
      await viewManager.createView(
        'Something Else',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      const projectViews = viewManager.searchViews('Project');

      expect(projectViews).toHaveLength(2);
      expect(projectViews.every((v) => v.view.name.includes('Project'))).toBe(true);
    });

    it('should provide view statistics', async () => {
      await viewManager.createView(
        'Custom View 1',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );
      await viewManager.createView(
        'Custom View 2',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      const stats = viewManager.getViewStats();

      expect(stats.total).toBe(DEFAULT_VIEWS.length + 2);
      expect(stats.custom).toBe(2);
      expect(stats.default).toBe(DEFAULT_VIEWS.length);
      expect(stats.mostUsed).toBeDefined();
    });
  });

  describe('View Validation', () => {
    it('should reject view with empty name', async () => {
      await expect(
        viewManager.createView(
          '',
          { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
          { field: 'order', direction: 'asc' },
          { enabled: false, field: 'status' },
        ),
      ).rejects.toThrow('View name is required');
    });

    it('should reject view with duplicate name', async () => {
      await viewManager.createView(
        'Duplicate Name',
        { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
        { field: 'order', direction: 'asc' },
        { enabled: false, field: 'status' },
      );

      await expect(
        viewManager.createView(
          'Duplicate Name',
          { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
          { field: 'order', direction: 'asc' },
          { enabled: false, field: 'status' },
        ),
      ).rejects.toThrow('View name "Duplicate Name" already exists');
    });

    it('should reject view with invalid sort field', async () => {
      await expect(
        viewManager.createView(
          'Invalid Sort',
          { statuses: [], priorities: [], tags: [], characters: [], chapters: [] },
          { field: 'invalid_field' as any, direction: 'asc' },
          { enabled: false, field: 'status' },
        ),
      ).rejects.toThrow('Invalid sort field: invalid_field');
    });
  });
});

describe('Schema Versioning', () => {
  describe('Version Detection', () => {
    it('should detect current version data', () => {
      const currentData = {
        schemaVersion: '1.2.0',
        data: { test: 'data' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(schemaVersionManager.needsMigration(currentData)).toBe(false);
    });

    it('should detect old version data', () => {
      const oldData = {
        schemaVersion: '1.0.0',
        data: { test: 'data' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(schemaVersionManager.needsMigration(oldData)).toBe(true);
    });

    it('should detect unversioned data', () => {
      const unversionedData = { test: 'data' };

      expect(schemaVersionManager.needsMigration(unversionedData)).toBe(true);
      expect(schemaVersionManager.getDataVersion(unversionedData)).toBe('1.0.0');
    });
  });

  describe('Version Comparison', () => {
    it('should compare versions correctly', () => {
      expect(schemaVersionManager.compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(schemaVersionManager.compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(schemaVersionManager.compareVersions('1.2.0', '1.2.0')).toBe(0);
      expect(schemaVersionManager.compareVersions('1.2.3', '1.2.10')).toBe(-1);
    });
  });

  describe('Migration Process', () => {
    it('should migrate from 1.0.0 to current version', async () => {
      const oldData = {
        schemaVersion: '1.0.0',
        data: {
          columns: [
            {
              id: 'col1',
              title: 'Test Column',
              cards: [
                {
                  id: 'card1',
                  title: 'Test Card',
                  status: 'idea',
                  // Missing priority and tags fields
                },
              ],
            },
          ],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = await schemaVersionManager.migrateToCurrentVersion(oldData);

      expect(result.success).toBe(true);
      expect(result.data.schemaVersion).toBe('1.2.0');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.data.migrationHistory).toBeDefined();
      expect(result.data.migrationHistory?.length).toBeGreaterThan(0);
    });

    it('should handle migration warnings', async () => {
      const oldData = {
        schemaVersion: '1.1.0',
        data: {
          columns: [
            {
              id: 'col1',
              title: 'Test Column',
              cards: [
                {
                  id: 'card1',
                  title: 'Test Card',
                  status: 'idea',
                  // Missing some fields that will trigger warnings
                },
              ],
            },
          ],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = await schemaVersionManager.migrateToCurrentVersion(oldData);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Added default'))).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate correct schema data', () => {
      const validData = {
        schemaVersion: '1.2.0',
        data: { test: 'data' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validation = schemaVersionManager.validateData(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid schema data', () => {
      const invalidData = {
        // Missing required fields
        data: { test: 'data' },
      } as any;

      const validation = schemaVersionManager.validateData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect future version data', () => {
      const futureData = {
        schemaVersion: '2.0.0', // Future version
        data: { test: 'data' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validation = schemaVersionManager.validateData(futureData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('newer than supported'))).toBe(true);
    });
  });

  describe('Schema Information', () => {
    it('should provide schema information', () => {
      const info = schemaVersionManager.getSchemaInfo();

      expect(info.currentVersion).toBe('1.2.0');
      expect(info.supportedVersions).toContain('1.0.0');
      expect(info.supportedVersions).toContain('1.1.0');
      expect(info.supportedVersions).toContain('1.2.0');
      expect(info.latestChanges.length).toBeGreaterThan(0);
    });
  });
});
