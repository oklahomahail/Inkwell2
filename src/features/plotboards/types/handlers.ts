import type { PlotBoard, PlotCard, PlotColumn } from '../types';

// Event handlers for card interactions
export interface CardEventHandlers {
  onEditCard?: (card: PlotCard) => void;
  onEditColumn?: (column: PlotColumn) => void;
  onBeforeCardCreate?: (columnTitle: string, cardTitle: string) => Promise<void>;
  onBeforeCardDelete?: (cardId: string, cardTitle: string) => Promise<void>;
}

// Props for components that display a plot board
export interface PlotBoardDisplayProps extends CardEventHandlers {
  board: PlotBoard;
  className?: string;
  onEditBoard?: (board: PlotBoard) => void;
}

// Props for virtual column list components
export interface VirtualColumnProps extends CardEventHandlers {
  column: PlotColumn;
  cards: PlotCard[];
  showSceneLinks?: boolean;
  showTimeline?: boolean;
  isCompact?: boolean;
  focusedCardId?: string | null;
  draggedCardId?: string | null;
  onCardFocus?: (cardId: string) => void;
  onKeyboardDragStart?: (cardId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  itemHeight?: number;
  maxHeight?: number;
  overscanCount?: number;
}
