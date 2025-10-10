// Undo/Redo system for Plot Boards
// Provides bounded history with persistence for board operations

import { useState, useCallback, useRef } from 'react';

import { storage } from '../../../utils/storage';
import { trace } from '../../../utils/trace';
import { PlotBoard } from '../types';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  operation: string;
  boardId: string;
  boardState: PlotBoard;
  description: string;
  metadata?: Record<string, any>;
}

interface UndoRedoState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  currentEntry: HistoryEntry | null;
  isUndoing: boolean;
  isRedoing: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

interface UndoRedoActions {
  pushEntry: (
    operation: string,
    board: PlotBoard,
    description: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  undo: () => Promise<HistoryEntry | null>;
  redo: () => Promise<HistoryEntry | null>;
  clear: () => Promise<void>;
  getHistory: () => HistoryEntry[];
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const MAX_HISTORY_SIZE = 50;
const STORAGE_KEY_PREFIX = 'plotboard_history_';

export const useUndoRedo = (
  boardId: string,
  onRestoreBoard: (board: PlotBoard) => Promise<void>,
): UndoRedoState & UndoRedoActions => {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    currentEntry: null,
    isUndoing: false,
    isRedoing: false,
    canUndo: false,
    canRedo: false,
  });

  const loadingRef = useRef<Promise<void> | null>(null);
  const loadedRef = useRef<boolean>(false);

  // Load persisted history
  const loadHistory = useCallback(async (): Promise<void> => {
    if (loadingRef.current) {
      await loadingRef.current;
      return;
    }

    if (loadedRef.current) {
      return;
    }

    loadingRef.current = (async () => {
      try {
        trace.log('loadHistory', 'store_action', 'debug', { boardId });

        const historyData = await storage.getItem(`${STORAGE_KEY_PREFIX}${boardId}`);
        if (historyData && Array.isArray(historyData)) {
          const undoStack = historyData.map((entry) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));

          setState((prev) => ({
            ...prev,
            undoStack,
            canUndo: undoStack.length > 0,
          }));
        }
        loadedRef.current = true;
      } catch (error) {
        console.warn('Failed to load undo history:', error);
        loadedRef.current = true;
      }
    })();

    await loadingRef.current;
    loadingRef.current = null;
  }, [boardId]);

  // Save history to storage
  const saveHistory = useCallback(
    async (undoStack: HistoryEntry[]): Promise<void> => {
      try {
        await storage.setItem(`${STORAGE_KEY_PREFIX}${boardId}`, undoStack);
      } catch (error) {
        console.warn('Failed to save undo history:', error);
      }
    },
    [boardId],
  );

  // Push new entry to undo stack
  const pushEntry = useCallback(
    async (
      operation: string,
      board: PlotBoard,
      description: string,
      metadata?: Record<string, any>,
    ): Promise<void> => {
      await loadHistory();

      trace.log('pushUndoEntry', 'store_action', 'debug', { operation, boardId, description });

      const entry: HistoryEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        operation,
        boardId,
        boardState: JSON.parse(JSON.stringify(board)), // Deep clone
        description,
        metadata,
      };

      setState((prev) => {
        const newUndoStack = [...prev.undoStack, entry];

        // Limit history size
        if (newUndoStack.length > MAX_HISTORY_SIZE) {
          newUndoStack.splice(0, newUndoStack.length - MAX_HISTORY_SIZE);
        }

        return {
          ...prev,
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack when new action is performed
          currentEntry: entry,
          canUndo: true,
          canRedo: false,
        };
      });

      // Save to storage (async, don't wait)
      const newUndoStack = [...state.undoStack, entry];
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.splice(0, newUndoStack.length - MAX_HISTORY_SIZE);
      }
      saveHistory(newUndoStack);
    },
    [loadHistory, saveHistory, boardId, state.undoStack],
  );

  // Undo last operation
  const undo = useCallback(async (): Promise<HistoryEntry | null> => {
    await loadHistory();

    if (state.undoStack.length === 0 || state.isUndoing || state.isRedoing) {
      return null;
    }

    setState((prev) => ({ ...prev, isUndoing: true }));

    try {
      const entryToUndo = state.undoStack[state.undoStack.length - 1];
      if (!entryToUndo) {
        setState((prev) => ({ ...prev, isUndoing: false }));
        return null;
      }

      const newUndoStack = state.undoStack.slice(0, -1);
      const newRedoStack = [...state.redoStack, entryToUndo];

      trace.log('undoOperation', 'user_action', 'info', {
        operation: entryToUndo.operation,
        description: entryToUndo.description,
      });

      // Restore board state (reconstruct Date objects)
      const restoredBoard = reconstructDates(entryToUndo.boardState);
      await onRestoreBoard(restoredBoard);

      setState((prev) => ({
        ...prev,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        currentEntry: newUndoStack[newUndoStack.length - 1] || null,
        canUndo: newUndoStack.length > 0,
        canRedo: true,
        isUndoing: false,
      }));

      // Save to storage
      await saveHistory(newUndoStack);

      return entryToUndo;
    } catch (error) {
      console.error('Undo operation failed:', error);
      setState((prev) => ({ ...prev, isUndoing: false }));
      return null;
    }
  }, [
    loadHistory,
    state.undoStack,
    state.redoStack,
    state.isUndoing,
    state.isRedoing,
    onRestoreBoard,
    saveHistory,
  ]);

  // Redo last undone operation
  const redo = useCallback(async (): Promise<HistoryEntry | null> => {
    await loadHistory();

    if (state.redoStack.length === 0 || state.isUndoing || state.isRedoing) {
      return null;
    }

    setState((prev) => ({ ...prev, isRedoing: true }));

    try {
      const entryToRedo = state.redoStack[state.redoStack.length - 1];
      if (!entryToRedo) {
        setState((prev) => ({ ...prev, isRedoing: false }));
        return null;
      }

      const newRedoStack = state.redoStack.slice(0, -1);
      const newUndoStack = [...state.undoStack, entryToRedo];

      trace.log('redoOperation', 'user_action', 'info', {
        operation: entryToRedo.operation,
        description: entryToRedo.description,
      });

      // We don't restore the board state for redo, as the entry contains the "after" state
      // Instead, the calling code should handle re-applying the operation

      setState((prev) => ({
        ...prev,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        currentEntry: entryToRedo,
        canUndo: true,
        canRedo: newRedoStack.length > 0,
        isRedoing: false,
      }));

      // Save to storage
      await saveHistory(newUndoStack);

      return entryToRedo;
    } catch (error) {
      console.error('Redo operation failed:', error);
      setState((prev) => ({ ...prev, isRedoing: false }));
      return null;
    }
  }, [
    loadHistory,
    state.redoStack,
    state.undoStack,
    state.isUndoing,
    state.isRedoing,
    saveHistory,
  ]);

  // Clear all history
  const clear = useCallback(async (): Promise<void> => {
    trace.log('clearUndoHistory', 'store_action', 'debug', { boardId });

    setState({
      undoStack: [],
      redoStack: [],
      currentEntry: null,
      isUndoing: false,
      isRedoing: false,
      canUndo: false,
      canRedo: false,
    });

    await storage.removeItem(`${STORAGE_KEY_PREFIX}${boardId}`);
    loadedRef.current = false;
  }, [boardId]);

  // Get full history
  const getHistory = useCallback((): HistoryEntry[] => {
    return [...state.undoStack].reverse(); // Most recent first
  }, [state.undoStack]);

  // Get description for next undo operation
  const getUndoDescription = useCallback((): string | null => {
    if (state.undoStack.length === 0) return null;
    const lastEntry = state.undoStack[state.undoStack.length - 1];
    return lastEntry ? lastEntry.description : null;
  }, [state.undoStack]);

  // Get description for next redo operation
  const getRedoDescription = useCallback((): string | null => {
    if (state.redoStack.length === 0) return null;
    const lastEntry = state.redoStack[state.redoStack.length - 1];
    return lastEntry ? lastEntry.description : null;
  }, [state.redoStack]);

  return {
    ...state,
    pushEntry,
    undo,
    redo,
    clear,
    getHistory,
    getUndoDescription,
    getRedoDescription,
  };
};

