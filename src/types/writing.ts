/**
 * Writing domain types
 * - Flexible enough to tolerate existing usage across services/components
 * - Strong where it matters (ids, nesting), loose for optional props
 */

export type SceneStatus = 'draft' | 'in_progress' | 'final' | 'archived' | (string & {});
export type ChapterStatus = 'draft' | 'revising' | 'final' | 'archived' | (string & {});

/** Export formats used by ExportDialog and downstream utilities */
export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx' | (string & {});

/** Some code references ExportFormat without importing. Make it safe globally. */
declare global {
  var __inkwell_has_global_exportformat__: true | undefined;
  // Only define once
  // @ts-ignore
  if (!globalThis.__inkwell_has_global_exportformat__) {
    type ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx' | (string & {});
    // @ts-ignore
    globalThis.__inkwell_has_global_exportformat__ = true;
  }
}

/** Common identity & audit fields */
export interface BaseEntity {
  id: string;
  createdAt?: Date | number | string;
  updatedAt?: Date | number | string;
}

/** Character (needed by timelineConflictService and tests) */
export interface Character extends BaseEntity {
  name: string;
  description?: string;
  traits?: Record<string, unknown>;
  tags?: string[];
  [key: string]: any;
}

/** Scene is the atomic writing unit */
export interface Scene extends BaseEntity {
  title: string;
  content?: string;
  /** numeric order inside its chapter (1-based or 0-based depending on caller) */
  order?: number;
  status?: SceneStatus;
  /** optional metadata used around the app */
  summary?: string;
  pov?: string;
  location?: string;
  characterIds?: string[];
  tags?: string[];
  eventType?: string; // e.g., 'plot', 'character', etc.
  importance?: 'minor' | 'major' | (string & {});
  [key: string]: any; // keep permissive for legacy usage
}

/** Chapter groups scenes */
export interface Chapter extends BaseEntity {
  title: string;
  scenes: Scene[];
  order?: number;
  status?: ChapterStatus;
  summary?: string;
  notes?: string;
  [key: string]: any;
}

// ========================================
// Enhanced Chapter Management
// ========================================

/**
 * Chapter metadata - lightweight for lists and analytics
 * Stored separately from content for performance
 */
export interface ChapterMeta {
  id: string;
  projectId: string;
  title: string;
  index: number; // display order (0-based)
  summary?: string;
  status: 'draft' | 'revising' | 'final';
  wordCount: number; // denormalized for fast UI
  sceneCount?: number; // optional: number of scenes
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Chapter document - heavy content stored separately
 * Enables fast lists without loading all content
 */
export interface ChapterDoc {
  id: string; // same as ChapterMeta.id
  content: string; // editor-serialized content (HTML/markdown/JSON)
  version: number; // for optimistic locking
  scenes?: Scene[]; // optional embedded scenes
}

/**
 * Full chapter with both meta and content
 * Used when editing/displaying a chapter
 */
export interface FullChapter extends ChapterMeta {
  content: string;
  version: number;
  scenes?: Scene[];
}

/**
 * Chapter creation input
 */
export interface CreateChapterInput {
  id?: string; // optional: if not provided, service will generate
  projectId: string;
  title?: string;
  summary?: string;
  content?: string;
  index?: number; // if not provided, appends to end
  status?: 'draft' | 'revising' | 'final';
}

/**
 * Chapter update input
 */
export interface UpdateChapterInput {
  id: string;
  title?: string;
  summary?: string;
  status?: 'draft' | 'revising' | 'final';
  tags?: string[];
}

/** Helpful aliases used around services */
export type WritingChapter = Chapter;
export type WritingScene = Scene;

/** Light-weight project shape some services expect when pairing with writing */
export interface WritingProject extends BaseEntity {
  name: string;
  description?: string;
  chapters?: Chapter[];
  characters?: Character[];
  currentWordCount?: number;
  sessions?: Array<{ startTime: number | string; endTime?: number | string }>;
  [key: string]: any;
}

/** Export request/response helpers */
export interface ExportRequest {
  projectId: string;
  format: ExportFormat;
  chapters?: Chapter[];
  scenes?: Scene[];
  options?: Record<string, unknown>;
}

export interface ExportResult {
  format: ExportFormat;
  blob?: Blob;
  content?: string; // for text-like exports
  filename?: string;
}
