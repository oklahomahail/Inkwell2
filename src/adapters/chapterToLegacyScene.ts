/**
 * Chapter to Legacy Scene Adapter
 *
 * Converts new chapter-only format back to legacy scene-based format.
 * Used during migration period to support components that haven't been updated yet.
 *
 * @deprecated This adapter exists only for backwards compatibility
 * All components should migrate to use Chapter.content directly
 */

import type { Chapter } from '@/types/project';
import type { Scene } from '@/types/writing';

import type { LegacyChapterWithScenes } from './sceneToChapter';

/**
 * Convert canonical chapter to legacy scene-based format
 * Creates a single scene containing all chapter content
 */
export function canonicalToLegacyChapter(chapter: Chapter): LegacyChapterWithScenes {
  // Split content by h2 headings to create pseudo-scenes
  const scenes = splitContentIntoScenes(chapter);

  return {
    id: chapter.id,
    title: chapter.title,
    scenes,
    order: chapter.order,
    status: mapCanonicalStatus(chapter.status),
    summary: chapter.summary,
    notes: chapter.notes,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    totalWordCount: chapter.wordCount,
  };
}

/**
 * Split chapter content into pseudo-scenes based on h2 headings
 * If no headings found, creates a single scene with all content
 */
function splitContentIntoScenes(chapter: Chapter): Scene[] {
  const content = chapter.content || '';

  // Try to split by h2 tags
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const matches = Array.from(content.matchAll(h2Regex));

  if (matches.length === 0) {
    // No scenes found, create single scene
    return [{
      id: `${chapter.id}-scene-1`,
      title: 'Scene 1',
      content,
      order: 0,
      status: 'draft',
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      wordCount: chapter.wordCount,
      characterIds: chapter.charactersInChapter,
    }];
  }

  // Split content by h2 tags
  const scenes: Scene[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const title = match[1] || `Scene ${index + 1}`;
    const startIndex = match.index! + match[0].length;
    const endIndex = matches[index + 1]?.index ?? content.length;
    const sceneContent = content.substring(startIndex, endIndex).trim();

    const wordCount = sceneContent
      .replace(/<[^>]*>/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    scenes.push({
      id: `${chapter.id}-scene-${index + 1}`,
      title,
      content: sceneContent,
      order: index,
      status: 'draft',
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      wordCount,
      characterIds: chapter.charactersInChapter,
    });

    lastIndex = endIndex;
  });

  return scenes;
}

/**
 * Map canonical ChapterStatus to legacy scene status
 */
function mapCanonicalStatus(status: Chapter['status']): string {
  const statusMap: Record<Chapter['status'], string> = {
    'planned': 'draft',
    'in-progress': 'in_progress',
    'first-draft': 'draft',
    'revised': 'revising',
    'completed': 'final',
  };

  return statusMap[status] || 'draft';
}

/**
 * Convert array of canonical chapters to legacy format
 */
export function convertToLegacyChapters(chapters: Chapter[]): LegacyChapterWithScenes[] {
  return chapters.map(canonicalToLegacyChapter);
}

/**
 * Create a single legacy scene from chapter content
 * Simpler than splitContentIntoScenes - just wraps content in one scene
 */
export function chapterToSingleScene(chapter: Chapter): Scene {
  return {
    id: `${chapter.id}-scene-1`,
    title: chapter.title,
    content: chapter.content,
    order: 0,
    status: mapCanonicalStatus(chapter.status) as any,
    summary: chapter.summary,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    wordCount: chapter.wordCount,
    characterIds: chapter.charactersInChapter,
  };
}

/**
 * Merge multiple scenes back into chapter content
 * Used when saving legacy scene edits to canonical chapter
 */
export function mergeScenesIntoChapter(
  chapter: Chapter,
  scenes: Scene[]
): Chapter {
  const sortedScenes = [...scenes].sort((a, b) => (a.order || 0) - (b.order || 0));

  const combinedContent = sortedScenes
    .map(scene => {
      const title = scene.title ? `<h2>${scene.title}</h2>\n` : '';
      return title + (scene.content || '');
    })
    .join('\n\n');

  const wordCount = combinedContent
    .replace(/<[^>]*>/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Extract unique character IDs from all scenes
  const charactersInChapter = Array.from(
    new Set(sortedScenes.flatMap(scene => scene.characterIds || []))
  );

  return {
    ...chapter,
    content: combinedContent,
    wordCount,
    charactersInChapter,
    updatedAt: Date.now(),
  };
}
