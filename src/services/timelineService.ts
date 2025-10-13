// src/services/timelineService.ts
import type { EnhancedProject } from '@/types/project';
import type { TimelineItem, TimelineRange } from '@/types/timeline';

import type { GeneratedOutline } from './storyArchitectService';

export interface TimelineExportData {
  items: TimelineItem[];
  metadata: {
    projectId: string;
    projectName: string;
    exportDate: number;
    version: string;
  };
}

export interface TimelineImportResult {
  importedItems: number;
  skippedItems: number;
  conflicts: Array<{ itemId: string; reason: string }>;
}

export interface TimelineAnalytics {
  itemCount: number;
  povCharacters: string[];
  timeSpan: TimelineRange | null;
  itemsByImportance: Record<string, number>;
  itemsByType: Record<string, number>;
  averageItemsPerChapter: number;
  consistencyScore: number;
}

/** conditional spread helper */
const cond = <T extends object>(flag: any, obj: T) =>
  flag !== undefined && flag !== null ? obj : {};

/** Filter items that overlap a given range */
export function _within(items: TimelineItem[], range: TimelineRange): TimelineItem[] {
  return items.filter((item) => {
    const itemEnd = typeof item.end === 'number' ? item.end : item.start;
    return item.start <= range.end && itemEnd >= range.start;
  });
}

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const mem = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
};

function safeStorage(): StorageLike {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {}
  return memoryStorage;
}

class TimelineService {
  private readonly STORAGE_VERSION = '1.0';
  private readonly STORAGE_PREFIX = 'timeline_';

  private get storage(): StorageLike {
    return safeStorage();
  }

