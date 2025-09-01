// src/utils/searchDataAdapter.ts - CLEAN VERSION
import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/writing';

export interface NormalizedScene {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: string;
  updatedAt: Date;
  chapterId: string;
}

export interface NormalizedChapter {
  id: string;
  title: string;
  scenes: NormalizedScene[];
  totalWordCount: number;
  status: string;
  updatedAt: Date;
}

export interface NormalizedProjectData {
  scenes: NormalizedScene[];
  chapters: NormalizedChapter[];
  characters: Array<{
    id: string;
    name: string;
    description: string;
    backstory: string;
    personality: string[];
  }>;
  plotNotes: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }>;
}

/**
 * SearchDataAdapter - Defensive normalization of project data for search indexing
 */
export class SearchDataAdapter {
  /**
   * Safely normalize project data for search indexing
   */
  static normalizeProjectData(
    project: EnhancedProject | null,
    writingChapters: Chapter[],
  ): NormalizedProjectData {
    const result: NormalizedProjectData = {
      scenes: [],
      chapters: [],
      characters: [],
      plotNotes: [],
    };

    if (!project) {
      console.warn('SearchDataAdapter: No project provided for normalization');
      return result;
    }

    try {
      // Normalize writing chapters (editor shape)
      result.chapters = this.normalizeWritingChapters(writingChapters);
      result.scenes = result.chapters.flatMap((chapter) => chapter.scenes);

      // Normalize characters from project
      result.characters = this.normalizeCharacters(project);

      // Normalize plot notes from project
      result.plotNotes = this.normalizePlotNotes(project);

      console.log(
        `SearchDataAdapter: Normalized ${result.scenes.length} scenes, ${result.chapters.length} chapters, ${result.characters.length} characters`,
      );
    } catch (error) {
      console.error('SearchDataAdapter: Error during normalization:', error);
    }

    return result;
  }

  /**
   * Normalize writing chapters with defensive handling of scenes:any
   */
  private static normalizeWritingChapters(chapters: Chapter[]): NormalizedChapter[] {
    return chapters.map((chapter) => {
      try {
        const scenes = this.normalizeChapterScenes(chapter);

        return {
          id: chapter.id,
          title: chapter.title || 'Untitled Chapter',
          scenes,
          totalWordCount:
            this.safeNumber(chapter.totalWordCount) ||
            scenes.reduce((sum, s) => sum + s.wordCount, 0),
          status: this.safeString(chapter.status) || 'draft',
          updatedAt: this.safeDate(chapter.updatedAt) || new Date(),
        };
      } catch (error) {
        console.warn(`SearchDataAdapter: Error normalizing chapter ${chapter.id}:`, error);
        return {
          id: chapter.id,
          title: 'Error Loading Chapter',
          scenes: [],
          totalWordCount: 0,
          status: 'error',
          updatedAt: new Date(),
        };
      }
    });
  }

  /**
   * Safely extract scenes from chapter.scenes which could be anything
   */
  private static normalizeChapterScenes(chapter: Chapter): NormalizedScene[] {
    const scenes: NormalizedScene[] = [];

    try {
      const rawScenes = chapter.scenes;

      if (!rawScenes) {
        console.warn(`SearchDataAdapter: Chapter ${chapter.id} has no scenes property`);
        return scenes;
      }

      if (Array.isArray(rawScenes)) {
        rawScenes.forEach((sceneData: any, index: number) => {
          try {
            const scene = this.normalizeSingleScene(sceneData, chapter.id, index);
            if (scene) {
              scenes.push(scene);
            }
          } catch (error) {
            console.warn(
              `SearchDataAdapter: Error normalizing scene ${index} in chapter ${chapter.id}:`,
              error,
            );
          }
        });
      } else if (typeof rawScenes === 'object') {
        console.warn(`SearchDataAdapter: Chapter ${chapter.id} has scenes as object, not array`);

        if ((rawScenes as any).id && (rawScenes as any).content) {
          const scene = this.normalizeSingleScene(rawScenes, chapter.id, 0);
          if (scene) {
            scenes.push(scene);
          }
        }
      } else {
        console.warn(
          `SearchDataAdapter: Chapter ${chapter.id} has unexpected scenes type:`,
          typeof rawScenes,
        );
      }
    } catch (error) {
      console.error(
        `SearchDataAdapter: Failed to normalize scenes for chapter ${chapter.id}:`,
        error,
      );
    }

    return scenes;
  }

