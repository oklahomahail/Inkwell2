// src/services/timelineService.ts
import type { GeneratedOutline } from './storyArchitectService';

import { TimelineEvent } from '@/components/Views/TimelineView';
import type { EnhancedProject } from '@/types/project';

export interface TimelineExportData {
  events: TimelineEvent[];
  metadata: {
    projectId: string;
    projectName: string;
    exportDate: number;
    version: string;
  };
}

export interface TimelineImportResult {
  importedEvents: number;
  skippedEvents: number;
  conflicts: Array<{
    eventId: string;
    reason: string;
  }>;
}

export interface TimelineAnalytics {
  eventCount: number;
  povCharacters: string[];
  timeSpan: { start: number; end: number } | null;
  eventsByImportance: Record<string, number>;
  eventsByType: Record<string, number>;
  averageEventsPerChapter: number;
  consistencyScore: number;
}

class TimelineService {
  private readonly STORAGE_VERSION = '1.0';
  private readonly STORAGE_PREFIX = 'timeline_';

  /**
   * Get timeline events for a specific project using localStorage
   */
  async getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
    try {
      const storageKey = this.getStorageKey(projectId);
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : null;

      if (!data) return [];

      // Deserialize dates
      return data.map((event: any) => ({
        ...event,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load timeline:', error);
      return [];
    }
  }

  /**
   * Save timeline events for a project using localStorage
   */
  async saveProjectTimeline(projectId: string, events: TimelineEvent[]): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      localStorage.setItem(storageKey, JSON.stringify(events));

      // Track analytics if available
      this.trackEvent('timeline_saved', {
        projectId,
        eventCount: events.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save timeline:', error);
      throw error;
    }
  }

  /**
   * Generate timeline events from Story Architect outline
   */
  generateTimelineFromOutline(outline: GeneratedOutline, projectId: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    let orderIndex = 1;

    // Add story-level events
    events.push({
      id: `event_story_start_${Date.now()}`,
      title: `${outline.title} - Story Begins`,
      description: outline.summary,
      when: {
        type: 'order',
        value: orderIndex++,
        displayText: 'Story Opening',
      },
      characterIds: [],
      pov: undefined,
      location: undefined,
      tags: ['story-start', 'generated'],
      importance: 'major',
      eventType: 'plot',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Process chapters
    outline.chapters.forEach((chapter, chapterIndex) => {
      // Chapter milestone event
      events.push({
        id: `event_chapter_${chapterIndex}_${Date.now()}`,
        title: chapter.title,
        description: `${chapter.plotFunction}: ${chapter.summary}`,
        when: {
          type: 'order',
          value: orderIndex++,
          displayText: `Chapter ${chapterIndex + 1}`,
        },
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

      // Scene events
      chapter.scenes?.forEach((scene, sceneIndex) => {
        const sceneCharacters = scene.characters || [];
        const povCharacter = sceneCharacters[0]; // Use first character as POV

        events.push({
          id: `event_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
          title: scene.title,
          description: `${scene.purpose}\n\nConflict: ${scene.conflict}`,
          when: {
            type: 'order',
            value: orderIndex++,
            displayText: `Ch${chapterIndex + 1}, Scene ${sceneIndex + 1}`,
          },
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

    // Add character arc events
    outline.characters?.forEach((character, charIndex) => {
      if (character.arc) {
        const midPoint = Math.floor(outline.chapters.length / 2) + 1;

        events.push({
          id: `event_character_arc_${charIndex}_${Date.now()}`,
          title: `${character.name}'s Transformation`,
          description: character.arc,
          when: {
            type: 'order',
            value: midPoint,
            displayText: `${character.name}'s Arc`,
          },
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

    // Sort events by order
    return events.sort((a, b) => a.when.value - b.when.value);
  }

  /**
   * Merge events from existing project chapters
   */
  async syncWithProjectChapters(projectId: string, project: EnhancedProject): Promise<void> {
    const existingEvents = await this.getProjectTimeline(projectId);
    const newEvents: TimelineEvent[] = [];
    let orderIndex = existingEvents.length + 1;

    // Find chapters not yet in timeline
    project.chapters.forEach((chapter, chapterIndex) => {
      const chapterExists = existingEvents.some(
        (event) => event.chapterId === chapter.id || event.title.includes(chapter.title),
      );

      if (!chapterExists) {
        newEvents.push({
          id: `event_sync_chapter_${chapterIndex}_${Date.now()}`,
          title: chapter.title,
          description: chapter.summary || 'Chapter content',
          when: {
            type: 'order',
            value: chapter.order || orderIndex++,
            displayText: `Chapter ${chapter.order || chapterIndex + 1}`,
          },
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

        // Add scene events if they exist
        if (chapter.scenes && Array.isArray(chapter.scenes)) {
          chapter.scenes.forEach((scene: any, sceneIndex) => {
            newEvents.push({
              id: `event_sync_scene_${chapterIndex}_${sceneIndex}_${Date.now()}`,
              title: scene.title || `Scene ${sceneIndex + 1}`,
              description: scene.summary || scene.content?.substring(0, 200) + '...' || '',
              when: {
                type: 'order',
                value: orderIndex++,
                displayText: `Ch${chapter.order || chapterIndex + 1}, Scene ${sceneIndex + 1}`,
              },
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

    if (newEvents.length > 0) {
      const allEvents = [...existingEvents, ...newEvents].sort(
        (a, b) => a.when.value - b.when.value,
      );
      await this.saveProjectTimeline(projectId, allEvents);
    }
  }

  /**
   * Export timeline to various formats
   */
  async exportTimeline(projectId: string, projectName: string): Promise<TimelineExportData> {
    const events = await this.getProjectTimeline(projectId);

    return {
      events,
      metadata: {
        projectId,
        projectName,
        exportDate: Date.now(),
        version: this.STORAGE_VERSION,
      },
    };
  }

  /**
   * Import timeline from export data
   */
  async importTimeline(projectId: string, data: TimelineExportData): Promise<TimelineImportResult> {
    const existingEvents = await this.getProjectTimeline(projectId);
    const result: TimelineImportResult = {
      importedEvents: 0,
      skippedEvents: 0,
      conflicts: [],
    };

    const eventsToImport: TimelineEvent[] = [];

    data.events.forEach((event) => {
      const existingEvent = existingEvents.find(
        (e) => e.title === event.title && e.when.value === event.when.value,
      );

      if (existingEvent) {
        result.skippedEvents++;
        result.conflicts.push({
          eventId: event.id,
          reason: 'Event with same title and time already exists',
        });
      } else {
        // Create new event with fresh ID and timestamps
        eventsToImport.push({
          ...event,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        result.importedEvents++;
      }
    });

    if (eventsToImport.length > 0) {
      const allEvents = [...existingEvents, ...eventsToImport].sort(
        (a, b) => a.when.value - b.when.value,
      );
      await this.saveProjectTimeline(projectId, allEvents);
    }

    return result;
  }

  /**
   * Analyze timeline for insights and consistency
   */
  async analyzeTimeline(projectId: string): Promise<TimelineAnalytics> {
    const events = await this.getProjectTimeline(projectId);

    if (events.length === 0) {
      return {
        eventCount: 0,
        povCharacters: [],
        timeSpan: null,
        eventsByImportance: {},
        eventsByType: {},
        averageEventsPerChapter: 0,
        consistencyScore: 100,
      };
    }

    // Calculate basic stats with proper type handling
    const povCharacters = events
      .map((e) => e.pov)
      .filter((pov): pov is string => pov !== undefined && pov !== null)
      .filter((pov, index, arr) => arr.indexOf(pov) === index); // Remove duplicates

    const eventsByImportance = events.reduce(
      (acc, event) => {
        acc[event.importance] = (acc[event.importance] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Time span with proper type handling
    const times = events.map((e) => e.when.value).sort((a, b) => a - b);
    let timeSpan: { start: number; end: number } | null = null;
    if (times.length > 1) {
      const start = times[0];
      const end = times[times.length - 1];
      if (typeof start === 'number' && typeof end === 'number') {
        timeSpan = { start, end };
      }
    }

    // Chapter analysis
    const chapterEvents = events.filter((e) => e.tags.includes('chapter'));
    const averageEventsPerChapter =
      chapterEvents.length > 0 ? events.length / chapterEvents.length : 0;

    // Consistency score (simplified)
    let consistencyScore = 100;
    const issues = this.checkConsistencyIssues(events);
    consistencyScore = Math.max(0, 100 - issues.length * 5);

    return {
      eventCount: events.length,
      povCharacters,
      timeSpan,
      eventsByImportance,
      eventsByType,
      averageEventsPerChapter,
      consistencyScore,
    };
  }

  /**
   * Delete all timeline data for a project
   */
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

  /**
   * Backup timeline data
   */
  async backupTimeline(projectId: string): Promise<void> {
    try {
      const events = await this.getProjectTimeline(projectId);
      const backup = {
        events,
        timestamp: Date.now(),
        version: this.STORAGE_VERSION,
      };

      const backupKey = `${this.getStorageKey(projectId)}_backup`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
    } catch (error) {
      console.error('Timeline backup failed:', error);
    }
  }

  /**
   * Restore timeline from backup
   */
  async restoreFromBackup(projectId: string): Promise<boolean> {
    try {
      const backupKey = `${this.getStorageKey(projectId)}_backup`;
      const stored = localStorage.getItem(backupKey);
      const backup = stored ? JSON.parse(stored) : null;

      if (!backup || !backup.events) {
        return false;
      }

      const events = backup.events.map((event: any) => ({
        ...event,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));

      await this.saveProjectTimeline(projectId, events);
      return true;
    } catch (error) {
      console.error('Timeline restore failed:', error);
      return false;
    }
  }

  /**
   * Track analytics events (with fallback if analytics service unavailable)
   */
  private trackEvent(eventName: string, data: any): void {
    try {
      // Try to use analytics service if available
      if (typeof window !== 'undefined' && (window as any).analyticsService) {
        (window as any).analyticsService.track(eventName, data);
      } else {
        // Fallback: just log to console for development
        console.log(`Analytics: ${eventName}`, data);
      }
    } catch (error) {
      // Silently fail - analytics shouldn't break core functionality
      console.debug('Analytics tracking failed:', error);
    }
  }

  /**
   * Get timeline events that conflict with each other
   */
  private checkConsistencyIssues(events: TimelineEvent[]): Array<{
    eventId: string;
    issue: string;
  }> {
    const issues: Array<{ eventId: string; issue: string }> = [];

    events.forEach((event) => {
      // Check for missing titles
      if (!event.title.trim()) {
        issues.push({
          eventId: event.id,
          issue: 'Missing event title',
        });
      }

      // Check for POV consistency
      if (event.pov && !event.characterIds.includes(event.pov)) {
        issues.push({
          eventId: event.id,
          issue: 'POV character not in character list',
        });
      }

      // Check for timeline conflicts (same time, same POV)
      const conflicts = events.filter(
        (e) =>
          e.id !== event.id &&
          e.when.value === event.when.value &&
          e.pov === event.pov &&
          event.pov, // Only check if POV is defined
      );

      if (conflicts.length > 0) {
        issues.push({
          eventId: event.id,
          issue: 'Timeline conflict with another event',
        });
      }
    });

    return issues;
  }

  /**
   * Determine chapter importance based on plot function
   */
  private getChapterImportance(plotFunction: string): TimelineEvent['importance'] {
    const majorEvents = ['inciting incident', 'midpoint', 'climax', 'resolution'];
    const lowerFunction = plotFunction.toLowerCase();

    return majorEvents.some((event) => lowerFunction.includes(event)) ? 'major' : 'minor';
  }

  /**
   * Generate storage key for project timeline
   */
  private getStorageKey(projectId: string): string {
    return `${this.STORAGE_PREFIX}${projectId}`;
  }
}

export const timelineService = new TimelineService();
