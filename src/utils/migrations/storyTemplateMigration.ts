// src/utils/migrations/storyTemplateMigration.ts
/**
 * Migration utility to add story template fields to existing projects
 * Version: 1.4.0
 */

import type { Project } from '@/types/project';
import { STORY_TEMPLATES } from '@/types/storyTemplates';
import devLog from '@/utils/devLog';

const MIGRATION_VERSION_KEY = 'inkwell_template_migration_version';
const CURRENT_MIGRATION_VERSION = '1.4.0';
const DEFAULT_TEMPLATE_ID = 'three-act'; // Simple, beginner-friendly default

/**
 * Check if the story template migration has been run
 */
export function hasRunTemplateMigration(): boolean {
  try {
    const version = localStorage.getItem(MIGRATION_VERSION_KEY);
    return version === CURRENT_MIGRATION_VERSION;
  } catch (error) {
    devLog.warn('[Migration] Failed to check migration status:', error);
    return false;
  }
}

/**
 * Mark the story template migration as complete
 */
export function markTemplateMigrationComplete(): void {
  try {
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION);
    devLog.log('[Migration] Story template migration marked as complete');
  } catch (error) {
    devLog.warn('[Migration] Failed to mark migration complete:', error);
  }
}

/**
 * Migrate a single project to include story template fields
 * @param project - The project to migrate
 * @returns The migrated project with template fields added
 */
export function migrateProjectToTemplate(project: Project): Project {
  // Already has template ID, skip migration
  if (project.storyTemplateId !== undefined) {
    return project;
  }

  const defaultTemplate = STORY_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID);
  if (!defaultTemplate) {
    devLog.warn(
      '[Migration] Default template not found, skipping migration for project:',
      project.id,
    );
    return project;
  }

  // Initialize beat mapping with all beats unmapped
  const beatToChapter: Record<string, string | null> = {};
  defaultTemplate.beats.forEach((beat) => {
    beatToChapter[beat.id] = null;
  });

  // Auto-distribute beats across existing chapters if any exist
  if (project.chapters && project.chapters.length > 0) {
    const sortedChapters = [...project.chapters].sort((a, b) => a.order - b.order);
    defaultTemplate.beats.forEach((beat, index) => {
      const chapterIndex = Math.floor(
        (index / defaultTemplate.beats.length) * sortedChapters.length,
      );
      beatToChapter[beat.id] = sortedChapters[chapterIndex]?.id ?? null;
    });
    devLog.log(
      `[Migration] Auto-distributed ${defaultTemplate.beats.length} beats across ${sortedChapters.length} chapters for project: ${project.name}`,
    );
  }

  return {
    ...project,
    storyTemplateId: null, // Don't force a template, let user choose
    storyTemplateVersion: '1.0.0',
    beatMapping: undefined, // Only set when user selects a template
  };
}

/**
 * Run the story template migration on all projects
 * @param projects - Array of projects to migrate
 * @returns Migrated projects array
 */
export function runStoryTemplateMigration(projects: Project[]): Project[] {
  if (hasRunTemplateMigration()) {
    devLog.log('[Migration] Story template migration already completed, skipping');
    return projects;
  }

  devLog.log('[Migration] Running story template migration on', projects.length, 'projects');

  const migrated = projects.map((project) => {
    // Skip demo/welcome projects
    if (project.isDemo) {
      return project;
    }
    return migrateProjectToTemplate(project);
  });

  const migratedCount = migrated.filter((p) => p.storyTemplateId !== undefined).length;
  devLog.log(`[Migration] Migrated ${migratedCount} projects to include template fields`);

  markTemplateMigrationComplete();

  return migrated;
}

/**
 * Reset migration status (for testing purposes)
 */
export function resetMigrationStatus(): void {
  try {
    localStorage.removeItem(MIGRATION_VERSION_KEY);
    devLog.log('[Migration] Reset migration status');
  } catch (error) {
    devLog.warn('[Migration] Failed to reset migration status:', error);
  }
}
