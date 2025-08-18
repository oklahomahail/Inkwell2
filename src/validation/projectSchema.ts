// src/validation/projectSchema.ts
import { z } from 'zod';

// Scene schema
const SceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  wordCount: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  order: z.number().min(0),
  status: z.enum(['draft', 'in-progress', 'complete', 'needs-revision']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Chapter schema
const ChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  scenes: z.array(SceneSchema),
  wordCount: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  order: z.number().min(0),
  status: z.enum(['draft', 'in-progress', 'complete', 'needs-revision']).optional(),
  summary: z.string().optional(),
  goals: z.array(z.string()).optional(),
});

// Character schema
const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']),
  description: z.string().optional(),
  motivation: z.string().optional(),
  arc: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Beat sheet schema
const BeatSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().min(0),
  category: z.string(),
  wordTarget: z.number().min(0).optional(),
  completed: z.boolean().default(false),
  linkedScenes: z.array(z.string()).optional(),
});

const BeatSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  template: z.enum(['save-the-cat', 'three-act', 'heros-journey', 'custom']),
  beats: z.array(BeatSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Project settings schema
const ProjectSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  fontSize: z.number().min(12).max(24).default(16),
  lineHeight: z.number().min(1).max(3).default(1.6),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().min(1000).default(30000), // ms
  focusMode: z.boolean().default(false),
  wordCountGoal: z.number().min(0).optional(),
  dailyWordGoal: z.number().min(0).optional(),
  exportFormat: z.enum(['markdown', 'docx', 'pdf']).default('markdown'),
});

// Main project schema
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  genre: z.string().optional(),
  targetWordCount: z.number().min(0).optional(),
  currentWordCount: z.number().min(0).default(0),
  chapters: z.array(ChapterSchema),
  characters: z.array(CharacterSchema).optional(),
  beatSheets: z.array(BeatSheetSchema).optional(),
  settings: ProjectSettingsSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.string().default('1.0.0'),
  lastBackup: z.string().datetime().optional(),
});

// Snapshot metadata schema
export const SnapshotMetadataSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  timestamp: z.string().datetime(),
  version: z.string(),
  description: z.string().optional(),
  wordCount: z.number().min(0),
  chaptersCount: z.number().min(0),
  size: z.number().min(0), // bytes
  checksum: z.string().optional(),
  isAutomatic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

// Export schemas
export type Project = z.infer<typeof ProjectSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type BeatSheet = z.infer<typeof BeatSheetSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;

// Validation helpers
export const validateProject = (
  data: unknown,
): { success: true; data: Project } | { success: false; error: string } => {
  try {
    const result = ProjectSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMsg = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    return {
      success: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

export const validateSnapshot = (
  data: unknown,
): { success: true; data: SnapshotMetadata } | { success: false; error: string } => {
  try {
    const result = SnapshotMetadataSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMsg = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    return {
      success: false,
      error: `Snapshot validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Migration helpers
export const migrateProjectToLatest = (data: any): Project => {
  // Handle legacy projects without version
  if (!data.version) {
    data.version = '1.0.0';
  }

  // Ensure required fields exist
  if (!data.currentWordCount) {
    data.currentWordCount =
      data.chapters?.reduce((total: number, chapter: any) => total + (chapter.wordCount || 0), 0) ||
      0;
  }

  // Ensure timestamps
  const now = new Date().toISOString();
  if (!data.createdAt) data.createdAt = now;
  if (!data.updatedAt) data.updatedAt = now;

  // Ensure chapters have proper structure
  if (data.chapters) {
    data.chapters = data.chapters.map((chapter: any) => ({
      ...chapter,
      createdAt: chapter.createdAt || now,
      updatedAt: chapter.updatedAt || now,
      wordCount:
        chapter.wordCount ||
        chapter.scenes?.reduce((total: number, scene: any) => total + (scene.wordCount || 0), 0) ||
        0,
      scenes:
        chapter.scenes?.map((scene: any) => ({
          ...scene,
          createdAt: scene.createdAt || now,
          updatedAt: scene.updatedAt || now,
          wordCount: scene.wordCount || scene.content?.split(/\s+/).length || 0,
        })) || [],
    }));
  }

  return data as Project;
};
