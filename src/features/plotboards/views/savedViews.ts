// Saved views management system for Plot Boards
// Allows users to save, load, and manage custom view configurations

import { trace } from '../../../utils/trace';
import { FilterContext } from '../filters/filtering';
import {
  PlotBoardView,
  PlotBoardFilters,
  PlotBoardSorting,
  PlotBoardGrouping,
  PlotCardPriority,
  PlotCardStatus,
} from '../types';

/* ========= View Management Types ========= */

export interface SavedViewData {
  view: PlotBoardView;
  filterContext: FilterContext;
  layoutSettings?: ViewLayoutSettings;
}

export interface ViewLayoutSettings {
  columnWidth: number;
  showDescriptions: boolean;
  showWordCounts: boolean;
  compactMode: boolean;
  virtualizationThreshold: number;
}

export interface ViewManagerOptions {
  persistToStorage: boolean;
  storageKey: string;
  maxSavedViews: number;
}

export interface ViewValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/* ========= Default Views ========= */

export const DEFAULT_VIEWS: SavedViewData[] = [
  {
    view: {
      id: 'default-all',
      boardId: '', // Will be set per board
      name: 'All Cards',
      filters: {
        statuses: [],
        priorities: [],
        tags: [],
        characters: [],
        chapters: [],
      },
      sorting: {
        field: 'order',
        direction: 'asc',
      },
      grouping: {
        enabled: false,
        field: 'status',
      },
      isDefault: true,
    },
    filterContext: {},
    layoutSettings: {
      columnWidth: 320,
      showDescriptions: true,
      showWordCounts: true,
      compactMode: false,
      virtualizationThreshold: 50,
    },
  },
  {
    view: {
      id: 'default-incomplete',
      boardId: '',
      name: 'Work in Progress',
      filters: {
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
      },
      sorting: {
        field: 'priority',
        direction: 'desc',
      },
      grouping: {
        enabled: true,
        field: 'status',
      },
      isDefault: true,
    },
    filterContext: {},
    layoutSettings: {
      columnWidth: 320,
      showDescriptions: true,
      showWordCounts: false,
      compactMode: false,
      virtualizationThreshold: 50,
    },
  },
  {
    view: {
      id: 'default-priority',
      boardId: '',
      name: 'High Priority',
      filters: {
        statuses: [],
        priorities: [PlotCardPriority.HIGH, PlotCardPriority.CRITICAL],
        tags: [],
        characters: [],
        chapters: [],
      },
      sorting: {
        field: 'updatedAt',
        direction: 'desc',
      },
      grouping: {
        enabled: true,
        field: 'priority',
      },
      isDefault: true,
    },
    filterContext: {},
    layoutSettings: {
      columnWidth: 320,
      showDescriptions: true,
      showWordCounts: true,
      compactMode: false,
      virtualizationThreshold: 50,
    },
  },
];

/* ========= View Manager ========= */

export class SavedViewManager {
  private boardId: string;
  private views: Map<string, SavedViewData> = new Map();
  private currentViewId: string | null = null;
  private options: ViewManagerOptions;

  constructor(boardId: string, options: Partial<ViewManagerOptions> = {}) {
    this.boardId = boardId;
    this.options = {
      persistToStorage: true,
      storageKey: `plotboard-views-${boardId}`,
      maxSavedViews: 20,
      ...options,
    };

    this.initializeViews();
  }

