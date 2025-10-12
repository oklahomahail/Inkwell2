// File: PlotBoard/components/PlotCard.tsx
// Individual Plot Card component with drag-and-drop support
// Displays story elements as draggable cards on the Kanban board

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState, KeyboardEvent } from 'react';

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

// tiny, dependency-free class combiner
function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Linked scene/chapter
  const linkedChapter = card.chapterId ? ((chapters as any)?.[card.chapterId] ?? null) : null;
  const linkedScene =
    card.sceneId && linkedChapter?.scenes
      ? ((linkedChapter.scenes as any[]).find((s: any) => s?.id === card.sceneId) ?? null)
      : null;

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
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityClass = (priority: PlotCardPriority): string => {
    switch (priority) {
      case 'low':
        return 'border-l-2 border-gray-300';
      case 'medium':
        return 'border-l-2 border-blue-400';
      case 'high':
        return 'border-l-2 border-orange-400';
      case 'critical':
        return 'border-l-2 border-red-500';
      default:
        return '';
    }
  };

  const handleStatusChange = async (newStatus: PlotCardStatus) => {
    await updateCard(card.id, { status: newStatus });
  };

  const handlePriorityChange = async (newPriority: PlotCardPriority) => {
    await updateCard(card.id, { priority: newPriority });
  };

  const handleEdit = () => {
    onEdit?.(card);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id);
    }
  };

  const cardClasses = classNames(
    'bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 p-3 cursor-grab active:cursor-grabbing focus:outline-none',
    getPriorityClass(card.priority),
    isDragOverlay && 'shadow-lg rotate-3',
    isDragging && 'opacity-50',
    isFocused && 'ring-2 ring-blue-500 ring-offset-2',
    isDraggedCard && 'bg-blue-50 border-blue-300',
    card.color && 'border-l-4',
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      onKeyboardDragStart?.(card.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      {...attributes}
      {...listeners}
      tabIndex={isFocused ? 0 : -1}
      role="button"
      aria-label={`Plot card: ${card.title}. Status: ${card.status}. Priority: ${card.priority}.${
        card.description ? ` Description: ${card.description}` : ''
      }`}
      aria-describedby={`card-${card.id}-details`}
      aria-grabbed={isDraggedCard || isDragging}
      onFocus={() => onFocus?.(card.id)}
      onKeyDown={onKeyDown}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <h4 className="flex-1 text-sm font-medium leading-tight text-gray-900">{card.title}</h4>
        <div className="ml-2 flex items-center space-x-1">
          {/* Status Badge */}
          <span
            className={classNames('rounded-full px-2 py-1 text-xs', getStatusColor(card.status))}
          >
            {String(card.status).replace('_', ' ')}
          </span>

          {/* Actions */}
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            title="Edit card"
            aria-label="Edit card"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
            className="p-1 text-gray-400 transition-colors hover:text-red-600"
            title="Delete card"
            aria-label="Delete card"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
      {card.description ? (
        <p className="mb-2 line-clamp-2 text-xs text-gray-600">{card.description}</p>
      ) : null}

      {/* Scene/Chapter Link */}
      {showSceneLink && linkedScene && linkedChapter ? (
        <div className="mb-2 rounded bg-blue-50 p-2 text-xs">
          <div className="flex items-center text-blue-700">
            <svg
              className="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="font-medium">{linkedChapter.title}</span>
          </div>
          <div className="ml-4 text-blue-600">{linkedScene.title}</div>
        </div>
      ) : null}

      {/* Timeline Events */}
      {showTimeline && Array.isArray(card.timelineEventIds) && card.timelineEventIds.length > 0 ? (
        <div className="mb-2 rounded bg-purple-50 p-2 text-xs">
          <div className="flex items-center text-purple-700">
            <svg
              className="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
      ) : null}

      {/* Tags */}
      {Array.isArray(card.tags) && card.tags.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {tag}
            </span>
          ))}
          {card.tags.length > 3 ? (
            <span className="text-xs text-gray-500">+{card.tags.length - 3} more</span>
          ) : null}
        </div>
      ) : null}

      {/* Word Count */}
      {typeof card.wordCount === 'number' ? (
        <div className="flex items-center text-xs text-gray-500">
          <svg
            className="mr-1 h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{card.wordCount.toLocaleString()} words</span>
        </div>
      ) : null}

      {/* Notes */}
      {card.notes ? (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
            aria-expanded={isExpanded}
            aria-controls={`card-${card.id}-notes`}
          >
            <svg
              className={classNames('mr-1 h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Notes
          </button>

          {isExpanded ? (
            <div
              id={`card-${card.id}-notes`}
              className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700"
            >
              {card.notes}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
        <select
          value={card.status}
          onChange={(e) => handleStatusChange(e.target.value as PlotCardStatus)}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer bg-transparent text-xs text-gray-600 focus:outline-none"
          aria-label="Change status"
        >
          {Object.values(PlotCardStatus).map((status) => (
            <option key={status} value={status}>
              {String(status).replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={card.priority}
          onChange={(e) => handlePriorityChange(e.target.value as PlotCardPriority)}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer bg-transparent text-xs text-gray-600 focus:outline-none"
          aria-label="Change priority"
        >
          {Object.values(PlotCardPriority).map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      {/* Last updated */}
      {card.updatedAt ? (
        <div className="mt-1 text-xs text-gray-400">
          Updated {new Date(card.updatedAt).toLocaleDateString()}
        </div>
      ) : null}

      {/* Screen reader details */}
      <div id={`card-${card.id}-details`} className="sr-only">
        {linkedScene && linkedChapter ? (
          <span>
            Linked to scene: {linkedScene.title} in chapter: {linkedChapter.title}.{' '}
          </span>
        ) : null}
        {Array.isArray(card.timelineEventIds) && card.timelineEventIds.length > 0 ? (
          <span>{card.timelineEventIds.length} timeline events linked. </span>
        ) : null}
        {Array.isArray(card.tags) && card.tags.length > 0 ? (
          <span>Tags: {card.tags.join(', ')}. </span>
        ) : null}
        {typeof card.wordCount === 'number' ? <span>Word count: {card.wordCount}. </span> : null}
        {card.notes ? <span>Has notes. </span> : null}
        <span>Use arrow keys to navigate, Space to pick up, Enter to edit.</span>
      </div>
    </div>
  );
};
