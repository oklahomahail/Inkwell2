// @ts-nocheck
import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { Scene, Character } from '@/types/writing';
import type { TimelineItem } from '@/types/timeline';

import {
  timelineConflictService,
  type TimelineConflict,
} from '../services/timelineConflictService';
import { storageService } from '../services/storageService';
import { timelineService } from '../services/timelineService';
import { getCharacterBible } from '../services/projectContextService';

// Mock the services
vi.mock('../services/storageService', () => ({
  storageService: {
    loadScenes: vi.fn(),
  },
}));

vi.mock('../services/timelineService', () => ({
  timelineService: {
    getProjectTimeline: vi.fn(),
  },
}));

vi.mock('../services/projectContextService', () => ({
  getCharacterBible: vi.fn(),
}));

describe('Timeline Conflict Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // Sample test data
  const testScene: Scene = {
    id: 'test1',
    title: 'Test Scene',
    content: 'Yesterday, something happened.',
    chapterId: 'ch1',
    timelineEventIds: ['ev1'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testEvent: TimelineItem = {
    id: 'ev1',
    title: 'Test Event',
    date: new Date('2025-01-01'),
    type: 'event',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test('Detects temporal conflicts', async () => {
    // Setup mocks
    vi.mocked(storageService.loadScenes).mockResolvedValue([testScene]);
    vi.mocked(timelineService.getProjectTimeline).mockResolvedValue([testEvent]);
    vi.mocked(getCharacterBible).mockReturnValue({});
    const result = await timelineConflictService.checkSceneConflicts('test-project', 'test1');

    expect(result).toEqual([
      expect.objectContaining<Partial<TimelineConflict>>({
        type: 'chronology',
        severity: 'warning',
        sceneId: 'test1',
        eventIds: ['ev1'],
      }),
    ]);
  });
});
