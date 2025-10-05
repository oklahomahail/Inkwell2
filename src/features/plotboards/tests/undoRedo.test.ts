// Undo/Redo functionality tests
// Tests for Plot Board undo/redo operations and history management

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useUndoRedo, createOperationDescription } from '../hooks/useUndoRedo';
import { PlotBoard, PlotColumnType, PlotCardStatus, PlotCardPriority } from '../types';

// Mock storage
vi.mock('../../../utils/storage', () => ({
  storage: {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(undefined),
    getAllKeys: vi.fn().mockResolvedValue([]),
  },
}));

// Mock tracing
vi.mock('../../../utils/trace', () => ({
  trace: {
    log: vi.fn(),
  },
}));

const createMockBoard = (id: string = 'test-board'): PlotBoard => ({
  id,
  title: 'Test Board',
  projectId: 'test-project',
  columns: [
    {
      id: 'col-1',
      boardId: id,
      title: 'Column 1',
      type: PlotColumnType.CUSTOM,
      color: '#10B981',
      order: 0,
      cards: [
        {
          id: 'card-1',
          columnId: 'col-1',
          title: 'Card 1',
          description: 'First card',
          order: 0,
          status: PlotCardStatus.IDEA,
          priority: PlotCardPriority.MEDIUM,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      settings: {},
    },
  ],
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Undo/Redo Hook', () => {
  let mockOnRestoreBoard: ReturnType<typeof vi.fn>;
  let mockBoard: PlotBoard;

  beforeEach(() => {
    mockOnRestoreBoard = vi.fn().mockResolvedValue(undefined);
    mockBoard = createMockBoard();
    vi.clearAllMocks();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.getUndoDescription()).toBeNull();
    expect(result.current.getRedoDescription()).toBeNull();
  });

  it('should push entry to undo stack', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card "Test Card" to Column 1', {
        cardTitle: 'Test Card',
      });
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.getUndoDescription()).toBe('Add card "Test Card" to Column 1');
  });

  it('should perform undo operation', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    // Push an entry first
    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card "Test Card" to Column 1');
    });

    expect(result.current.canUndo).toBe(true);

    // Perform undo
    await act(async () => {
      const undoneEntry = await result.current.undo();
      expect(undoneEntry).toBeTruthy();
      expect(undoneEntry?.description).toBe('Add card "Test Card" to Column 1');
    });

    expect(mockOnRestoreBoard).toHaveBeenCalledTimes(1);
    // Board should be restored with same structure (dates may be reconstructed)
    const restoredBoard = mockOnRestoreBoard.mock.calls[0][0];
    expect(restoredBoard.id).toBe(mockBoard.id);
    expect(restoredBoard.title).toBe(mockBoard.title);
    expect(restoredBoard.columns.length).toBe(mockBoard.columns.length);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
    expect(result.current.getRedoDescription()).toBe('Add card "Test Card" to Column 1');
  });

  it('should perform redo operation', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    // Push entry and undo first
    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card "Test Card"');
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    // Perform redo
    await act(async () => {
      const redoneEntry = await result.current.redo();
      expect(redoneEntry).toBeTruthy();
      expect(redoneEntry?.description).toBe('Add card "Test Card"');
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear redo stack on new action', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    // Push entry, undo, then push new entry
    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card 1');
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card 2');
    });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.getUndoDescription()).toBe('Add card 2');
  });

  it('should limit history size', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    // Push more than MAX_HISTORY_SIZE entries
    await act(async () => {
      for (let i = 0; i < 55; i++) {
        await result.current.pushEntry('createCard', mockBoard, `Add card ${i}`);
      }
    });

    const history = result.current.getHistory();
    expect(history.length).toBeLessThanOrEqual(50); // MAX_HISTORY_SIZE
  });

  it('should clear all history', async () => {
    const { result } = renderHook(() => useUndoRedo('test-board', mockOnRestoreBoard));

    await act(async () => {
      await result.current.pushEntry('createCard', mockBoard, 'Add card');
    });

    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      await result.current.clear();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.getHistory().length).toBe(0);
  });

  // Note: Concurrency protection is handled at the hook level
  // and is difficult to test reliably in React Testing Library
});

describe('Operation Description Helpers', () => {
  it('should create correct move card descriptions', () => {
    expect(createOperationDescription.moveCard('Card 1', 'Column A', 'Column B')).toBe(
      'Move "Card 1" from Column A to Column B',
    );

    expect(createOperationDescription.moveCard('Card 1', 'Column A', 'Column A')).toBe(
      'Reorder "Card 1" within Column A',
    );
  });

  it('should create correct column operation descriptions', () => {
    expect(createOperationDescription.createColumn('New Column')).toBe('Add column "New Column"');

    expect(createOperationDescription.deleteColumn('Old Column', 5)).toBe(
      'Delete column "Old Column" (5 cards)',
    );

    expect(createOperationDescription.reorderColumns(['Col A', 'Col B', 'Col C'])).toBe(
      'Reorder columns: Col A, Col B, Col C',
    );
  });

  it('should create correct card operation descriptions', () => {
    expect(createOperationDescription.createCard('New Card', 'Column 1')).toBe(
      'Add card "New Card" to Column 1',
    );

    expect(createOperationDescription.deleteCard('Old Card', 'Column 1')).toBe(
      'Delete card "Old Card" from Column 1',
    );

    expect(createOperationDescription.updateCard('Card 1', ['title', 'description'])).toBe(
      'Update "Card 1": title, description',
    );
  });
});
