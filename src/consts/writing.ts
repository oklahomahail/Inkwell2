export const SCENE_STATUS = {
  DRAFT: 'draft',
  REVISION: 'revision',
  COMPLETE: 'complete',
} as const;

export const CHAPTER_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete',
} as const;

export const EXPORT_FORMAT = {
  PDF: 'pdf',
  DOCX: 'docx',
  EPUB: 'epub',
  TXT: 'txt',
  HTML: 'html',
  MARKDOWN: 'markdown',
} as const;

// Derived types
export type SceneStatus = (typeof SCENE_STATUS)[keyof typeof SCENE_STATUS];
export type ChapterStatus = (typeof CHAPTER_STATUS)[keyof typeof CHAPTER_STATUS];
export type ExportFormat = (typeof EXPORT_FORMAT)[keyof typeof EXPORT_FORMAT];
