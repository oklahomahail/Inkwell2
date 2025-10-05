// Virtualized column component for performance with large card lists
// Uses @tanstack/react-virtual to efficiently render only visible cards while maintaining DnD

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useState, useMemo, useRef, useCallback } from 'react';

import { usePlotBoardStore } from '../store';
import { PlotColumn as PlotColumnType, PlotCard as PlotCardType } from '../types';

import { PlotCard } from './PlotCard';

interface VirtualizedColumnProps {
  column: PlotColumnType;
  cards: PlotCardType[];
  onEditCard?: (card: PlotCardType) => void;
  onAddCard?: (columnId: string) => void;
  onEditColumn?: (column: PlotColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  showSceneLinks?: boolean;
  showTimeline?: boolean;
  isCompact?: boolean;
  // Keyboard navigation props
  focusedCardId?: string | null;
  draggedCardId?: string | null;
  onCardFocus?: (cardId: string) => void;
  onKeyboardDragStart?: (cardId: string) => void;
  // Undo/redo props
  onBeforeCardDelete?: (cardId: string, cardTitle: string) => Promise<void>;
  onBeforeCardCreate?: (columnTitle: string, cardTitle: string) => Promise<void>;
  // Virtualization settings
  itemHeight?: number;
  maxHeight?: number;
  overscanCount?: number;
}

export const VirtualizedColumn: React.FC<VirtualizedColumnProps> = ({
  column,
  cards,
  onEditCard,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  showSceneLinks = true,
  showTimeline = true,
  isCompact = false,
  focusedCardId = null,
  draggedCardId = null,
  onCardFocus,
  onKeyboardDragStart,
  onBeforeCardDelete,
  onBeforeCardCreate,
  itemHeight = 140, // Estimated card height
  maxHeight = 600, // Max column height before virtualizing
  overscanCount = 5, // Cards to render outside visible area
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { deleteCard, createCard } = usePlotBoardStore();
  const parentRef = useRef<HTMLDivElement>(null);

  // Droppable area for cards
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  // Quick add card functionality
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = () => {
    if (onAddCard) {
      onAddCard(column.id);
    } else {
      setIsAddingCard(true);
    }
  };

  const handleQuickAdd = async () => {
    if (newCardTitle.trim()) {
      if (onBeforeCardCreate) {
        await onBeforeCardCreate(column.title, newCardTitle.trim());
      }
      await createCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleCancelAdd = () => {
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card && onBeforeCardDelete) {
      await onBeforeCardDelete(cardId, card.title);
    }
    await deleteCard(cardId);
  };

  const handleEditColumn = () => {
    if (onEditColumn) {
      onEditColumn(column);
    }
  };

  const handleDeleteColumn = () => {
    if (
      onDeleteColumn &&
      window.confirm(`Are you sure you want to delete "${column.title}" and all its cards?`)
    ) {
      onDeleteColumn(column.id);
    }
  };

  // Sort cards and get IDs for DnD context
  const sortedCards = useMemo(() => [...cards].sort((a, b) => a.order - b.order), [cards]);
  const cardIds = useMemo(() => sortedCards.map((card) => card.id), [sortedCards]);

  // Determine if virtualization is needed
  const shouldVirtualize = cards.length > 50;
  const listHeight = shouldVirtualize ? Math.min(maxHeight, cards.length * itemHeight) : 'auto';

  // Set up virtualizer for large lists
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? sortedCards.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: overscanCount,
  });

  // Scroll to focused card when it changes
  const scrollToCard = useCallback(
    (cardId: string) => {
      if (!shouldVirtualize) return;

      const cardIndex = sortedCards.findIndex((card) => card.id === cardId);
      if (cardIndex >= 0) {
        virtualizer.scrollToIndex(cardIndex);
      }
    },
    [shouldVirtualize, sortedCards, virtualizer],
  );

  // Scroll to focused card when it changes
  React.useEffect(() => {
    if (focusedCardId) {
      scrollToCard(focusedCardId);
    }
  }, [focusedCardId, scrollToCard]);

  // Column type styling
  const getColumnTypeIcon = (type: string): string => {
    switch (type) {
      case 'act':
        return '🎭';
      case 'chapter':
        return '📖';
      case 'character_arc':
        return '👤';
      case 'subplot':
        return '🧩';
      case 'theme':
        return '💭';
      default:
        return '📝';
    }
  };

  const columnClasses = `
    bg-gray-50 rounded-lg p-3 min-h-[200px] transition-all duration-200
    ${isOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
    ${isCompact ? 'min-h-[120px]' : ''}
  `.trim();

  return (
    <div className={columnClasses} style={{ backgroundColor: `${column.color}15` }}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1">
          <span className="text-lg">{getColumnTypeIcon(column.type)}</span>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 text-sm" style={{ color: column.color }}>
                {column.title}
              </h3>

              <span className="px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                {cards.length}
                {shouldVirtualize && (
                  <span className="ml-1 text-blue-600" title="Virtualized for performance">
                    ⚡
                  </span>
                )}
              </span>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={isCollapsed ? 'Expand column' : 'Collapse column'}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
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
              </button>
            </div>

            {column.description && !isCompact && (
              <p className="text-xs text-gray-600 mt-1">{column.description}</p>
            )}
          </div>
        </div>

        {/* Column Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleAddCard}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Add card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button
            onClick={handleEditColumn}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit column"
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
            onClick={handleDeleteColumn}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete column"
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

      {/* Quick Add Card Form */}
      {isAddingCard && !isCollapsed && (
        <div className="mb-3 p-2 bg-white rounded border-2 border-dashed border-gray-300">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Card title..."
            className="w-full text-sm border-none outline-none resize-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickAdd();
              } else if (e.key === 'Escape') {
                handleCancelAdd();
              }
            }}
          />
          <div className="flex items-center justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelAdd}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickAdd}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              disabled={!newCardTitle.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Cards Area */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`${isOver ? 'bg-blue-50' : ''} rounded p-1 transition-colors`}
          style={{ minHeight: shouldVirtualize ? listHeight : '100px' }}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {shouldVirtualize ? (
              // Virtualized list for performance
              <div
                ref={parentRef}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{
                  height: typeof listHeight === 'number' ? listHeight : 400,
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const card = sortedCards[virtualItem.index];
                    if (!card) return null;

                    return (
                      <div
                        key={card.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="px-1 py-1 h-full">
                          <PlotCard
                            card={card}
                            onEdit={onEditCard}
                            onDelete={handleDeleteCard}
                            showSceneLink={showSceneLinks}
                            showTimeline={showTimeline}
                            isFocused={focusedCardId === card.id}
                            isDraggedCard={draggedCardId === card.id}
                            onFocus={onCardFocus}
                            onKeyboardDragStart={onKeyboardDragStart}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Regular rendering for smaller lists
              <div className="space-y-2">
                {sortedCards.map((card) => (
                  <PlotCard
                    key={card.id}
                    card={card}
                    onEdit={onEditCard}
                    onDelete={handleDeleteCard}
                    showSceneLink={showSceneLinks}
                    showTimeline={showTimeline}
                    isFocused={focusedCardId === card.id}
                    isDraggedCard={draggedCardId === card.id}
                    onFocus={onCardFocus}
                    onKeyboardDragStart={onKeyboardDragStart}
                  />
                ))}
              </div>
            )}
          </SortableContext>

          {/* Empty State */}
          {cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xs text-center">Drop cards here or click + to add</p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex items-center justify-center py-4 text-gray-400">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">{cards.length}</span>
            <span className="text-xs">cards</span>
            {shouldVirtualize && <span className="text-xs text-blue-600">⚡ virtualized</span>}
          </div>
        </div>
      )}

      {/* Column Footer */}
      {!isCollapsed && !isCompact && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>{column.type.replace('_', ' ')}</span>
            {cards.length > 0 && (
              <span>
                {cards
                  .filter((c) => c.wordCount)
                  .reduce((sum, c) => sum + (c.wordCount || 0), 0)
                  .toLocaleString()}{' '}
                words
              </span>
            )}
          </div>
          {shouldVirtualize && (
            <div className="text-xs text-blue-600 mt-1">
              ⚡ Performance mode: {cards.length} cards virtualized
            </div>
          )}
        </div>
      )}
    </div>
  );
};
