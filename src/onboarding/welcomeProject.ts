/**
 * Welcome Project Management
 *
 * Handles creation, lifecycle, and cleanup of the one-time welcome project
 * for first-time users. Features:
 * - Creates only when projects.length === 0 and !localStorage.hasSeenTour
 * - Includes 3 demo chapters with instructional content
 * - Idempotent creation with pointer reconciliation
 * - Clean deletion on skip or tour completion
 * - Offline-resilient (uses IndexedDB via chaptersService)
 * - PII-free telemetry
 */

import { track } from '@/services/telemetry';
import type { EnhancedProject } from '@/types/project';
import type { CreateChapterInput } from '@/types/writing';

import { seedChapters, validateChapterData } from './content/welcomeChapters';

// Lazy imports to avoid circular dependencies
let chaptersService: any = null;
let storageService: any = null;

async function getChaptersService() {
  if (!chaptersService) {
    const module = await import('@/services/chaptersService');
    chaptersService = module.Chapters;
  }
  return chaptersService;
}

async function getStorageService() {
  if (!storageService) {
    const module = await import('@/services/storageService');
    storageService = module.EnhancedStorageService;
  }
  return storageService;
}

// ============================================
// Configuration
// ============================================

const HAS_SEEN_TOUR_KEY = 'inkwell_hasSeenTour';
const WELCOME_PROJECT_ID_KEY = 'inkwell_welcomeProjectId';
const IS_ENABLED =
  import.meta.env.VITE_ENABLE_WELCOME_PROJECT !== 'false' &&
  import.meta.env.VITE_ENABLE_WELCOME_PROJECT !== false;

// ============================================
// Public API
// ============================================

/**
 * Check if welcome project should be created
 * Only creates when:
 * 1. Feature flag is enabled
 * 2. User hasn't seen the tour
 * 3. No projects exist
 */
export async function shouldCreateWelcomeProject(): Promise<boolean> {
  if (!IS_ENABLED) {
    return false;
  }

  try {
    // Check if user has already seen the tour
    const seen = localStorage.getItem(HAS_SEEN_TOUR_KEY) === 'true';
    if (seen) {
      return false;
    }

    // Check if any projects exist
    const storage = await getStorageService();
    const projects = storage.loadAllProjects();
    return projects.length === 0;
  } catch (error) {
    console.error('[WelcomeProject] Error checking creation eligibility:', error);
    return false;
  }
}

/**
 * Ensure welcome project exists (idempotent)
 * Returns the project ID if created/exists, null otherwise
 *
 * @param force - If true, bypasses the "no projects exist" check, allowing tour creation even with existing projects
 */
export async function ensureWelcomeProject(force = false): Promise<string | null> {
  if (!force && !(await shouldCreateWelcomeProject())) {
    return null;
  }

  // If force mode, still check if feature is enabled
  if (force && !IS_ENABLED) {
    return null;
  }

  try {
    // Check for existing pointer (idempotency)
    const existingId = localStorage.getItem(WELCOME_PROJECT_ID_KEY);
    if (existingId) {
      const storage = await getStorageService();
      const existing = storage.loadProject(existingId);
      if (existing) {
        return existingId;
      }
      // Stale pointer, clear it
      localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
    }

    // Create the welcome project
    const projectId = `proj_welcome_${Date.now()}`;
    const now = Date.now();

    const welcomeProject: EnhancedProject = {
      id: projectId,
      name: 'Welcome to Inkwell',
      description:
        "A guided introduction to Inkwell's features. Delete this project when you're ready to start your own.",
      genre: 'Tutorial',
      createdAt: now,
      updatedAt: now,
      currentWordCount: 0,
      targetWordCount: undefined,
      chapters: [],
      characters: [],
      plotNotes: [],
      worldBuilding: [],
      sessions: [],
      recentContent: '',
      claudeContext: {
        includeCharacters: true,
        includePlotNotes: true,
        includeWorldBuilding: true,
        maxCharacters: 5,
        maxPlotNotes: 5,
        contextLength: 'medium',
      },
    };

    // Save project to storage
    const storage = await getStorageService();
    storage.saveProject(welcomeProject);

    // Create demo chapters
    const chapters = seedChapters();
    const service = await getChaptersService();

    for (const chapterData of chapters) {
      // Validate before creating
      if (!validateChapterData(chapterData)) {
        console.error('[WelcomeProject] Invalid chapter data:', chapterData);
        continue;
      }

      const input: CreateChapterInput = {
        projectId,
        title: chapterData.title,
        summary: chapterData.summary,
        content: chapterData.content,
        index: chapterData.order - 1, // Convert 1-based to 0-based
        status: 'draft',
      };

      await service.create(input);
    }

    // Store pointer for cleanup
    localStorage.setItem(WELCOME_PROJECT_ID_KEY, projectId);

    // Emit telemetry (PII-free)
    track('onboarding.welcome.created', { sample: 1 });

    return projectId;
  } catch (error) {
    console.error('[WelcomeProject] Error creating welcome project:', error);
    // Clean up on failure
    const projectId = localStorage.getItem(WELCOME_PROJECT_ID_KEY);
    if (projectId) {
      localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
    }
    return null;
  }
}

