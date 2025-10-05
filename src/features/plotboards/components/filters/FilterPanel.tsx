// Filter panel component for Plot Boards
// Provides intuitive interface for filtering and searching cards

import React, { useState, useCallback, useMemo } from 'react';

import { PlotCardFilterEngine, FilterContext, PRESET_FILTERS } from '../../filters/filtering';
import { PlotBoardFilters, PlotCardStatus, PlotCardPriority } from '../../types';

interface FilterPanelProps {
  filters: PlotBoardFilters;
  filterContext: FilterContext;
  filterStats: {
    availableStatuses: { value: PlotCardStatus; count: number; label: string }[];
    availablePriorities: { value: PlotCardPriority; count: number; label: string }[];
    availableTags: { value: string; count: number }[];
    availableChapters: { value: string; count: number; title: string }[];
    dateRange: { earliest: Date; latest: Date } | null;
  };
  onFiltersChange: (filters: PlotBoardFilters) => void;
  onContextChange: (context: FilterContext) => void;
  onClearAll: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  resultCount?: number;
  totalCount?: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterContext,
  filterStats,
  onFiltersChange,
  onContextChange,
  onClearAll,
  isExpanded,
  onToggleExpanded,
  resultCount = 0,
  totalCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'search' | 'presets'>('filters');

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    const engine = new PlotCardFilterEngine(filters, filterContext);
    return engine.getActiveFilterCount();
  }, [filters, filterContext]);

  // Handle status filter changes
  const handleStatusChange = useCallback(
    (status: PlotCardStatus, checked: boolean) => {
      const currentStatuses = filters.statuses || [];
      const newStatuses = checked
        ? [...currentStatuses, status]
        : currentStatuses.filter((s) => s !== status);

      onFiltersChange({ ...filters, statuses: newStatuses });
    },
    [filters, onFiltersChange],
  );

  // Handle priority filter changes
  const handlePriorityChange = useCallback(
    (priority: PlotCardPriority, checked: boolean) => {
      const currentPriorities = filters.priorities || [];
      const newPriorities = checked
        ? [...currentPriorities, priority]
        : currentPriorities.filter((p) => p !== priority);

      onFiltersChange({ ...filters, priorities: newPriorities });
    },
    [filters, onFiltersChange],
  );

  // Handle tag filter changes
  const handleTagChange = useCallback(
    (tag: string, checked: boolean) => {
      const currentTags = filters.tags || [];
      const newTags = checked ? [...currentTags, tag] : currentTags.filter((t) => t !== tag);

      onFiltersChange({ ...filters, tags: newTags });
    },
    [filters, onFiltersChange],
  );

  // Handle chapter filter changes
  const handleChapterChange = useCallback(
    (chapterId: string, checked: boolean) => {
      const currentChapters = filters.chapters || [];
      const newChapters = checked
        ? [...currentChapters, chapterId]
        : currentChapters.filter((c) => c !== chapterId);

      onFiltersChange({ ...filters, chapters: newChapters });
    },
    [filters, onFiltersChange],
  );

  // Handle date range changes
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      const dateRange =
        from && to
          ? {
              from: new Date(from),
              to: new Date(to),
            }
          : undefined;

      onFiltersChange({ ...filters, dateRange });
    },
    [filters, onFiltersChange],
  );

  // Handle search term change
  const handleSearchChange = useCallback(
    (searchTerm: string) => {
      onContextChange({ ...filterContext, searchTerm });
    },
    [filterContext, onContextChange],
  );

  // Handle preset filter application
  const handlePresetApply = useCallback(
    (presetKey: keyof typeof PRESET_FILTERS) => {
      const presetEngine = PRESET_FILTERS[presetKey]();
      const presetConfig = presetEngine.exportConfig();

      onFiltersChange(presetConfig.filters);
      onContextChange(presetConfig.context);
    },
    [onFiltersChange, onContextChange],
  );

  // Handle clear specific filter
  const handleClearFilter = useCallback(
    (filterType: keyof PlotBoardFilters | 'search') => {
      if (filterType === 'search') {
        onContextChange({ ...filterContext, searchTerm: undefined });
      } else if (filterType === 'dateRange') {
        onFiltersChange({ ...filters, dateRange: undefined });
      } else if (Array.isArray(filters[filterType])) {
        onFiltersChange({ ...filters, [filterType]: [] });
      }
    },
    [filters, filterContext, onFiltersChange, onContextChange],
  );

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Filter Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleExpanded}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards..."
              value={filterContext.searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64 pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Result Count */}
          <span className="text-sm text-gray-600">
            {resultCount === totalCount
              ? `${totalCount} cards`
              : `${resultCount} of ${totalCount} cards`}
          </span>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button onClick={onClearAll} className="text-sm text-red-600 hover:text-red-800">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4 mt-4">
            {[
              { key: 'filters' as const, label: 'Filters', icon: '🔍' },
              { key: 'search' as const, label: 'Search', icon: '📝' },
              { key: 'presets' as const, label: 'Presets', icon: '⭐' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Content */}
          <div className="space-y-6">
            {activeTab === 'filters' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Status Filters */}
                {filterStats.availableStatuses.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-900">Status</label>
                      {(filters.statuses || []).length > 0 && (
                        <button
                          onClick={() => handleClearFilter('statuses')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {filterStats.availableStatuses.map((status) => (
                        <label key={status.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(filters.statuses || []).includes(status.value)}
                            onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {status.label} ({status.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority Filters */}
                {filterStats.availablePriorities.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-900">Priority</label>
                      {(filters.priorities || []).length > 0 && (
                        <button
                          onClick={() => handleClearFilter('priorities')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {filterStats.availablePriorities.map((priority) => (
                        <label key={priority.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(filters.priorities || []).includes(priority.value)}
                            onChange={(e) => handlePriorityChange(priority.value, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 flex items-center">
                            <PriorityIndicator priority={priority.value} />
                            {priority.label} ({priority.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag Filters */}
                {filterStats.availableTags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-900">Tags</label>
                      {(filters.tags || []).length > 0 && (
                        <button
                          onClick={() => handleClearFilter('tags')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {filterStats.availableTags.slice(0, 10).map((tag) => (
                        <label key={tag.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(filters.tags || []).includes(tag.value)}
                            onChange={(e) => handleTagChange(tag.value, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            #{tag.value} ({tag.count})
                          </span>
                        </label>
                      ))}
                      {filterStats.availableTags.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2">
                          +{filterStats.availableTags.length - 10} more tags
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Date Range Filter */}
                {filterStats.dateRange && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-900">Updated Date</label>
                      {filters.dateRange && (
                        <button
                          onClick={() => handleClearFilter('dateRange')}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.dateRange?.from.toISOString().split('T')[0] || ''}
                        min={filterStats.dateRange.earliest.toISOString().split('T')[0]}
                        max={filterStats.dateRange.latest.toISOString().split('T')[0]}
                        onChange={(e) =>
                          handleDateRangeChange(
                            e.target.value,
                            filters.dateRange?.to.toISOString().split('T')[0] || e.target.value,
                          )
                        }
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.dateRange?.to.toISOString().split('T')[0] || ''}
                        min={
                          filters.dateRange?.from.toISOString().split('T')[0] ||
                          filterStats.dateRange.earliest.toISOString().split('T')[0]
                        }
                        max={filterStats.dateRange.latest.toISOString().split('T')[0]}
                        onChange={(e) =>
                          handleDateRangeChange(
                            filters.dateRange?.from.toISOString().split('T')[0] || e.target.value,
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="To"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="max-w-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Search Term
                  </label>
                  <input
                    type="text"
                    value={filterContext.searchTerm || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter search term..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Search in card titles, descriptions, tags, and notes
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!filterContext.caseSensitive}
                      onChange={(e) =>
                        onContextChange({
                          ...filterContext,
                          caseSensitive: !e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Case insensitive</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterContext.includeDescriptions !== false}
                      onChange={(e) =>
                        onContextChange({
                          ...filterContext,
                          includeDescriptions: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Search descriptions</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterContext.includeNotes !== false}
                      onChange={(e) =>
                        onContextChange({
                          ...filterContext,
                          includeNotes: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Search notes</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(PRESET_FILTERS).map(([key, presetFn]) => {
                  const presetEngine = presetFn();
                  const presetConfig = presetEngine.exportConfig();

                  return (
                    <button
                      key={key}
                      onClick={() => handlePresetApply(key as keyof typeof PRESET_FILTERS)}
                      className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {presetEngine.getActiveFilterCount()} filters active
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <div className="flex flex-wrap gap-2">
            {(filters.statuses || []).map((status) => (
              <FilterChip
                key={`status-${status}`}
                label={`Status: ${status.replace('_', ' ')}`}
                onRemove={() => handleStatusChange(status, false)}
              />
            ))}
            {(filters.priorities || []).map((priority) => (
              <FilterChip
                key={`priority-${priority}`}
                label={`Priority: ${priority}`}
                onRemove={() => handlePriorityChange(priority, false)}
              />
            ))}
            {(filters.tags || []).slice(0, 3).map((tag) => (
              <FilterChip
                key={`tag-${tag}`}
                label={`Tag: ${tag}`}
                onRemove={() => handleTagChange(tag, false)}
              />
            ))}
            {(filters.tags || []).length > 3 && (
              <span className="text-xs text-gray-600 px-2 py-1">
                +{(filters.tags || []).length - 3} more tags
              </span>
            )}
            {filterContext.searchTerm && (
              <FilterChip
                label={`Search: "${filterContext.searchTerm}"`}
                onRemove={() => handleSearchChange('')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components

const PriorityIndicator: React.FC<{ priority: PlotCardPriority }> = ({ priority }) => {
  const colors = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    critical: 'text-red-500',
  };

  return <span className={`mr-1 ${colors[priority]}`}>●</span>;
};

const FilterChip: React.FC<{
  label: string;
  onRemove: () => void;
}> = ({ label, onRemove }) => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
    {label}
    <button onClick={onRemove} className="ml-1 text-blue-600 hover:text-blue-800">
      ×
    </button>
  </span>
);
