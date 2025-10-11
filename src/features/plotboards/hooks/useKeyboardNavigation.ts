// Keyboard navigation and accessibility for Plot Boards
// Provides arrow key navigation, drag-and-drop keyboard controls, and screen reader support

import { useCallback, useEffect, useRef, useState } from 'react';

import { PlotBoard, PlotColumn, PlotCard } from '../types';

interface KeyboardNavigationState {
  focusedCardId: string | null;
  focusedColumnId: string | null;
  draggedCardId: string | null;
  isDragging: boolean;
  announcements: string[];
}

interface KeyboardNavigationActions {
  setFocus: (_cardId: string | null, _columnId: string | null) => void;
  startDrag: (_cardId: string) => void;
  completeDrop: (_targetColumnId: string, _newOrder: number) => void;
  cancelDrag: () => void;
  announce: (_message: string) => void;
  clearAnnouncements: () => void;
}

interface UseKeyboardNavigationProps {
  board: PlotBoard;
  onMoveCard: (_cardId: string, _targetColumnId: string, _newOrder: number) => void;
  onReorderColumns: (_columnIds: string[]) => void;
}

export const useKeyboardNavigation = ({
  board,
  onMoveCard,
  onReorderColumns: _onReorderColumns,
}: UseKeyboardNavigationProps): KeyboardNavigationState & KeyboardNavigationActions => {
  const [state, setState] = useState<KeyboardNavigationState>({
    focusedCardId: null,
    focusedColumnId: null,
    draggedCardId: null,
    isDragging: false,
    announcements: [],
  });

  const lastFocusRef = useRef<{ cardId: string | null; columnId: string | null }>({
    cardId: null,
    columnId: null,
  });

  // Get all cards in a flat array with their positions
  const getAllCards = useCallback(() => {
    const cards: Array<{
      card: PlotCard;
      column: PlotColumn;
      cardIndex: number;
      columnIndex: number;
    }> = [];

    board.columns.forEach((column, _columnIndex) => {
      column.cards.forEach((card, _cardIndex) => {
        cards.push({ card, column, cardIndex, columnIndex });
      });
    });

    return cards;
  }, [board]);

  // Find card position in the grid
  const findCardPosition = useCallback(
    (cardId: string) => {
      const allCards = getAllCards();
      return allCards.find((item) => item.card.id === cardId);
    },
    [getAllCards],
  );

  // Navigate to adjacent card
  const navigateToCard = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!state.focusedCardId) {
        // If no card focused, focus first card
        const allCards = getAllCards();
        if (allCards.length > 0 && allCards[0]) {
          const firstCard = allCards[0];
          setState((prev) => ({
            ...prev,
            focusedCardId: firstCard.card.id,
            focusedColumnId: firstCard.column.id,
          }));
          lastFocusRef.current = {
            cardId: firstCard.card.id,
            columnId: firstCard.column.id,
          };
        }
        return;
      }

      const currentPosition = findCardPosition(state.focusedCardId);
      if (!currentPosition) return;

      const { columnIndex, cardIndex } = currentPosition;
      let targetColumnIndex = columnIndex;
      let targetCardIndex = cardIndex;

      switch (direction) {
        case 'up':
          targetCardIndex = Math.max(0, cardIndex - 1);
          break;
        case 'down':
          const currentColumn = board.columns[columnIndex];
          if (currentColumn && currentColumn.cards) {
            targetCardIndex = Math.min(currentColumn.cards.length - 1, cardIndex + 1);
          }
          break;
        case 'left':
          targetColumnIndex = Math.max(0, columnIndex - 1);
          const leftColumn = board.columns[targetColumnIndex];
          if (leftColumn && leftColumn.cards) {
            targetCardIndex = Math.min(cardIndex, leftColumn.cards.length - 1);
          }
          break;
        case 'right':
          targetColumnIndex = Math.min(board.columns.length - 1, columnIndex + 1);
          const rightColumn = board.columns[targetColumnIndex];
          if (rightColumn && rightColumn.cards) {
            targetCardIndex = Math.min(cardIndex, rightColumn.cards.length - 1);
          }
          break;
      }

      const targetColumn = board.columns[targetColumnIndex];
      if (!targetColumn || !targetColumn.cards) return;

      const targetCard = targetColumn.cards[targetCardIndex];
      if (targetCard) {
        setState((prev) => ({
          ...prev,
          focusedCardId: targetCard.id,
          focusedColumnId: targetColumn.id,
        }));
        lastFocusRef.current = { cardId: targetCard.id, columnId: targetColumn.id };
      }
    },
    [state.focusedCardId, getAllCards, findCardPosition, board],
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigateToCard('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateToCard('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigateToCard('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToCard('right');
          break;
        case 'Enter':
          event.preventDefault();
          if (state.focusedCardId && !state.isDragging) {
            // Open card for editing (could trigger a modal or inline edit)
            announce(`Opening card ${findCardPosition(state.focusedCardId)?.card.title || 'card'}`);
          }
          break;
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          if (!state.isDragging && state.focusedCardId) {
            startDrag(state.focusedCardId);
          } else if (state.isDragging && state.draggedCardId) {
            // Drop at current focus position
            const focusedPosition = state.focusedColumnId
              ? board.columns.find((col) => col.id === state.focusedColumnId)
              : null;
            if (focusedPosition) {
              const newOrder = state.focusedCardId
                ? findCardPosition(state.focusedCardId)?.cardIndex || 0
                : 0;
              completeDrop(state.focusedColumnId!, newOrder);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (state.isDragging) {
            cancelDrag();
          }
          break;
      }
    },
    [
      state.focusedCardId,
      state.focusedColumnId,
      state.isDragging,
      state.draggedCardId,
      navigateToCard,
      findCardPosition,
      board,
    ],
  );

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Actions
  const setFocus = useCallback((cardId: string | null, _columnId: string | null) => {
    setState((prev) => ({ ...prev, focusedCardId: cardId, focusedColumnId: columnId }));
    lastFocusRef.current = { cardId, columnId };
  }, []);

  const startDrag = useCallback(
    (cardId: string) => {
      const position = findCardPosition(cardId);
      if (!position) return;

      setState((prev) => ({
        ...prev,
        draggedCardId: cardId,
        isDragging: true,
      }));

      announce(
        `Picked up card: ${position.card.title}. Use arrow keys to navigate, Space to drop, Escape to cancel.`,
      );
    },
    [findCardPosition],
  );

  const completeDrop = useCallback(
    (targetColumnId: string, _newOrder: number) => {
      if (!state.draggedCardId) return;

      const draggedCard = findCardPosition(state.draggedCardId);
      const targetColumn = board.columns.find((col) => col.id === targetColumnId);

      if (!draggedCard || !targetColumn) return;

      onMoveCard(state.draggedCardId, targetColumnId, newOrder);

      announce(
        `Dropped card: ${draggedCard.card.title} into column: ${targetColumn.title} at position ${newOrder + 1}`,
      );

      setState((prev) => ({
        ...prev,
        draggedCardId: null,
        isDragging: false,
        focusedCardId: prev.draggedCardId, // Keep focus on the moved card
      }));
    },
    [state.draggedCardId, findCardPosition, board, onMoveCard],
  );

  const cancelDrag = useCallback(() => {
    if (!state.draggedCardId) return;

    const draggedCard = findCardPosition(state.draggedCardId);
    announce(`Cancelled drag of card: ${draggedCard?.card.title || 'card'}`);

    setState((prev) => ({
      ...prev,
      draggedCardId: null,
      isDragging: false,
      focusedCardId: prev.draggedCardId, // Return focus to original card
    }));
  }, [state.draggedCardId, findCardPosition]);

  const announce = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      announcements: [...prev.announcements, message],
    }));
  }, []);

  const clearAnnouncements = useCallback(() => {
    setState((prev) => ({ ...prev, announcements: [] }));
  }, []);

  return {
    ...state,
    setFocus,
    startDrag,
    completeDrop,
    cancelDrag,
    announce,
    clearAnnouncements,
  };
};

// Hook for managing ARIA live region announcements
export const useAriaLiveRegion = (_announcements: string[]) => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');

  useEffect(() => {
    if (announcements.length > 0) {
      const latestAnnouncement = announcements[announcements.length - 1];
      if (latestAnnouncement) {
        setCurrentAnnouncement(latestAnnouncement);

        // Clear announcement after a delay to allow it to be read
        const timer = setTimeout(() => {
          setCurrentAnnouncement('');
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [announcements]);

  return currentAnnouncement;
};
