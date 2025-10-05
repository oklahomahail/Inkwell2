// Plot Boards integration utilities
// Connects plot boards with existing chapter/scene data and timeline events

import { Chapter, Scene, TimelineEvent } from '../../../domain/types';
import { PlotCard, PlotCardStatus, PlotCardPriority } from '../types';

/* ========= Chapter/Scene Integration ========= */
export interface ScenePlotCardMapping {
  sceneId: string;
  chapterId: string;
  cardId: string;
  boardId: string;
  wordCount: number;
  lastSynced: Date;
}

export interface ChapterPlotSummary {
  chapterId: string;
  totalCards: number;
  completedCards: number;
  totalWords: number;
  averageProgress: number;
  linkedBoards: string[];
}

/**
 * Converts a scene into a plot card
 */
export const sceneToPlotCard = (
  scene: Scene,
  chapter: Chapter,
  columnId: string,
  order: number = 0,
): PlotCard => {
  // Determine status based on scene content/word count
  let status = PlotCardStatus.IDEA;
  const effectiveWordCount = scene.wordCount || scene.content?.length || 0;
  if ((scene.content && scene.content.trim().length > 0) || effectiveWordCount > 0) {
    if (effectiveWordCount >= 500) {
      status = PlotCardStatus.DRAFT;
    } else {
      status = PlotCardStatus.OUTLINED;
    }
  }

  // Determine priority based on scene importance or order
  let priority = PlotCardPriority.MEDIUM;
  if (order === 0) {
    priority = PlotCardPriority.HIGH; // First scene is usually important
  }

  return {
    id: `card_${scene.id}`,
    columnId,
    title: scene.title || `Scene ${order + 1}`,
    description: scene.summary || `Scene in ${chapter.title}`,
    order,
    sceneId: scene.id,
    chapterId: chapter.id,
    status,
    priority,
    tags: ['scene', chapter.title.toLowerCase().replace(/\s+/g, '-'), ...(scene.tags || [])],
    wordCount: scene.wordCount || scene.content?.length || 0,
    notes: scene.notes,
    createdAt: scene.createdAt,
    updatedAt: scene.updatedAt,
  };
};

/**
 * Updates a scene based on plot card changes
 */
export const updateSceneFromPlotCard = (scene: Scene, card: PlotCard): Partial<Scene> => {
  const updates: Partial<Scene> = {};

  // Update title if changed
  if (card.title !== scene.title) {
    updates.title = card.title;
  }

  // Update summary if description changed
  if (card.description && card.description !== scene.summary) {
    updates.summary = card.description;
  }

  // Update notes if changed
  if (card.notes !== scene.notes) {
    updates.notes = card.notes;
  }

  // Update word count if significantly different
  if (card.wordCount && Math.abs(card.wordCount - (scene.wordCount || 0)) > 10) {
    updates.wordCount = card.wordCount;
  }

  // Update tags, filtering out auto-generated ones
  const sceneSpecificTags = card.tags.filter(
    (tag) => !['scene', 'chapter'].includes(tag) && !tag.includes('-'),
  );
  if (sceneSpecificTags.length > 0) {
    updates.tags = sceneSpecificTags;
  }

  return updates;
};

/**
 * Creates plot cards for all scenes in a chapter
 */
export const createCardsFromChapter = (chapter: Chapter, columnId: string): PlotCard[] => {
  if (!chapter.scenes) return [];

  return chapter.scenes.map((scene, index) => sceneToPlotCard(scene, chapter, columnId, index));
};

/**
 * Syncs plot cards with their corresponding scenes
 */
