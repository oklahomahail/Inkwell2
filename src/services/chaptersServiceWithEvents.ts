/**
 * Chapter Service with Event Broadcasting
 *
 * Wraps the base Chapters service to emit cross-panel sync events
 * when chapters are modified. This enables real-time updates across
 * panels without polling.
 */

import type { ChapterMeta, CreateChapterInput } from '@/types/writing';

import { Chapters } from './chaptersService';

type ChapterChangeEvent = {
  type: 'chapter-updated' | 'chapter-created' | 'chapter-deleted';
  chapterId: string;
  projectId: string;
  timestamp: number;
};

type ChapterChangeListener = (event: ChapterChangeEvent) => void;

class ChaptersServiceWithEvents {
  private listeners: Set<ChapterChangeListener> = new Set();

  /**
   * Subscribe to chapter change events
   */
  onChapterChange(listener: ChapterChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit chapter change event to all listeners
   */
  private emitChange(event: ChapterChangeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[ChaptersServiceWithEvents] Listener error:', error);
      }
    });
  }

  /**
   * Save chapter document and emit event
   */
  async saveDoc(params: {
    id: string;
    content: string;
    version: number;
    scenes?: any[];
  }): Promise<void> {
    await Chapters.saveDoc(params);

    // Get chapter meta to find projectId
    try {
      const meta = await Chapters.getMeta(params.id);
      if (!meta) {
        console.warn('[ChaptersServiceWithEvents] Chapter not found for saveDoc event:', params.id);
        return;
      }
      this.emitChange({
        type: 'chapter-updated',
        chapterId: params.id,
        projectId: meta.projectId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('[ChaptersServiceWithEvents] Failed to emit event for saveDoc:', error);
    }
  }

  /**
   * Update chapter metadata and emit event
   */
  async updateMeta(meta: Partial<ChapterMeta> & { id: string }): Promise<void> {
    await Chapters.updateMeta(meta as any);

    // Get full meta to find projectId
    try {
      const fullMeta = await Chapters.getMeta(meta.id);
      if (!fullMeta) {
        console.warn(
          '[ChaptersServiceWithEvents] Chapter not found for updateMeta event:',
          meta.id,
        );
        return;
      }
      this.emitChange({
        type: 'chapter-updated',
        chapterId: meta.id,
        projectId: fullMeta.projectId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('[ChaptersServiceWithEvents] Failed to emit event for updateMeta:', error);
    }
  }

  /**
   * Create chapter and emit event
   */
  async create(input: CreateChapterInput): Promise<ChapterMeta> {
    const meta = await Chapters.create(input);

    this.emitChange({
      type: 'chapter-created',
      chapterId: meta.id,
      projectId: meta.projectId,
      timestamp: Date.now(),
    });

    return meta;
  }

  /**
   * Remove chapter and emit event
   */
  async remove(id: string): Promise<void> {
    // Get meta before removing to get projectId
    const meta = await Chapters.getMeta(id);
    if (!meta) {
      console.warn('[ChaptersServiceWithEvents] Chapter not found for remove event:', id);
      await Chapters.remove(id);
      return;
    }

    await Chapters.remove(id);

    this.emitChange({
      type: 'chapter-deleted',
      chapterId: id,
      projectId: meta.projectId,
      timestamp: Date.now(),
    });
  }

  // Proxy all other methods to base Chapters service
  get = Chapters.get.bind(Chapters);
  getMeta = Chapters.getMeta.bind(Chapters);
  list = Chapters.list.bind(Chapters);
  reorder = Chapters.reorder.bind(Chapters);
}

// Export singleton instance
export const ChaptersWithEvents = new ChaptersServiceWithEvents();