  /**
   * Initialize views with defaults and load from storage
   */
  private initializeViews() {
    // Set default current view
    this.currentViewId = 'default-all';

    // Add default views
    DEFAULT_VIEWS.forEach((defaultView) => {
      const viewData = {
        ...defaultView,
        view: {
          ...defaultView.view,
          boardId: this.boardId,
        },
      };
      this.views.set(viewData.view.id, viewData);
    });

    // Load custom views from storage (this may override currentViewId)
    if (this.options.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Get all views
   */
  getAllViews(): SavedViewData[] {
    return Array.from(this.views.values()).sort((a, b) => {
      // Default views first
      if (a.view.isDefault && !b.view.isDefault) return -1;
      if (!a.view.isDefault && b.view.isDefault) return 1;

      // Then by name
      return a.view.name.localeCompare(b.view.name);
    });
  }

  /**
   * Get view by ID
   */
  getView(viewId: string): SavedViewData | null {
    return this.views.get(viewId) || null;
  }

  /**
   * Get current active view
   */
  getCurrentView(): SavedViewData | null {
    if (!this.currentViewId) return null;
    return this.getView(this.currentViewId);
  }

  /**
   * Set current view
   */
  setCurrentView(viewId: string): boolean {
    const view = this.getView(viewId);
    if (!view) {
      trace.log('View not found', 'user_action', 'warn', { viewId });
      return false;
    }

    this.currentViewId = viewId;
    trace.log('Current view changed', 'user_action', 'info', { viewId, viewName: view.view.name });
    return true;
  }

  /**
   * Create new view
   */
  async createView(
    name: string,
    filters: PlotBoardFilters,
    sorting: PlotBoardSorting,
    grouping: PlotBoardGrouping,
    filterContext: FilterContext = {},
    layoutSettings?: Partial<ViewLayoutSettings>,
  ): Promise<string> {
    const viewId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const viewData: SavedViewData = {
      view: {
        id: viewId,
        boardId: this.boardId,
        name,
        filters: { ...filters },
        sorting: { ...sorting },
        grouping: { ...grouping },
        isDefault: false,
      },
      filterContext: { ...filterContext },
      layoutSettings: {
        columnWidth: 320,
        showDescriptions: true,
        showWordCounts: true,
        compactMode: false,
        virtualizationThreshold: 50,
        ...layoutSettings,
      },
    };

    // Validate view
    const validation = this.validateView(viewData);
    if (!validation.isValid) {
      throw new Error(`Invalid view: ${validation.errors.join(', ')}`);
    }

    // Check view limit
    const customViews = Array.from(this.views.values()).filter((v) => !v.view.isDefault);
    if (customViews.length >= this.options.maxSavedViews) {
      throw new Error(`Maximum number of saved views (${this.options.maxSavedViews}) exceeded`);
    }

    this.views.set(viewId, viewData);

    if (this.options.persistToStorage) {
      await this.saveToStorage();
    }

    trace.log('View created', 'user_action', 'info', { viewId, name });
    return viewId;
  }

  /**
   * Update existing view
   */
  async updateView(
    viewId: string,
    updates: Partial<{
      name: string;
      filters: PlotBoardFilters;
      sorting: PlotBoardSorting;
      grouping: PlotBoardGrouping;
      filterContext: FilterContext;
      layoutSettings: Partial<ViewLayoutSettings>;
    }>,
  ): Promise<boolean> {
    const existingView = this.views.get(viewId);
    if (!existingView) {
      trace.log('View not found for update', 'user_action', 'warn', { viewId });
      return false;
    }

    // Prevent updating default views (except layout settings)
    if (existingView.view.isDefault) {
      const allowedUpdates = { layoutSettings: updates.layoutSettings };
      if (Object.keys(updates).some((key) => key !== 'layoutSettings')) {
        throw new Error('Cannot modify default views (except layout settings)');
      }
    }

    const updatedView: SavedViewData = {
      view: {
        ...existingView.view,
        ...(updates.name && { name: updates.name }),
        ...(updates.filters && { filters: updates.filters }),
        ...(updates.sorting && { sorting: updates.sorting }),
        ...(updates.grouping && { grouping: updates.grouping }),
      },
      filterContext: {
        ...existingView.filterContext,
        ...(updates.filterContext && updates.filterContext),
      },
      layoutSettings: {
        columnWidth: 320,
        showDescriptions: true,
        showWordCounts: true,
        compactMode: false,
        virtualizationThreshold: 50,
        ...existingView.layoutSettings,
        ...(updates.layoutSettings && updates.layoutSettings),
      },
    };

    // Validate updated view
    const validation = this.validateView(updatedView);
    if (!validation.isValid) {
      throw new Error(`Invalid view update: ${validation.errors.join(', ')}`);
    }

    this.views.set(viewId, updatedView);

    if (this.options.persistToStorage) {
      await this.saveToStorage();
    }

    trace.log('View updated', 'user_action', 'info', { viewId, updates: Object.keys(updates) });
    return true;
  }

  /**
   * Delete view
   */
  async deleteView(viewId: string): Promise<boolean> {
    const view = this.views.get(viewId);
    if (!view) {
      trace.log('View not found for deletion', 'user_action', 'warn', { viewId });
      return false;
    }

    if (view.view.isDefault) {
      throw new Error('Cannot delete default views');
    }

    this.views.delete(viewId);

    // If deleted view was current, switch to default
    if (this.currentViewId === viewId) {
      this.currentViewId = 'default-all';
    }

    if (this.options.persistToStorage) {
      await this.saveToStorage();
    }

    trace.log('View deleted', 'user_action', 'info', { viewId });
    return true;
  }

  /**
   * Duplicate view
   */
  async duplicateView(viewId: string, newName?: string): Promise<string> {
    const existingView = this.views.get(viewId);
    if (!existingView) {
      throw new Error(`View ${viewId} not found`);
    }

    const baseName = newName || `${existingView.view.name} (Copy)`;
    let finalName = baseName;
    let counter = 1;

    // Ensure unique name
    while (Array.from(this.views.values()).some((v) => v.view.name === finalName)) {
      finalName = `${baseName} ${counter}`;
      counter++;
    }

    return await this.createView(
      finalName,
      existingView.view.filters,
      existingView.view.sorting,
      existingView.view.grouping,
      existingView.filterContext,
      existingView.layoutSettings,
    );
  }

  /**
   * Export view configuration
   */
  exportView(viewId: string): string | null {
    const view = this.views.get(viewId);
    if (!view) return null;

    return JSON.stringify(
      {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        view: {
          ...view.view,
          id: undefined, // Remove ID for import
          boardId: undefined, // Remove board ID for import
        },
        filterContext: view.filterContext,
        layoutSettings: view.layoutSettings,
      },
      null,
      2,
    );
  }

  /**
   * Import view configuration
   */
  async importView(viewData: string, name?: string): Promise<string> {
    try {
      const parsed = JSON.parse(viewData);

      if (!parsed.view) {
        throw new Error('Invalid view data format');
      }

      const importName = name || parsed.view.name || 'Imported View';

      return await this.createView(
        importName,
        parsed.view.filters || {},
        parsed.view.sorting || { field: 'order', direction: 'asc' },
        parsed.view.grouping || { enabled: false, field: 'status' },
        parsed.filterContext || {},
        parsed.layoutSettings,
      );
    } catch (error) {
      throw new Error(`Failed to import view: ${error}`);
    }
  }

  /**
   * Search views by name
   */
  searchViews(query: string): SavedViewData[] {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.views.values()).filter((viewData) =>
      viewData.view.name.toLowerCase().includes(normalizedQuery),
    );
  }

  /**
   * Get view statistics
   */
  getViewStats(): {
    total: number;
    custom: number;
    default: number;
    mostUsed: string | null;
  } {
    const allViews = Array.from(this.views.values());

    return {
      total: allViews.length,
      custom: allViews.filter((v) => !v.view.isDefault).length,
      default: allViews.filter((v) => v.view.isDefault).length,
      mostUsed: this.currentViewId, // Would be enhanced with usage tracking
    };
  }

  /**
   * Validate view data
   */
  private validateView(viewData: SavedViewData): ViewValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate view structure
    if (!viewData.view.name || viewData.view.name.trim().length === 0) {
      errors.push('View name is required');
    }

    if (viewData.view.name.length > 100) {
      errors.push('View name is too long (max 100 characters)');
    }

    // Validate filters
    if (!viewData.view.filters) {
      errors.push('Filters object is required');
    }

    // Validate sorting
    if (!viewData.view.sorting) {
      errors.push('Sorting configuration is required');
    } else {
      const validSortFields = ['order', 'title', 'status', 'priority', 'wordCount', 'updatedAt'];
      if (!validSortFields.includes(viewData.view.sorting.field)) {
        errors.push(`Invalid sort field: ${viewData.view.sorting.field}`);
      }

      if (!['asc', 'desc'].includes(viewData.view.sorting.direction)) {
        errors.push(`Invalid sort direction: ${viewData.view.sorting.direction}`);
      }
    }

    // Validate grouping
    if (!viewData.view.grouping) {
      errors.push('Grouping configuration is required');
    } else if (viewData.view.grouping.enabled) {
      const validGroupFields = ['status', 'priority', 'character', 'chapter', 'tag'];
      if (!validGroupFields.includes(viewData.view.grouping.field)) {
        errors.push(`Invalid group field: ${viewData.view.grouping.field}`);
      }
    }

    // Check for duplicate names (excluding self)
    const existingView = Array.from(this.views.values()).find(
      (v) => v.view.name === viewData.view.name && v.view.id !== viewData.view.id,
    );
    if (existingView) {
      errors.push(`View name "${viewData.view.name}" already exists`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Save views to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const customViews = Array.from(this.views.values()).filter((v) => !v.view.isDefault);
      const storageData = {
        version: '1.2.0',
        savedAt: new Date().toISOString(),
        boardId: this.boardId,
        currentViewId: this.currentViewId,
        views: customViews,
      };

      localStorage.setItem(this.options.storageKey, JSON.stringify(storageData));
      trace.log('Views saved to storage', 'store_action', 'debug', { count: customViews.length });
    } catch (error) {
      trace.log('Failed to save views to storage', 'store_action', 'error', { error });
    }
  }

  /**
   * Load views from storage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.options.storageKey);
      if (!storedData) return;

      const parsed = JSON.parse(storedData);
      if (parsed.boardId !== this.boardId) {
        trace.log('Storage data for different board', 'store_action', 'warn', {
          storedBoardId: parsed.boardId,
          currentBoardId: this.boardId,
        });
        return;
      }

      // Load custom views
      if (Array.isArray(parsed.views)) {
        parsed.views.forEach((viewData: SavedViewData) => {
          this.views.set(viewData.view.id, viewData);
        });
      }

      // Set current view if valid
      if (parsed.currentViewId && this.views.has(parsed.currentViewId)) {
        this.currentViewId = parsed.currentViewId;
      }

      trace.log('Views loaded from storage', 'store_action', 'debug', {
        count: parsed.views?.length || 0,
        currentViewId: this.currentViewId,
      });
    } catch (error) {
      trace.log('Failed to load views from storage', 'store_action', 'error', { error });
    }
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(): Promise<void> {
    // Clear custom views
    const customViewIds = Array.from(this.views.entries())
      .filter(([_, view]) => !view.view.isDefault)
      .map(([id, _]) => id);

    customViewIds.forEach((id) => this.views.delete(id));

    // Reset current view
    this.currentViewId = 'default-all';

    if (this.options.persistToStorage) {
      await this.saveToStorage();
    }

    trace.log('Reset to defaults', 'user_action', 'info', {
      removedCustomViews: customViewIds.length,
    });
  }
}
