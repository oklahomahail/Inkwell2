// Main Plot Board component
// Kanban-style visualization for story structure and scene organization

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useState, useCallback } from 'react';

import { useKeyboardNavigation, useAriaLiveRegion } from '../hooks/useKeyboardNavigation';
import { useUndoRedo, createOperationDescription } from '../hooks/useUndoRedo';
import { usePlotBoardStore } from '../store';
import {
  PlotBoard as PlotBoardType,
  PlotColumn as PlotColumnType,
  PlotCard as PlotCardType,
} from '../types';

import { AccessibilityRegion } from './AccessibilityAnnouncer';
import { PlotCard } from './PlotCard';
import { PlotColumn } from './PlotColumn';
import { UndoRedoControls } from './UndoRedoControls';
import { VirtualizedColumn } from './VirtualizedColumn';

// PlotBoard types and interfaces
import type { CardEventHandlers } from '../types/handlers';
// Used in other components
type _DragEvent = DragStartEvent | DragEndEvent | DragOverEvent;

interface PlotBoardProps extends CardEventHandlers {
  board: PlotBoardType;
  className?: string;
  onEditBoard?: (board: PlotBoardType) => void;
}

export const PlotBoard: React.FC<PlotBoardProps> = ({
  board,
  onEditCard,
  onEditColumn,
  onEditBoard,
  className = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBeforeCardCreate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBeforeCardDelete,
}) => {
  // Store actions
  const { moveCard, reorderColumns, deleteColumn, createColumn, updateBoard } = usePlotBoardStore();

  // Drag state
  const [activeCard, setActiveCard] = useState<PlotCardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<PlotColumnType | null>(null);

  // Keyboard navigation and accessibility
  const keyboardNav = useKeyboardNavigation({
    board,
    onMoveCard: async (cardId: string, targetColumnId: string, newOrder: number) => {
      await moveCard(cardId, targetColumnId, newOrder);
    },
    onReorderColumns: async (columnIds: string[]) => {
      await reorderColumns(board.id, columnIds);
    },
  });

  // ARIA live announcements
  const currentAnnouncement = useAriaLiveRegion(keyboardNav.announcements);

  // Clear announcements periodically
  React.useEffect(() => {
    if (keyboardNav.announcements.length > 0) {
      const timer = setTimeout(() => {
        keyboardNav.clearAnnouncements();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return () => {}; // Always return cleanup function
  }, [keyboardNav.announcements, keyboardNav]);

  // Undo/Redo system
  const undoRedo = useUndoRedo(board.id, async (restoredBoard) => {
    await updateBoard(board.id, restoredBoard);
    keyboardNav.announce(`Restored board state: ${restoredBoard.title}`);
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Sort columns by order
  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);
  const columnIds = sortedColumns.map((col) => col.id);

  // Helper to find card and its column
  const findCardAndColumn = useCallback(
    (cardId: string) => {
      for (const column of board.columns) {
        const card = column.cards.find((c) => c.id === cardId);
        if (card) {
          return { card, column };
        }
      }
      return null;
    },
    [board.columns],
  );

  // Drag start handler
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Check if dragging a card
    const cardResult = findCardAndColumn(active.id as string);
    if (cardResult) {
      setActiveCard(cardResult.card);
      keyboardNav.announce(`Started dragging card: ${cardResult.card.title}`);
      return;
    }

    // Check if dragging a column
    const column = board.columns.find((col) => col.id === active.id);
    if (column) {
      setActiveColumn(column);
      keyboardNav.announce(`Started dragging column: ${column.title}`);
    }
  };

  // Drag over handler (for visual feedback)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Handle card dragging over columns
    const activeCardResult = findCardAndColumn(active.id as string);
    if (activeCardResult) {
      const { card } = activeCardResult;
      const overColumn = board.columns.find((col) => col.id === over.id);

      if (overColumn && card.columnId !== overColumn.id) {
        // Visual feedback handled by CSS in PlotColumn
      }
    }
  };

  // Drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    setActiveColumn(null);

    if (!over || active.id === over.id) return;

    try {
      // Handle card movement
      const activeCardResult = findCardAndColumn(active.id as string);
      if (activeCardResult) {
        const { card } = activeCardResult;

        // Find destination column
        let destinationColumnId = over.id as string;
        let newOrder = 0;

        // Check if dropping over another card
        const overCardResult = findCardAndColumn(over.id as string);
        if (overCardResult) {
          destinationColumnId = overCardResult.column.id;
          newOrder = overCardResult.card.order;
        } else {
          // Dropping at end of column
          const destColumn = board.columns.find((col) => col.id === destinationColumnId);
          if (destColumn) {
            newOrder = destColumn.cards.length;
          }
        }

        // Get destination column for announcements and undo
        const destinationColumn = board.columns.find((col) => col.id === destinationColumnId);

        // Save state before the move for undo
        const sourceColumn = board.columns.find((col) => col.cards.some((c) => c.id === card.id));

        await undoRedo.pushEntry(
          'moveCard',
          board,
          createOperationDescription.moveCard(
            card.title,
            sourceColumn?.title || 'Unknown',
            destinationColumn?.title || 'Unknown',
          ),
          { cardId: card.id, sourceColumnId: sourceColumn?.id, destinationColumnId, newOrder },
        );

        await moveCard(card.id, destinationColumnId, newOrder);

        // Announce the move
        keyboardNav.announce(
          `Moved card "${card.title}" to column "${destinationColumn?.title || 'Unknown'}" at position ${newOrder + 1}`,
        );
        return;
      }

      // Handle column reordering
      const activeColumn = board.columns.find((col) => col.id === active.id);
      const overColumn = board.columns.find((col) => col.id === over.id);

      if (activeColumn && overColumn) {
        const oldIndex = sortedColumns.findIndex((col) => col.id === activeColumn.id);
        const newIndex = sortedColumns.findIndex((col) => col.id === overColumn.id);

        if (oldIndex !== newIndex) {
          // Save state before reordering for undo
          await undoRedo.pushEntry(
            'reorderColumns',
            board,
            createOperationDescription.reorderColumns([
              activeColumn.title,
              `position ${newIndex + 1}`,
            ]),
            { activeColumnId: activeColumn.id, oldIndex, newIndex },
          );

          const reorderedColumns = arrayMove(sortedColumns, oldIndex, newIndex);
          const newColumnIds = reorderedColumns.map((col) => col.id);
          await reorderColumns(board.id, newColumnIds);

          keyboardNav.announce(`Moved column "${activeColumn.title}" to position ${newIndex + 1}`);
        }
      }
    } catch (error) {
      console.error('Drag operation failed:', error);
    }
  };

  // Column management
  const handleDeleteColumn = async (columnId: string) => {
    const column = board.columns.find((col) => col.id === columnId);
    if (!column) return;

    // Save state before deletion for undo
    await undoRedo.pushEntry(
      'deleteColumn',
      board,
      createOperationDescription.deleteColumn(column.title, column.cards.length),
      { columnId, columnData: column },
    );

    await deleteColumn(columnId);
    keyboardNav.announce(`Deleted column "${column.title}"`);
  };

  const handleAddColumn = async () => {
    const title = prompt('Column title:');
    if (title) {
      // Save state before creation for undo
      await undoRedo.pushEntry(
        'createColumn',
        board,
        createOperationDescription.createColumn(title),
        { title },
      );

      await createColumn(board.id, title);
      keyboardNav.announce(`Added column "${title}"`);
    }
  };

  // Board settings
  const { settings } = board;

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      role="application"
      aria-label={`Plot board: ${board.title}`}
      aria-describedby="plot-board-instructions"
    >
      {/* Screen reader instructions */}
      <div id="plot-board-instructions" className="sr-only">
        Use arrow keys to navigate between cards. Press Space to pick up a card, navigate to
        destination, then press Space again to drop. Press Enter to edit a card. Press Escape to
        cancel drag operations.
      </div>

      {/* ARIA Live Region for announcements */}
      <AccessibilityRegion assertiveAnnouncement={currentAnnouncement} />
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{board.title}</h2>
            {board.description && <p className="text-sm text-gray-600 mt-1">{board.description}</p>}
          </div>

          {/* Board Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{board.columns.length} columns</span>
            <span>{board.columns.reduce((sum, col) => sum + col.cards.length, 0)} cards</span>
            {settings.showWordCounts && (
              <span>
                {board.columns
                  .flatMap((col) => col.cards)
                  .reduce((sum, card) => sum + (card.wordCount || 0), 0)
                  .toLocaleString()}{' '}
                words
              </span>
            )}
          </div>
        </div>

        {/* Board Actions */}
        <div className="flex items-center space-x-2">
          {/* Undo/Redo Controls */}
          <UndoRedoControls
            canUndo={undoRedo.canUndo}
            canRedo={undoRedo.canRedo}
            undoDescription={undoRedo.getUndoDescription() ?? ''}
            redoDescription={undoRedo.getRedoDescription() ?? ''}
            onUndo={undoRedo.undo}
            onRedo={undoRedo.redo}
            isUndoing={undoRedo.isUndoing}
            isRedoing={undoRedo.isRedoing}
          />

          <div className="border-r border-gray-300 h-6 mx-2" />

          <button
            onClick={handleAddColumn}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            + Add Column
          </button>

          {onEditBoard && (
            <button
              onClick={() => onEditBoard(board)}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Board Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Columns Container */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex space-x-4 p-4 min-w-max">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {sortedColumns.map((column) => {
                const shouldUseVirtualization = column.cards.length > 50;

                return (
                  <div key={column.id} className="w-80 flex-shrink-0">
                    {shouldUseVirtualization ? (
                      <VirtualizedColumn
                        column={column}
                        cards={column.cards}
                        {...(onEditCard ? { onEditCard } : {})}
                        {...(onEditColumn ? { onEditColumn } : {})}
                        onDeleteColumn={handleDeleteColumn}
                        showSceneLinks={settings.showCharacters}
                        showTimeline={settings.showTimeline}
                        isCompact={settings.compactView}
                        focusedCardId={keyboardNav.focusedCardId}
                        draggedCardId={keyboardNav.draggedCardId}
                        onCardFocus={(cardId) => keyboardNav.setFocus(cardId, column.id)}
                        onKeyboardDragStart={keyboardNav.startDrag}
                        onBeforeCardDelete={async (cardId: string, cardTitle: string) => {
                          await undoRedo.pushEntry(
                            'deleteCard',
                            board,
                            createOperationDescription.deleteCard(cardTitle, column.title),
                            { cardId, cardData: column.cards.find((c) => c.id === cardId) },
                          );
                        }}
                        onBeforeCardCreate={async (columnTitle: string, cardTitle: string) => {
                          await undoRedo.pushEntry(
                            'createCard',
                            board,
                            createOperationDescription.createCard(cardTitle, columnTitle),
                            { columnId: column.id, cardTitle },
                          );
                        }}
                        itemHeight={144} // Adjusted for typical card height with margins
                        maxHeight={600} // Maximum column height before virtualizing
                        overscanCount={3} // Cards to render outside visible area
                      />
                    ) : (
                      <PlotColumn
                        column={column}
                        cards={column.cards}
                        {...(onEditCard ? { onEditCard } : {})}
                        {...(onEditColumn ? { onEditColumn } : {})}
                        onDeleteColumn={handleDeleteColumn}
                        showSceneLinks={settings.showCharacters}
                        showTimeline={settings.showTimeline}
                        isCompact={settings.compactView}
                        focusedCardId={keyboardNav.focusedCardId}
                        draggedCardId={keyboardNav.draggedCardId}
                        onCardFocus={(cardId) => keyboardNav.setFocus(cardId, column.id)}
                        onKeyboardDragStart={keyboardNav.startDrag}
                        onBeforeCardDelete={async (cardId: string, cardTitle: string) => {
                          await undoRedo.pushEntry(
                            'deleteCard',
                            board,
                            createOperationDescription.deleteCard(cardTitle, column.title),
                            { cardId, cardData: column.cards.find((c) => c.id === cardId) },
                          );
                        }}
                        onBeforeCardCreate={async (columnTitle: string, cardTitle: string) => {
                          await undoRedo.pushEntry(
                            'createCard',
                            board,
                            createOperationDescription.createCard(cardTitle, columnTitle),
                            { columnId: column.id, cardTitle },
                          );
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </SortableContext>

            {/* Add Column Placeholder */}
            <div className="w-80 flex-shrink-0">
              <button
                onClick={handleAddColumn}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm font-medium">Add Column</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Drag Overlays */}
        <DragOverlay>
          {activeCard && (
            <PlotCard
              card={activeCard}
              isDragOverlay={true}
              showSceneLink={settings.showCharacters}
              showTimeline={settings.showTimeline}
            />
          )}
          {activeColumn && (
            <div className="w-80 opacity-75">
              {activeColumn.cards.length > 50 ? (
                <VirtualizedColumn
                  column={activeColumn}
                  cards={activeColumn.cards}
                  showSceneLinks={settings.showCharacters}
                  showTimeline={settings.showTimeline}
                  isCompact={settings.compactView}
                  focusedCardId={keyboardNav.focusedCardId}
                  draggedCardId={keyboardNav.draggedCardId}
                  onCardFocus={(cardId) => keyboardNav.setFocus(cardId, activeColumn.id)}
                  onKeyboardDragStart={keyboardNav.startDrag}
                  onBeforeCardDelete={async (_cardId, _cardTitle) => {
                    // This is for the drag overlay, operations are handled in the main board
                  }}
                  onBeforeCardCreate={async (_columnTitle, _cardTitle) => {
                    // This is for the drag overlay, operations are handled in the main board
                  }}
                  itemHeight={144}
                  maxHeight={600}
                  overscanCount={3}
                />
              ) : (
                <PlotColumn
                  column={activeColumn}
                  cards={activeColumn.cards}
                  showSceneLinks={settings.showCharacters}
                  showTimeline={settings.showTimeline}
                  isCompact={settings.compactView}
                  focusedCardId={keyboardNav.focusedCardId}
                  draggedCardId={keyboardNav.draggedCardId}
                  onCardFocus={(cardId) => keyboardNav.setFocus(cardId, activeColumn.id)}
                  onKeyboardDragStart={keyboardNav.startDrag}
                  onBeforeCardDelete={async (_cardId, _cardTitle) => {
                    // This is for the drag overlay, operations are handled in the main board
                  }}
                  onBeforeCardCreate={async (_columnTitle, _cardTitle) => {
                    // This is for the drag overlay, operations are handled in the main board
                  }}
                />
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {board.columns.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No columns yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first column to start organizing your story structure.
            </p>
            <button
              onClick={handleAddColumn}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create First Column
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
