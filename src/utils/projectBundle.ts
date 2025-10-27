// Project bundle system for .inkwell archives
// Handles creation, validation, and import of complete project bundles

import JSZip from 'jszip';

import { ProjectBundle, ProjectManifest } from '../domain/types';

import { createProjectBackup, validateProjectBundle, restoreProjectBackup } from './backup';
import { storage } from './storage';

/* ========= Types ========= */
export interface InkwellArchive {
  filename: string;
  blob: Blob;
  manifest: ProjectManifest;
}

export interface BundleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canRecover: boolean;
  repairOptions?: string[];
}

/* ========= Archive Creation ========= */

/**
 * Create a complete .inkwell archive for a project
 */
export async function createInkwellArchive(
  projectId: string,
  projectName?: string,
): Promise<InkwellArchive> {
  try {
    // Create project backup bundle
    const bundle = await createProjectBackup(projectId);

    // Create ZIP archive
    const zip = new JSZip();

    // Add manifest
    zip.file('manifest.json', JSON.stringify(bundle.manifest, null, 2));

    // Add project data
    zip.file('project.json', JSON.stringify(bundle.project, null, 2));

    // Add metadata file with human-readable info
    const metadata = {
      exportedBy: 'Inkwell',
      exportedAt: new Date().toISOString(),
      version: bundle.manifest.version,
      schemaVersion: bundle.manifest.schemaVersion,
      projectName: bundle.project.name,
      summary: {
        chapters: bundle.manifest.itemCounts.chapters,
        scenes: bundle.manifest.itemCounts.scenes,
        characters: bundle.manifest.itemCounts.characters,
        totalWords: bundle.project.metadata.totalWordCount,
      },
      instructions: [
        'This is an Inkwell project archive.',
        "To restore: Import this file using Inkwell's project import feature.",
        'The manifest.json contains metadata and integrity information.',
        'The project.json contains all project data including chapters, characters, and timeline.',
      ],
    };

    zip.file('README.json', JSON.stringify(metadata, null, 2));

    // Add assets if they exist
    if (bundle.assets) {
      const assetsFolder = zip.folder('assets');
      for (const [filename, blob] of Object.entries(bundle.assets)) {
        assetsFolder?.file(filename, blob as Blob);
      }
    }

    // Generate the archive
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      comment: `Inkwell project: ${bundle.project.name} - Exported ${new Date().toLocaleDateString()}`,
    });

    const filename = `${sanitizeFilename(projectName ?? bundle.project.name ?? 'untitled')}-${new Date().toISOString().split('T')[0]}.inkwell`;

    return {
      filename,
      blob,
      manifest: bundle.manifest,
    };
  } catch (error: any) {
    throw new Error(`Failed to create Inkwell archive: ${error.message}`);
  }
}

/**
 * Extract and validate an .inkwell archive
 */
export async function extractInkwellArchive(file: File | Blob): Promise<{
  bundle: ProjectBundle;
  validation: BundleValidationResult;
}> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Extract manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      throw new Error('Archive missing manifest.json - not a valid Inkwell archive');
    }

    const manifestText = await manifestFile.async('text');
    const manifest = JSON.parse(manifestText) as ProjectManifest;

    // Extract project data
    const projectFile = zip.file('project.json');
    if (!projectFile) {
      throw new Error('Archive missing project.json - corrupted archive');
    }

    const projectText = await projectFile.async('text');
    const project = JSON.parse(projectText);

    // Extract assets if they exist
    let assets: Record<string, Blob> = {};
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      const assetPromises: Promise<void>[] = [];
      assetsFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          assetPromises.push(
            file.async('blob').then((blob) => {
              assets[relativePath] = blob;
            }),
          );
        }
      });
      await Promise.all(assetPromises);
    }

    // Create bundle
    const bundle: ProjectBundle = {
      manifest,
      project,
      assets: Object.keys(assets).length > 0 ? assets : undefined,
    };

    // Validate the bundle
    const validation = await validateInkwellBundle(bundle);

    return { bundle, validation };
  } catch (error: any) {
    const validation: BundleValidationResult = {
      isValid: false,
      errors: [`Failed to extract archive: ${error.message}`],
      warnings: [],
      canRecover: false,
    };

    // Try to provide a mock bundle for error handling
    const bundle: ProjectBundle = {
      manifest: {} as ProjectManifest,
      project: {} as any,
    };

    return { bundle, validation };
  }
}

/**
 * Import an .inkwell archive into the application
 */
export async function importInkwellArchive(
  file: File | Blob,
  options: {
    overwrite?: boolean;
    repairData?: boolean;
    newProjectId?: string;
  } = {},
): Promise<{
  projectId: string;
  validation: BundleValidationResult;
  repaired: boolean;
}> {
  const { bundle, validation } = await extractInkwellArchive(file);

  if (!validation.isValid && !validation.canRecover) {
    throw new Error(`Cannot import archive: ${validation.errors.join(', ')}`);
  }

  // Attempt to restore the project
  const projectId = await restoreProjectBackup(bundle, {
    overwrite: options.overwrite,
    repairData: options.repairData || validation.canRecover,
    newProjectId: options.newProjectId,
  });

  return {
    projectId,
    validation,
    repaired: options.repairData || validation.canRecover,
  };
}