/**
 * Delete the welcome project (idempotent)
 * Safe to call even if project doesn't exist
 */
export async function deleteWelcomeProject(): Promise<void> {
  const projectId = localStorage.getItem(WELCOME_PROJECT_ID_KEY);
  if (!projectId) {
    return;
  }

  try {
    const storage = await getStorageService();
    const project = storage.loadProject(projectId);

    if (project) {
      // Delete all chapters first
      const service = await getChaptersService();
      const chapters = await service.list(projectId);

      for (const chapter of chapters) {
        await service.delete(chapter.id);
      }

      // Delete the project
      const allProjects = storage.loadAllProjects();
      const filtered = allProjects.filter((p: EnhancedProject) => p.id !== projectId);
      localStorage.setItem('inkwell_enhanced_projects', JSON.stringify(filtered));
    }

    // Clear pointer
    localStorage.removeItem(WELCOME_PROJECT_ID_KEY);

    // Emit telemetry
    track('onboarding.welcome.deleted', { sample: 1 });
  } catch (error) {
    console.error('[WelcomeProject] Error deleting welcome project:', error);
    // Clear pointer even on error to prevent stale state
    localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
  }
}

/**
 * Mark tour as seen (prevents re-creation)
 */
export function markTourSeen(): void {
  localStorage.setItem(HAS_SEEN_TOUR_KEY, 'true');
  track('onboarding.tour.seen', { sample: 1 });
}

/**
 * Check if tour has been seen
 */
export function hasTourBeenSeen(): boolean {
  return localStorage.getItem(HAS_SEEN_TOUR_KEY) === 'true';
}

/**
 * Skip tutorial - called when user clicks "Skip Tutorial"
 * Deletes welcome project and marks tour as seen
 */
export async function skipTutorial(): Promise<void> {
  try {
    await deleteWelcomeProject();
    markTourSeen();
    track('onboarding.welcome.skipped', { sample: 1 });
  } catch (error) {
    console.error('[WelcomeProject] Error skipping tutorial:', error);
    throw error;
  }
}

/**
 * Complete welcome flow - called on tour completion
 * Deletes welcome project and marks tour as seen
 */
export async function completeWelcomeFlow(): Promise<void> {
  try {
    await deleteWelcomeProject();
    markTourSeen();
    track('onboarding.welcome.completed', { sample: 1 });
  } catch (error) {
    console.error('[WelcomeProject] Error completing welcome flow:', error);
    throw error;
  }
}

/**
 * Reconcile welcome project pointer
 * Clears stale pointers where project no longer exists
 * Safe to call during boot or recovery
 */
export async function reconcileWelcomeProjectPointer(): Promise<void> {
  const projectId = localStorage.getItem(WELCOME_PROJECT_ID_KEY);
  if (!projectId) {
    return;
  }

  try {
    const storage = await getStorageService();
    const project = storage.loadProject(projectId);

    if (!project) {
      // Pointer is stale, clear it
      localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
      // Log for debugging if needed
    }
  } catch (error) {
    console.error('[WelcomeProject] Error reconciling pointer:', error);
    // Clear pointer on error to be safe
    localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
  }
}

/**
 * Get the welcome project ID if it exists
 */
export function getWelcomeProjectId(): string | null {
  return localStorage.getItem(WELCOME_PROJECT_ID_KEY);
}

/**
 * Check if a project is the welcome project
 */
export function isWelcomeProject(projectId: string): boolean {
  return projectId === localStorage.getItem(WELCOME_PROJECT_ID_KEY);
}

/**
 * Check if welcome project feature is enabled
 */
export function isWelcomeProjectEnabled(): boolean {
  return IS_ENABLED;
}

// ============================================
// Testing Utilities (exported for tests only)
// ============================================

/**
 * Reset all welcome project state (for testing)
 * @internal
 */
export function __resetWelcomeState(): void {
  localStorage.removeItem(HAS_SEEN_TOUR_KEY);
  localStorage.removeItem(WELCOME_PROJECT_ID_KEY);
}

/**
 * Get configuration keys (for testing)
 * @internal
 */
export const __testKeys = {
  HAS_SEEN_TOUR_KEY,
  WELCOME_PROJECT_ID_KEY,
  IS_ENABLED,
};
