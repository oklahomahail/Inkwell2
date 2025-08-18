import type { Dispatch } from 'react';
// src/types/writing.ts

/* ========= Enums ========= */
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

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

/* ========= Auto-save ========= */
export interface AutoSaveState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error?: string | null;
  saveCount: number; // ✅ used in WritingPanel
}

/* ========= Writing Sessions ========= */
export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  wordsAdded: number;
  productivity: number;
  focusTime: number;
  notes?: string;
}

export interface UIWritingSession {
  date: string;
  startTime: Date;
  endTime?: Date;
  wordCount?: number;
  wordsAtStart: number;
  wordsWritten?: number;
  lastActivityTime: Date;
  projectId?: string;
  sceneId?: string;
  chapterId?: string;
}

/* ========= Core Models ========= */
export interface Scene {
  id: string;
  title: string;
  content: string;
  status: SceneStatus;
  order: number;
  wordCount: number;
  wordCountGoal?: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
  totalWordCount: number;
  status: ChapterStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ========= Hook State / API ========= */
export type WritingState = {
  /** The active project ID (string) or null if nothing selected */
  currentProject: string | null;
  /** The active project’s chapters */
  chapters: Chapter[];
};

export type WritingAction =
  | { type: 'SET_CHAPTERS'; payload: Chapter[] }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'UPDATE_CHAPTER'; payload: Chapter }
  | { type: 'DELETE_CHAPTER'; payload: { id: string } }
  | { type: string; payload?: unknown }; // catch-all for now

export type WritingAPI = {
  state: WritingState;
  dispatch: Dispatch<WritingAction>;
};
