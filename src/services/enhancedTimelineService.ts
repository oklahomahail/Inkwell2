// src/services/enhancedTimelineService.ts - Enhanced Timeline with Conflict Detection
import type { EnhancedProject } from '@/types/project';
import type { TimelineItem, TimelineRange } from '@/types/timeline';

import { timelineService } from './timelineService';

export interface TimelineConflict {
  id: string;
  type:
    | 'time_overlap'
    | 'character_presence'
    | 'location_mismatch'
    | 'pov_inconsistency'
    | 'chronological_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEvents: string[]; // Timeline item IDs
  affectedScenes?: string[]; // Scene IDs if applicable
  suggestion: string;
  autoFixable: boolean;
  evidence: string[];
}

export interface SceneLinkage {
  sceneId: string;
  chapterId: string;
  timelineEventIds: string[];
  linkageType: 'manual' | 'auto_detected' | 'ai_suggested';
  confidence: number; // 0-1 for auto/AI linkages
  lastValidated: Date;
}

export interface TimelineValidationResult {
  isValid: boolean;
  conflicts: TimelineConflict[];
  warnings: TimelineConflict[];
  suggestions: TimelineOptimization[];
  overallScore: number; // 0-100
}

export interface TimelineOptimization {
  type: 'reorder_events' | 'merge_events' | 'split_event' | 'add_missing_event' | 'link_scene';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  eventIds: string[];
  sceneIds?: string[];
}

export interface TimelineAnchor {
  id: string;
  eventId: string;
  anchorType: 'absolute' | 'relative' | 'sequence';
  position: number | Date;
  description: string;
  locked: boolean; // Prevents automatic reordering
}

class EnhancedTimelineService {
  private readonly STORAGE_PREFIX = 'enhanced_timeline_';
  private readonly CONFLICTS_STORAGE_PREFIX = 'timeline_conflicts_';
  private readonly LINKAGES_STORAGE_PREFIX = 'scene_linkages_';

  /**
   * Perform comprehensive timeline validation with conflict detection
   */
  async validateTimeline(
    projectId: string,
    project?: EnhancedProject,
  ): Promise<TimelineValidationResult> {
    const items = await timelineService.getProjectTimeline(projectId);
    const conflicts: TimelineConflict[] = [];
    const warnings: TimelineConflict[] = [];
    const suggestions: TimelineOptimization[] = [];

    // Time overlap conflicts
    const timeOverlaps = this.detectTimeOverlapConflicts(items);
    conflicts.push(...timeOverlaps);

    // Character presence conflicts
    if (project) {
      const characterConflicts = this.detectCharacterPresenceConflicts(items, project);
      conflicts.push(...characterConflicts);

      // Location consistency issues
      const locationConflicts = this.detectLocationMismatchConflicts(items, project);
      warnings.push(...locationConflicts);
    }

    // POV inconsistencies
    const povConflicts = this.detectPovInconsistencies(items);
    warnings.push(...povConflicts);

    // Chronological errors
    const chronoConflicts = this.detectChronologicalErrors(items);
    conflicts.push(...chronoConflicts);

    // Generate optimization suggestions
    const optimizations = this.generateOptimizationSuggestions(items, conflicts, project);
    suggestions.push(...optimizations);

    // Calculate overall score
    const criticalCount = conflicts.filter((c) => c.severity === 'critical').length;
    const highCount = conflicts.filter((c) => c.severity === 'high').length;
    const mediumCount = conflicts.filter((c) => c.severity === 'medium').length;
    const lowCount = conflicts.filter((c) => c.severity === 'low').length;

    const overallScore = Math.max(
      0,
      100 - (criticalCount * 25 + highCount * 15 + mediumCount * 10 + lowCount * 5),
    );

    const result: TimelineValidationResult = {
      isValid:
        conflicts.filter((c) => c.severity === 'critical' || c.severity === 'high').length === 0,
      conflicts,
      warnings,
      suggestions,
      overallScore,
    };

    // Cache validation results
    await this.saveValidationResults(projectId, result);
    return result;
  }