// Helper function to create operation descriptions
// Helper to reconstruct Date objects from JSON serialization
const reconstructDates = (board: PlotBoard): PlotBoard => {
  const reconstructed = JSON.parse(JSON.stringify(board));

  // Reconstruct board dates
  if (reconstructed.createdAt) reconstructed.createdAt = new Date(reconstructed.createdAt);
  if (reconstructed.updatedAt) reconstructed.updatedAt = new Date(reconstructed.updatedAt);

  // Reconstruct column and card dates
  reconstructed.columns?.forEach((column: any) => {
    column.cards?.forEach((card: any) => {
      if (card.createdAt) card.createdAt = new Date(card.createdAt);
      if (card.updatedAt) card.updatedAt = new Date(card.updatedAt);
    });
  });

  return reconstructed as PlotBoard;
};

export const createOperationDescription = {
  moveCard: (cardTitle: string, fromColumn: string, toColumn: string): string => {
    if (fromColumn === toColumn) {
      return `Reorder "${cardTitle}" within ${fromColumn}`;
    }
    return `Move "${cardTitle}" from ${fromColumn} to ${toColumn}`;
  },

  reorderColumns: (columnTitles: string[]): string => {
    return `Reorder columns: ${columnTitles.join(', ')}`;
  },

  deleteCard: (cardTitle: string, columnTitle: string): string => {
    return `Delete card "${cardTitle}" from ${columnTitle}`;
  },

  createCard: (cardTitle: string, columnTitle: string): string => {
    return `Add card "${cardTitle}" to ${columnTitle}`;
  },

  updateCard: (cardTitle: string, changes: string[]): string => {
    return `Update "${cardTitle}": ${changes.join(', ')}`;
  },

  deleteColumn: (columnTitle: string, cardCount: number): string => {
    return `Delete column "${columnTitle}" (${cardCount} cards)`;
  },

  createColumn: (columnTitle: string): string => {
    return `Add column "${columnTitle}"`;
  },
};
