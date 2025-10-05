// Domain types - Consolidated data models for Inkwell
// This centralizes all domain types used across stores and components

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

export enum CharacterRole {
  PROTAGONIST = 'protagonist',
  ANTAGONIST = 'antagonist',
  SUPPORTING = 'supporting',
  MINOR = 'minor',
}

export enum TimelineEventType {
  PLOT_POINT = 'plot_point',
  CHARACTER_ARC = 'character_arc',
  WORLD_BUILDING = 'world_building',
  THEME = 'theme',
}

/* ========= Core Domain Models ========= */
export interface Scene {
  id: string;
  title: string;
  content: string;
  status: SceneStatus;
  order: number;
  wordCount: number;
  wordCountGoal?: number;
  summary?: string;
  timelineEventIds?: string[];
  characterIds?: string[];
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

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  description?: string;
  arc?: string;
  traits?: string[];
  relationships?: Array<{
    characterId: string;
    relationship: string;
    description?: string;
  }>;
  appearancesInScenes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: TimelineEventType;
  timestamp: number; // Story timestamp, not real time
  chapterIds?: string[];
  sceneIds?: string[];
  characterIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  sceneId?: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  wordsAdded: number;
  productivity: number;
  focusTime: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[];
  characters: Character[];
  timelineEvents: TimelineEvent[];
  writingSessions: WritingSession[];
  metadata: {
    totalWordCount: number;
    targetWordCount?: number;
    genre?: string;
    tags?: string[];
  };
  settings: {
    autoSaveEnabled: boolean;
    autoSaveInterval: number;
    backupEnabled: boolean;
    theme?: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

/* ========= Store State Types ========= */
export interface ChaptersStoreState {
  chapters: Chapter[];
  currentChapterId: string | null;
  currentSceneId: string | null;
  isLoading: boolean;
  error: string | null;
  // Auto-save state
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
}

export interface CharactersStoreState {
  characters: Character[];
  currentCharacterId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TimelineStoreState {
  events: TimelineEvent[];
  currentEventId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SessionsStoreState {
  sessions: WritingSession[];
  currentSession: WritingSession | null;
  isTracking: boolean;
  todayStats: {
    wordsWritten: number;
    timeSpent: number;
    sessionsCount: number;
  };
  isLoading: boolean;
  error: string | null;
}

export interface SettingsStoreState {
  theme: 'light' | 'dark';
  autoSave: {
    enabled: boolean;
    interval: number; // in milliseconds
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  editor: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    showWordCount: boolean;
    showCharacterCount: boolean;
  };
  export: {
    defaultFormat: ExportFormat;
    includeMetadata: boolean;
    compressImages: boolean;
  };
  featureFlags: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
}

/* ========= Action Types for Stores ========= */
export interface StoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/* ========= Export/Import Types ========= */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeTimeline: boolean;
  includeCharacters: boolean;
  chaptersOnly?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ProjectManifest {
  version: number;
  schemaVersion: number;
  projectId: string;
  name: string;
  exportedAt: Date;
  itemCounts: {
    chapters: number;
    scenes: number;
    characters: number;
    timelineEvents: number;
    writingSessions: number;
  };
  integrity: {
    checksum: string;
    algorithm: 'sha256';
  };
}

export interface ProjectBundle {
  manifest: ProjectManifest;
  project: Project;
  assets?: {
    [key: string]: Blob;
  };
}
