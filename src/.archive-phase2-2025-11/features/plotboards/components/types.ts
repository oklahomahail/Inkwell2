import { PlotCard, PlotColumn, PlotCardStatus } from '../types';

export interface CardEventHandlers {
  onBeforeCardDelete?: (cardId: string, cardTitle: string) => Promise<void>;
  onBeforeCardCreate?: (columnTitle: string, cardTitle: string) => Promise<void>;
  onEditCard?: (card: PlotCard) => void;
  onEditColumn?: (column: PlotColumn) => void;
}

export interface NavigationHandlers {
  onCardFocus?: (cardId: string) => void;
  onKeyboardDragStart?: () => void;
}

export interface ColumnDisplayProps {
  showSceneLinks?: boolean;
  showTimeline?: boolean;
  isCompact?: boolean;
  focusedCardId?: string | null;
  draggedCardId?: string | null;
}

export interface VirtualizedColumnProps
  extends CardEventHandlers,
    NavigationHandlers,
    ColumnDisplayProps {
  column: PlotColumn;
  cards: PlotCard[];
  itemHeight: number;
  maxHeight: number;
  overscanCount: number;
  onDeleteColumn?: (columnId: string) => void;
}

export interface PlotColumnProps extends CardEventHandlers, NavigationHandlers, ColumnDisplayProps {
  column: PlotColumn;
  cards: PlotCard[];
  onDeleteColumn?: (columnId: string) => void;
}

export interface PlotCardProps {
  card: PlotCard;
  isDragOverlay?: boolean;
  showSceneLink?: boolean;
  showTimeline?: boolean;
  isFocused?: boolean;
  isDraggedCard?: boolean;
  onEdit?: (card: PlotCard) => void;
  onDelete?: (cardId: string) => void;
  onFocus?: (cardId: string) => void;
  onKeyboardDragStart?: () => void;
}

export interface CardStatusProps {
  status: PlotCardStatus;
  onChange: (newStatus: PlotCardStatus) => void;
}
