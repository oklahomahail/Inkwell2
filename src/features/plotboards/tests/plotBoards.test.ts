// Plot Boards test suite
// Tests for store operations, scene integration, and timeline linking

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SceneStatus, ChapterStatus, TimelineEventType } from '../../../domain/types';
import { getOrThrow } from '../../../test-utils/getters';
import { assertExists } from '../../../test-utils/invariants';
import { usePlotBoardStore } from '../store';
import { PlotCardStatus, PlotCardPriority, PlotColumnType } from '../types';
import {
  sceneToPlotCard,
  syncCardsWithScenes,
  linkCardsToTimelineEvents,
  calculatePlotProgress,
} from '../utils/integration';

import type { Chapter, TimelineEvent } from '../../../domain/types';

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

describe('Plot Board Store', () => {
  beforeEach(() => {
    // Reset the store to initial state
    usePlotBoardStore.setState({
      boards: {},
      activeBoard: null,
      lastError: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Board Operations', () => {
    it('should create a new board', async () => {
      const projectId = 'test-project';
      const title = 'Test Board';

      const board = await usePlotBoardStore.getState().createBoard(projectId, title);
      const updatedStore = usePlotBoardStore.getState(); // Get updated state

      expect(board).toBeDefined();
      expect(board.title).toBe(title);
      expect(board.projectId).toBe(projectId);
      expect(board.columns).toEqual([]);
      expect(updatedStore.boards[board.id]).toBe(board);
      expect(updatedStore.activeBoard).toBe(board.id);
    });

    it('should create a board from template', async () => {
      const projectId = 'test-project';
      const title = 'Three Act Board';
      const templateId = 'three-act-structure';

      const board = await usePlotBoardStore.getState().createBoard(projectId, title, templateId);

      expect(board.title).toBe(title);
      expect(board.columns.length).toBe(3); // Three-act structure
      expect(board.columns[0]?.title).toBe('Act I - Setup');
      expect(board.columns[0]?.cards.length).toBeGreaterThan(0); // Default cards
    });

    it('should update a board', async () => {
      const board = await usePlotBoardStore.getState().createBoard('project', 'Original Title');
      const updates = { title: 'Updated Title', description: 'New description' };

      await usePlotBoardStore.getState().updateBoard(board.id, updates);

      const updatedStore = usePlotBoardStore.getState(); // Get updated state
      const updatedBoard = updatedStore.boards[board.id];
      expect(updatedBoard?.title).toBe(updates.title);
      expect(updatedBoard?.description).toBe(updates.description);
      expect(updatedBoard?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete a board', async () => {
      const board = await usePlotBoardStore.getState().createBoard('project', 'Test Board');

      await usePlotBoardStore.getState().deleteBoard(board.id);

      const updatedStore = usePlotBoardStore.getState();
      expect(updatedStore.boards[board.id]).toBeUndefined();
      expect(updatedStore.activeBoard).toBeNull();
    });

    it('should duplicate a board', async () => {
      const originalBoard = await usePlotBoardStore
        .getState()
        .createBoard('project', 'Original Board');
      await usePlotBoardStore.getState().createColumn(originalBoard.id, 'Test Column');
      const beforeDuplication = usePlotBoardStore.getState(); // Get updated state

      const duplicatedBoard = await usePlotBoardStore
        .getState()
        .duplicateBoard(originalBoard.id, 'Duplicated Board');

      expect(duplicatedBoard.title).toBe('Duplicated Board');
      expect(duplicatedBoard.id).not.toBe(originalBoard.id);
      expect(duplicatedBoard.columns.length).toBe(
        beforeDuplication.boards[originalBoard.id]?.columns.length ?? 0,
      );
      expect(duplicatedBoard.projectId).toBe(originalBoard.projectId);
    });
  });

  describe('Column Operations', () => {
    let boardId: string;

    beforeEach(async () => {
      const board = await usePlotBoardStore.getState().createBoard('project', 'Test Board');
      boardId = board.id;
    });

    it('should create a column', async () => {
      const title = 'Test Column';
      const type = PlotColumnType.ACT;
      const color = '#FF0000';

      const column = await usePlotBoardStore.getState().createColumn(boardId, title, type, color);

      expect(column.title).toBe(title);
      expect(column.type).toBe(type);
      expect(column.color).toBe(color);
      expect(column.boardId).toBe(boardId);

      const updatedStore = usePlotBoardStore.getState();
      const board = updatedStore.boards[boardId];
      expect(board?.columns.find((c) => c.id === column.id)).toBe(column);
    });

    it('should update a column', async () => {
      const column = await usePlotBoardStore.getState().createColumn(boardId, 'Original Title');
      const updates = { title: 'Updated Title', description: 'New description' };

      await usePlotBoardStore.getState().updateColumn(column.id, updates);

      const updatedStore = usePlotBoardStore.getState();
      const board = updatedStore.boards[boardId];
      const updatedColumn = board?.columns.find((c) => c.id === column.id);
      expect(updatedColumn?.title).toBe(updates.title);
      expect(updatedColumn?.description).toBe(updates.description);
    });

    it('should delete a column', async () => {
      const column = await usePlotBoardStore.getState().createColumn(boardId, 'Test Column');

      await usePlotBoardStore.getState().deleteColumn(column.id);

      const updatedStore = usePlotBoardStore.getState();
      const board = updatedStore.boards[boardId];
      expect(board?.columns.find((c) => c.id === column.id)).toBeUndefined();
    });

    it('should reorder columns', async () => {
      const column1 = await usePlotBoardStore.getState().createColumn(boardId, 'Column 1');
      const column2 = await usePlotBoardStore.getState().createColumn(boardId, 'Column 2');
      const column3 = await usePlotBoardStore.getState().createColumn(boardId, 'Column 3');

      // Reorder: [1,2,3] -> [2,3,1]
      await usePlotBoardStore
        .getState()
        .reorderColumns(boardId, [column2.id, column3.id, column1.id]);

      const updatedStore = usePlotBoardStore.getState();
      const board = updatedStore.boards[boardId];
      assertExists(board, 'board not found after reorder');
      const orderedColumns = board.columns.sort((a, b) => a.order - b.order);
      expect(orderedColumns[0]?.id).toBe(column2.id);
      expect(orderedColumns[1]?.id).toBe(column3.id);
      expect(orderedColumns[2]?.id).toBe(column1.id);
    });
  });

  describe('Card Operations', () => {
    let boardId: string;
    let columnId: string;

    beforeEach(async () => {
      const board = await usePlotBoardStore.getState().createBoard('project', 'Test Board');
      const column = await usePlotBoardStore.getState().createColumn(board.id, 'Test Column');
      boardId = board.id;
      columnId = column.id;
    });

    it('should create a card', async () => {
      const title = 'Test Card';
      const description = 'Test description';

      const card = await usePlotBoardStore.getState().createCard(columnId, title, description);

      expect(card.title).toBe(title);
      expect(card.description).toBe(description);
      expect(card.columnId).toBe(columnId);
      expect(card.status).toBe(PlotCardStatus.IDEA);
      expect(card.priority).toBe(PlotCardPriority.MEDIUM);
    });

    it('should update a card', async () => {
      const card = await usePlotBoardStore.getState().createCard(columnId, 'Original Title');
      const updates = {
        title: 'Updated Title',
        status: PlotCardStatus.DRAFT,
        priority: PlotCardPriority.HIGH,
      };

      await usePlotBoardStore.getState().updateCard(card.id, updates);

      const result = usePlotBoardStore.getState().findCardById(card.id);
      expect(result?.card.title).toBe(updates.title);
      expect(result?.card.status).toBe(updates.status);
      expect(result?.card.priority).toBe(updates.priority);
    });

    it('should delete a card', async () => {
      const card = await usePlotBoardStore.getState().createCard(columnId, 'Test Card');

      await usePlotBoardStore.getState().deleteCard(card.id);

      const result = usePlotBoardStore.getState().findCardById(card.id);
      expect(result).toBeNull();
    });

    it('should move a card between columns', async () => {
      const column2 = await usePlotBoardStore.getState().createColumn(boardId, 'Column 2');
      const card = await usePlotBoardStore.getState().createCard(columnId, 'Test Card');

      await usePlotBoardStore.getState().moveCard(card.id, column2.id, 0);

      const result = usePlotBoardStore.getState().findCardById(card.id);
      expect(result?.card.columnId).toBe(column2.id);
      expect(result?.column.id).toBe(column2.id);
    });

    it('should reorder cards within a column', async () => {
      const card1 = await usePlotBoardStore.getState().createCard(columnId, 'Card 1');
      const card2 = await usePlotBoardStore.getState().createCard(columnId, 'Card 2');
      const card3 = await usePlotBoardStore.getState().createCard(columnId, 'Card 3');

      // Reorder: [1,2,3] -> [3,1,2]
      await usePlotBoardStore.getState().reorderCards(columnId, [card3.id, card1.id, card2.id]);

      const updatedStore = usePlotBoardStore.getState();
      const board = updatedStore.boards[boardId];
      assertExists(board, 'board not found');
      const column = board.columns.find((c) => c.id === columnId);
      assertExists(column, 'column not found');
      const orderedCards = column.cards.sort((a, b) => a.order - b.order);

      expect(orderedCards[0]?.id).toBe(card3.id);
      expect(orderedCards[1]?.id).toBe(card1.id);
      expect(orderedCards[2]?.id).toBe(card2.id);
    });

    it('should link a card to a scene', async () => {
      const card = await usePlotBoardStore.getState().createCard(columnId, 'Test Card');
      const sceneId = 'scene-1';
      const chapterId = 'chapter-1';

      await usePlotBoardStore.getState().linkCardToScene(card.id, sceneId, chapterId);

      const result = usePlotBoardStore.getState().findCardById(card.id);
      expect(result?.card.sceneId).toBe(sceneId);
      expect(result?.card.chapterId).toBe(chapterId);
    });

    it('should link a card to timeline events', async () => {
      const card = await usePlotBoardStore.getState().createCard(columnId, 'Test Card');
      const eventIds = ['event-1', 'event-2'];

      await usePlotBoardStore.getState().linkCardToTimeline(card.id, eventIds);

      const result = usePlotBoardStore.getState().findCardById(card.id);
      expect(result?.card.timelineEventIds).toEqual(eventIds);
    });
  });

  describe('Utility Functions', () => {
    let boardId: string;
    let columnId: string;

    beforeEach(async () => {
      const board = await usePlotBoardStore.getState().createBoard('project', 'Test Board');
      const column = await usePlotBoardStore.getState().createColumn(board.id, 'Test Column');
      boardId = board.id;
      columnId = column.id;
    });

    it('should find cards by status', async () => {
      await usePlotBoardStore.getState().createCard(columnId, 'Draft Card 1');
      await usePlotBoardStore.getState().createCard(columnId, 'Draft Card 2');
      const card3 = await usePlotBoardStore.getState().createCard(columnId, 'Complete Card');

      await usePlotBoardStore.getState().updateCard(card3.id, { status: PlotCardStatus.COMPLETE });

      const draftCards = usePlotBoardStore
        .getState()
        .getCardsByStatus(boardId, PlotCardStatus.IDEA);
      const completeCards = usePlotBoardStore
        .getState()
        .getCardsByStatus(boardId, PlotCardStatus.COMPLETE);

      expect(draftCards.length).toBe(2);
      expect(completeCards.length).toBe(1);
      expect(completeCards[0]?.id).toBe(card3.id);
    });

    it('should search cards by text', async () => {
      await usePlotBoardStore.getState().createCard(columnId, 'Important Scene');
      await usePlotBoardStore.getState().createCard(columnId, 'Regular Chapter');
      await usePlotBoardStore.getState().createCard(columnId, 'Another Important Plot Point');

      const results = usePlotBoardStore.getState().searchCards('important');

      expect(results.length).toBe(2);
      expect(results[0]?.title).toContain('Important');
      expect(results[1]?.title).toContain('Important');
    });

    it('should bulk update cards', async () => {
      const card1 = await usePlotBoardStore.getState().createCard(columnId, 'Card 1');
      const card2 = await usePlotBoardStore.getState().createCard(columnId, 'Card 2');
      const updates = { status: PlotCardStatus.DRAFT, priority: PlotCardPriority.HIGH };

      await usePlotBoardStore.getState().bulkUpdateCards([card1.id, card2.id], updates);

      const result1 = usePlotBoardStore.getState().findCardById(card1.id);
      const result2 = usePlotBoardStore.getState().findCardById(card2.id);

      expect(result1?.card.status).toBe(PlotCardStatus.DRAFT);
      expect(result1?.card.priority).toBe(PlotCardPriority.HIGH);
      expect(result2?.card.status).toBe(PlotCardStatus.DRAFT);
      expect(result2?.card.priority).toBe(PlotCardPriority.HIGH);
    });
  });
});

describe('Scene Integration', () => {
  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: 'Chapter 1',
    scenes: [
      {
        id: 'scene-1',
        title: 'Opening Scene',
        content: 'A long scene with lots of content for testing',
        summary: 'The story begins',
        wordCount: 500,
        status: SceneStatus.DRAFT,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'scene-2',
        title: 'Second Scene',
        content: 'Short',
        summary: 'Conflict arises',
        wordCount: 50,
        status: SceneStatus.DRAFT,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    order: 1,
    totalWordCount: 550,
    status: ChapterStatus.DRAFT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should convert scene to plot card', () => {
    const scene = getOrThrow(mockChapter.scenes?.[0], 'first scene not found');
    const columnId = 'column-1';

    const card = sceneToPlotCard(scene, mockChapter, columnId, 0);

    expect(card.title).toBe(scene.title);
    expect(card.sceneId).toBe(scene.id);
    expect(card.chapterId).toBe(mockChapter.id);
    expect(card.columnId).toBe(columnId);
    expect(card.status).toBe(PlotCardStatus.DRAFT); // Long content = draft
    expect(card.priority).toBe(PlotCardPriority.HIGH); // First scene = high priority
    expect(card.wordCount).toBe(500);
  });

  it('should determine status based on content length', () => {
    const shortScene = getOrThrow(mockChapter.scenes?.[1], 'second scene not found'); // 50 words
    const longScene = getOrThrow(mockChapter.scenes?.[0], 'first scene not found'); // 500 words

    const shortCard = sceneToPlotCard(shortScene, mockChapter, 'col', 1);
    const longCard = sceneToPlotCard(longScene, mockChapter, 'col', 0);

    expect(shortCard.status).toBe(PlotCardStatus.OUTLINED);
    expect(longCard.status).toBe(PlotCardStatus.DRAFT);
  });

  it('should sync cards with scenes', () => {
    const cards = [
      sceneToPlotCard(
        getOrThrow(mockChapter.scenes?.[0], 'first scene not found'),
        mockChapter,
        'col',
        0,
      ),
      sceneToPlotCard(
        getOrThrow(mockChapter.scenes?.[1], 'second scene not found'),
        mockChapter,
        'col',
        1,
      ),
    ];

    // Update card title
    if (cards[0]) {
      cards[0].title = 'Updated Scene Title';
    }

    const chapters = { [mockChapter.id]: mockChapter };
    const result = syncCardsWithScenes(cards, chapters);

    expect(result.updates.length).toBe(1);
    if (result.updates[0]) {
      expect(result.updates[0].sceneUpdates.title).toBe('Updated Scene Title');
    }
    expect(result.orphanedCards.length).toBe(0);
    expect(result.newCards.length).toBe(0);
  });

  it('should identify orphaned cards', () => {
    const cards = [
      sceneToPlotCard(
        getOrThrow(mockChapter.scenes?.[0], 'first scene not found'),
        mockChapter,
        'col',
        0,
      ),
      {
        ...sceneToPlotCard(
          getOrThrow(mockChapter.scenes?.[1], 'second scene not found'),
          mockChapter,
          'col',
          1,
        ),
        sceneId: 'nonexistent-scene',
      },
    ];

    const chapters = { [mockChapter.id]: mockChapter };
    const result = syncCardsWithScenes(cards, chapters);

    expect(result.orphanedCards.length).toBe(1);
    expect(result.orphanedCards[0]).toBe(cards[1]?.id);
  });
});

describe('Timeline Integration', () => {
  const mockTimelineEvents: TimelineEvent[] = [
    {
      id: 'event-1',
      title: 'Important Event',
      type: TimelineEventType.PLOT_POINT,
      timestamp: new Date('2023-01-01').getTime(),
      storyDate: new Date('2023-01-01').getTime(),
      tags: ['battle', 'climax'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'event-2',
      title: 'Character Meeting',
      type: TimelineEventType.CHARACTER_ARC,
      timestamp: new Date('2023-01-02').getTime(),
      storyDate: new Date('2023-01-02').getTime(),
      tags: ['character', 'introduction'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: 'Chapter 1',
    scenes: [
      {
        id: 'scene-1',
        title: 'Battle Scene',
        content: 'Epic battle content',
        storyDate: new Date('2023-01-01').getTime(),
        tags: ['battle'],
        status: SceneStatus.DRAFT,
        order: 0,
        wordCount: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    order: 1,
    totalWordCount: 0,
    status: ChapterStatus.DRAFT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should link cards to timeline events by date proximity', () => {
    const cards = [
      sceneToPlotCard(
        getOrThrow(mockChapter.scenes?.[0], 'first scene not found'),
        mockChapter,
        'col',
        0,
      ),
    ];
    const chapters = { [mockChapter.id]: mockChapter };

    const links = linkCardsToTimelineEvents(cards, mockTimelineEvents, chapters);

    expect(links.length).toBe(1);
    expect(links[0]?.cardId).toBe(cards[0]?.id);
    expect(links[0]?.eventIds).toContain('event-1'); // Same date
  });

  it('should link cards to timeline events by tag matching', () => {
    const cards = [
      sceneToPlotCard(
        getOrThrow(mockChapter.scenes?.[0], 'first scene not found'),
        mockChapter,
        'col',
        0,
      ),
    ];
    const chapters = { [mockChapter.id]: mockChapter };

    const links = linkCardsToTimelineEvents(cards, mockTimelineEvents, chapters);

    expect(links.length).toBe(1);
    expect(links[0]?.eventIds).toContain('event-1'); // Matching 'battle' tag
  });
});

describe('Progress Tracking', () => {
  it('should calculate progress metrics', () => {
    const cards = [
      {
        id: 'card-1',
        status: PlotCardStatus.COMPLETE,
        priority: PlotCardPriority.HIGH,
        wordCount: 1000,
        estimatedLength: 1200,
        chapterId: 'chapter-1',
      },
      {
        id: 'card-2',
        status: PlotCardStatus.DRAFT,
        priority: PlotCardPriority.MEDIUM,
        wordCount: 500,
        estimatedLength: 800,
        chapterId: 'chapter-1',
      },
      {
        id: 'card-3',
        status: PlotCardStatus.IDEA,
        priority: PlotCardPriority.LOW,
        wordCount: 0,
        estimatedLength: 500,
        chapterId: 'chapter-2',
      },
    ] as any[];

    const chapters = {
      'chapter-1': {
        id: 'chapter-1',
        title: 'Chapter 1',
        order: 1,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'chapter-2': {
        id: 'chapter-2',
        title: 'Chapter 2',
        order: 2,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const metrics = calculatePlotProgress(cards, chapters);

    expect(metrics.totalCards).toBe(3);
    expect(metrics.cardsByStatus[PlotCardStatus.COMPLETE]).toBe(1);
    expect(metrics.cardsByStatus[PlotCardStatus.DRAFT]).toBe(1);
    expect(metrics.cardsByStatus[PlotCardStatus.IDEA]).toBe(1);
    expect(metrics.averageProgress).toBeGreaterThan(0);
    expect(metrics.wordCountProgress.current).toBe(1500);
    expect(metrics.wordCountProgress.estimated).toBe(2500);
    expect(metrics.chapterProgress.length).toBe(2);
  });

  it('should calculate chapter-level progress', () => {
    const cards = [
      {
        id: 'card-1',
        status: PlotCardStatus.COMPLETE,
        chapterId: 'chapter-1',
        wordCount: 1000,
      },
      {
        id: 'card-2',
        status: PlotCardStatus.DRAFT,
        chapterId: 'chapter-1',
        wordCount: 500,
      },
    ] as any[];

    const chapters = {
      'chapter-1': {
        id: 'chapter-1',
        title: 'Chapter 1',
        order: 1,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const metrics = calculatePlotProgress(cards, chapters);
    const chapterProgress = getOrThrow(metrics.chapterProgress[0], 'chapter progress not found');

    expect(chapterProgress.chapterId).toBe('chapter-1');
    expect(chapterProgress.totalCards).toBe(2);
    expect(chapterProgress.completedCards).toBe(1);
    expect(chapterProgress.totalWords).toBe(1500);
    expect(chapterProgress.averageProgress).toBe(75); // (100 + 50) / 2 - draft is 50% weight
  });
});