  /**
   * Normalize a single scene with maximum defensive programming
   */
  private static normalizeSingleScene(
    sceneData: any,
    chapterId: string,
    fallbackIndex: number,
  ): NormalizedScene | null {
    try {
      if (!sceneData || typeof sceneData !== 'object') {
        console.warn('SearchDataAdapter: Invalid scene data:', sceneData);
        return null;
      }

      const id = this.safeString(sceneData.id) || `scene_${chapterId}_${fallbackIndex}`;
      const title = this.safeString(sceneData.title) || `Scene ${fallbackIndex + 1}`;
      const content = this.safeString(sceneData.content) || '';

      const providedWordCount = this.safeNumber(sceneData.wordCount);
      const calculatedWordCount = this.calculateWordCount(content);
      const wordCount =
        providedWordCount && Math.abs(providedWordCount - calculatedWordCount) < 50
          ? providedWordCount
          : calculatedWordCount;

      return {
        id,
        title,
        content,
        wordCount,
        status: this.safeString(sceneData.status) || 'draft',
        updatedAt: this.safeDate(sceneData.updatedAt) || new Date(),
        chapterId,
      };
    } catch (error) {
      console.error('SearchDataAdapter: Error normalizing single scene:', error);
      return null;
    }
  }

  /**
   * Normalize characters from project data
   */
  private static normalizeCharacters(project: EnhancedProject): Array<{
    id: string;
    name: string;
    description: string;
    backstory: string;
    personality: string[];
  }> {
    const characters: Array<{
      id: string;
      name: string;
      description: string;
      backstory: string;
      personality: string[];
    }> = [];

    try {
      if (project.characters && Array.isArray(project.characters)) {
        project.characters.forEach((char) => {
          try {
            characters.push({
              id: this.safeString(char.id) || `char_${Date.now()}`,
              name: this.safeString(char.name) || 'Unnamed Character',
              description: this.safeString(char.description) || '',
              backstory: this.safeString(char.backstory) || '',
              personality: Array.isArray(char.personality)
                ? char.personality.filter((p) => typeof p === 'string')
                : [],
            });
          } catch (error) {
            console.warn('SearchDataAdapter: Error normalizing character:', error);
          }
        });
      }
    } catch (error) {
      console.error('SearchDataAdapter: Error normalizing characters:', error);
    }

    return characters;
  }

  /**
   * Normalize plot notes from project data
   */
  private static normalizePlotNotes(project: EnhancedProject): Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }> {
    const plotNotes: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
    }> = [];

    try {
      if (project.plotNotes && Array.isArray(project.plotNotes)) {
        project.plotNotes.forEach((note) => {
          try {
            plotNotes.push({
              id: this.safeString(note.id) || `plot_${Date.now()}`,
              title: this.safeString(note.title) || 'Untitled Note',
              content: this.safeString(note.content) || '',
              type: this.safeString(note.type) || 'outline',
            });
          } catch (error) {
            console.warn('SearchDataAdapter: Error normalizing plot note:', error);
          }
        });
      }
    } catch (error) {
      console.error('SearchDataAdapter: Error normalizing plot notes:', error);
    }

    return plotNotes;
  }

  /**
   * Safe string extraction with fallback
   */
  private static safeString(value: any): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return null;
  }

  /**
   * Safe number extraction with fallback
   */
  private static safeNumber(value: any): number | null {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return null;
  }

  /**
   * Safe date extraction with fallback
   */
  private static safeDate(value: any): Date | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  /**
   * Calculate word count from text content
   */
  private static calculateWordCount(content: string): number {
    if (!content || typeof content !== 'string') {
      return 0;
    }

    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Update a scene in the normalized data and return the updated structure
   */
  static updateSceneInNormalizedData(
    data: NormalizedProjectData,
    sceneId: string,
    updates: Partial<NormalizedScene>,
  ): NormalizedProjectData {
    const updatedData = { ...data };

    // Update in scenes array
    updatedData.scenes = data.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date() } : scene,
    );

    // Update in chapters array
    updatedData.chapters = data.chapters.map((chapter) => {
      const updatedScenes = chapter.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date() } : scene,
      );

      if (updatedScenes !== chapter.scenes) {
        return {
          ...chapter,
          scenes: updatedScenes,
          totalWordCount: updatedScenes.reduce((sum, s) => sum + s.wordCount, 0),
          updatedAt: new Date(),
        };
      }

      return chapter;
    });

    return updatedData;
  }
}
