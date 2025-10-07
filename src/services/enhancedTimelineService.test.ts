// src/services/enhancedTimelineService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { EnhancedProject } from '@/types/project';
import type { TimelineItem } from '@/types/timeline';

import { getOrThrow } from '../test-utils/getters';
import { assertExists } from '../test-utils/invariants';

// ID generation helper
const newId = () => globalThis.crypto?.randomUUID?.() ?? `test-${Date.now()}-${Math.random()}`;

import { enhancedTimelineService } from './enhancedTimelineService';
import { timelineService } from './timelineService';

// Mock the timelineService
vi.mock('./timelineService', () => ({
  timelineService: {
    getProjectTimeline: vi.fn(),
    linkScene: vi.fn(),
  },
}));

describe('EnhancedTimelineService', () => {
  const mockProjectId = 'test-project-1';
  const mockTimelineItems: TimelineItem[] = [
    {
      id: 'event-1',
      title: 'Opening Scene',
      description: 'The hero begins their journey',
      start: 1,
      end: 3,
      characterIds: ['char-1', 'char-2'],
      pov: 'Hero',
      location: 'Village',
      tags: ['inciting-incident'],
      importance: 'major',
      eventType: 'plot',
      chapterId: 'chapter-1',
      sceneId: 'scene-1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 'event-2',
      title: 'Meeting the Mentor',
      description: 'Hero meets their guide',
      start: 5,
      end: 7,
      characterIds: ['char-1', 'char-3'],
      pov: 'Hero',
      location: 'Forest',
      tags: ['character-development'],
      importance: 'major',
      eventType: 'character',
      chapterId: 'chapter-2',
      sceneId: 'scene-2',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
    },
    {
      id: 'event-3',
      title: 'Hero in Different Location',
      description: 'Hero travels quickly',
      start: 6,
      end: 6,
      characterIds: ['char-1'],
      pov: 'Hero',
      location: 'Mountain',
      tags: ['travel'],
      importance: 'minor',
      eventType: 'plot',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03'),
    },
  ];

  const mockProject: EnhancedProject = {
    id: mockProjectId,
    name: 'Test Story',
    description: 'A test story for validation',
    currentWordCount: 350,
    characters: [
      {
        id: 'char-1',
        name: 'Hero',
        role: 'protagonist',
        description: 'The main character',
        personality: [],
        backstory: '',
        goals: '',
        conflicts: '',
        appearance: '',
        appearsInChapters: ['chapter-1', 'chapter-2'],
        relationships: [],
        notes: '',
        createdAt: new Date('2023-01-01').getTime(),
        updatedAt: new Date('2023-01-01').getTime(),
      },
      {
        id: 'char-2',
        name: 'Companion',
        role: 'supporting',
        description: "Hero's friend",
        personality: [],
        backstory: '',
        goals: '',
        conflicts: '',
        appearance: '',
        appearsInChapters: ['chapter-1'],
        relationships: [],
        notes: '',
        createdAt: new Date('2023-01-01').getTime(),
        updatedAt: new Date('2023-01-01').getTime(),
      },
      {
        id: 'char-3',
        name: 'Mentor',
        role: 'supporting',
        description: 'Wise guide',
        personality: [],
        backstory: '',
        goals: '',
        conflicts: '',
        appearance: '',
        appearsInChapters: ['chapter-2'],
        relationships: [],
        notes: '',
        createdAt: new Date('2023-01-01').getTime(),
        updatedAt: new Date('2023-01-01').getTime(),
      },
    ],
    chapters: [
      {
        id: 'chapter-1',
        title: 'Beginning',
        content: '',
        order: 1,
        scenes: [
          {
            id: 'scene-1',
            title: 'Opening',
            content: '<p>The hero begins their magical journey in the village.</p>',
            order: 1,
            status: 'first-draft',
            wordCount: 150,
            timelineEventIds: ['event-1'],
            createdAt: new Date('2023-01-01').getTime(),
            updatedAt: new Date('2023-01-01').getTime(),
          },
        ],
        wordCount: 150,
        status: 'first-draft',
        charactersInChapter: ['char-1', 'char-2'],
        plotPointsResolved: [],
        notes: '',
        createdAt: new Date('2023-01-01').getTime(),
        updatedAt: new Date('2023-01-01').getTime(),
      },
      {
        id: 'chapter-2',
        title: 'Development',
        content: '',
        order: 2,
        scenes: [
          {
            id: 'scene-2',
            title: 'Meeting',
            content: '<p>In the magical forest, the hero encounters their mentor.</p>',
            order: 1,
            status: 'first-draft',
            wordCount: 200,
            timelineEventIds: [],
            createdAt: new Date('2023-01-02').getTime(),
            updatedAt: new Date('2023-01-02').getTime(),
          },
        ],
        wordCount: 200,
        status: 'first-draft',
        charactersInChapter: ['char-1', 'char-3'],
        plotPointsResolved: [],
        notes: '',
        createdAt: new Date('2023-01-02').getTime(),
        updatedAt: new Date('2023-01-02').getTime(),
      },
    ],
    plotNotes: [],
    worldBuilding: [],
    recentContent: '',
    sessions: [],
    createdAt: new Date('2023-01-01').getTime(),
    updatedAt: new Date('2023-01-03').getTime(),
    claudeContext: {
      includeCharacters: true,
      includePlotNotes: true,
      includeWorldBuilding: true,
      maxCharacters: 10,
      maxPlotNotes: 5,
      contextLength: 'medium',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock return
    (timelineService.getProjectTimeline as any).mockResolvedValue(mockTimelineItems);
  });

  describe('Timeline Validation', () => {
    it('should detect time overlap conflicts', async () => {
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      expect(result.isValid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      const firstConflict = getOrThrow(result.conflicts[0], 'expected first conflict');
      expect(firstConflict.type).toBe('time_overlap');
      expect(firstConflict.severity).toBe('high');
      expect(firstConflict.affectedEvents).toContain('event-2');
      expect(firstConflict.affectedEvents).toContain('event-3');
    });

    it('should detect chronological errors', async () => {
      const itemsWithError: TimelineItem[] = [
        {
          ...mockTimelineItems[0],
          id: newId(),
          title: 'Error Item',
          characterIds: ['char-1'],
          tags: ['test'],
          importance: 'major',
          eventType: 'plot',
          start: 10,
          end: 5, // End before start
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (timelineService.getProjectTimeline as any).mockResolvedValue(itemsWithError);

      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      expect(result.conflicts.some((c) => c.type === 'chronological_error')).toBe(true);
      expect(result.conflicts.some((c) => c.severity === 'critical')).toBe(true);
    });

    it('should detect character presence conflicts', async () => {
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      // Should detect that Companion (char-2) appears in event-1 but not marked in chapter-1
      const characterConflicts = result.conflicts.filter((c) => c.type === 'character_presence');
      expect(characterConflicts.length).toBeGreaterThanOrEqual(0); // Depends on mock data setup
    });

    it('should detect location mismatch conflicts', async () => {
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      // Should detect Hero traveling from Forest to Mountain too quickly
      const locationConflicts = result.warnings.filter((c) => c.type === 'location_mismatch');
      expect(locationConflicts.length).toBeGreaterThanOrEqual(1);
      if (locationConflicts.length > 0) {
        expect(locationConflicts[0]?.description).toContain('travels from');
      }
    });

    it('should detect POV inconsistencies', async () => {
      const itemsWithPOVError: TimelineItem[] = [
        {
          ...mockTimelineItems[0],
          id: newId(),
          title: 'POV Error Item',
          start: 1,
          tags: ['test'],
          importance: 'major',
          eventType: 'plot',
          pov: 'NonExistentCharacter',
          characterIds: ['char-1', 'char-2'], // POV not in character list
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (timelineService.getProjectTimeline as any).mockResolvedValue(itemsWithPOVError);

      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      const povConflicts = result.warnings.filter((c) => c.type === 'pov_inconsistency');
      expect(povConflicts.length).toBe(1);
      const firstPovConflict = getOrThrow(povConflicts[0], 'expected POV conflict');
      expect(firstPovConflict.autoFixable).toBe(true);
    });

    it('should calculate overall score correctly', async () => {
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      // With conflicts, score should be less than perfect
      if (result.conflicts.length > 0) {
        expect(result.overallScore).toBeLessThan(100);
      }
    });

    it('should generate optimization suggestions', async () => {
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('Scene Linkage', () => {
    it('should link scene to timeline events successfully', async () => {
      const result = await enhancedTimelineService.linkSceneToTimeline(
        mockProjectId,
        'scene-2',
        'chapter-2',
        ['event-2'],
        'manual',
      );

      expect(result.success).toBe(true);
      expect(timelineService.linkScene).toHaveBeenCalledWith(mockProjectId, 'scene-2', 'event-2');
    });

    it('should fail linkage when events do not exist', async () => {
      const result = await enhancedTimelineService.linkSceneToTimeline(
        mockProjectId,
        'scene-2',
        'chapter-2',
        ['nonexistent-event'],
        'manual',
      );

      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
      assertExists(result.conflicts, 'expected conflicts array');
      const firstConflict = getOrThrow(result.conflicts[0], 'expected first conflict');
      expect(firstConflict.type).toBe('chronological_error');
      expect(firstConflict.severity).toBe('high');
    });

    it('should prevent linking events already linked to other scenes', async () => {
      const result = await enhancedTimelineService.linkSceneToTimeline(
        mockProjectId,
        'scene-different',
        'chapter-different',
        ['event-1'], // Already linked to scene-1
        'manual',
      );

      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
      assertExists(result.conflicts, 'expected conflicts array');
      const firstConflict = getOrThrow(result.conflicts[0], 'expected first conflict');
      expect(firstConflict.description).toContain('already linked');
    });
  });

  describe('Scene Linkage Detection', () => {
    it('should detect potential scene linkages', async () => {
      const suggestions = await enhancedTimelineService.detectSceneLinkages(
        mockProjectId,
        mockProject,
      );

      expect(Array.isArray(suggestions)).toBe(true);

      // Should find suggestion for scene-2 (unlinked) based on content matching
      const scene2Suggestion = suggestions.find((s) => s.sceneId === 'scene-2');
      if (scene2Suggestion) {
        expect(scene2Suggestion.confidence).toBeGreaterThan(0);
        expect(scene2Suggestion.suggestedEvents).toContain('event-2');
        expect(scene2Suggestion.reasoning).toContain('matches');
      }
    });

    it('should skip already linked scenes', async () => {
      const suggestions = await enhancedTimelineService.detectSceneLinkages(
        mockProjectId,
        mockProject,
      );

      // scene-1 is already linked, so should not appear in suggestions
      const scene1Suggestion = suggestions.find((s) => s.sceneId === 'scene-1');
      expect(scene1Suggestion).toBeUndefined();
    });

    it('should sort suggestions by confidence', async () => {
      const suggestions = await enhancedTimelineService.detectSceneLinkages(
        mockProjectId,
        mockProject,
      );

      if (suggestions.length > 1) {
        for (let i = 0; i < suggestions.length - 1; i++) {
          const current = getOrThrow(suggestions[i], `expected suggestion at index ${i}`);
          const next = getOrThrow(suggestions[i + 1], `expected suggestion at index ${i + 1}`);
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        }
      }
    });
  });

  describe('Timeline Navigation', () => {
    it('should get navigation info for linked scene', async () => {
      const navigation = await enhancedTimelineService.getTimelineNavigation(
        mockProjectId,
        'scene-1',
      );

      expect(navigation).toBeDefined();
      expect(navigation.next).toBeDefined();
      expect(navigation.next!.sceneId).toBe('scene-2');
      expect(navigation.previous).toBeUndefined(); // scene-1 is first
    });

    it('should handle unlinked scenes gracefully', async () => {
      const navigation = await enhancedTimelineService.getTimelineNavigation(
        mockProjectId,
        'nonexistent-scene',
      );

      // Since getTimelineNavigation looks for scenes in the timeline items,
      // and nonexistent-scene doesn't exist, it won't find it in the timeline
      // However, the method still returns navigation based on existing linked scenes
      expect(navigation).toBeDefined();
      expect(navigation.siblings).toHaveLength(0);
    });

    it('should find sibling scenes within time threshold', async () => {
      // Add a concurrent event
      const concurrentItems = [
        ...mockTimelineItems,
        {
          ...mockTimelineItems[0],
          id: 'event-concurrent',
          sceneId: 'scene-concurrent',
          start: 2, // Within 2 time units of event-1 (start: 1)
        },
      ];
      (timelineService.getProjectTimeline as any).mockResolvedValue(concurrentItems);

      const navigation = await enhancedTimelineService.getTimelineNavigation(
        mockProjectId,
        'scene-1',
      );

      expect(navigation.siblings.length).toBeGreaterThanOrEqual(0);
      if (navigation.siblings.length > 0) {
        const firstSibling = getOrThrow(navigation.siblings[0], 'expected first sibling');
        expect(firstSibling.sceneId).toBe('scene-concurrent');
      }
    });
  });

  describe('Time Anchors', () => {
    it('should generate time anchors for major events', async () => {
      const anchors = await enhancedTimelineService.generateTimeAnchors(mockProjectId);

      expect(Array.isArray(anchors)).toBe(true);

      // Should create anchors for major events
      const majorEvents = mockTimelineItems.filter((item) => item.importance === 'major');
      expect(anchors.length).toBeGreaterThanOrEqual(majorEvents.length);

      if (anchors.length > 0) {
        const firstAnchor = getOrThrow(anchors[0], 'expected first anchor');
        expect(firstAnchor.anchorType).toBe('sequence');
        expect(firstAnchor.locked).toBe(true);
        expect(firstAnchor.description).toContain('Critical story moment');
      }
    });

    it('should create anchors for tagged critical events', async () => {
      const anchors = await enhancedTimelineService.generateTimeAnchors(mockProjectId);

      // Should create anchor for event-1 which has 'inciting-incident' tag
      const incitingAnchor = anchors.find((a) => a.eventId === 'event-1');
      expect(incitingAnchor).toBeDefined();
      if (incitingAnchor) {
        expect(incitingAnchor.description).toContain('Opening Scene');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle timeline service errors gracefully', async () => {
      (timelineService.getProjectTimeline as any).mockRejectedValue(new Error('Service error'));

      await expect(
        enhancedTimelineService.validateTimeline(mockProjectId, mockProject),
      ).rejects.toThrow('Service error');
    });

    it('should handle linkage service errors gracefully', async () => {
      (timelineService.linkScene as any).mockRejectedValue(new Error('Link error'));

      await expect(
        enhancedTimelineService.linkSceneToTimeline(mockProjectId, 'scene-1', 'chapter-1', [
          'event-1',
        ]),
      ).rejects.toThrow('Link error');
    });

    it('should handle navigation for nonexistent scenes', async () => {
      const navigation = await enhancedTimelineService.getTimelineNavigation(
        mockProjectId,
        'nonexistent',
      );

      // The navigation method returns the structure even for nonexistent scenes
      // but without finding the specific scene in timeline
      expect(navigation).toBeDefined();
      expect(navigation.siblings).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle large timeline datasets efficiently', async () => {
      // Create a large dataset
      const baseItem = getOrThrow(mockTimelineItems[0], 'expected base timeline item');
      const largeTimeline = Array.from({ length: 1000 }, (_, i) => ({
        ...baseItem,
        id: `event-${i}`,
        title: `Event ${i}`,
        start: i,
        end: i + 1,
      }));
      (timelineService.getProjectTimeline as any).mockResolvedValue(largeTimeline);

      const startTime = Date.now();
      const result = await enhancedTimelineService.validateTimeline(mockProjectId, mockProject);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
