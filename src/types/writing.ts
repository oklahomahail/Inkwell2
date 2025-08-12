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

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  HTML = 'html',
  MARKDOWN = 'markdown', // Now 'markdown' will work
}

export interface AutoSaveState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error?: string | null;
  saveCount: number; // ✅ Added this property that's used in WritingPanel
}

// WritingSession for the service (from enhancedStorageService.ts)
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

// WritingSession for the UI components (what WritingPanel uses)
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