export const syncCardsWithScenes = (
  cards: PlotCard[],
  chapters: Record<string, Chapter>,
): {
  updates: Array<{ cardId: string; sceneUpdates: Partial<Scene>; chapterId: string }>;
  orphanedCards: string[];
  newCards: PlotCard[];
} => {
  const updates: Array<{ cardId: string; sceneUpdates: Partial<Scene>; chapterId: string }> = [];
  const orphanedCards: string[] = [];
  const newCards: PlotCard[] = [];

  // Check existing cards
  for (const card of cards) {
    if (card.sceneId && card.chapterId) {
      const chapter = chapters[card.chapterId];
      if (!chapter) {
        orphanedCards.push(card.id);
        continue;
      }

      const scene = chapter.scenes?.find((s) => s.id === card.sceneId);
      if (!scene) {
        orphanedCards.push(card.id);
        continue;
      }

      const sceneUpdates = updateSceneFromPlotCard(scene, card);
      if (Object.keys(sceneUpdates).length > 0) {
        updates.push({
          cardId: card.id,
          sceneUpdates,
          chapterId: card.chapterId,
        });
      }
    }
  }

  // Find scenes without cards
  for (const chapter of Object.values(chapters)) {
    if (!chapter.scenes) continue;

    for (const scene of chapter.scenes) {
      const hasCard = cards.some((card) => card.sceneId === scene.id);
      if (!hasCard) {
        // Create a new card for this scene
        const newCard = sceneToPlotCard(scene, chapter, 'unassigned');
        newCards.push(newCard);
      }
    }
  }

  return { updates, orphanedCards, newCards };
};

/* ========= Timeline Integration ========= */
export interface TimelineEventPlotMapping {
  eventId: string;
  cardIds: string[];
  boardId: string;
  lastSynced: Date;
}

/**
 * Links plot cards to timeline events based on temporal proximity
 */
export const linkCardsToTimelineEvents = (
  cards: PlotCard[],
  timelineEvents: TimelineEvent[],
  chapters: Record<string, Chapter>,
): Array<{ cardId: string; eventIds: string[] }> => {
  const links: Array<{ cardId: string; eventIds: string[] }> = [];

  for (const card of cards) {
    if (!card.sceneId || !card.chapterId) continue;

    const chapter = chapters[card.chapterId];
    if (!chapter?.scenes) continue;

    const scene = chapter.scenes.find((s) => s.id === card.sceneId);
    if (!scene) continue;

    // Find timeline events that might relate to this scene
    const relatedEvents = timelineEvents.filter((event) => {
      // Basic temporal matching - could be enhanced with more sophisticated logic
      if (scene.storyDate && event.storyDate) {
        const sceneDateStr =
          typeof scene.storyDate === 'string' ? scene.storyDate : scene.storyDate.toISOString();
        const eventDateStr =
          typeof event.storyDate === 'string' ? event.storyDate : event.storyDate.toISOString();

        return (
          Math.abs(new Date(sceneDateStr).getTime() - new Date(eventDateStr).getTime()) <
          24 * 60 * 60 * 1000
        ); // Within 24 hours
      }

      // Tag matching
      const sceneTags = scene.tags || [];
      const eventTags = event.tags || [];
      return sceneTags.some((tag) => eventTags.includes(tag));
    });

    if (relatedEvents.length > 0) {
      links.push({
        cardId: card.id,
        eventIds: relatedEvents.map((e) => e.id),
      });
    }
  }

  return links;
};

/* ========= Progress Tracking ========= */
export interface PlotProgressMetrics {
  boardId: string;
  totalCards: number;
  cardsByStatus: Record<PlotCardStatus, number>;
  cardsByPriority: Record<PlotCardPriority, number>;
  averageProgress: number;
  estimatedCompletion: Date | null;
  wordCountProgress: {
    current: number;
    estimated: number;
    percentage: number;
  };
  chapterProgress: ChapterPlotSummary[];
}

/**
 * Calculates comprehensive progress metrics for a plot board
 */