  /**
   * Link a scene to timeline events with validation
   */
  async linkSceneToTimeline(
    projectId: string,
    sceneId: string,
    chapterId: string,
    eventIds: string[],
    linkageType: SceneLinkage['linkageType'] = 'manual',
  ): Promise<{ success: boolean; conflicts?: TimelineConflict[] }> {
    const items = await timelineService.getProjectTimeline(projectId);
    const events = items.filter((item) => eventIds.includes(item.id));

    if (events.length !== eventIds.length) {
      return {
        success: false,
        conflicts: [
          {
            id: `missing_events_${Date.now()}`,
            type: 'chronological_error',
            severity: 'high',
            title: 'Missing Timeline Events',
            description: 'Some specified timeline events could not be found',
            affectedEvents: eventIds,
            affectedScenes: [sceneId],
            suggestion: 'Verify that all timeline events exist before linking',
            autoFixable: false,
            evidence: [`Requested ${eventIds.length} events, found ${events.length}`],
          },
        ],
      };
    }

    // Validate linkage doesn't create conflicts
    const linkageConflicts = this.validateSceneLinkage(events, sceneId, chapterId);
    if (linkageConflicts.length > 0) {
      return { success: false, conflicts: linkageConflicts };
    }

    // Create linkage record
    const linkage: SceneLinkage = {
      sceneId,
      chapterId,
      timelineEventIds: eventIds,
      linkageType,
      confidence: linkageType === 'manual' ? 1.0 : 0.8,
      lastValidated: new Date(),
    };

    // Update timeline events with scene references
    for (const eventId of eventIds) {
      await timelineService.linkScene(projectId, sceneId, eventId);
    }

    // Save linkage record
    await this.saveSceneLinkage(projectId, linkage);

    return { success: true };
  }

