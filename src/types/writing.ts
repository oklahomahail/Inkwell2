/**
 * Writing domain types
 * - Flexible enough to tolerate existing usage across services/components
 * - Strong where it matters (ids, nesting), loose for optional props
 */

/** Export formats used by ExportDialog and downstream utilities */
export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx' | (string & {});

/** Some code references ExportFormat without importing. Make it safe globally. */
declare global {
  var __inkwell_has_global_exportformat__: true | undefined;
  // Only define once
  // @ts-ignore
  if (!globalThis.__inkwell_has_global_exportformat__) {
    type _ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx' | (string & {});
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

// Import and re-export canonical Chapter and Character types from project.ts
// Moved after BaseEntity to avoid circular reference issues
import type { Chapter as ProjectChapter, Character as ProjectCharacter } from './project';
export type Chapter = ProjectChapter;
export type Character = ProjectCharacter;

//
// ⚠️ DEPRECATED: Scene-based architecture
// Scenes have been removed in favor of chapter-only content
// Keep these types temporarily for backwards compatibility during migration
//

/** @deprecated Use Chapter.content instead of nested scenes */
export type SceneStatus = 'draft' | 'in_progress' | 'final' | 'archived' | (string & {});

/** @deprecated Scene-based writing is deprecated - use chapters directly */
export interface Scene extends BaseEntity {
  title: string;
  content?: string;
  order?: number;
  status?: SceneStatus;
  summary?: string;
  pov?: string;
  location?: string;
  characterIds?: string[];
  tags?: string[];
  eventType?: string;
  importance?: 'minor' | 'major' | (string & {});
  [key: string]: any;
  // Kept for migration period only
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
  type?: string; // section type (chapter, prologue, epilogue, etc.) for section support
  client_rev?: number; // Phase 3: cloud sync revision number
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
  type?: string; // Section type (v1.3.0+)
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
  type?: string; // Section type (v1.3.0+)
  index?: number; // Section order (v1.3.0+)
  wordCount?: number; // Word count (v1.3.0+)
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