export const calculatePlotProgress = (
  cards: PlotCard[],
  chapters: Record<string, Chapter>,
): PlotProgressMetrics => {
  const totalCards = cards.length;

  // Count by status
  const cardsByStatus = cards.reduce(
    (acc, card) => {
      acc[card.status] = (acc[card.status] || 0) + 1;
      return acc;
    },
    {} as Record<PlotCardStatus, number>,
  );

  // Count by priority
  const cardsByPriority = cards.reduce(
    (acc, card) => {
      acc[card.priority] = (acc[card.priority] || 0) + 1;
      return acc;
    },
    {} as Record<PlotCardPriority, number>,
  );

  // Calculate progress percentage
  const statusWeights = {
    [PlotCardStatus.IDEA]: 0,
    [PlotCardStatus.OUTLINED]: 0.25,
    [PlotCardStatus.DRAFT]: 0.5,
    [PlotCardStatus.REVISION]: 0.75,
    [PlotCardStatus.COMPLETE]: 1,
    [PlotCardStatus.CUT]: 0, // Cut cards don't count toward progress
  };

  const totalProgress = cards.reduce((sum, card) => {
    return sum + (statusWeights[card.status] || 0);
  }, 0);

  const averageProgress = totalCards > 0 ? (totalProgress / totalCards) * 100 : 0;

  // Word count progress
  const currentWords = cards.reduce((sum, card) => sum + (card.wordCount || 0), 0);
  const estimatedWords = cards.reduce((sum, card) => sum + (card.estimatedLength || 1000), 0);
  const wordCountPercentage = estimatedWords > 0 ? (currentWords / estimatedWords) * 100 : 0;

  // Chapter-level progress
  const chapterProgress: ChapterPlotSummary[] = [];
  const chapterCards = new Map<string, PlotCard[]>();

  cards.forEach((card) => {
    if (card.chapterId) {
      if (!chapterCards.has(card.chapterId)) {
        chapterCards.set(card.chapterId, []);
      }
      chapterCards.get(card.chapterId)!.push(card);
    }
  });

  chapterCards.forEach((chapterCardList, chapterId) => {
    const completedCards = chapterCardList.filter(
      (c) => c.status === PlotCardStatus.COMPLETE,
    ).length;
    const totalWords = chapterCardList.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    const chapterProgress_avg =
      (chapterCardList.reduce((sum, c) => {
        return sum + (statusWeights[c.status] || 0);
      }, 0) /
        chapterCardList.length) *
      100;

    chapterProgress.push({
      chapterId,
      totalCards: chapterCardList.length,
      completedCards,
      totalWords,
      averageProgress: chapterProgress_avg,
      linkedBoards: ['current'], // Could track multiple boards
    });
  });

  // Estimate completion date based on recent progress
  let estimatedCompletion: Date | null = null;
  if (averageProgress > 0 && averageProgress < 100) {
    const remainingProgress = 100 - averageProgress;
    const estimatedDaysRemaining = (remainingProgress / averageProgress) * 30; // Rough estimate
    estimatedCompletion = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
  }

  return {
    boardId: 'current',
    totalCards,
    cardsByStatus,
    cardsByPriority,
    averageProgress,
    estimatedCompletion,
    wordCountProgress: {
      current: currentWords,
      estimated: estimatedWords,
      percentage: wordCountPercentage,
    },
    chapterProgress,
  };
};

/* ========= Auto-sync Configuration ========= */
export interface AutoSyncConfig {
  enabled: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'card-wins' | 'scene-wins' | 'manual';
  autoCreateCards: boolean;
  autoLinkTimeline: boolean;
}

export const DEFAULT_SYNC_CONFIG: AutoSyncConfig = {
  enabled: true,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'card-wins',
  autoCreateCards: true,
  autoLinkTimeline: true,
};

/* ========= Utilities ========= */
/**
 * Generates a unique card ID from scene ID
 */
export const generateCardIdFromScene = (sceneId: string): string => {
  return `card_scene_${sceneId}`;
};

/**
 * Extracts scene ID from card ID (if it's a scene-based card)
 */
export const extractSceneIdFromCard = (cardId: string): string | null => {
  if (cardId.startsWith('card_scene_')) {
    return cardId.replace('card_scene_', '');
  }
  return null;
};

/**
 * Checks if two cards represent the same scene
 */
export const cardsRepresentSameScene = (card1: PlotCard, card2: PlotCard): boolean => {
  return (
    card1.sceneId === card2.sceneId &&
    card1.chapterId === card2.chapterId &&
    card1.sceneId !== undefined
  );
};
