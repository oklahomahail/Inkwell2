// src/services/importService.ts
import { error } from 'console';
import { Project, validateProject, migrateProjectToLatest } from '../validation/projectSchema';
import { snapshotService } from './snapshotService';

export interface ImportResult {
  success: boolean;
  project?: Project;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    originalVersion?: string;
    migrated?: boolean;
    wordCount?: number;
    chaptersCount?: number;
  };
}

export interface ImportOptions {
  overwrite?: boolean;
  createBackup?: boolean;
  validateIntegrity?: boolean;
  autoMigrate?: boolean;
}

class ImportService {
  /**
   * Import a project from JSON data
   */
  async importProject(
    jsonData: string | object,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const {
      overwrite = false,
      createBackup = true,
      validateIntegrity = true,
      autoMigrate = true,
    } = options;

    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
      metadata: {},
    };

    try {
      // Parse JSON if string
      let projectData: any;
      if (typeof jsonData === 'string') {
        try {
          projectData = JSON.parse(jsonData);
        } catch (_error) {
          result.errors!.push('Invalid JSON format');
          return result;
        }
      } else {
        projectData = jsonData;
      }

      // Basic structure validation
      if (!projectData || typeof projectData !== 'object') {
        result.errors!.push('Project data must be an object');
        return result;
      }

      if (!projectData.id || !projectData.title) {
        result.errors!.push('Project must have an ID and title');
        return result;
      }

      // Store original version info
      result.metadata!.originalVersion = projectData.version;

      // Check if project already exists
      const existingProject = await this.checkExistingProject(projectData.id);
      if (existingProject && !overwrite) {
        result.errors!.push(
          `Project with ID "${projectData.id}" already exists. Use overwrite option to replace it.`,
        );
        return result;
      }

      // Create backup of existing project if requested
      if (existingProject && createBackup) {
        try {
          await snapshotService.createSnapshot(existingProject, {
            description: 'Backup before import',
            isAutomatic: false,
            tags: ['import-backup'],
          });
          result.warnings!.push('Created backup of existing project');
        } catch (_error) {
          result.warnings!.push('Failed to create backup of existing project');
        }
      }

      // Auto-migrate if needed
      if (autoMigrate) {
        try {
          projectData = migrateProjectToLatest(projectData);
          if (projectData.version !== result.metadata!.originalVersion) {
            result.metadata!.migrated = true;
            result.warnings!.push(
              `Project migrated from version ${result.metadata!.originalVersion} to ${projectData.version}`,
            );
          }
        } catch (error) {
          result.errors!.push(
            `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          return result;
        }
      }

      // Validate project structure
      const validation = validateProject(projectData);
      if (!validation.success) {
        result.errors!.push(`Project validation failed: ${validation.error}`);
        if (!validateIntegrity) {
          result.warnings!.push('Continuing import despite validation errors');
        } else {
          return result;
        }
      }

      const project = validation.success ? validation.data : (projectData as Project);

      // Additional integrity checks
      if (validateIntegrity) {
        const integrityErrors = await this.validateProjectIntegrity(project);
        if (integrityErrors.length > 0) {
          result.errors!.push(...integrityErrors);
          return result;
        }
      }

      // Store metadata
      result.metadata!.wordCount = project.currentWordCount;
      result.metadata!.chaptersCount = project.chapters.length;

      // Save the project using EnhancedStorageService
      try {
        // Use the enhanced storage service which handles your project type
        const { EnhancedStorageService } = await import('./enhancedStorageService');
        await EnhancedStorageService.saveProjectSafe(validateProject as any);

        result.success = true;
        result.project = project;

        // Create import snapshot
        if (createBackup) {
          try {
            await snapshotService.createSnapshot(project, {
              description: 'Imported project snapshot',
              isAutomatic: false,
              tags: ['import'],
            });
          } catch (_error) {
            result.warnings!.push('Failed to create import snapshot');
          }
        }

        console.log(`Project imported successfully: ${project.title} (${project.id})`);
      } catch (_error) {
        result.errors!.push(
          `Failed to save imported project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return result;
      }
    } catch (_error) {
      result.errors!.push(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return result;
  }

  /**
   * Import project from file
   */
  async importFromFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      if (!file.name.endsWith('.json')) {
        return {
          success: false,
          errors: ['Only JSON files are supported'],
        };
      }

      const text = await this.readFileAsText(file);
      return await this.importProject(text, options);
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Validate imported project without saving
   */
  async validateImport(jsonData: string | object): Promise<ImportResult> {
    // Run import validation without saving
    const mockOptions: ImportOptions = {
      overwrite: false,
      createBackup: false,
      validateIntegrity: true,
      autoMigrate: false,
    };

    const result = await this.importProject(jsonData, mockOptions);

    // Remove the project from result since we're just validating
    delete result.project;

    return result;
  }

  /**
   * Get import preview/summary
   */
  async getImportPreview(jsonData: string | object): Promise<{
    isValid: boolean;
    title?: string;
    description?: string;
    wordCount?: number;
    chaptersCount?: number;
    scenesCount?: number;
    charactersCount?: number;
    version?: string;
    createdAt?: string;
    lastModified?: string;
    errors?: string[];
  }> {
    try {
      let projectData: any;
      if (typeof jsonData === 'string') {
        projectData = JSON.parse(jsonData);
      } else {
        projectData = jsonData;
      }

      const validation = validateProject(projectData);

      if (!validation.success) {
        return {
          isValid: false,
          errors: [validation.error],
        };
      }

      const project = validation.data;
      const scenesCount = project.chapters.reduce(
        (total, chapter) => total + chapter.scenes.length,
        0,
      );

      return {
        isValid: true,
        title: project.title,
        description: project.description,
        wordCount: project.currentWordCount,
        chaptersCount: project.chapters.length,
        scenesCount,
        charactersCount: project.characters?.length || 0,
        version: project.version,
        createdAt: project.createdAt,
        lastModified: project.updatedAt,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  // Private methods

  private async checkExistingProject(projectId: string): Promise<Project | null> {
    try {
      // Use the enhanced storage service
      const { EnhancedStorageService } = await import('./enhancedStorageService');
      const project = EnhancedStorageService.loadProject(projectId);
      return project as any; // Type assertion for compatibility
    } catch (_error) {
      return null;
    }
  }

  private async validateProjectIntegrity(project: Project): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Check word count consistency
      let calculatedWordCount = 0;
      for (const chapter of project.chapters) {
        let chapterWordCount = 0;
        for (const scene of chapter.scenes) {
          const sceneWordCount = scene.content
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          if (Math.abs(scene.wordCount - sceneWordCount) > 5) {
            // Allow small variance
            errors.push(
              `Scene "${scene.title}" word count mismatch: expected ${scene.wordCount}, calculated ${sceneWordCount}`,
            );
          }
          chapterWordCount += sceneWordCount;
        }

        if (Math.abs(chapter.wordCount - chapterWordCount) > 10) {
          // Allow small variance
          errors.push(
            `Chapter "${chapter.title}" word count mismatch: expected ${chapter.wordCount}, calculated ${chapterWordCount}`,
          );
        }
        calculatedWordCount += chapterWordCount;
      }

      if (Math.abs(project.currentWordCount - calculatedWordCount) > 20) {
        // Allow small variance
        errors.push(
          `Project word count mismatch: expected ${project.currentWordCount}, calculated ${calculatedWordCount}`,
        );
      }

      // Check for duplicate IDs
      const sceneIds = new Set<string>();
      const chapterIds = new Set<string>();

      for (const chapter of project.chapters) {
        if (chapterIds.has(chapter.id)) {
          errors.push(`Duplicate chapter ID: ${chapter.id}`);
        }
        chapterIds.add(chapter.id);

        for (const scene of chapter.scenes) {
          if (sceneIds.has(scene.id)) {
            errors.push(`Duplicate scene ID: ${scene.id}`);
          }
          sceneIds.add(scene.id);
        }
      }

      // Check timestamp validity
      const now = new Date();
      const projectCreated = new Date(project.createdAt);
      const projectUpdated = new Date(project.updatedAt);

      if (isNaN(projectCreated.getTime())) {
        errors.push('Invalid project creation date');
      }
      if (isNaN(projectUpdated.getTime())) {
        errors.push('Invalid project update date');
      }
      if (projectCreated > now) {
        errors.push('Project creation date is in the future');
      }
      if (projectUpdated < projectCreated) {
        errors.push('Project update date is before creation date');
      }

      // Check scene order consistency
      for (const chapter of project.chapters) {
        const sceneOrders = chapter.scenes.map((scene) => scene.order);
        const sortedOrders = [...sceneOrders].sort((a, b) => a - b);
        if (JSON.stringify(sceneOrders) !== JSON.stringify(sortedOrders)) {
          errors.push(`Chapter "${chapter.title}" has inconsistent scene ordering`);
        }
      }

      // Check character references if beat sheets exist
      if (project.beatSheets && project.characters) {
        const characterIds = new Set(project.characters.map((char) => char.id));
        for (const beatSheet of project.beatSheets) {
          for (const beat of beatSheet.beats) {
            if (beat.linkedScenes) {
              for (const sceneId of beat.linkedScenes) {
                if (!sceneIds.has(sceneId)) {
                  errors.push(`Beat "${beat.title}" references non-existent scene: ${sceneId}`);
                }
              }
            }
          }
        }
      }
    } catch (_error) {
      errors.push(
        `Integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return errors;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  /**
   * Create a round-trip test project for validation
   */
  createTestProject(): Project {
    const now = new Date().toISOString();
    const testProjectId = `test_${Date.now()}`;

    return {
      id: testProjectId,
      title: 'Round-Trip Test Project',
      description: 'This is a test project for validating import/export functionality',
      genre: 'Test',
      targetWordCount: 50000,
      currentWordCount: 150,
      chapters: [
        {
          id: 'chapter_1',
          title: 'Chapter One',
          scenes: [
            {
              id: 'scene_1',
              title: 'Opening Scene',
              content:
                'This is a test scene with exactly fifteen words to validate word counting functionality.',
              wordCount: 15,
              createdAt: now,
              updatedAt: now,
              order: 0,
              status: 'draft',
            },
            {
              id: 'scene_2',
              title: 'Second Scene',
              content:
                'Another test scene to ensure multiple scenes work correctly in the import process.',
              wordCount: 14,
              createdAt: now,
              updatedAt: now,
              order: 1,
              status: 'in-progress',
            },
          ],
          wordCount: 29,
          createdAt: now,
          updatedAt: now,
          order: 0,
          status: 'in-progress',
          summary: 'Test chapter for validation',
        },
        {
          id: 'chapter_2',
          title: 'Chapter Two',
          scenes: [
            {
              id: 'scene_3',
              title: 'Final Scene',
              content:
                'The last test scene to complete our validation project with exactly twelve words here.',
              wordCount: 14,
              createdAt: now,
              updatedAt: now,
              order: 0,
              status: 'complete',
            },
          ],
          wordCount: 14,
          createdAt: now,
          updatedAt: now,
          order: 1,
          status: 'draft',
        },
      ],
      characters: [
        {
          id: 'char_1',
          name: 'Test Character',
          role: 'protagonist',
          description: 'A character created for testing purposes',
          motivation: 'To validate the import/export system',
          createdAt: now,
          updatedAt: now,
        },
      ],
      beatSheets: [
        {
          id: 'beat_sheet_1',
          name: 'Test Beat Sheet',
          template: 'save-the-cat',
          beats: [
            {
              id: 'beat_1',
              title: 'Opening Image',
              description: 'The first beat of our test story',
              order: 0,
              category: 'setup',
              wordTarget: 500,
              completed: true,
              linkedScenes: ['scene_1'],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      settings: {
        theme: 'light',
        fontSize: 16,
        lineHeight: 1.6,
        autoSave: true,
        autoSaveInterval: 30000,
        focusMode: false,
        wordCountGoal: 50000,
        dailyWordGoal: 1000,
        exportFormat: 'markdown',
      },
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    };
  }

  /**
   * Run a complete round-trip test
   */
  async runRoundTripTest(): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    testData?: {
      originalProject: Project;
      exportedData: string;
      importedProject: Project;
      differences: string[];
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('Starting round-trip test...');

      // 1. Create test project
      const originalProject = this.createTestProject();
      console.log('Created test project:', originalProject.title);

      // 2. Export project to JSON
      const exportedData = JSON.stringify(originalProject, null, 2);
      console.log('Exported project to JSON');

      // 3. Import the exported data
      const importResult = await this.importProject(exportedData, {
        overwrite: true,
        createBackup: false,
        validateIntegrity: true,
        autoMigrate: true,
      });

      if (!importResult.success) {
        errors.push('Import failed during round-trip test');
        errors.push(...(importResult.errors || []));
        return { success: false, errors, warnings };
      }

      const importedProject = importResult.project!;
      console.log('Successfully imported project');

      // 4. Compare original and imported projects
      const differences = this.compareProjects(originalProject, importedProject);
      if (differences.length > 0) {
        warnings.push(
          `Found ${differences.length} differences between original and imported project`,
        );
        differences.forEach((diff) => warnings.push(`  - ${diff}`));
      }

      // 5. Validate imported project structure
      const validation = validateProject(importedProject);
      if (!validation.success) {
        errors.push(`Imported project failed validation: ${validation.error}`);
      }

      // 6. Check word counts
      if (originalProject.currentWordCount !== importedProject.currentWordCount) {
        errors.push(
          `Word count mismatch: original ${originalProject.currentWordCount}, imported ${importedProject.currentWordCount}`,
        );
      }

      // 7. Verify data integrity
      const integrityErrors = await this.validateProjectIntegrity(importedProject);
      if (integrityErrors.length > 0) {
        errors.push('Imported project failed integrity check');
        errors.push(...integrityErrors);
      }

      console.log('Round-trip test completed');

      return {
        success: errors.length === 0,
        errors,
        warnings,
        testData: {
          originalProject,
          exportedData,
          importedProject,
          differences,
        },
      };
    } catch (_error) {
      const errorMessage = `Round-trip test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(errorMessage, error);

      return { success: false, errors, warnings };
    }
  }

  /**
   * Compare two projects and return differences
   */
  private compareProjects(original: Project, imported: Project): string[] {
    const differences: string[] = [];

    // Compare basic properties
    if (original.id !== imported.id) differences.push('Project ID differs');
    if (original.title !== imported.title) differences.push('Project title differs');
    if (original.currentWordCount !== imported.currentWordCount)
      differences.push('Word count differs');
    if (original.chapters.length !== imported.chapters.length)
      differences.push('Chapter count differs');

    // Compare chapters
    for (let i = 0; i < Math.min(original.chapters.length, imported.chapters.length); i++) {
      const origChapter = original.chapters[i];
      const impChapter = imported.chapters[i];

      if (origChapter && impChapter) {
        if (origChapter.id !== impChapter.id) differences.push(`Chapter ${i} ID differs`);
        if (origChapter.title !== impChapter.title) differences.push(`Chapter ${i} title differs`);
        if (origChapter.scenes.length !== impChapter.scenes.length)
          differences.push(`Chapter ${i} scene count differs`);

        // Compare scenes
        for (let j = 0; j < Math.min(origChapter.scenes.length, impChapter.scenes.length); j++) {
          const origScene = origChapter.scenes[j];
          const impScene = impChapter.scenes[j];

          if (origScene && impScene) {
            if (origScene.id !== impScene.id)
              differences.push(`Chapter ${i}, Scene ${j} ID differs`);
            if (origScene.content !== impScene.content)
              differences.push(`Chapter ${i}, Scene ${j} content differs`);
            if (origScene.wordCount !== impScene.wordCount)
              differences.push(`Chapter ${i}, Scene ${j} word count differs`);
          }
        }
      }
    }

    // Compare characters
    if ((original.characters?.length || 0) !== (imported.characters?.length || 0)) {
      differences.push('Character count differs');
    }

    // Compare beat sheets
    if ((original.beatSheets?.length || 0) !== (imported.beatSheets?.length || 0)) {
      differences.push('Beat sheet count differs');
    }

    return differences;
  }
}

// Export singleton instance
export const importService = new ImportService();
export default importService;

// Utility function for running tests in development
export const runImportExportTest = async (): Promise<void> => {
  if (import.meta.env.DEV) {
    console.log('Running import/export round-trip test...');
    const result = await importService.runRoundTripTest();

    if (result.success) {
      console.log('✅ Round-trip test passed!');
      if (result.warnings.length > 0) {
        console.warn('⚠️ Warnings:', result.warnings);
      }
    } else {
      console.error('❌ Round-trip test failed!');
      console.error('Errors:', result.errors);
    }
  }
};
