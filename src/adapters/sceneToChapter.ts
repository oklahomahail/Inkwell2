/**
 * Scene to Chapter Adapter
 *
 * Converts legacy scene-based chapters to new chapter-only format.
 * Used during migration period when VITE_ENABLE_CHAPTER_MODEL flag is transitioning.
 */

import type { Chapter } from '@/types/project';
import type { Scene } from '@/types/writing';

/**
 * Legacy chapter format with nested scenes
 * @deprecated Use Chapter from types/project.ts instead
 */
export interface LegacyChapterWithScenes {
  id: string;
  title: string;
  scenes: Scene[];
  order?: number;
  status?: string;
  summary?: string;
  notes?: string;
  createdAt?: Date | number | string;
  updatedAt?: Date | number | string;
  totalWordCount?: number;
  [key: string]: any;
}

/**
 * Convert legacy scene-based chapter to new chapter-only format
 * Flattens all scenes into a single content string
 */
export function sceneChapterToCanonical(legacy: LegacyChapterWithScenes): Chapter {
  const now = Date.now();

  // Combine all scene content into chapter content
  const combinedContent = legacy.scenes
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(scene => {
      // Add scene title as heading if it exists
      const title = scene.title ? `<h2>${scene.title}</h2>\n` : '';
      return title + (scene.content || '');
    })
    .join('\n\n');

  // Calculate word count from content
  const wordCount = combinedContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Extract character IDs from all scenes
  const charactersInChapter = Array.from(
    new Set(
      legacy.scenes.flatMap(scene => scene.characterIds || [])
    )
  );

  return {
    id: legacy.id,
    title: legacy.title,
    summary: legacy.summary || '',
    content: combinedContent,
    wordCount,
    targetWordCount: undefined,
    status: mapLegacyStatus(legacy.status),
    order: legacy.order || 0,
    charactersInChapter,
    plotPointsResolved: [],
    notes: legacy.notes || '',
    createdAt: normalizeTimestamp(legacy.createdAt, now),
    updatedAt: normalizeTimestamp(legacy.updatedAt, now),
  };
}

/**
 * Convert array of legacy chapters to canonical format
 */
export function convertLegacyChapters(legacyChapters: LegacyChapterWithScenes[]): Chapter[] {
  return legacyChapters
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((legacy, index) => ({
      ...sceneChapterToCanonical(legacy),
      order: index, // Ensure sequential ordering
    }));
}

/**
 * Map legacy status values to canonical ChapterStatus
 */
function mapLegacyStatus(status: string | undefined): 'planned' | 'in-progress' | 'first-draft' | 'revised' | 'completed' {
  if (!status) return 'in-progress';

  const statusMap: Record<string, Chapter['status']> = {
    'draft': 'first-draft',
    'in_progress': 'in-progress',
    'in-progress': 'in-progress',
    'revising': 'revised',
    'final': 'completed',
    'completed': 'completed',
    'planned': 'planned',
  };

  return statusMap[status.toLowerCase()] || 'in-progress';
}

/**
 * Normalize timestamp to number (epoch ms)
 */
function normalizeTimestamp(timestamp: Date | number | string | undefined, fallback: number): number {
  if (!timestamp) return fallback;

  if (typeof timestamp === 'number') {
    return timestamp;
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp).getTime();
    return isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

/**
 * Extract scene metadata for migration tracking
 * Useful for preserving scene boundaries in notes/metadata
 */
export interface SceneBoundary {
  sceneId: string;
  title: string;
  characterOffset: number; // Where scene starts in combined content
  wordCount: number;
  characterIds?: string[];
}

export function extractSceneBoundaries(legacy: LegacyChapterWithScenes): SceneBoundary[] {
  let currentOffset = 0;
  const boundaries: SceneBoundary[] = [];

  const sortedScenes = [...legacy.scenes].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const scene of sortedScenes) {
    const title = scene.title ? `<h2>${scene.title}</h2>\n` : '';
    const content = title + (scene.content || '');
    const wordCount = content
      .replace(/<[^>]*>/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    boundaries.push({
      sceneId: scene.id,
      title: scene.title,
      characterOffset: currentOffset,
      wordCount,
      characterIds: scene.characterIds,
    });

    currentOffset += content.length + 2; // +2 for \n\n separator
  }

  return boundaries;
}

/**
 * Check if chapter data appears to be in legacy scene-based format
 */
export function isLegacyChapterFormat(chapter: any): chapter is LegacyChapterWithScenes {
  return (
    typeof chapter === 'object' &&
    chapter !== null &&
    'scenes' in chapter &&
    Array.isArray(chapter.scenes) &&
    chapter.scenes.length > 0
  );
}
