import type { PlotBoard, PlotCard, PlotColumn } from '../types';

/**
 * State for tracking keyboard focus and drag-and-drop operations
 */
export interface KeyboardNavigationState {
  /** ID of the currently focused card, if any */
  focusedCardId: string | null;
  /** ID of the currently focused column, if any */
  focusedColumnId: string | null;
  /** ID of the card being dragged, if any */
  draggedCardId: string | null;
  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** List of announcements for screen readers */
  announcements: string[];
}

/**
 * Actions for managing keyboard navigation state
 */
export interface KeyboardNavigationActions {
  /** Set focus to a specific card and column */
  setFocus: (cardId: string | null, columnId: string | null) => void;
  /** Start dragging a card */
  startDrag: (cardId: string) => void;
  /** Complete dropping a card at a new position */
  completeDrop: (targetColumnId: string, newOrder: number) => void;
  /** Cancel the current drag operation */
  cancelDrag: () => void;
  /** Add an announcement for screen readers */
  announce: (message: string) => void;
  /** Clear all announcements */
  clearAnnouncements: () => void;
}

/**
 * Props for the useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationProps {
  /** Current state of the plot board */
  board: PlotBoard;
  /** Callback when a card is moved */
  onMoveCard: (cardId: string, targetColumnId: string, newOrder: number) => void;
  /** Callback when columns are reordered */
  onReorderColumns: (columnIds: string[]) => void;
}

/**
 * Position information for a card in the board grid
 */
export interface CardPosition {
  /** The card itself */
  card: PlotCard;
  /** The column containing the card */
  column: PlotColumn;
  /** Index of the card within its column */
  cardIndex: number;
  /** Index of the column in the board */
  columnIndex: number;
}