  /**
   * Auto-detect potential scene-timeline linkages
   */
  async detectSceneLinkages(
    projectId: string,
    project: EnhancedProject,
  ): Promise<
    Array<{
      sceneId: string;
      chapterId: string;
      suggestedEvents: string[];
      confidence: number;
      reasoning: string;
    }>
  > {
    const items = await timelineService.getProjectTimeline(projectId);
    const suggestions: Array<{
      sceneId: string;
      chapterId: string;
      suggestedEvents: string[];
      confidence: number;
      reasoning: string;
    }> = [];

    for (const chapter of project.chapters) {
      for (const scene of chapter.scenes || []) {
        if (scene.timelineEventIds && scene.timelineEventIds.length > 0) {
          continue; // Skip already linked scenes
        }

        const sceneText = this.stripHtml(scene.content).toLowerCase();
        const matchingEvents: Array<{ eventId: string; confidence: number }> = [];

        for (const item of items) {
          const confidence = this.calculateLinkageConfidence(scene, item, sceneText);
          if (confidence > 0.3) {
            // Threshold for suggestion
            matchingEvents.push({ eventId: item.id, confidence });
          }
        }

        if (matchingEvents.length > 0) {
          matchingEvents.sort((a, b) => b.confidence - a.confidence);
          const topEvents = matchingEvents.slice(0, 3); // Top 3 matches
          const avgConfidence =
            topEvents.reduce((sum, e) => sum + e.confidence, 0) / topEvents.length;

          suggestions.push({
            sceneId: scene.id,
            chapterId: chapter.id,
            suggestedEvents: topEvents.map((e) => e.eventId),
            confidence: avgConfidence,
            reasoning: this.generateLinkageReasoning(scene, topEvents, items),
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get navigation path between linked scenes
   */
  async getTimelineNavigation(
    projectId: string,
    currentSceneId: string,
  ): Promise<{
    previous?: { sceneId: string; chapterId: string; eventTitle: string; timePosition: number };
    next?: { sceneId: string; chapterId: string; eventTitle: string; timePosition: number };
    siblings: Array<{
      sceneId: string;
      chapterId: string;
      eventTitle: string;
      timePosition: number;
    }>;
  }> {
    const items = await timelineService.getProjectTimeline(projectId);
    const linkedEvents = items.filter((item) => item.sceneId).sort((a, b) => a.start - b.start);

    const currentIndex = linkedEvents.findIndex((item) => item.sceneId === currentSceneId);
    const result = {
      previous: undefined as any,
      next: undefined as any,
      siblings: [] as any[],
    };

    // Find previous and next scenes in timeline order
    if (currentIndex > 0 && linkedEvents[currentIndex - 1]) {
      const prev = linkedEvents[currentIndex - 1];
      result.previous = {
        sceneId: prev.sceneId!,
        chapterId: prev.chapterId || 'unknown',
        eventTitle: prev.title,
        timePosition: prev.start,
      };
    }

    if (currentIndex < linkedEvents.length - 1 && linkedEvents[currentIndex + 1]) {
      const next = linkedEvents[currentIndex + 1];
      result.next = {
        sceneId: next.sceneId!,
        chapterId: next.chapterId || 'unknown',
        eventTitle: next.title,
        timePosition: next.start,
      };
    }

    // Find all sibling scenes (scenes linked to the same timeline events)
    const currentEvent = linkedEvents[currentIndex];
    if (currentEvent) {
      result.siblings = linkedEvents
        .filter(
          (item) =>
            item.sceneId !== currentSceneId && Math.abs(item.start - currentEvent.start) <= 2, // Within 2 time units
        )
        .map((item) => ({
          sceneId: item.sceneId!,
          chapterId: item.chapterId || 'unknown',
          eventTitle: item.title,
          timePosition: item.start,
        }));
    }

    return result;
  }

  /**
   * Generate time anchors for critical story moments
   */
  async generateTimeAnchors(projectId: string): Promise<TimelineAnchor[]> {
    const items = await timelineService.getProjectTimeline(projectId);
    const anchors: TimelineAnchor[] = [];

    // Find critical story moments that should be anchored
    const criticalEvents = items.filter(
      (item) =>
        item.importance === 'major' ||
        item.tags.some((tag) =>
          ['climax', 'inciting-incident', 'midpoint', 'resolution'].includes(tag),
        ),
    );

    for (const event of criticalEvents) {
      anchors.push({
        id: `anchor_${event.id}_${Date.now()}`,
        eventId: event.id,
        anchorType: 'sequence',
        position: event.start,
        description: `Critical story moment: ${event.title}`,
        locked: true,
      });
    }

    // Save anchors
    await this.saveTimelineAnchors(projectId, anchors);
    return anchors;
  }

  // Private methods for conflict detection

  private detectTimeOverlapConflicts(items: TimelineItem[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];

        // Check if same character appears in overlapping time ranges
        if (item1.pov && item2.pov && item1.pov === item2.pov) {
          const range1: TimelineRange = { start: item1.start, end: item1.end || item1.start };
          const range2: TimelineRange = { start: item2.start, end: item2.end || item2.start };

          if (this.rangesOverlap(range1, range2) && Math.abs(item1.start - item2.start) > 0) {
            conflicts.push({
              id: `overlap_${item1.id}_${item2.id}`,
              type: 'time_overlap',
              severity: 'high',
              title: 'Character Timeline Overlap',
              description: `${item1.pov} appears simultaneously in multiple events`,
              affectedEvents: [item1.id, item2.id],
              suggestion:
                'Adjust timeline positions or verify if character can be in both locations',
              autoFixable: true,
              evidence: [
                `Event "${item1.title}" at position ${item1.start}`,
                `Event "${item2.title}" at position ${item2.start}`,
                `Both feature ${item1.pov} as POV character`,
              ],
            });
          }
        }
      }
    }

    return conflicts;
  }

  private detectCharacterPresenceConflicts(
    items: TimelineItem[],
    project: EnhancedProject,
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Check if characters appear in timeline events but not in corresponding chapters
    for (const item of items) {
      if (!item.chapterId) continue;

      const chapter = project.chapters.find((c) => c.id === item.chapterId);
      if (!chapter) continue;

      for (const charId of item.characterIds) {
        const character = project.characters.find((c) => c.id === charId);
        if (!character) continue;

        if (!character.appearsInChapters.includes(item.chapterId)) {
          conflicts.push({
            id: `char_presence_${item.id}_${charId}`,
            type: 'character_presence',
            severity: 'medium',
            title: 'Character Presence Mismatch',
            description: `${character.name} appears in timeline event but not marked as present in chapter`,
            affectedEvents: [item.id],
            suggestion: `Add ${character.name} to chapter ${chapter.title} or remove from timeline event`,
            autoFixable: true,
            evidence: [
              `Character ${character.name} in event "${item.title}"`,
              `Chapter "${chapter.title}" character list: [${character.appearsInChapters.join(', ')}]`,
            ],
          });
        }
      }
    }

    return conflicts;
  }

  private detectLocationMismatchConflicts(
    items: TimelineItem[],
    project: EnhancedProject,
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Group events by location and time to detect impossible travel
    const locationGroups = new Map<string, TimelineItem[]>();

    for (const item of items) {
      if (!item.location) continue;

      if (!locationGroups.has(item.location)) {
        locationGroups.set(item.location, []);
      }
      locationGroups.get(item.location)!.push(item);
    }

    // Check for characters moving between distant locations too quickly
    for (const character of project.characters) {
      const characterEvents = items
        .filter((item) => item.characterIds.includes(character.id) || item.pov === character.name)
        .sort((a, b) => a.start - b.start);

      for (let i = 0; i < characterEvents.length - 1; i++) {
        const current = characterEvents[i];
        const next = characterEvents[i + 1];

        if (current.location && next.location && current.location !== next.location) {
          const timeDiff = next.start - current.start;

          // If events are very close in time but in different locations
          if (timeDiff <= 1) {
            conflicts.push({
              id: `location_travel_${current.id}_${next.id}`,
              type: 'location_mismatch',
              severity: 'medium',
              title: 'Impossible Travel Time',
              description: `${character.name} travels from ${current.location} to ${next.location} too quickly`,
              affectedEvents: [current.id, next.id],
              suggestion: 'Add travel time between events or verify location accuracy',
              autoFixable: false,
              evidence: [
                `From "${current.title}" in ${current.location}`,
                `To "${next.title}" in ${next.location}`,
                `Time difference: ${timeDiff} time units`,
              ],
            });
          }
        }
      }
    }

    return conflicts;
  }

  private detectPovInconsistencies(items: TimelineItem[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Find events where POV character is not in the character list
    for (const item of items) {
      if (item.pov && !item.characterIds.includes(item.pov)) {
        conflicts.push({
          id: `pov_consistency_${item.id}`,
          type: 'pov_inconsistency',
          severity: 'low',
          title: 'POV Character Not Listed',
          description: `POV character "${item.pov}" is not in the event's character list`,
          affectedEvents: [item.id],
          suggestion: `Add ${item.pov} to character list or update POV selection`,
          autoFixable: true,
          evidence: [`POV: ${item.pov}`, `Characters: [${item.characterIds.join(', ')}]`],
        });
      }
    }

    return conflicts;
  }

  private detectChronologicalErrors(items: TimelineItem[]): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Find events with end times before start times
    for (const item of items) {
      if (item.end && item.end < item.start) {
        conflicts.push({
          id: `chrono_error_${item.id}`,
          type: 'chronological_error',
          severity: 'critical',
          title: 'Invalid Time Range',
          description: `Event "${item.title}" ends before it starts`,
          affectedEvents: [item.id],
          suggestion: 'Fix the end time to be after the start time',
          autoFixable: true,
          evidence: [`Start: ${item.start}`, `End: ${item.end}`],
        });
      }
    }

    return conflicts;
  }

  private generateOptimizationSuggestions(
    items: TimelineItem[],
    _conflicts: TimelineConflict[],
    _project?: EnhancedProject,
  ): TimelineOptimization[] {
    const suggestions: TimelineOptimization[] = [];

    // Suggest merging similar adjacent events
    const adjacentEvents = this.findAdjacentSimilarEvents(items);
    for (const pair of adjacentEvents) {
      suggestions.push({
        type: 'merge_events',
        title: 'Merge Similar Events',
        description: `Consider merging "${pair[0].title}" and "${pair[1].title}"`,
        impact: 'medium',
        effort: 'easy',
        eventIds: [pair[0].id, pair[1].id],
      });
    }

    // Suggest adding missing events for gaps
    const gaps = this.findTimelineGaps(items);
    for (const gap of gaps) {
      suggestions.push({
        type: 'add_missing_event',
        title: 'Fill Timeline Gap',
        description: `Consider adding an event between positions ${gap.start} and ${gap.end}`,
        impact: 'low',
        effort: 'moderate',
        eventIds: [],
      });
    }

    return suggestions;
  }

  // Helper methods

  private rangesOverlap(range1: TimelineRange, range2: TimelineRange): boolean {
    return range1.start <= range2.end && range2.start <= range1.end;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateLinkageConfidence(scene: any, item: TimelineItem, sceneText: string): number {
    let confidence = 0;

    // Character overlap
    if (item.characterIds.length > 0) {
      // This would need character name matching logic
      confidence += 0.3;
    }

    // Title/content similarity
    const itemWords = item.title.toLowerCase().split(/\s+/);
    const sceneWords = scene.title.toLowerCase().split(/\s+/);
    const commonWords = itemWords.filter((word) =>
      sceneWords.some((sw) => sw.includes(word) || word.includes(sw)),
    );
    confidence += (commonWords.length / Math.max(itemWords.length, sceneWords.length)) * 0.4;

    // Content keyword matching
    if (sceneText.includes(item.title.toLowerCase())) {
      confidence += 0.3;
    }

    return Math.min(1, confidence);
  }

  private generateLinkageReasoning(
    scene: any,
    events: Array<{ eventId: string; confidence: number }>,
    items: TimelineItem[],
  ): string {
    const eventTitles = events.map((e) => {
      const item = items.find((i) => i.id === e.eventId);
      return item ? item.title : 'Unknown';
    });

    return `Scene "${scene.title}" matches timeline events: ${eventTitles.join(', ')}`;
  }

  private validateSceneLinkage(
    events: TimelineItem[],
    sceneId: string,
    _chapterId: string,
  ): TimelineConflict[] {
    const conflicts: TimelineConflict[] = [];

    // Check if events are already linked to other scenes
    const alreadyLinked = events.filter((e) => e.sceneId && e.sceneId !== sceneId);
    if (alreadyLinked.length > 0) {
      conflicts.push({
        id: `already_linked_${sceneId}_${Date.now()}`,
        type: 'chronological_error',
        severity: 'medium',
        title: 'Events Already Linked',
        description: 'Some events are already linked to other scenes',
        affectedEvents: alreadyLinked.map((e) => e.id),
        affectedScenes: [sceneId],
        suggestion: 'Unlink from other scenes first or choose different events',
        autoFixable: false,
        evidence: alreadyLinked.map((e) => `Event "${e.title}" linked to scene ${e.sceneId}`),
      });
    }

    return conflicts;
  }

  private findAdjacentSimilarEvents(items: TimelineItem[]): Array<[TimelineItem, TimelineItem]> {
    const pairs: Array<[TimelineItem, TimelineItem]> = [];
    const sorted = [...items].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // Check if events are adjacent and similar
      if (
        next.start - current.start <= 2 &&
        current.eventType === next.eventType &&
        current.importance === next.importance
      ) {
        pairs.push([current, next]);
      }
    }

    return pairs;
  }

  private findTimelineGaps(items: TimelineItem[]): Array<{ start: number; end: number }> {
    const gaps: Array<{ start: number; end: number }> = [];
    const sorted = [...items].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const gap = next.start - (current.end || current.start);

      if (gap > 5) {
        // Significant gap threshold
        gaps.push({ start: current.end || current.start, end: next.start });
      }
    }

    return gaps;
  }

  // Storage methods

  private async saveValidationResults(
    projectId: string,
    results: TimelineValidationResult,
  ): Promise<void> {
    const key = `${this.CONFLICTS_STORAGE_PREFIX}${projectId}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          ...results,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error('Failed to save timeline validation results:', error);
    }
  }

  private async saveSceneLinkage(projectId: string, linkage: SceneLinkage): Promise<void> {
    const key = `${this.LINKAGES_STORAGE_PREFIX}${projectId}`;
    try {
      const existing = localStorage.getItem(key);
      const linkages: SceneLinkage[] = existing ? JSON.parse(existing) : [];

      // Remove existing linkage for this scene
      const filtered = linkages.filter((l) => l.sceneId !== linkage.sceneId);
      filtered.push(linkage);

      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to save scene linkage:', error);
    }
  }

  private async saveTimelineAnchors(projectId: string, anchors: TimelineAnchor[]): Promise<void> {
    const key = `${this.STORAGE_PREFIX}anchors_${projectId}`;
    try {
      localStorage.setItem(key, JSON.stringify(anchors));
    } catch (error) {
      console.error('Failed to save timeline anchors:', error);
    }
  }
}

export const enhancedTimelineService = new EnhancedTimelineService();
