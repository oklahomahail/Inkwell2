// Plot Boards Zustand store
// Manages plot board state with persistence and tracing

import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import { storage } from '../../utils/storage';
import { trace } from '../../utils/trace';

import {
  PlotBoard,
  PlotColumn,
  PlotCard,
  PlotBoardTemplate,
  PlotColumnType,
  PlotCardStatus,
  PlotCardPriority,
  DEFAULT_PLOT_TEMPLATES,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_COLUMN_SETTINGS,
} from './types';
import {
  createCardsFromChapter,
  syncCardsWithScenes,
  linkCardsToTimelineEvents,
  calculatePlotProgress,
  AutoSyncConfig,
  DEFAULT_SYNC_CONFIG,
  PlotProgressMetrics,
} from './utils/integration';

import type { PlotAnalysis } from '../../types/plotAnalysis';

/* ========= Store State Interface ========= */
export interface PlotBoardStore {
  // State
  boards: Record<string, PlotBoard>;
  activeBoard: string | null;
  templates: Record<string, PlotBoardTemplate>;
  isLoading: boolean;
  lastError: string | null;

  // Analysis State
  analysisByProjectId: Record<string, PlotAnalysis | undefined>;
  setAnalysis: (_projectId: string, _analysis: PlotAnalysis) => void;
  clearAnalysis: (_projectId: string) => void;

  // Board Operations
  createBoard: (_projectId: string, _title: string, _templateId?: string) => Promise<PlotBoard>;
  updateBoard: (_boardId: string, _updates: Partial<PlotBoard>) => Promise<void>;
  deleteBoard: (_boardId: string) => Promise<void>;
  duplicateBoard: (_boardId: string, _newTitle?: string) => Promise<PlotBoard>;
  setActiveBoard: (_boardId: string | null) => void;
  getBoardsByProject: (_projectId: string) => PlotBoard[];

  // Column Operations
  createColumn: (
    _boardId: string,
    _title: string,
    _type?: PlotColumnType,
    _color?: string,
  ) => Promise<PlotColumn>;
  updateColumn: (_columnId: string, _updates: Partial<PlotColumn>) => Promise<void>;
  deleteColumn: (_columnId: string) => Promise<void>;
  reorderColumns: (_boardId: string, _columnIds: string[]) => Promise<void>;

  // Card Operations
  createCard: (_columnId: string, _title: string, _description?: string) => Promise<PlotCard>;
  updateCard: (_cardId: string, _updates: Partial<PlotCard>) => Promise<void>;
  deleteCard: (_cardId: string) => Promise<void>;
  moveCard: (_cardId: string, _destinationColumnId: string, _newOrder: number) => Promise<void>;
  reorderCards: (_columnId: string, _cardIds: string[]) => Promise<void>;
  linkCardToScene: (_cardId: string, _sceneId: string, _chapterId: string) => Promise<void>;
  unlinkCardFromScene: (_cardId: string) => Promise<void>;
  linkCardToTimeline: (_cardId: string, _eventIds: string[]) => Promise<void>;

  // Template Operations
  createTemplate: (
    _template: Omit<PlotBoardTemplate, 'id' | 'isBuiltIn'>,
  ) => Promise<PlotBoardTemplate>;
  updateTemplate: (_templateId: string, _updates: Partial<PlotBoardTemplate>) => Promise<void>;
  deleteTemplate: (_templateId: string) => Promise<void>;
  getTemplatesByCategory: (_category?: string) => PlotBoardTemplate[];

  // Batch Operations
  importBoard: (_boardData: Partial<PlotBoard>) => Promise<PlotBoard>;
  exportBoard: (_boardId: string) => PlotBoard | null;
  bulkUpdateCards: (_cardIds: string[], _updates: Partial<PlotCard>) => Promise<void>;

  // Chapter/Scene Integration
  syncWithChapters: (_boardId: string, _chapters: Record<string, any>) => Promise<void>;
  createCardsFromChapters: (
    _boardId: string,
    _chapterIds: string[],
    _chapters: Record<string, any>,
  ) => Promise<void>;
  autoSyncWithTimeline: (
    _boardId: string,
    _timelineEvents: any[],
    _chapters: Record<string, any>,
  ) => Promise<void>;
  getProgressMetrics: (
    _boardId: string,
    _chapters: Record<string, any>,
  ) => PlotProgressMetrics | null;

