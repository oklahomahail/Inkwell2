// Saved views selector component for Plot Boards
// Allows users to switch between, create, and manage saved views

import React, { useState, useRef, useEffect } from 'react';

import { SavedViewData, SavedViewManager } from '../../views/savedViews';

interface SavedViewsSelectorProps {
  viewManager: SavedViewManager;
  currentView: SavedViewData | null;
  onViewChange: (viewId: string) => void;
  onCreateView: (name: string) => Promise<void>;
  onUpdateView: (viewId: string, name: string) => Promise<void>;
  onDeleteView: (viewId: string) => Promise<void>;
  onDuplicateView: (viewId: string) => Promise<void>;
  className?: string;
}

export const SavedViewsSelector: React.FC<SavedViewsSelectorProps> = ({
  viewManager,
  currentView,
  onViewChange,
  onCreateView,
  onUpdateView,
  onDeleteView,
  onDuplicateView,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [showManagement, setShowManagement] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Get all views
  const allViews = viewManager.getAllViews();
  const defaultViews = allViews.filter((v) => v.view.isDefault);
  const customViews = allViews.filter((v) => !v.view.isDefault);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingViewId(null);
        setShowManagement(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingViewId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingViewId]);

  const handleViewSelect = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
    setShowManagement(false);
  };

  const handleStartEditing = (viewId: string, currentName: string) => {
    setEditingViewId(viewId);
    setEditingName(currentName);
  };

  const handleSaveEdit = async () => {
    if (editingViewId && editingName.trim()) {
      try {
        await onUpdateView(editingViewId, editingName.trim());
        setEditingViewId(null);
        setEditingName('');
      } catch (error) {
        console.error('Failed to update view:', error);
        // Could show toast notification here
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingViewId(null);
    setEditingName('');
  };

  const handleCreateView = async () => {
    if (newViewName.trim()) {
      try {
        await onCreateView(newViewName.trim());
        setIsCreating(false);
        setNewViewName('');
        setShowManagement(false);
      } catch (error) {
        console.error('Failed to create view:', error);
        // Could show toast notification here
      }
    }
  };

  const handleDeleteView = async (viewId: string) => {
    if (window.confirm('Are you sure you want to delete this view?')) {
      try {
        await onDeleteView(viewId);
      } catch (error) {
        console.error('Failed to delete view:', error);
      }
    }
  };

  const handleDuplicateView = async (viewId: string) => {
    try {
      await onDuplicateView(viewId);
      setShowManagement(false);
    } catch (error) {
      console.error('Failed to duplicate view:', error);
    }
  };

  const handleExportView = (viewId: string) => {
    const exportData = viewManager.exportView(viewId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plot-view-${viewId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* View Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span>{currentView?.view.name || 'Select View'}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Saved Views</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowManagement(!showManagement)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    showManagement
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Manage
                </button>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + New
                </button>
              </div>
            </div>
          </div>

          {/* Views List */}
          <div className="max-h-80 overflow-y-auto">
            {/* Default Views */}
            {defaultViews.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Default Views
                </div>
                {defaultViews.map((viewData) => (
                  <ViewItem
                    key={viewData.view.id}
                    viewData={viewData}
                    isActive={currentView?.view.id === viewData.view.id}
                    isEditing={editingViewId === viewData.view.id}
                    editingName={editingName}
                    showManagement={showManagement}
                    onSelect={handleViewSelect}
                    onStartEditing={handleStartEditing}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDelete={handleDeleteView}
                    onDuplicate={handleDuplicateView}
                    onExport={handleExportView}
                    onEditNameChange={setEditingName}
                    editInputRef={editInputRef}
                  />
                ))}
              </div>
            )}

            {/* Custom Views */}
            {customViews.length > 0 && (
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Custom Views ({customViews.length})
                </div>
                {customViews.map((viewData) => (
                  <ViewItem
                    key={viewData.view.id}
                    viewData={viewData}
                    isActive={currentView?.view.id === viewData.view.id}
                    isEditing={editingViewId === viewData.view.id}
                    editingName={editingName}
                    showManagement={showManagement}
                    onSelect={handleViewSelect}
                    onStartEditing={handleStartEditing}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDelete={handleDeleteView}
                    onDuplicate={handleDuplicateView}
                    onExport={handleExportView}
                    onEditNameChange={setEditingName}
                    editInputRef={editInputRef}
                  />
                ))}
              </div>
            )}

            {/* Create New View Form */}
            {isCreating && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      View Name
                    </label>
                    <input
                      type="text"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="Enter view name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateView();
                        } else if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewViewName('');
                        }
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This will save the current filters and settings
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewViewName('');
                      }}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateView}
                      disabled={!newViewName.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {customViews.length === 0 && !isCreating && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <p>No custom views yet</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first view
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Views save your current filters, search, and layout settings
          </div>
        </div>
      )}
    </div>
  );
};

