// Individual Plot Card component with drag-and-drop support
// Displays story elements as draggable cards on the Kanban board

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';

import { useChaptersStore } from '../../../stores/useChaptersStore';
import { usePlotBoardStore } from '../store';
import { PlotCard as PlotCardType, PlotCardStatus, PlotCardPriority } from '../types';

interface PlotCardProps {
  card: PlotCardType;
  isDragOverlay?: boolean;
  onEdit?: (card: PlotCardType) => void;
  onDelete?: (cardId: string) => void;
  showSceneLink?: boolean;
  showTimeline?: boolean;
  isFocused?: boolean;
  isDraggedCard?: boolean;
  onFocus?: (cardId: string) => void;
  onKeyboardDragStart?: (cardId: string) => void;
}

export const PlotCard: React.FC<PlotCardProps> = ({
  card,
  isDragOverlay = false,
  onEdit,
  onDelete,
  showSceneLink = true,
  showTimeline = true,
  isFocused = false,
  isDraggedCard = false,
  onFocus,
  onKeyboardDragStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateCard } = usePlotBoardStore();
  const { chapters } = useChaptersStore();

  // Drag and drop setup
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Find linked scene/chapter info
  const linkedScene =
    card.sceneId && card.chapterId
      ? (chapters as any)[card.chapterId]?.scenes?.find((s: any) => s.id === card.sceneId)
      : null;
  const linkedChapter = card.chapterId ? (chapters as any)[card.chapterId] : null;

  // Status and priority styling
  const getStatusColor = (status: PlotCardStatus): string => {
    switch (status) {
      case PlotCardStatus.IDEA:
        return 'bg-gray-100 text-gray-700';
      case PlotCardStatus.OUTLINED:
        return 'bg-blue-100 text-blue-700';
      case PlotCardStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-700';
      case PlotCardStatus.REVISION:
        return 'bg-orange-100 text-orange-700';
      case PlotCardStatus.COMPLETE:
        return 'bg-green-100 text-green-700';
      case PlotCardStatus.CUT:
        return 'bg-red-100 text-red-700 line-through';
    }
  };

  const getPriorityColor = (priority: PlotCardPriority): string => {
    switch (priority) {
      case PlotCardPriority.LOW:
        return 'border-l-2 border-gray-300';
      case PlotCardPriority.MEDIUM:
        return 'border-l-2 border-blue-400';
      case PlotCardPriority.HIGH:
        return 'border-l-2 border-orange-400';
      case PlotCardPriority.CRITICAL:
        return 'border-l-2 border-red-500';
    }
  };

  const handleStatusChange = async (newStatus: PlotCardStatus) => {
    await updateCard(card.id, { status: newStatus });
  };

  const handlePriorityChange = async (newPriority: PlotCardPriority) => {
    await updateCard(card.id, { priority: newPriority });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(card);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id);
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 p-3
    ${getPriorityColor(card.priority)}
    ${card.color ? `border-l-4` : ''}
    ${isDragOverlay ? 'shadow-lg rotate-3' : ''}
    ${isDragging ? 'opacity-50' : ''}
    ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    ${isDraggedCard ? 'bg-blue-50 border-blue-300' : ''}
    cursor-grab active:cursor-grabbing focus:outline-none
  `.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      {...attributes}
      {...listeners}
      tabIndex={isFocused ? 0 : -1}
      role="button"
      aria-label={`Plot card: ${card.title}. Status: ${card.status}. Priority: ${card.priority}. ${card.description ? `Description: ${card.description}` : ''}`}
      aria-describedby={`card-${card.id}-details`}
      aria-grabbed={isDraggedCard}
      onFocus={() => onFocus?.(card.id)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onKeyboardDragStart?.(card.id);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleEdit();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">{card.title}</h4>
        <div className="flex items-center space-x-1 ml-2">
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(card.status)}`}>
            {card.status.replace('_', ' ')}
          </span>

          {/* Actions */}
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit card"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete card"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{card.description}</p>
      )}

      {/* Scene/Chapter Link */}
      {showSceneLink && linkedScene && linkedChapter && (
        <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
          <div className="flex items-center text-blue-700">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="font-medium">{linkedChapter.title}</span>
          </div>
          <div className="text-blue-600 ml-4">{linkedScene.title}</div>
        </div>
      )}

      {/* Timeline Events */}
      {showTimeline && card.timelineEventIds && card.timelineEventIds.length > 0 && (
        <div className="mb-2 p-2 bg-purple-50 rounded text-xs">
          <div className="flex items-center text-purple-700">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{card.timelineEventIds.length} timeline event(s)</span>
          </div>
        </div>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{card.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Word Count */}
      {card.wordCount && (
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{card.wordCount.toLocaleString()} words</span>
        </div>
      )}

      {/* Expand/Collapse for notes */}
      {card.notes && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              className={`w-3 h-3 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Notes
          </button>

          {isExpanded && (
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700">{card.notes}</div>
          )}
        </div>
      )}

      {/* Priority Selector (quick actions) */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <select
          value={card.status}
          onChange={(e) => handleStatusChange(e.target.value as PlotCardStatus)}
          className="text-xs border-none bg-transparent text-gray-600 focus:outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.values(PlotCardStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={card.priority}
          onChange={(e) => handlePriorityChange(e.target.value as PlotCardPriority)}
          className="text-xs border-none bg-transparent text-gray-600 focus:outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.values(PlotCardPriority).map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      {/* Last updated */}
      <div className="text-xs text-gray-400 mt-1">
        Updated {new Date(card.updatedAt).toLocaleDateString()}
      </div>

      {/* Screen reader details */}
      <div id={`card-${card.id}-details`} className="sr-only">
        {linkedScene && linkedChapter && (
          <span>
            Linked to scene: {linkedScene.title} in chapter: {linkedChapter.title}.{' '}
          </span>
        )}
        {card.timelineEventIds && card.timelineEventIds.length > 0 && (
          <span>{card.timelineEventIds.length} timeline events linked. </span>
        )}
        {card.tags.length > 0 && <span>Tags: {card.tags.join(', ')}. </span>}
        {card.wordCount && <span>Word count: {card.wordCount}. </span>}
        {card.notes && <span>Has notes. </span>}
        <span>Use arrow keys to navigate, Space to pick up, Enter to edit.</span>
      </div>
    </div>
  );
};