/**
 * Validate an Inkwell bundle with enhanced checks
 */
export async function validateInkwellBundle(
  bundle: ProjectBundle,
): Promise<BundleValidationResult> {
  // Start with basic validation
  const basicValidation = await validateProjectBundle(bundle);

  // Add Inkwell-specific validations
  const errors = [...basicValidation.errors];
  const warnings = [...basicValidation.warnings];
  let canRecover = basicValidation.canRecover;
  const repairOptions: string[] = [];

  // Check for Inkwell-specific requirements
  if (!bundle.manifest.name) {
    warnings.push('Project name is missing');
    repairOptions.push('Generate default project name');
  }

  // Validate chapter/scene structure
  if (bundle.project.chapters) {
    const chaptersWithoutScenes = bundle.project.chapters.filter(
      (ch) => !ch.scenes || ch.scenes.length === 0,
    );
    if (chaptersWithoutScenes.length > 0) {
      warnings.push(`${chaptersWithoutScenes.length} chapters have no scenes`);
      repairOptions.push('Create placeholder scenes for empty chapters');
    }

    // Check for duplicate IDs
    const chapterIds = bundle.project.chapters.map((ch) => ch.id);
    const duplicateChapterIds = chapterIds.filter((id, index) => chapterIds.indexOf(id) !== index);
    if (duplicateChapterIds.length > 0) {
      errors.push('Duplicate chapter IDs found');
      canRecover = true;
      repairOptions.push('Generate new unique IDs for duplicates');
    }
  }

  // Check total word count consistency
  if (bundle.project.metadata && bundle.project.chapters) {
    const calculatedWordCount = bundle.project.chapters.reduce(
      (total, ch) => total + (ch.totalWordCount || 0),
      0,
    );

    if (Math.abs(calculatedWordCount - bundle.project.metadata.totalWordCount) > 10) {
      warnings.push('Total word count mismatch detected');
      repairOptions.push('Recalculate word counts from content');
    }
  }

  // Check for missing timestamps
  const hasTimestampIssues = bundle.project.chapters?.some(
    (ch) =>
      !ch.createdAt || !ch.updatedAt || ch.scenes?.some((sc) => !sc.createdAt || !sc.updatedAt),
  );

  if (hasTimestampIssues) {
    warnings.push('Some items are missing creation/update timestamps');
    repairOptions.push('Add current timestamp to items missing dates');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canRecover,
    repairOptions: repairOptions.length > 0 ? repairOptions : undefined,
  };
}

/* ========= Utility Functions ========= */

/**
 * Sanitize filename for cross-platform compatibility
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Remove multiple consecutive dashes
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 100) || // Limit length
    'untitled'
  ); // Fallback if empty
}

/**
 * Download an Inkwell archive
 */
export function downloadInkwellArchive(archive: InkwellArchive): void {
  const url = URL.createObjectURL(archive.blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = archive.filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Get archive information without fully extracting
 */
export async function inspectInkwellArchive(file: File | Blob): Promise<{
  isValid: boolean;
  projectName?: string;
  exportedAt?: Date;
  itemCounts?: {
    chapters: number;
    scenes: number;
    characters: number;
    wordCount: number;
  };
  schemaVersion?: number;
  error?: string;
}> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Try to read just the manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      return { isValid: false, error: 'Not a valid Inkwell archive (missing manifest)' };
    }

    const manifestText = await manifestFile.async('text');
    const manifest = JSON.parse(manifestText) as ProjectManifest;

    return {
      isValid: true,
      projectName: manifest.name,
      exportedAt: new Date(manifest.exportedAt),
      itemCounts: {
        chapters: manifest.itemCounts.chapters,
        scenes: manifest.itemCounts.scenes,
        characters: manifest.itemCounts.characters,
        wordCount: 0, // Would need to extract project.json to get this
      },
      schemaVersion: manifest.schemaVersion,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Failed to inspect archive: ${error.message}`,
    };
  }
}

/* ========= Project Discovery ========= */

/**
 * List all projects available in storage
 */
export async function listAvailableProjects(): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    lastModified: Date;
    wordCount: number;
    chapterCount: number;
  }>
> {
  try {
    const keys = await storage.list('project:');
    const projectIds = new Set<string>();

    // Extract unique project IDs
    keys.forEach((key) => {
      const parts = key.split(':');
      if (parts.length >= 2 && parts[1]) {
        projectIds.add(parts[1]);
      }
    });

    const projects = [];

    for (const projectId of projectIds) {
      try {
        const meta = (await storage.get(`project:${projectId}:meta`)) as Record<string, any> | null;
        const chapters = (await storage.get(`project:${projectId}:chapters`)) || [];
        const chapterArray = Array.isArray(chapters) ? chapters : [];

        if (meta && meta.name) {
          projects.push({
            id: projectId,
            name: String(meta.name),
            description: meta.description ? String(meta.description) : undefined,
            lastModified: new Date(meta.updatedAt || meta.createdAt || Date.now()),
            wordCount: chapterArray.reduce(
              (total: number, ch: any) => total + (ch?.totalWordCount ?? 0),
              0,
            ),
            chapterCount: chapterArray.length,
          });
        }
      } catch (error) {
        console.warn(`Failed to load metadata for project ${projectId}:`, error);
      }
    }

    return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}
