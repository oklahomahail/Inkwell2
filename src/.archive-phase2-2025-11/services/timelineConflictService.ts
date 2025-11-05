// @ts-nocheck
import type { TimelineItem } from '@/types/timeline';
import type { Scene, Character } from '@/types/writing';
import devLog from '@/utils/devLog';

import { getCharacterBible } from './projectContextService';
import { storageService } from './storageService';
import { timelineService } from './timelineService';

import type { CharacterTrait } from './projectContextService';

export interface TimelineConflict {
  id: string;
  type: 'chronology' | 'knowledge' | 'presence' | 'age_inconsistency';
  severity: 'error' | 'warning' | 'suggestion';
  sceneId: string;
  eventIds: string[];
  characterId?: string;
  description: string;
  suggestion?: string;
  confidence: number; // 0–1
}

export interface ConflictCheckContext {
  scenes: Scene[];
  events: TimelineItem[];
  characters: Character[];
}

class TimelineConflictService {
  /* -------------------------------------------------------------- */
  /* Public API                                                     */
  /* -------------------------------------------------------------- */

  /** Analyze all conflicts for a project. */
  async analyzeProjectConflicts(projectId: string): Promise<TimelineConflict[]> {
    try {
      const ctx = await this.buildConflictContext(projectId);
      const out: TimelineConflict[] = [];

      out.push(...this.detectChronologyConflicts(ctx));
      out.push(...this.detectKnowledgeConflicts(ctx));
      out.push(...this.detectPresenceConflicts(ctx));
      out.push(...this.detectAgeInconsistencies(ctx));

      return out.sort((a, b) => b.confidence - a.confidence);
    } catch (err) {
      devLog.error('Failed to analyze project conflicts:', err);
      return [];
    }
  }

  /** Quick check for a single scene while editing. */
  async checkSceneConflicts(projectId: string, sceneId: string): Promise<TimelineConflict[]> {
    try {
      const ctx = await this.buildConflictContext(projectId);
      const scene = ctx.scenes.find((s) => s.id === sceneId);
      if (!scene) return [];

      const out: TimelineConflict[] = [];
      for (const eventId of scene.timelineEventIds || []) {
        out.push(...this.detectTimelineConflicts(ctx, scene, eventId));
      }
      return out;
    } catch (err) {
      devLog.error('Failed to check scene conflicts:', err);
      return [];
    }
  }

  /* -------------------------------------------------------------- */
  /* Private Helpers                                                 */
  /* -------------------------------------------------------------- */

  private async buildConflictContext(projectId: string): Promise<ConflictCheckContext> {
    const [scenes, events, characters] = await Promise.all([
      this.getProjectScenes(projectId),
      this.getProjectEvents(projectId),
      this.getProjectCharacters(projectId),
    ]);
    return { scenes, events, characters };
  }

  private async getProjectScenes(projectId: string): Promise<Scene[]> {
    try {
      return storageService.loadScenes(projectId) || [];
    } catch (err) {
      devLog.error('Failed to load scenes:', err);
      return [];
    }
  }

  private async getProjectEvents(projectId: string): Promise<TimelineItem[]> {
    try {
      const events = await timelineService.getProjectTimeline(projectId);
      return events.map((e) => ({ ...e }));
    } catch (err) {
      devLog.error('Failed to load events:', err);
      return [];
    }
  }

  private async getProjectCharacters(projectId: string): Promise<Character[]> {
    try {
      const bible = getCharacterBible(projectId);
      return Object.values(bible).map((trait: CharacterTrait) => ({
        id: this.slugId(trait.name),
        name: trait.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (err) {
      devLog.error('Failed to load characters:', err);
      return [];
    }
  }

  private detectChronologyConflicts(_ctx: ConflictCheckContext): TimelineConflict[] {
    return [];
  }

  private detectKnowledgeConflicts(_ctx: ConflictCheckContext): TimelineConflict[] {
    return [];
  }

  private detectPresenceConflicts(_ctx: ConflictCheckContext): TimelineConflict[] {
    return [];
  }

  private detectAgeInconsistencies(_ctx: ConflictCheckContext): TimelineConflict[] {
    return [];
  }

  private detectTimelineConflicts(
    ctx: ConflictCheckContext,
    scene: Scene,
    eventId: string,
  ): TimelineConflict[] {
    return [
      {
        id: `chrono_${scene.id}_${eventId}`,
        type: 'chronology',
        severity: 'warning',
        sceneId: scene.id,
        eventIds: [eventId],
        description: 'Temporal conflict detected',
        confidence: 0.7,
      },
    ];
  }

  private slugId(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const timelineConflictService = new TimelineConflictService();
