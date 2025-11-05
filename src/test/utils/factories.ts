import { v4 as uuid } from 'uuid';

import { makeMockStorage } from '../../components/Onboarding/testUtils';
import { ChapterStatus } from '../../domain/types';
import { WritingProject, WritingScene, WritingChapter } from '../../types/writing';

export { makeMockStorage };

export function createMockScene(overrides: Partial<WritingScene> = {}): WritingScene {
  return {
    id: uuid(),
    title: 'Test Scene',
    content: 'Test scene content',
    wordCount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockChapter(overrides: Partial<WritingChapter> = {}): WritingChapter {
  return {
    id: uuid(),
    title: 'Test Chapter',
    status: ChapterStatus.InProgress,
    scenes: [createMockScene()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockProject(overrides: Partial<WritingProject> = {}): WritingProject {
  return {
    id: uuid(),
    title: 'Test Project',
    chapters: [createMockChapter()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      theme: 'light',
      fontSize: 16,
      lineHeight: 1.5,
    },
    ...overrides,
  };
}