  async getProjectTimeline(projectId: string): Promise<TimelineItem[]> {
    try {
      const stored = this.storage.getItem(this.getStorageKey(projectId));
      const data = stored ? JSON.parse(stored) : null;
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        ...item,
        createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(),
      })) as TimelineItem[];
    } catch (e) {
      console.error('Failed to load timeline:', e);
      return [];
    }
  }

  async saveProjectTimeline(projectId: string, items: TimelineItem[]): Promise<void> {
    try {
      this.storage.setItem(this.getStorageKey(projectId), JSON.stringify(items));
      this.trackEvent('timeline_saved', {
        projectId,
        itemCount: items.length,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Failed to save timeline:', e);
      throw e;
    }
  }

  generateTimelineFromOutline(outline: GeneratedOutline, _projectId: string): TimelineItem[] {
    const items: TimelineItem[] = [];
    let orderIndex = 1;

    // Story start (omit optional keys instead of writing undefined)
    items.push({
      id: `item_story_start_${Date.now()}`,
      title: `${outline.title} - Story Begins`,
      description: outline.summary ?? '',
      start: orderIndex++,
      characterIds: [],
      tags: ['story-start', 'generated'],
      importance: 'major',
      eventType: 'plot',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (outline.chapters ?? []).forEach((chapter, chapterIndex) => {
      const sceneCount = chapter.scenes?.length ?? 0;
      const chapterStart = orderIndex++;
      const chapterEnd = chapterStart + sceneCount;

      items.push({
        id: `item_chapter_${chapterIndex}_${Date.now()}`,
        title: chapter.title ?? `Chapter ${chapterIndex + 1}`,
        description: `${chapter.plotFunction ?? 'Chapter'}: ${chapter.summary ?? ''}`,
        start: chapterStart,
        ...cond(sceneCount, { end: chapterEnd }),
        characterIds: [],
        tags: [
          'chapter',
          'generated',
          ...(chapter.plotFunction
            ? [chapter.plotFunction.toLowerCase().replace(/\s+/g, '-')]
            : []),
        ],
        importance: this.getChapterImportance(chapter.plotFunction ?? ''),
        eventType: 'plot',
        chapterId: `chapter_${chapterIndex}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (chapter.scenes ?? []).forEach((scene, sceneIndex) => {
        const sceneChars = (scene as any)?.characters ?? [];
        const pov = sceneChars[0] as string | undefined;

        items.push({
          id: `item_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
          title: scene.title ?? `Scene ${sceneIndex + 1}`,
          description: `${scene.purpose ?? ''}\n\nConflict: ${scene.conflict ?? ''}`,
          start: orderIndex++,
          characterIds: sceneChars,
          ...cond(pov, { pov }),
          tags: ['scene', 'generated'],
          importance: 'minor',
          eventType: 'plot',
          chapterId: `chapter_${chapterIndex}`,
          sceneId: `scene_${chapterIndex}_${sceneIndex}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    (outline.characters ?? []).forEach((character, charIndex) => {
      if (!character.arc) return;
      const totalChapters = outline.chapters?.length ?? 0;
      const arcStart = Math.floor(totalChapters / 3) + 1;
      const arcEnd = Math.floor((totalChapters * 2) / 3) + 1;

      items.push({
        id: `item_character_arc_${charIndex}_${Date.now()}`,
        title: `${character.name}'s Transformation`,
        description: character.arc,
        start: arcStart,
        end: arcEnd,
        characterIds: [character.name],
        pov: character.name,
        tags: ['character-arc', 'generated'],
        importance: character.role === 'protagonist' ? 'major' : 'minor',
        eventType: 'character',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    return items.sort((a, b) => a.start - b.start);
  }

  async syncWithProjectChapters(projectId: string, project: EnhancedProject): Promise<void> {
    const existing = await this.getProjectTimeline(projectId);
    const newItems: TimelineItem[] = [];
    let orderIndex = existing.length + 1;

    (project.chapters ?? []).forEach((chapter, chapterIndex) => {
      const chapterExists = existing.some(
        (i) => i.chapterId === chapter.id || i.title.includes(chapter.title ?? ''),
      );
      if (chapterExists) return;

      const chapterStart = (chapter as any).order ?? orderIndex++;
      const sceneCount = chapter.scenes?.length ?? 0;
      const chapterEnd = chapterStart + sceneCount;

      newItems.push({
        id: `item_sync_chapter_${chapterIndex}_${Date.now()}`,
        title: chapter.title ?? `Chapter ${chapterIndex + 1}`,
        description: chapter.summary || 'Chapter content',
        start: chapterStart,
        ...cond(sceneCount, { end: chapterEnd }),
        characterIds: (chapter as any).charactersInChapter ?? [],
        tags: ['chapter', 'synced'],
        importance: 'major',
        eventType: 'plot',
        chapterId: chapter.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (chapter.scenes ?? []).forEach((scene: any, sceneIndex: number) => {
        const preview =
          typeof scene?.content === 'string' ? `${scene.content.substring(0, 200)}...` : '';
        newItems.push({
          id: `item_sync_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
          title: scene?.title ?? `Scene ${sceneIndex + 1}`,
          description: scene?.summary || preview,
          start: orderIndex++,
          characterIds: [],
          tags: ['scene', 'synced'],
          importance: 'minor',
          eventType: 'plot',
          chapterId: chapter.id,
          ...cond(scene?.id, { sceneId: scene.id }),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    if (newItems.length) {
      const all = [...existing, ...newItems].sort((a, b) => a.start - b.start);
      await this.saveProjectTimeline(projectId, all);
    }
  }

  async exportTimeline(projectId: string, projectName: string): Promise<TimelineExportData> {
    const items = await this.getProjectTimeline(projectId);
    return {
      items,
      metadata: {
        projectId,
        projectName,
        exportDate: Date.now(),
        version: this.STORAGE_VERSION,
      },
    };
  }

  async importTimeline(projectId: string, data: TimelineExportData): Promise<TimelineImportResult> {
    const existing = await this.getProjectTimeline(projectId);
    const result: TimelineImportResult = { importedItems: 0, skippedItems: 0, conflicts: [] };
    const toImport: TimelineItem[] = [];

    (data.items ?? []).forEach((item) => {
      const dup = existing.find((i) => i.title === item.title && i.start === item.start);
      if (dup) {
        result.skippedItems++;
        result.conflicts.push({
          itemId: item.id,
          reason: 'Item with same title and start time already exists',
        });
        return;
      }
      toImport.push({
        ...item,
        id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      result.importedItems++;
    });

    if (toImport.length) {
      const all = [...existing, ...toImport].sort((a, b) => a.start - b.start);
      await this.saveProjectTimeline(projectId, all);
    }

    return result;
  }

  async analyzeTimeline(projectId: string): Promise<TimelineAnalytics> {
    const items = await this.getProjectTimeline(projectId);
    if (!items.length) {
      return {
        itemCount: 0,
        povCharacters: [],
        timeSpan: null,
        itemsByImportance: {},
        itemsByType: {},
        averageItemsPerChapter: 0,
        consistencyScore: 100,
      };
    }

    const povCharacters = Array.from(
      new Set(items.map((i) => i.pov).filter((p): p is string => typeof p === 'string' && p)),
    );

    const itemsByImportance = items.reduce(
      (acc, item) => {
        const k = item.importance ?? 'unknown';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const itemsByType = items.reduce(
      (acc, item) => {
        const k = item.eventType ?? 'unknown';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const starts = items
      .map((i) => i.start)
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);
    const ends = items
      .map((i) => (typeof i.end === 'number' ? i.end : i.start))
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);

    const timeSpan =
      starts.length && ends.length ? { start: starts[0], end: ends[ends.length - 1] } : null;

    const chapterItems = items.filter((i) => (i.tags ?? []).includes('chapter'));
    const averageItemsPerChapter = chapterItems.length ? items.length / chapterItems.length : 0;

    const issues = this.checkConsistencyIssues(items);
    const consistencyScore = Math.max(0, 100 - issues.length * 5);

    return {
      itemCount: items.length,
      povCharacters,
      timeSpan,
      itemsByImportance,
      itemsByType,
      averageItemsPerChapter,
      consistencyScore,
    };
  }

  async deleteProjectTimeline(projectId: string): Promise<void> {
    try {
      this.storage.removeItem(this.getStorageKey(projectId));
      this.trackEvent('timeline_deleted', { projectId, timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to delete timeline:', e);
      throw e;
    }
  }

  async backupTimeline(projectId: string): Promise<void> {
    try {
      const items = await this.getProjectTimeline(projectId);
      const backup = { items, timestamp: Date.now(), version: this.STORAGE_VERSION };
      this.storage.setItem(`${this.getStorageKey(projectId)}_backup`, JSON.stringify(backup));
    } catch (e) {
      console.error('Timeline backup failed:', e);
    }
  }

  async restoreFromBackup(projectId: string): Promise<boolean> {
    try {
      const raw = this.storage.getItem(`${this.getStorageKey(projectId)}_backup`);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.items) return false;

      const items = (parsed.items as any[]).map((item) => ({
        ...item,
        createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(),
      })) as TimelineItem[];

      await this.saveProjectTimeline(projectId, items);
      return true;
    } catch (e) {
      console.error('Timeline restore failed:', e);
      return false;
    }
  }

  private trackEvent(event: string, data: any) {
    try {
      if (typeof window !== 'undefined' && (window as any).analyticsService) {
        (window as any).analyticsService.track(event, data);
      } else {
        console.log(`Analytics: ${event}`, data);
      }
    } catch (e) {
      console.debug('Analytics tracking failed:', e);
    }
  }

  private checkConsistencyIssues(items: TimelineItem[]): Array<{ itemId: string; issue: string }> {
    const issues: Array<{ itemId: string; issue: string }> = [];

    items.forEach((item) => {
      if (!item.title || !item.title.trim()) {
        issues.push({ itemId: item.id, issue: 'Missing item title' });
      }

      const chars = item.characterIds ?? [];
      if (item.pov && !chars.includes(item.pov)) {
        issues.push({ itemId: item.id, issue: 'POV character not in character list' });
      }

      const conflicts = items.filter((i) => {
        if (i.id === item.id) return false;
        if (!item.pov || i.pov !== item.pov) return false;
        const a: TimelineRange = {
          start: item.start,
          end: typeof item.end === 'number' ? item.end : item.start,
        };
        const b: TimelineRange = {
          start: i.start,
          end: typeof i.end === 'number' ? i.end : i.start,
        };
        return this.rangesOverlap(a, b);
      });
      if (conflicts.length) {
        issues.push({ itemId: item.id, issue: 'Timeline conflict with another item' });
      }

      if (typeof item.end === 'number' && item.end < item.start) {
        issues.push({ itemId: item.id, issue: 'End time is before start time' });
      }
    });

    return issues;
  }

  private rangesOverlap(a: TimelineRange, b: TimelineRange): boolean {
    return a.start <= b.end && b.start <= a.end;
  }

  private getChapterImportance(plotFunction: string): TimelineItem['importance'] {
    const majors = ['inciting incident', 'midpoint', 'climax', 'resolution'];
    const lower = plotFunction.toLowerCase();
    return majors.some((m) => lower.includes(m)) ? 'major' : 'minor';
  }

  async linkScene(projectId: string, sceneId: string, eventId: string): Promise<void> {
    const items = await this.getProjectTimeline(projectId);
    const ev = items.find((i) => i.id === eventId);
    if (!ev) return;
    ev.sceneId = sceneId;
    ev.updatedAt = new Date();
    await this.saveProjectTimeline(projectId, items);
    this.trackEvent('scene_linked_to_timeline', {
      projectId,
      sceneId,
      eventId,
      timestamp: Date.now(),
    });
  }

  async unlinkScene(projectId: string, sceneId: string, eventId: string): Promise<void> {
    const items = await this.getProjectTimeline(projectId);
    const ev = items.find((i) => i.id === eventId);
    if (!ev || ev.sceneId !== sceneId) return;
    delete (ev as any).sceneId;
    ev.updatedAt = new Date();
    await this.saveProjectTimeline(projectId, items);
    this.trackEvent('scene_unlinked_from_timeline', {
      projectId,
      sceneId,
      eventId,
      timestamp: Date.now(),
    });
  }

  async getEventsForScene(projectId: string, sceneId: string): Promise<TimelineItem[]> {
    const items = await this.getProjectTimeline(projectId);
    return items.filter((i) => i.sceneId === sceneId);
  }

  async getScenesForEvents(
    projectId: string,
    eventIds: string[],
  ): Promise<Array<{ eventId: string; sceneId?: string; title?: string }>> {
    const items = await this.getProjectTimeline(projectId);
    return eventIds.map((id) => {
      const ev = items.find((i) => i.id === id);
      return { eventId: id, sceneId: ev?.sceneId, title: ev?.title };
    });
  }

  async checkSceneLinkageConsistency(projectId: string): Promise<
    Array<{
      type: 'orphan-event' | 'missing-scene' | 'chronological-mismatch';
      eventId: string;
      sceneId?: string;
      issue: string;
      suggestion: string;
    }>
  > {
    const items = await this.getProjectTimeline(projectId);
    const issues: Array<{
      type: 'orphan-event' | 'missing-scene' | 'chronological-mismatch';
      eventId: string;
      sceneId?: string;
      issue: string;
      suggestion: string;
    }> = [];

    const majors = items.filter(
      (i) =>
        (i.eventType === 'plot' || i.eventType === 'character') &&
        i.importance === 'major' &&
        !i.sceneId,
    );
    majors.forEach((ev) =>
      issues.push({
        type: 'orphan-event',
        eventId: ev.id,
        issue: `Major ${ev.eventType} event "${ev.title}" is not linked to any scene`,
        suggestion:
          'Link this event to the scene where it occurs for better navigation and consistency tracking',
      }),
    );

    const linked = items.filter((i) => i.sceneId).sort((a, b) => a.start - b.start);
    for (let i = 1; i < linked.length; i++) {
      const prev = linked[i - 1]!;
      const cur = linked[i]!;
      if (
        prev.sceneId &&
        cur.sceneId &&
        prev.sceneId === cur.sceneId &&
        Math.abs(cur.start - prev.start) > 10
      ) {
        issues.push({
          type: 'chronological-mismatch',
          eventId: cur.id,
          sceneId: cur.sceneId,
          issue: `Events in scene "${cur.sceneId}" are far apart in timeline (positions ${prev.start} and ${cur.start})`,
          suggestion: 'Consider splitting into separate scenes or adjusting timeline positions',
        });
      }
    }

    return issues;
  }

  async getSceneNavigation(
    projectId: string,
    currentSceneId: string,
  ): Promise<{
    previous?: { sceneId: string; eventTitle: string };
    next?: { sceneId: string; eventTitle: string };
  }> {
    const items = await this.getProjectTimeline(projectId);
    const linked = items.filter((i) => i.sceneId).sort((a, b) => a.start - b.start);
    const idx = linked.findIndex((i) => i.sceneId === currentSceneId);
    if (idx === -1) return {};
    const out: {
      previous?: { sceneId: string; eventTitle: string };
      next?: { sceneId: string; eventTitle: string };
    } = {};
    if (idx > 0 && linked[idx - 1]!.sceneId) {
      out.previous = { sceneId: linked[idx - 1]!.sceneId!, eventTitle: linked[idx - 1]!.title };
    }
    if (idx < linked.length - 1 && linked[idx + 1]!.sceneId) {
      out.next = { sceneId: linked[idx + 1]!.sceneId!, eventTitle: linked[idx + 1]!.title };
    }
    return out;
  }

  private getStorageKey(projectId: string): string {
    return `${this.STORAGE_PREFIX}${projectId}`;
  }
}

export const timelineService = new TimelineService();
