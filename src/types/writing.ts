// src/types/writing.ts
export enum SceneStatus {
  DRAFT = 'draft',
  REVISION = 'revision',
  COMPLETE = 'complete'
}

export interface Scene {
  id: string;
  title: string;
  content: string;
  summary?: string;
  wordCount: number;
  wordCountGoal?: number;
  status: SceneStatus;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  summary?: string;
  scenes: Scene[];
  totalWordCount: number;
  targetWordCount?: number;
  status: SceneStatus;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  totalWordCount: number;
  targetWordCount?: number;
  genre?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt: Date;
}

export interface WritingSession {
  id: string;
  projectId: string;
  sceneId?: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  timeSpent: number; // in minutes
}

export interface WritingGoal {
  id: string;
  projectId?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  targetWords: number;
  currentWords: number;
  deadline?: Date;
  isActive: boolean;
}

export interface WritingStats {
  totalWords: number;
  totalSessions: number;
  averageSessionLength: number;
  currentStreak: number;
  longestStreak: number;
  wordsToday: number;
  wordsThisWeek: number;
  wordsThisMonth: number;
}