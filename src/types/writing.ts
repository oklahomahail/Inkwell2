// src/types/writing.ts

export enum SceneStatus {
  DRAFT = 'draft',
  REVISION = 'revision',
  COMPLETE = 'complete',
}

export enum ChapterStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
}

export interface Scene {
  id: string;
  title: string;
  content: string;
  status: SceneStatus;
  order: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
  totalWordCount: number;
  status: ChapterStatus; // ✅ now correctly its own enum type
  createdAt: Date;
  updatedAt: Date;
}