// View Item Component
interface ViewItemProps {
  viewData: SavedViewData;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  showManagement: boolean;
  onSelect: (viewId: string) => void;
  onStartEditing: (viewId: string, name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (viewId: string) => void;
  onDuplicate: (viewId: string) => void;
  onExport: (viewId: string) => void;
  onEditNameChange: (name: string) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
}

const ViewItem: React.FC<ViewItemProps> = ({
  viewData,
  isActive,
  isEditing,
  editingName,
  showManagement,
  onSelect,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDuplicate,
  onExport,
  onEditNameChange,
  editInputRef,
}) => {
  // Count active filters
  const activeFilters =
    Object.values(viewData.view.filters).reduce((count, filter) => {
      if (Array.isArray(filter)) return count + filter.length;
      if (filter) return count + 1;
      return count;
    }, 0) + (viewData.filterContext.searchTerm ? 1 : 0);

  return (
    <div
      className={`group px-4 py-2 hover:bg-gray-50 ${
        isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                ref={editInputRef}
                type="text"
                value={editingName}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit();
                  } else if (e.key === 'Escape') {
                    onCancelEdit();
                  }
                }}
              />
              <button onClick={onSaveEdit} className="text-green-600 hover:text-green-800 text-xs">
                ✓
              </button>
              <button onClick={onCancelEdit} className="text-red-600 hover:text-red-800 text-xs">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => onSelect(viewData.view.id)} className="text-left w-full">
              <div className="text-sm font-medium text-gray-900 truncate">
                {viewData.view.name}
                {isActive && <span className="ml-2 text-xs text-blue-600">✓</span>}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {activeFilters > 0 && (
                  <span>
                    {activeFilters} filter{activeFilters !== 1 ? 's' : ''}
                  </span>
                )}
                {viewData.view.sorting && <span>Sort: {viewData.view.sorting.field}</span>}
                {viewData.view.grouping.enabled && (
                  <span>Group: {viewData.view.grouping.field}</span>
                )}
                {viewData.view.isDefault && (
                  <span className="px-1 bg-gray-200 rounded text-gray-600">Default</span>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Management Actions */}
        {showManagement && !isEditing && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!viewData.view.isDefault && (
              <button
                onClick={() => onStartEditing(viewData.view.id, viewData.view.name)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1"
                title="Rename"
              >
                ✏️
              </button>
            )}
            <button
              onClick={() => onDuplicate(viewData.view.id)}
              className="text-gray-400 hover:text-gray-600 text-xs p-1"
              title="Duplicate"
            >
              📋
            </button>
            <button
              onClick={() => onExport(viewData.view.id)}
              className="text-gray-400 hover:text-gray-600 text-xs p-1"
              title="Export"
            >
              📤
            </button>
            {!viewData.view.isDefault && (
              <button
                onClick={() => onDelete(viewData.view.id)}
                className="text-gray-400 hover:text-red-600 text-xs p-1"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
