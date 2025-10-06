// src/components/ProjectBrowser/EnhancedProjectBrowser.tsx
import {
  Search,
  Filter,
  Star,
  StarOff,
  Heart,
  Clock,
  FileText,
  MoreVertical,
  Copy,
  Edit3,
  Trash2,
  Download,
  Tag,
  Plus,
  X,
  Calendar,
  BarChart3,
  BookOpen,
  Zap,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import {
  useProjectMetadata,
  formatTimeSpent,
  getRelativeTimeString,
  getProjectColorClass,
} from '@/hooks/useProjectMetadata';
import { useProjectSearch } from '@/hooks/useProjectSearch';

import { Project } from '../../domain/types';

interface EnhancedProjectBrowserProps {
  onProjectSelect?: (project: Project) => void;
  compact?: boolean;
}

const EnhancedProjectBrowser: React.FC<EnhancedProjectBrowserProps> = ({
  onProjectSelect,
  compact = false,
}) => {
  const { state, currentProject, setCurrentProjectId, updateProject, deleteProject, dispatch } =
    useAppContext();
  const {
    getProjectMetadata,
    toggleFavorite,
    addTag,
    removeTag,
    getAllTags: _getAllTags,
    recordProjectOpen,
  } = useProjectMetadata();

  const {
    results,
    filters,
    filterOptions,
    setQuery,
    toggleTag: toggleFilterTag,
    toggleGenre,
    toggleFavorites,
    clearFilters,
    setSorting,
    applyQuickFilter,
    searchStats,
  } = useProjectSearch(state.projects as any);

  const [showFilters, setShowFilters] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    project: Project;
    x: number;
    y: number;
  } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [editingTags, setEditingTags] = useState<string | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  // Focus tag input when editing starts
  useEffect(() => {
    if (editingTags && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [editingTags]);

  const handleProjectClick = (project: Project) => {
    recordProjectOpen(project.id);
    setCurrentProjectId(project.id);
    onProjectSelect?.(project);
    dispatch({ type: 'SET_VIEW', payload: View.Writing });
  };

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      project,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleProjectAction = (action: string, project: Project) => {
    setContextMenu(null);

    switch (action) {
      case 'favorite':
        toggleFavorite(project.id);
        break;
      case 'duplicate':
        // TODO: Implement duplicate functionality
        console.log('Duplicate project:', project.name);
        break;
      case 'rename':
        const newName = prompt('Enter new project name:', project.name);
        if (newName && newName.trim() && newName !== project.name) {
          updateProject({
            ...project,
            name: newName.trim(),
            updatedAt: new Date(),
          } as any);
        }
        break;
      case 'delete':
        const confirmed = confirm(
          `Are you sure you want to delete "${project.name}"? This cannot be undone.`,
        );
        if (confirmed) {
          deleteProject(project.id);
        }
        break;
      case 'export':
        // TODO: Implement export functionality
        console.log('Export project:', project.name);
        break;
      case 'edit-tags':
        setEditingTags(project.id);
        break;
    }
  };

  const handleAddTag = (projectId: string, tag: string) => {
    if (tag.trim()) {
      addTag(projectId, tag.trim());
    }
    setTagInput('');
    setEditingTags(null);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      handleAddTag(projectId, tagInput);
    } else if (e.key === 'Escape') {
      setTagInput('');
      setEditingTags(null);
    }
  };

  const getProjectWordCount = (project: Project): number => {
    return project.metadata?.totalWordCount || 0;
  };

  const getGenreIcon = (genre: string) => {
    const genreIcons: Record<string, React.ElementType> = {
      Mystery: Zap,
      Romance: Heart,
      'Science Fiction': BookOpen,
      Fantasy: Star,
      Thriller: FileText,
    };
    return genreIcons[genre] || FileText;
  };

  const renderProjectCard = (result: {
    project: Project;
    relevanceScore: number;
    matchedFields: string[];
  }) => {
    const { project, matchedFields } = result;
    const metadata = getProjectMetadata(project.id);
    const wordCount = getProjectWordCount(project);
    const genre = project.metadata?.genre;
    const GenreIcon = genre ? getGenreIcon(genre) : FileText;

    return (
      <div
        key={project.id}
        className={`group card card-interactive p-4 ${
          currentProject?.id === project.id ? 'ring-2 ring-primary-500' : ''
        }`}
        onClick={() => handleProjectClick(project)}
        onContextMenu={(e) => handleContextMenu(e, project)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Project Icon/Color */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getProjectColorClass(metadata.customColor)}`}
            >
              <GenreIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {project.name}
                </h3>
                {metadata.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                )}
              </div>

              {project.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {project.description}
                </p>
              )}

              {/* Tags */}
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {metadata.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {metadata.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{metadata.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(project.id);
              }}
              className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
              title={metadata.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {metadata.isFavorite ? (
                <Star className="w-4 h-4 fill-current" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => handleContextMenu(e, project)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{getRelativeTimeString(project.updatedAt.getTime())}</span>
          </div>
          {metadata.totalTimeSpent > 0 && (
            <>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                <span>{formatTimeSpent(metadata.totalTimeSpent)} writing</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{metadata.openCount} sessions</span>
              </div>
            </>
          )}
        </div>

        {/* Match highlights */}
        {matchedFields.length > 0 && (
          <div className="text-xs text-primary-600 dark:text-primary-400 border-t border-slate-200 dark:border-slate-700 pt-2">
            Matched: {matchedFields.join(', ')}
          </div>
        )}

        {/* Tag editing */}
        {editingTags === project.id && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <div className="flex items-center gap-2">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleTagKeyPress(e, project.id)}
                placeholder="Add a tag..."
                className="flex-1 text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <button
                onClick={() => handleAddTag(project.id, tagInput)}
                className="p-1 text-primary-600 hover:text-primary-700"
                disabled={!tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTagInput('');
                  setEditingTags(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group/tag"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(project.id, tag)}
                      className="ml-1 text-slate-400 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="enhanced-project-browser">
      {/* Search and Filters Header */}
      <div className="mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, content, tags..."
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {searchStats.hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {[filters.tags.length, filters.genres.length, filters.favorites ? 1 : 0].reduce(
                  (sum, count) => sum + count,
                  0,
                )}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Sort:</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  typeof filters.sortBy,
                  typeof filters.sortOrder,
                ];
                setSorting(sortBy, sortOrder);
              }}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="updated-desc">Recently Updated</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="wordCount-desc">Most Words</option>
              <option value="wordCount-asc">Least Words</option>
              <option value="lastOpened-desc">Recently Opened</option>
              <option value="timeSpent-desc">Most Time Spent</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button onClick={() => applyQuickFilter('recent')} className="btn btn-ghost btn-sm">
              <Clock className="w-4 h-4" />
              Recent
            </button>
            <button onClick={() => applyQuickFilter('favorites')} className="btn btn-ghost btn-sm">
              <Star className="w-4 h-4" />
              Favorites
            </button>
            <button onClick={() => applyQuickFilter('mostWorked')} className="btn btn-ghost btn-sm">
              <BarChart3 className="w-4 h-4" />
              Most Worked
            </button>
          </div>

          {searchStats.hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            {/* Tags Filter */}
            {filterOptions.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleFilterTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genres Filter */}
            {filterOptions.genres.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        filters.genres.includes(genre)
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Toggle */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.favorites}
                  onChange={toggleFavorites}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Show only favorites
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Search Stats */}
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Showing {searchStats.totalResults} of {searchStats.totalProjects} projects
          {searchStats.filteredOut > 0 && <span> ({searchStats.filteredOut} filtered out)</span>}
        </div>
      </div>

      {/* Project Grid */}
      <div
        className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
      >
        {results.map(renderProjectCard)}
      </div>

      {/* Empty State */}
      {results.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
            {searchStats.hasActiveFilters ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchStats.hasActiveFilters
              ? 'Try adjusting your search terms or filters'
              : 'Create your first project to get started'}
          </p>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => handleProjectAction('favorite', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            {getProjectMetadata(contextMenu.project.id).isFavorite ? (
              <>
                <StarOff className="w-4 h-4" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                Add to Favorites
              </>
            )}
          </button>
          <button
            onClick={() => handleProjectAction('edit-tags', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Edit Tags
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          <button
            onClick={() => handleProjectAction('duplicate', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => handleProjectAction('rename', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={() => handleProjectAction('export', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          <button
            onClick={() => handleProjectAction('delete', contextMenu.project)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedProjectBrowser;