  // Auto-sync Configuration
  autoSyncConfig: AutoSyncConfig;
  setAutoSyncConfig: (_config: Partial<AutoSyncConfig>) => void;

  // Utility
  findCardById: (
    _cardId: string,
  ) => { card: PlotCard; column: PlotColumn; board: PlotBoard } | null;
  findColumnById: (_columnId: string) => { column: PlotColumn; board: PlotBoard } | null;
  getCardsByStatus: (_boardId: string, _status: PlotCardStatus) => PlotCard[];
  getCardsByPriority: (_boardId: string, _priority: PlotCardPriority) => PlotCard[];
  searchCards: (_query: string, _boardId?: string) => PlotCard[];
}

/* ========= Helper Functions ========= */
const generateColors = (): string[] => [
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#EC4899',
  '#64748B',
  '#0EA5E9',
];

const createPlotCard = (columnId: string, title: string, description?: string): PlotCard => ({
  id: uuidv4(),
  columnId,
  title,
  description,
  order: 0, // Will be updated when added to column
  status: PlotCardStatus.IDEA,
  priority: PlotCardPriority.MEDIUM,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createPlotColumn = (
  boardId: string,
  title: string,
  type: PlotColumnType = PlotColumnType.CUSTOM,
  color?: string,
): PlotColumn => ({
  id: uuidv4(),
  boardId,
  title,
  type,
  color: color || generateColors()[0] || '#3B82F6',
  order: 0, // Will be updated when added to board
  cards: [],
  settings: { ...DEFAULT_COLUMN_SETTINGS },
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createPlotBoard = (projectId: string, title: string): PlotBoard => ({
  id: uuidv4(),
  projectId,
  title,
  columns: [],
  settings: { ...DEFAULT_BOARD_SETTINGS },
  createdAt: new Date(),
  updatedAt: new Date(),
});

/* ========= Store Implementation ========= */
export const usePlotBoardStore = create<PlotBoardStore>()((set, _get) => ({
  // Initial State
  boards: {},
  _activeBoard: null,
  _templates: DEFAULT_PLOT_TEMPLATES.reduce(
    (acc, _template) => {
      acc[template.id] = template;
      return acc;
    },
    {} as Record<string, PlotBoardTemplate>,
  ),
  isLoading: false,
  lastError: null,
  autoSyncConfig: { ...DEFAULT_SYNC_CONFIG },

  // Analysis State
  analysisByProjectId: {},
  setAnalysis: (_projectId, _analysis) =>
    set((s) => ({ analysisByProjectId: { ...s.analysisByProjectId, [projectId]: analysis } })),
  clearAnalysis: (_projectId) =>
    set((s) => {
      const copy = { ...s.analysisByProjectId };
      delete copy[projectId];
      return { analysisByProjectId: copy };
    }),

  // Board Operations
  createBoard: async (_projectId: string, _title: string, _templateId?: string) => {
    trace.log('createBoard', 'store_action', 'debug', { projectId, title, templateId });

    try {
      set({ isLoading: true, lastError: null });

      const board = createPlotBoard(projectId, title);

      // Apply template if provided
      if (templateId) {
        const template = get().templates[templateId];
        if (template) {
          const _colors = generateColors();
          board.columns = template.columns.map((colTemplate, _index) => {
            const column = createPlotColumn(
              board.id,
              colTemplate.title,
              colTemplate.type,
              colTemplate.color,
            );
            column.description = colTemplate.description;
            column.order = colTemplate.order || index;

            // Add default cards if specified
            if (colTemplate.defaultCards) {
              column.cards = colTemplate.defaultCards.map((cardTemplate, _cardIndex) => {
                const card = createPlotCard(
                  column.id,
                  cardTemplate.title,
                  cardTemplate.description,
                );
                card.status = cardTemplate.status;
                card.priority = cardTemplate.priority;
                card.tags = [...cardTemplate.tags];
                card.order = cardIndex;
                return card;
              });
            }

            return column;
          });
        }
      }

      set((state) => ({
        boards: { ...state.boards, [board.id]: board },
        activeBoard: board.id,
        isLoading: false,
      }));

      await storage.setItem(`plotboard_${board.id}`, board);

      return board;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create board';
      set({ lastError: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateBoard: async (_boardId: string, _updates: Partial<PlotBoard>) => {
    trace.log('updateBoard', 'store_action', 'debug', { boardId, updates });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const updatedBoard = {
        ...board,
        ...updates,
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [boardId]: updatedBoard },
        lastError: null,
      }));

      await storage.setItem(`plotboard_${boardId}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update board';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  deleteBoard: async (_boardId: string) => {
    trace.log('deleteBoard', 'store_action', 'debug', { boardId });

    try {
      const state = get();
      if (!state.boards[boardId]) {
        throw new Error(`Board ${boardId} not found`);
      }

      const newBoards = { ...state.boards };
      delete newBoards[boardId];

      set({
        boards: newBoards,
        activeBoard: state.activeBoard === boardId ? null : state.activeBoard,
        lastError: null,
      });

      await storage.removeItem(`plotboard_${boardId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete board';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  duplicateBoard: async (_boardId: string, _newTitle?: string) => {
    trace.log('duplicateBoard', 'store_action', 'debug', { boardId, newTitle });

    try {
      const originalBoard = get().boards[boardId];
      if (!originalBoard) {
        throw new Error(`Board ${boardId} not found`);
      }

      const duplicatedBoard = createPlotBoard(
        originalBoard.projectId,
        newTitle || `${originalBoard.title} (Copy)`,
      );

      duplicatedBoard.description = originalBoard.description;
      duplicatedBoard.settings = { ...originalBoard.settings };

      // Deep clone columns and cards
      duplicatedBoard.columns = originalBoard.columns.map((column) => {
        const newColumn = { ...column };
        newColumn.id = uuidv4();
        newColumn.boardId = duplicatedBoard.id;
        newColumn.cards = column.cards.map((card) => ({
          ...card,
          id: uuidv4(),
          columnId: newColumn.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        return newColumn;
      });

      set((state) => ({
        boards: { ...state.boards, [duplicatedBoard.id]: duplicatedBoard },
      }));

      await storage.setItem(`plotboard_${duplicatedBoard.id}`, duplicatedBoard);
      return duplicatedBoard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate board';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  setActiveBoard: (_boardId: string | null) => {
    trace.log('setActiveBoard', 'store_action', 'debug', { boardId });
    set({ activeBoard: boardId });
  },

  getBoardsByProject: (_projectId: string) => {
    return Object.values(get().boards).filter((board) => board.projectId === projectId);
  },

  // Column Operations
  createColumn: async (
    _boardId: string,
    _title: string,
    _type: PlotColumnType = PlotColumnType.CUSTOM,
    _color?: string,
  ) => {
    trace.log('createColumn', 'store_action', 'debug', { boardId, title, type, color });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const column = createPlotColumn(boardId, title, type, color);
      column.order = board.columns.length;

      const updatedBoard = {
        ...board,
        columns: [...board.columns, column],
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [boardId]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${boardId}`, updatedBoard);
      return column;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create column';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  updateColumn: async (_columnId: string, _updates: Partial<PlotColumn>) => {
    trace.log('updateColumn', 'store_action', 'debug', { columnId, updates });

    try {
      const result = get().findColumnById(columnId);
      if (!result) {
        throw new Error(`Column ${columnId} not found`);
      }

      const { column, board } = result;
      const updatedColumn = { ...column, ...updates };

      const updatedBoard = {
        ...board,
        columns: board.columns.map((col) => (col.id === columnId ? updatedColumn : col)),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update column';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  deleteColumn: async (_columnId: string) => {
    trace.log('deleteColumn', 'store_action', 'debug', { columnId });

    try {
      const result = get().findColumnById(columnId);
      if (!result) {
        throw new Error(`Column ${columnId} not found`);
      }

      const { board } = result;

      const updatedBoard = {
        ...board,
        columns: board.columns.filter((col) => col.id !== columnId),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete column';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  reorderColumns: async (_boardId: string, _columnIds: string[]) => {
    trace.log('reorderColumns', 'store_action', 'debug', { boardId, columnIds });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const reorderedColumns = columnIds.map((id, _index) => {
        const column = board.columns.find((col) => col.id === id);
        if (!column) {
          throw new Error(`Column ${id} not found in board`);
        }
        return { ...column, order: index };
      });

      const updatedBoard = {
        ...board,
        columns: reorderedColumns,
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [boardId]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${boardId}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder columns';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  // Card Operations
  createCard: async (_columnId: string, _title: string, _description?: string) => {
    trace.log('createCard', 'store_action', 'debug', { columnId, title, description });

    try {
      const result = get().findColumnById(columnId);
      if (!result) {
        throw new Error(`Column ${columnId} not found`);
      }

      const { column, board } = result;
      const card = createPlotCard(columnId, title, description);
      card.order = column.cards.length;

      const updatedColumn = {
        ...column,
        cards: [...column.cards, card],
      };

      const updatedBoard = {
        ...board,
        columns: board.columns.map((col) => (col.id === columnId ? updatedColumn : col)),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
      return card;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create card';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  updateCard: async (_cardId: string, _updates: Partial<PlotCard>) => {
    trace.log('updateCard', 'store_action', 'debug', { cardId, updates });

    try {
      const result = get().findCardById(cardId);
      if (!result) {
        throw new Error(`Card ${cardId} not found`);
      }

      const { card, column, board } = result;
      const updatedCard = { ...card, ...updates, updatedAt: new Date() };

      const updatedColumn = {
        ...column,
        cards: column.cards.map((c) => (c.id === cardId ? updatedCard : c)),
      };

      const updatedBoard = {
        ...board,
        columns: board.columns.map((col) => (col.id === column.id ? updatedColumn : col)),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update card';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  deleteCard: async (_cardId: string) => {
    trace.log('deleteCard', 'store_action', 'debug', { cardId });

    try {
      const result = get().findCardById(cardId);
      if (!result) {
        throw new Error(`Card ${cardId} not found`);
      }

      const { column, board } = result;

      const updatedColumn = {
        ...column,
        cards: column.cards.filter((c) => c.id !== cardId),
      };

      const updatedBoard = {
        ...board,
        columns: board.columns.map((col) => (col.id === column.id ? updatedColumn : col)),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  moveCard: async (_cardId: string, _destinationColumnId: string, _newOrder: number) => {
    trace.log('moveCard', 'store_action', 'debug', { cardId, destinationColumnId, newOrder });

    try {
      const cardResult = get().findCardById(cardId);
      const destResult = get().findColumnById(destinationColumnId);

      if (!cardResult || !destResult) {
        throw new Error('Card or destination column not found');
      }

      const { card, column: sourceColumn, board } = cardResult;
      const { column: destColumn } = destResult;

      if (sourceColumn.id === destinationColumnId) {
        // Reordering within same column
        const reorderedCards = [...sourceColumn.cards];
        const cardIndex = reorderedCards.findIndex((c) => c.id === cardId);
        reorderedCards.splice(cardIndex, 1);
        reorderedCards.splice(newOrder, 0, { ...card, order: newOrder });

        // Update order for all cards
        reorderedCards.forEach((c, _idx) => {
          c.order = idx;
        });

        const updatedColumn = { ...sourceColumn, cards: reorderedCards };
        const updatedBoard = {
          ...board,
          columns: board.columns.map((col) => (col.id === sourceColumn.id ? updatedColumn : col)),
          updatedAt: new Date(),
        };

        set((state) => ({
          boards: { ...state.boards, [board.id]: updatedBoard },
        }));

        await storage.setItem(`plotboard_${board.id}`, updatedBoard);
      } else {
        // Moving between columns
        const updatedCard = { ...card, columnId: destinationColumnId, updatedAt: new Date() };

        const updatedSourceColumn = {
          ...sourceColumn,
          cards: sourceColumn.cards.filter((c) => c.id !== cardId),
        };

        const updatedDestCards = [...destColumn.cards];
        updatedDestCards.splice(newOrder, 0, updatedCard);
        updatedDestCards.forEach((c, _idx) => {
          c.order = idx;
        });

        const updatedDestColumn = {
          ...destColumn,
          cards: updatedDestCards,
        };

        const updatedBoard = {
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === sourceColumn.id) return updatedSourceColumn;
            if (col.id === destColumn.id) return updatedDestColumn;
            return col;
          }),
          updatedAt: new Date(),
        };

        set((state) => ({
          boards: { ...state.boards, [board.id]: updatedBoard },
        }));

        await storage.setItem(`plotboard_${board.id}`, updatedBoard);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move card';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  reorderCards: async (_columnId: string, _cardIds: string[]) => {
    trace.log('reorderCards', 'store_action', 'debug', { columnId, cardIds });

    try {
      const result = get().findColumnById(columnId);
      if (!result) {
        throw new Error(`Column ${columnId} not found`);
      }

      const { column, board } = result;

      const reorderedCards = cardIds.map((id, _index) => {
        const card = column.cards.find((c) => c.id === id);
        if (!card) {
          throw new Error(`Card ${id} not found in column`);
        }
        return { ...card, order: index };
      });

      const updatedColumn = { ...column, cards: reorderedCards };
      const updatedBoard = {
        ...board,
        columns: board.columns.map((col) => (col.id === columnId ? updatedColumn : col)),
        updatedAt: new Date(),
      };

      set((state) => ({
        boards: { ...state.boards, [board.id]: updatedBoard },
      }));

      await storage.setItem(`plotboard_${board.id}`, updatedBoard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder cards';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  linkCardToScene: async (_cardId: string, _sceneId: string, _chapterId: string) => {
    trace.log('linkCardToScene', 'store_action', 'debug', { cardId, sceneId, chapterId });

    await get().updateCard(cardId, {
      sceneId,
      chapterId,
    });
  },

  unlinkCardFromScene: async (_cardId: string) => {
    trace.log('unlinkCardFromScene', 'store_action', 'debug', { cardId });

    await get().updateCard(cardId, {
      sceneId: undefined,
      chapterId: undefined,
    });
  },

  linkCardToTimeline: async (_cardId: string, _eventIds: string[]) => {
    trace.log('linkCardToTimeline', 'store_action', 'debug', { cardId, eventIds });

    await get().updateCard(cardId, {
      timelineEventIds: eventIds,
    });
  },

  // Template Operations
  createTemplate: async (_template: Omit<PlotBoardTemplate, 'id' | 'isBuiltIn'>) => {
    trace.log('createTemplate', 'store_action', 'debug', { template });

    const newTemplate: PlotBoardTemplate = {
      ...template,
      id: uuidv4(),
      isBuiltIn: false,
    };

    set((state) => ({
      templates: { ...state.templates, [newTemplate.id]: newTemplate },
    }));

    await storage.setItem(`plottemplate_${newTemplate.id}`, newTemplate);
    return newTemplate;
  },

  updateTemplate: async (_templateId: string, _updates: Partial<PlotBoardTemplate>) => {
    trace.log('updateTemplate', 'store_action', 'debug', { templateId, updates });

    const template = get().templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (template.isBuiltIn) {
      throw new Error('Cannot update built-in template');
    }

    const updatedTemplate = { ...template, ...updates };

    set((state) => ({
      templates: { ...state.templates, [templateId]: updatedTemplate },
    }));

    await storage.setItem(`plottemplate_${templateId}`, updatedTemplate);
  },

  deleteTemplate: async (_templateId: string) => {
    trace.log('deleteTemplate', 'store_action', 'debug', { templateId });

    const template = get().templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (template.isBuiltIn) {
      throw new Error('Cannot delete built-in template');
    }

    const newTemplates = { ...get().templates };
    delete newTemplates[templateId];

    set({ templates: newTemplates });
    await storage.removeItem(`plottemplate_${templateId}`);
  },

  getTemplatesByCategory: (_category?: string) => {
    const templates = Object.values(get().templates);
    return category ? templates.filter((t) => t.category === category) : templates;
  },

  // Batch Operations
  importBoard: async (_boardData: Partial<PlotBoard>) => {
    trace.log('importBoard', 'store_action', 'debug', { boardData });

    const board = createPlotBoard(
      boardData.projectId || 'unknown',
      boardData.title || 'Imported Board',
    );

    if (boardData.description) board.description = boardData.description;
    if (boardData.settings) board.settings = { ...DEFAULT_BOARD_SETTINGS, ...boardData.settings };
    if (boardData.columns) board.columns = boardData.columns;

    set((state) => ({
      boards: { ...state.boards, [board.id]: board },
    }));

    await storage.setItem(`plotboard_${board.id}`, board);
    return board;
  },

  exportBoard: (_boardId: string) => {
    return get().boards[boardId] || null;
  },

  bulkUpdateCards: async (_cardIds: string[], _updates: Partial<PlotCard>) => {
    trace.log('bulkUpdateCards', 'store_action', 'debug', { cardIds, updates });

    try {
      const boardsToUpdate: Record<string, PlotBoard> = {};

      for (const cardId of cardIds) {
        const result = get().findCardById(cardId);
        if (!result) continue;

        const { card, column, board } = result;
        const updatedCard = { ...card, ...updates, updatedAt: new Date() };

        if (!boardsToUpdate[board.id]) {
          boardsToUpdate[board.id] = JSON.parse(JSON.stringify(board));
        }

        const boardToUpdate = boardsToUpdate[board.id];
        if (boardToUpdate) {
          const columnToUpdate = boardToUpdate.columns.find((c) => c.id === column.id);
          if (columnToUpdate) {
            const cardIndex = columnToUpdate.cards.findIndex((c) => c.id === cardId);
            if (cardIndex >= 0) {
              columnToUpdate.cards[cardIndex] = updatedCard;
            }
          }
        }
      }

      // Update all affected boards
      for (const board of Object.values(boardsToUpdate)) {
        board.updatedAt = new Date();
        await storage.setItem(`plotboard_${board.id}`, board);
      }

      set((state) => ({
        boards: { ...state.boards, ...boardsToUpdate },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update cards';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  // Utility Functions
  findCardById: (_cardId: string) => {
    const boards = get().boards;

    for (const board of Object.values(boards)) {
      for (const column of board.columns) {
        const card = column.cards.find((c) => c.id === cardId);
        if (card) {
          return { card, column, board };
        }
      }
    }

    return null;
  },

  findColumnById: (_columnId: string) => {
    const boards = get().boards;

    for (const board of Object.values(boards)) {
      const column = board.columns.find((c) => c.id === columnId);
      if (column) {
        return { column, board };
      }
    }

    return null;
  },

  getCardsByStatus: (_boardId: string, _status: PlotCardStatus) => {
    const board = get().boards[boardId];
    if (!board) return [];

    return board.columns.flatMap((column) => column.cards.filter((card) => card.status === status));
  },

  getCardsByPriority: (_boardId: string, _priority: PlotCardPriority) => {
    const board = get().boards[boardId];
    if (!board) return [];

    return board.columns.flatMap((column) =>
      column.cards.filter((card) => card.priority === priority),
    );
  },

  searchCards: (_query: string, _boardId?: string) => {
    const lowerQuery = query.toLowerCase();
    const boards = boardId ? { [boardId]: get().boards[boardId] } : get().boards;

    const results: PlotCard[] = [];

    for (const board of Object.values(boards)) {
      if (!board) continue;

      for (const column of board.columns) {
        for (const card of column.cards) {
          if (
            card.title.toLowerCase().includes(lowerQuery) ||
            card.description?.toLowerCase().includes(lowerQuery) ||
            card.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
            card.notes?.toLowerCase().includes(lowerQuery)
          ) {
            results.push(card);
          }
        }
      }
    }

    return results;
  },

  // Chapter/Scene Integration Methods
  syncWithChapters: async (_boardId: string, _chapters: Record<string, any>) => {
    trace.log('syncWithChapters', 'store_action', 'debug', { boardId });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const allCards = board.columns.flatMap((col) => col.cards);
      const syncResult = syncCardsWithScenes(allCards, chapters);

      // Handle scene updates
      for (const update of syncResult.updates) {
        await get().updateCard(update.cardId, {
          title: update.sceneUpdates.title,
          description: update.sceneUpdates.summary,
          // notes and tags properties might not exist on Scene, using optional access
          notes: (update.sceneUpdates as any).notes,
          wordCount: update.sceneUpdates.wordCount,
          tags: (update.sceneUpdates as any).tags || [],
        });
      }

      // Remove orphaned cards
      for (const cardId of syncResult.orphanedCards) {
        await get().deleteCard(cardId);
      }

      // Add new cards to an "Unassigned" column or first available column
      if (syncResult.newCards.length > 0) {
        let targetColumn = board.columns.find((col) =>
          col.title.toLowerCase().includes('unassigned'),
        );
        if (!targetColumn && board.columns.length > 0) {
          targetColumn = board.columns[0];
        }

        if (targetColumn) {
          for (const newCard of syncResult.newCards) {
            newCard.columnId = targetColumn.id;
            newCard.order = targetColumn.cards.length;
            await get().createCard(targetColumn.id, newCard.title, newCard.description);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with chapters';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  createCardsFromChapters: async (
    _boardId: string,
    _chapterIds: string[],
    _chapters: Record<string, any>,
  ) => {
    trace.log('createCardsFromChapters', 'store_action', 'debug', { boardId, chapterIds });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      // Find or create a target column
      let targetColumn = board.columns.find((col) => col.type === PlotColumnType.CHAPTER);
      if (!targetColumn && board.columns.length > 0) {
        targetColumn = board.columns[0];
      }

      if (!targetColumn) {
        targetColumn = await get().createColumn(boardId, 'Scenes', PlotColumnType.CHAPTER);
      }

      // Create cards for each chapter's scenes
      for (const chapterId of chapterIds) {
        const chapter = chapters[chapterId];
        if (!chapter || !chapter.scenes) continue;

        const cards = createCardsFromChapter(chapter, targetColumn.id);
        for (const card of cards) {
          await get().createCard(targetColumn.id, card.title, card.description);
          // Link the card to the scene
          const createdCards = targetColumn.cards.filter((c) => c.title === card.title);
          const createdCard = createdCards[createdCards.length - 1];
          if (createdCard) {
            await get().linkCardToScene(createdCard.id, card.sceneId!, card.chapterId!);
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create cards from chapters';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  autoSyncWithTimeline: async (
    _boardId: string,
    _timelineEvents: any[],
    _chapters: Record<string, any>,
  ) => {
    trace.log('autoSyncWithTimeline', 'store_action', 'debug', { boardId });

    try {
      const board = get().boards[boardId];
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const allCards = board.columns.flatMap((col) => col.cards);
      const timelineLinks = linkCardsToTimelineEvents(allCards, timelineEvents, chapters);

      // Apply timeline links to cards
      for (const link of timelineLinks) {
        await get().linkCardToTimeline(link.cardId, link.eventIds);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with timeline';
      set({ lastError: errorMessage });
      throw error;
    }
  },

  getProgressMetrics: (_boardId: string, _chapters: Record<string, any>) => {
    const board = get().boards[boardId];
    if (!board) return null;

    const allCards = board.columns.flatMap((col) => col.cards);
    return calculatePlotProgress(allCards, chapters);
  },

  setAutoSyncConfig: (_config: Partial<AutoSyncConfig>) => {
    trace.log('setAutoSyncConfig', 'store_action', 'debug', { config });

    set((state) => ({
      autoSyncConfig: { ...state.autoSyncConfig, ...config },
    }));
  },
}));

/* ========= Store Initialization ========= */
export const initializePlotBoardStore = async () => {
  trace.log('initialize', 'store_action', 'debug');

  // Load custom templates
  const customTemplates = await storage
    .getAllKeys()
    .then((keys) => keys.filter((key) => key.startsWith('plottemplate_')))
    .then((keys) => Promise.all(keys.map((key) => storage.getItem(key))))
    .then((templates) => templates.filter(Boolean) as PlotBoardTemplate[]);

  if (customTemplates.length > 0) {
    usePlotBoardStore.setState((state) => ({
      templates: {
        ...state.templates,
        ...customTemplates.reduce(
          (acc, _template) => {
            acc[template.id] = template;
            return acc;
          },
          {} as Record<string, PlotBoardTemplate>,
        ),
      },
    }));
  }

  // Load boards
  const boardKeys = await storage
    .getAllKeys()
    .then((keys) => keys.filter((key) => key.startsWith('plotboard_')));

  for (const key of boardKeys) {
    try {
      const board = (await storage.getItem(key)) as PlotBoard;
      if (board) {
        usePlotBoardStore.setState((state) => ({
          boards: { ...state.boards, [board.id]: board },
        }));
      }
    } catch (error) {
      console.warn(`Failed to load plot board from ${key}:`, error);
    }
  }
};
