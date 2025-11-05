/**
 * ChapterListItem
 *
 * Individual chapter item in the list with drag-and-drop, inline editing,
 * and status display.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Trash2, Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import type { Chapter } from '@/types/project';

export interface ChapterListItemProps {
  chapter: Chapter;
  isActive?: boolean;
  isCollapsed?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onToggleCollapse?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

export default function ChapterListItem({
  chapter,
  isActive = false,
  isCollapsed = false,
  isDragging = false,
  onSelect,
  onDelete,
  onToggleCollapse,
  onTitleChange,
}: ChapterListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sortable hook from dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: chapter.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== chapter.title) {
      onTitleChange?.(trimmed);
    } else {
      setEditedTitle(chapter.title); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(chapter.title);
      setIsEditing(false);
    }
  };

  const getStatusBadge = () => {
    const badges: Record<Chapter['status'], { label: string; className: string }> = {
      planned: { label: 'Planned', className: 'bg-gray-100 text-gray-700' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      'first-draft': { label: 'Draft', className: 'bg-yellow-100 text-yellow-700' },
      revised: { label: 'Revised', className: 'bg-purple-100 text-purple-700' },
      completed: { label: 'Done', className: 'bg-green-100 text-green-700' },
    };

    const badge = badges[chapter.status];
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-lg border transition-all
        ${isActive ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}
        ${isSortableDragging || isDragging ? 'shadow-lg scale-105' : ''}
      `}
    >
      {/* Main Content */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-gray-600"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Title (editable on double-click) */}
        <div className="flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chapter title"
              />
              <button
                onClick={handleSaveTitle}
                className="text-green-600 hover:text-green-700"
                aria-label="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onSelect} className="w-full text-left truncate" title={chapter.title}>
              <div className="font-medium text-sm truncate">
                {chapter.title || 'Untitled Chapter'}
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
            aria-label="Delete chapter"
            title="Delete chapter"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {!isCollapsed && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{chapter.wordCount.toLocaleString()} words</span>
            {getStatusBadge()}
          </div>

          {/* Summary (if exists) */}
          {chapter.summary && (
            <p className="text-xs text-gray-500 line-clamp-2">{chapter.summary}</p>
          )}

          {/* Target Word Count (if set) */}
          {chapter.targetWordCount && (
            <div className="text-xs text-gray-500">
              Target: {chapter.targetWordCount.toLocaleString()} words
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min((chapter.wordCount / chapter.targetWordCount) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
