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
  conflicts: Array<{
    itemId: string;
    reason: string;
  }>;
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

export function within(items: TimelineItem[], range: TimelineRange): TimelineItem[] {
  return items.filter((item) => {
    const itemEnd = item.end ?? item.start;
    return item.start <= range.end && itemEnd >= range.start;
  });
}

class TimelineService {
  private readonly STORAGE_VERSION = '1.0';
  private readonly STORAGE_PREFIX = 'timeline_';

  /** Get timeline items for a specific project using localStorage */
  async getProjectTimeline(projectId: string): Promise<TimelineItem[]> {
    try {
      const storageKey = this.getStorageKey(projectId);
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : null;

      if (!data) return [];

      // Deserialize dates
      return data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load timeline:', error);
      return [];
    }
  }

  /** Save timeline items for a project using localStorage */
  async saveProjectTimeline(projectId: string, items: TimelineItem[]): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      localStorage.setItem(storageKey, JSON.stringify(items));

      this.trackEvent('timeline_saved', {
        projectId,
        itemCount: items.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save timeline:', error);
      throw error;
    }
  }

  /** Generate timeline items from Story Architect outline */
  generateTimelineFromOutline(outline: GeneratedOutline, _projectId: string): TimelineItem[] {
    const items: TimelineItem[] = [];
    let orderIndex = 1;

    // Story start
    items.push({
      id: `item_story_start_${Date.now()}`,
      title: `${outline.title} - Story Begins`,
      description: outline.summary,
      start: orderIndex++,
      end: undefined,
      characterIds: [],
      pov: undefined,
      location: undefined,
      tags: ['story-start', 'generated'],
      importance: 'major',
      eventType: 'plot',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Chapters & scenes
    outline.chapters.forEach((chapter, chapterIndex) => {
      const chapterStart = orderIndex++;
      const chapterEnd = chapterStart + (chapter.scenes?.length || 0);

      items.push({
        id: `item_chapter_${chapterIndex}_${Date.now()}`,
        title: chapter.title,
        description: `${chapter.plotFunction}: ${chapter.summary}`,
        start: chapterStart,
        end: chapterEnd,
        characterIds: [],
        pov: undefined,
        location: undefined,
        tags: ['chapter', 'generated', chapter.plotFunction.toLowerCase().replace(/\s+/g, '-')],
        importance: this.getChapterImportance(chapter.plotFunction),
        eventType: 'plot',
        chapterId: `chapter_${chapterIndex}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      chapter.scenes?.forEach((scene, sceneIndex) => {
        const sceneCharacters = scene.characters || [];
        const povCharacter = sceneCharacters[0];

        items.push({
          id: `item_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
          title: scene.title,
          description: `${scene.purpose}\n\nConflict: ${scene.conflict}`,
          start: orderIndex++,
          end: undefined,
          characterIds: sceneCharacters,
          pov: povCharacter,
          location: undefined,
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

    // Character arcs
    outline.characters?.forEach((character, charIndex) => {
      if (character.arc) {
        const arcStart = Math.floor(outline.chapters.length / 3) + 1;
        const arcEnd = Math.floor((outline.chapters.length * 2) / 3) + 1;

        items.push({
          id: `item_character_arc_${charIndex}_${Date.now()}`,
          title: `${character.name}'s Transformation`,
          description: character.arc,
          start: arcStart,
          end: arcEnd,
          characterIds: [character.name],
          pov: character.name,
          location: undefined,
          tags: ['character-arc', 'generated'],
          importance: character.role === 'protagonist' ? 'major' : 'minor',
          eventType: 'character',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    return items.sort((a, b) => a.start - b.start);
  }

  /** Merge items from existing project chapters */
  async syncWithProjectChapters(projectId: string, project: EnhancedProject): Promise<void> {
    const existingItems = await this.getProjectTimeline(projectId);
    const newItems: TimelineItem[] = [];
    let orderIndex = existingItems.length + 1;

    project.chapters.forEach((chapter, chapterIndex) => {
      const chapterExists = existingItems.some(
        (item) => item.chapterId === chapter.id || item.title.includes(chapter.title),
      );

      if (!chapterExists) {
        const chapterStart = chapter.order || orderIndex++;
        const chapterEnd = chapterStart + (chapter.scenes?.length || 0);

        newItems.push({
          id: `item_sync_chapter_${chapterIndex}_${Date.now()}`,
          title: chapter.title,
          description: chapter.summary || 'Chapter content',
          start: chapterStart,
          end: chapterEnd,
          characterIds: chapter.charactersInChapter || [],
          pov: undefined,
          location: undefined,
          tags: ['chapter', 'synced'],
          importance: 'major',
          eventType: 'plot',
          chapterId: chapter.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (chapter.scenes && Array.isArray(chapter.scenes)) {
          chapter.scenes.forEach((scene: any, sceneIndex) => {
            newItems.push({
              id: `item_sync_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
              title: scene.title || `Scene ${sceneIndex + 1}`,
              description: scene.summary || scene.content?.substring(0, 200) + '...' || '',
              start: orderIndex++,
              end: undefined,
              characterIds: [],
              pov: undefined,
              location: undefined,
              tags: ['scene', 'synced'],
              importance: 'minor',
              eventType: 'plot',
              chapterId: chapter.id,
              sceneId: scene.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          });
        }
      }
    });

    if (newItems.length > 0) {
      const allItems = [...existingItems, ...newItems].sort((a, b) => a.start - b.start);
      await this.saveProjectTimeline(projectId, allItems);
    }
  }

  /** Export timeline to various formats */
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

  /** Import timeline from export data */
  async importTimeline(projectId: string, data: TimelineExportData): Promise<TimelineImportResult> {
    const existingItems = await this.getProjectTimeline(projectId);
    const result: TimelineImportResult = {
      importedItems: 0,
      skippedItems: 0,
      conflicts: [],
    };

    const itemsToImport: TimelineItem[] = [];

    data.items.forEach((item) => {
      const existingItem = existingItems.find(
        (i) => i.title === item.title && i.start === item.start,
      );

      if (existingItem) {
        result.skippedItems++;
        result.conflicts.push({
          itemId: item.id,
          reason: 'Item with same title and start time already exists',
        });
      } else {
        itemsToImport.push({
          ...item,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        result.importedItems++;
      }
    });

    if (itemsToImport.length > 0) {
      const allItems = [...existingItems, ...itemsToImport].sort((a, b) => a.start - b.start);
      await this.saveProjectTimeline(projectId, allItems);
    }

    return result;
  }

  /** Analyze timeline for insights and consistency */
  async analyzeTimeline(projectId: string): Promise<TimelineAnalytics> {
    const items = await this.getProjectTimeline(projectId);

    if (items.length === 0) {
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

    // Distinct POV characters
    const povCharacters = items
      .map((i) => i.pov)
      .filter((pov): pov is string => pov !== undefined && pov !== null)
      .filter((pov, index, arr) => arr.indexOf(pov) === index);

    // Aggregations
    const itemsByImportance = items.reduce(
      (acc, item) => {
        acc[item.importance] = (acc[item.importance] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const itemsByType = items.reduce(
      (acc, item) => {
        acc[item.eventType] = (acc[item.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Time span calculation (robust: filter to numbers)
    const startTimes = items
      .map((i) => i.start)
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);

    const endTimes = items
      .map((i) => i.end ?? i.start)
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);

    let timeSpan: TimelineRange | null = null;
    if (startTimes.length > 0 && endTimes.length > 0) {
      timeSpan = {
        start: startTimes[0] ?? 0,
        end: endTimes[endTimes.length - 1] ?? 0,
      };
    }

    // Chapter analysis
    const chapterItems = items.filter((i) => Array.isArray(i.tags) && i.tags.includes('chapter'));
    const averageItemsPerChapter = chapterItems.length > 0 ? items.length / chapterItems.length : 0;

    // Consistency score (simplified)
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

  /** Delete all timeline data for a project */
  async deleteProjectTimeline(projectId: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      localStorage.removeItem(storageKey);

      this.trackEvent('timeline_deleted', {
        projectId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to delete timeline:', error);
      throw error;
    }
  }

  /** Backup timeline data */
  async backupTimeline(projectId: string): Promise<void> {
    try {
      const items = await this.getProjectTimeline(projectId);
      const backup = {
        items,
        timestamp: Date.now(),
        version: this.STORAGE_VERSION,
      };

      const backupKey = `${this.getStorageKey(projectId)}_backup`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
    } catch (error) {
      console.error('Timeline backup failed:', error);
    }
  }

  /** Restore timeline from backup */
  async restoreFromBackup(projectId: string): Promise<boolean> {
    try {
      const backupKey = `${this.getStorageKey(projectId)}_backup`;
      const stored = localStorage.getItem(backupKey);
      const backup = stored ? JSON.parse(stored) : null;

      if (!backup || !backup.items) return false;

      const items = backup.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));

      await this.saveProjectTimeline(projectId, items);
      return true;
    } catch (error) {
      console.error('Timeline restore failed:', error);
      return false;
    }
  }

  /** Track analytics events (with fallback if analytics service unavailable) */
  private trackEvent(eventName: string, data: any): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analyticsService) {
        (window as any).analyticsService.track(eventName, data);
      } else {
        console.log(`Analytics: ${eventName}`, data);
      }
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }

  /** Get timeline items that conflict with each other */
  private checkConsistencyIssues(items: TimelineItem[]): Array<{ itemId: string; issue: string }> {
    const issues: Array<{ itemId: string; issue: string }> = [];

    items.forEach((item) => {
      // Missing titles
      if (!item.title || !item.title.trim()) {
        issues.push({ itemId: item.id, issue: 'Missing item title' });
      }

      // POV consistency
      if (item.pov && !item.characterIds.includes(item.pov)) {
        issues.push({ itemId: item.id, issue: 'POV character not in character list' });
      }

      // Overlaps for same POV
      const conflicts = items.filter(
        (i) =>
          i.id !== item.id &&
          i.pov === item.pov &&
          item.pov &&
          this.rangesOverlap(
            { start: item.start, end: item.end ?? item.start },
            { start: i.start, end: i.end ?? i.start },
          ),
      );
      if (conflicts.length > 0) {
        issues.push({ itemId: item.id, issue: 'Timeline conflict with another item' });
      }

      // Invalid ranges
      if (item.end && item.end < item.start) {
        issues.push({ itemId: item.id, issue: 'End time is before start time' });
      }
    });

    return issues;
  }

  /** Check if two time ranges overlap */
  private rangesOverlap(range1: TimelineRange, range2: TimelineRange): boolean {
    return range1.start <= range2.end && range2.start <= range1.end;
  }

  /** Determine chapter importance based on plot function */
  private getChapterImportance(plotFunction: string): TimelineItem['importance'] {
    const majorEvents = ['inciting incident', 'midpoint', 'climax', 'resolution'];
    const lower = plotFunction.toLowerCase();
    return majorEvents.some((e) => lower.includes(e)) ? 'major' : 'minor';
  }

  /** Link a scene to timeline events */
  async linkScene(projectId: string, sceneId: string, eventId: string): Promise<void> {
    const items = await this.getProjectTimeline(projectId);
    const event = items.find((item) => item.id === eventId);

    if (event) {
      event.sceneId = sceneId;
      event.updatedAt = new Date();
      await this.saveProjectTimeline(projectId, items);

      this.trackEvent('scene_linked_to_timeline', {
        projectId,
        sceneId,
        eventId,
        timestamp: Date.now(),
      });
    }
  }

  /** Unlink a scene from timeline events */
  async unlinkScene(projectId: string, sceneId: string, eventId: string): Promise<void> {
    const items = await this.getProjectTimeline(projectId);
    const event = items.find((item) => item.id === eventId);

    if (event && event.sceneId === sceneId) {
      delete event.sceneId;
      event.updatedAt = new Date();
      await this.saveProjectTimeline(projectId, items);

      this.trackEvent('scene_unlinked_from_timeline', {
        projectId,
        sceneId,
        eventId,
        timestamp: Date.now(),
      });
    }
  }

  /** Get timeline events linked to a specific scene */
  async getEventsForScene(projectId: string, sceneId: string): Promise<TimelineItem[]> {
    const items = await this.getProjectTimeline(projectId);
    return items.filter((item) => item.sceneId === sceneId);
  }

  /** Get scenes referenced by timeline events (requires project data) */
  async getScenesForEvents(
    projectId: string,
    eventIds: string[],
  ): Promise<Array<{ eventId: string; sceneId?: string; title?: string }>> {
    const items = await this.getProjectTimeline(projectId);
    return eventIds.map((eventId) => {
      const event = items.find((item) => item.id === eventId);
      return {
        eventId,
        sceneId: event?.sceneId,
        title: event?.title,
      };
    });
  }

  /** Check for timeline consistency issues specific to scene linkage */
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

    // Find events that should be linked to scenes but aren't
    const plotEvents = items.filter(
      (item) =>
        (item.eventType === 'plot' || item.eventType === 'character') &&
        item.importance === 'major' &&
        !item.sceneId,
    );

    plotEvents.forEach((event) => {
      issues.push({
        type: 'orphan-event',
        eventId: event.id,
        issue: `Major ${event.eventType} event "${event.title}" is not linked to any scene`,
        suggestion: `Link this event to the scene where it occurs for better navigation and consistency tracking`,
      });
    });

    // Check chronological order of linked scenes (simplified)
    const linkedEvents = items.filter((item) => item.sceneId).sort((a, b) => a.start - b.start);
    for (let i = 1; i < linkedEvents.length; i++) {
      const prev = linkedEvents[i - 1];
      const current = linkedEvents[i];

      if (
        prev &&
        current &&
        prev.sceneId &&
        current.sceneId &&
        prev.sceneId === current.sceneId &&
        Math.abs(current.start - prev.start) > 10
      ) {
        issues.push({
          type: 'chronological-mismatch',
          eventId: current.id,
          sceneId: current.sceneId,
          issue: `Events in scene "${current.sceneId}" are spread far apart in timeline (positions ${prev.start} and ${current.start})`,
          suggestion:
            'Consider if these events should be in separate scenes or if the timeline positions need adjustment',
        });
      }
    }

    return issues;
  }

  /** Navigation helper: Get next/previous linked scenes */
  async getSceneNavigation(
    projectId: string,
    currentSceneId: string,
  ): Promise<{
    previous?: { sceneId: string; eventTitle: string };
    next?: { sceneId: string; eventTitle: string };
  }> {
    const items = await this.getProjectTimeline(projectId);
    const linkedEvents = items.filter((item) => item.sceneId).sort((a, b) => a.start - b.start);

    const currentIndex = linkedEvents.findIndex((item) => item.sceneId === currentSceneId);
    if (currentIndex === -1) return {};

    const result: {
      previous?: { sceneId: string; eventTitle: string };
      next?: { sceneId: string; eventTitle: string };
    } = {};

    if (currentIndex > 0 && linkedEvents[currentIndex - 1]) {
      const prev = linkedEvents[currentIndex - 1];
      if (prev && prev.sceneId) {
        result.previous = {
          sceneId: prev.sceneId,
          eventTitle: prev.title,
        };
      }
    }

    if (currentIndex < linkedEvents.length - 1 && linkedEvents[currentIndex + 1]) {
      const next = linkedEvents[currentIndex + 1];
      if (next && next.sceneId) {
        result.next = {
          sceneId: next.sceneId,
          eventTitle: next.title,
        };
      }
    }

    return result;
  }

  /** Generate storage key for project timeline */
  private getStorageKey(projectId: string): string {
    return `${this.STORAGE_PREFIX}${projectId}`;
  }
}

export const timelineService = new TimelineService();
