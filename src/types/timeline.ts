// src/types/timeline.ts
export type TimelineImportance = 'major' | 'minor';
export type TimelineEventType = 'plot' | 'character' | 'world' | 'other';

export interface TimelineItem {
  id: string;

  // content
  title: string;
  description?: string;

  // numeric domain (e.g., index or epoch ms)
  start: number;
  end?: number;

  // metadata used across the app
  characterIds: string[];
  pov?: string;
  location?: string;
  tags: string[];

  importance: TimelineImportance;
  eventType: TimelineEventType;

  // optional relations
  chapterId?: string;
  sceneId?: string;

  // bookkeeping
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineRange {
  start: number;
  end: number;
}
