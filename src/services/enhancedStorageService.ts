// @ts-nocheck
// src/services/enhancedStorageService.ts
import devLog from "src/utils/devLogger";

import { EnhancedProject } from '@/types/project';

import { quotaAwareStorage } from '../utils/quotaAwareStorage';
import { validateProject } from '../validation/projectSchema';

import { connectivityService } from './connectivityService';
import { snapshotService } from './snapshotService';

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

export class EnhancedStorageService {
  private static PROJECTS_KEY = 'inkwell_enhanced_projects';
  private static PROJECT_PREFIX = 'inkwell_project_';
  private static CHAPTER_PREFIX = 'inkwell_chapter_';
  private static SCENE_PREFIX = 'inkwell_scene_';

  private static _initialized = false;
  private static _cleanup?: () => void;

  private static get autoSnapshotEnabled(): boolean {
    const enabled = localStorage.getItem(this.AUTO_SNAPSHOT_KEY);
    return enabled === null ? true : enabled === 'true';
  }

  private static set autoSnapshotEnabled(value: boolean) {
    localStorage.setItem(this.AUTO_SNAPSHOT_KEY, value.toString());
  }
  private static readonly AUTO_SNAPSHOT_KEY = 'inkwell_auto_snapshot_enabled';
  private static readonly autoSnapshotInterval = 10 * 60 * 1000; // 10 minutes

  // ==============================================
  // LEGACY METHODS (Your existing functionality)
  // ==============================================

  static saveProject(project: EnhancedProject): void {
    try {
      const projects = this.loadAllProjects();
      const existingIndex = projects.findIndex((p) => p.id === project.id);

      const updatedProject = {
        ...project,
        updatedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.push(updatedProject);
      }

      // Use safe storage with quota awareness
      this.safeSetItem(this.PROJECTS_KEY, JSON.stringify(projects));

      // Create snapshot if needed (enhanced functionality)
      this.maybeCreateSnapshot(updatedProject);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  static loadProject(projectId: string): EnhancedProject | null {
    try {
      const projects = this.loadAllProjects();
      return projects.find((p) => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  static loadAllProjects(): EnhancedProject[] {
    try {
      const result = quotaAwareStorage.safeGetItem(this.PROJECTS_KEY);
      if (!result.success || !result.data) {
        return [];
      }
      return JSON.parse(result.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  static updateProjectContent(projectId: string, content: string): void {
    const project = this.loadProject(projectId);
    if (project) {
      const words = content.split(' ').filter((word) => word.trim().length > 0);
      project.recentContent = words.slice(-1000).join(' ');
      project.currentWordCount = words.length;

      this.saveProject(project);
    }
  }

  static addWritingSession(
    projectId: string,
    session: Omit<WritingSession, 'id' | 'projectId'>,
  ): void {
    const project = this.loadProject(projectId);
    if (project) {
      const newSession: WritingSession = {
        ...session,
        id: `session_${Date.now()}`,
        projectId,
      };

      project.sessions = project.sessions || [];
      project.sessions.push(newSession);
      this.saveProject(project);
    }
  }

  // ==============================================
  // ENHANCED SAFETY METHODS (New functionality)
  // ==============================================

  /**
   * Safe project save with validation and error handling
   */
  static async saveProjectSafe(
    project: EnhancedProject,
  ): Promise<{ success: boolean; error?: Error; message?: string }> {
    try {
      // Validate if project has schema-compatible structure
      if (this.isSchemaCompatible(project)) {
        const validation = validateProject(project as any);
        if (!validation.success) {
          console.warn(`Project validation warning for ${project.id}:`, validation.error);
        }
      }

      const projects = this.loadAllProjects();
      const existingIndex = projects.findIndex((p) => p.id === project.id);

      const updatedProject = {
        ...project,
        updatedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.push(updatedProject);
      }

      // If offline, enqueue the write and return queued status
      const online = (() => {
        try {
          return connectivityService.getStatus().isOnline;
        } catch {
          return typeof navigator !== 'undefined' ? navigator.onLine : true;
        }
      })();

      if (!online) {
        try {
          await connectivityService.queueWrite('save', this.PROJECTS_KEY, JSON.stringify(projects));
          console.info('Save queued (offline):', updatedProject.id);
          return { success: true, message: 'queued' };
        } catch (e) {
          const msg = 'Failed to queue save while offline';
          console.error(msg, e);
          return { success: false, error: e instanceof Error ? e : undefined, message: msg };
        }
      }

      // Use quota-aware storage
      const result = await this.safeWrite(this.PROJECTS_KEY, JSON.stringify(projects));
      if (!result.success) {
        // Propagate the underlying error as an Error instance if available
        const out: { success: boolean; error?: Error; message?: string } = { success: false };
        if (result.error instanceof Error) out.error = result.error;
        else if (typeof result.error === 'string') out.message = result.error;
        else out.message = 'Unknown storage error';
        return out;
      }

      // Create snapshot if significant changes
      await this.maybeCreateSnapshotAsync(updatedProject);

      devLog.debug(`Project saved safely: ${updatedProject.name || updatedProject.id}`);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to save project safely: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);
      return {
        success: false,
        error: error instanceof Error ? error : undefined,
        message: errorMessage,
      };
    }
  }

  /**
   * Delete project with backup
   */
  static async deleteProjectSafe(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create backup snapshot before deletion
      const project = this.loadProject(projectId);
      if (project && this.isSchemaCompatible(project)) {
        try {
          await snapshotService.createSnapshot(project as any, {
            description: 'Backup before deletion',
            isAutomatic: false,
            tags: ['deletion-backup'],
          });
        } catch (error) {
          console.warn('Failed to create deletion backup:', error);
        }
      }

      const projects = this.loadAllProjects();
      const filteredProjects = projects.filter((p) => p.id !== projectId);

      const result = await this.safeWrite(this.PROJECTS_KEY, JSON.stringify(filteredProjects));

      if (result.success) {
        // Delete related data
        this.deleteProjectData(projectId);
        devLog.debug(`Project deleted safely: ${projectId}`);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to delete project safely: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalProjects: number;
    totalWordCount: number;
    storageUsed: number;
    quotaInfo: any;
    snapshotCount: number;
    writingSessions: number;
  }> {
    try {
      const projects = this.loadAllProjects();
      const totalWordCount = projects.reduce(
        (total, _project) => total + (project.currentWordCount || 0),
        0,
      );
      const quotaInfo = await quotaAwareStorage.getQuotaInfo();
      const snapshotUsage = snapshotService.getSnapshotStorageUsage();
      const writingSessions = projects.reduce(
        (total, _project) => total + (project.sessions?.length || 0),
        0,
      );

      return {
        totalProjects: projects.length,
        totalWordCount,
        storageUsed: quotaInfo.usage,
        quotaInfo,
        snapshotCount: snapshotUsage.snapshotCount,
        writingSessions,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalProjects: 0,
        totalWordCount: 0,
        storageUsed: 0,
        quotaInfo: null,
        snapshotCount: 0,
        writingSessions: 0,
      };
    }
  }

  /**
   * Perform maintenance and cleanup
   */
  static async performMaintenance(): Promise<{ success: boolean; actions: string[] }> {
    const actions: string[] = [];

    try {
      // Check if maintenance is needed
      const needsMaintenance = await quotaAwareStorage.needsMaintenance();
      if (!needsMaintenance) {
        return { success: true, actions: ['No maintenance needed'] };
      }

      // Clean up old snapshots for schema-compatible projects
      const projects = this.loadAllProjects();
      for (const project of projects) {
        if (this.isSchemaCompatible(project)) {
          const cleaned = await snapshotService.emergencyCleanup(project.id, 5);
          if (cleaned > 0) {
            actions.push(`Cleaned ${cleaned} old snapshots for ${project.name || project.id}`);
          }
        }
      }

      // Clean up orphaned writing sessions (sessions without projects)
      const orphanedSessions = await this.cleanupOrphanedSessions();
      if (orphanedSessions > 0) {
        actions.push(`Cleaned up ${orphanedSessions} orphaned writing sessions`);
      }

      return { success: true, actions };
    } catch (error) {
      console.error('Maintenance failed:', error);
      return {
        success: false,
        actions: [
          `Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Enable/disable auto-snapshots
   */
  private static lastAutoSnapshot = 0; // Initialize to 0 to force first snapshot

  static setAutoSnapshotEnabled(enabled: boolean): void {
    this.autoSnapshotEnabled = enabled;
    localStorage.setItem(this.AUTO_SNAPSHOT_KEY, enabled.toString());
    devLog.debug(`Auto-snapshots ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get recent writing sessions across all projects
   */
  static getRecentWritingSessions(limit: number = 10): WritingSession[] {
    try {
      const projects = this.loadAllProjects();
      const allSessions: WritingSession[] = [];

      for (const project of projects) {
        if (project.sessions) {
          allSessions.push(...project.sessions);
        }
      }

      return allSessions
        .sort((a, _b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent writing sessions:', error);
      return [];
    }
  }

  /**
   * Export project for backup
   */
  static async exportProjectBackup(
    projectId: string,
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const project = this.loadProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const backupData = {
        project,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        type: 'inkwell_project_backup',
      };

      return {
        success: true,
        data: JSON.stringify(backupData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==============================================
  // PRIVATE HELPER METHODS
  // ==============================================

  private static async safeWrite(
    key: string,
    data: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Check if online, if not queue the write
    if (!connectivityService.getStatus().isOnline) {
      await connectivityService.queueWrite('save', key, data);
      return { success: true }; // Queued successfully
    }

    // Attempt immediate write
    const result = await quotaAwareStorage.safeSetItem(key, data);
    if (!result.success && result.error) {
      // If quota error, try emergency cleanup
      if (result.error.type === 'quota') {
        devLog.debug('Quota exceeded, attempting emergency cleanup...');
        const cleanup = await quotaAwareStorage.emergencyCleanup();
        if (cleanup.freedBytes > 0) {
          // Retry after cleanup
          const retryResult = await quotaAwareStorage.safeSetItem(key, data);
          if (retryResult.success) {
            return { success: true };
          }
        }

        // Still failing, queue for later
        await connectivityService.queueWrite('save', key, data);
        return {
          success: false,
          error: 'Storage full. Operation queued for when space is available.',
        };
      }

      return { success: false, error: result.error.message };
    }

    return { success: result.success, error: result.error?.message };
  }

  private static safeSetItem(key: string, data: string): void {
    try {
      localStorage.setItem(key, data);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);

      // Queue for later if offline or quota issues
      if (
        error instanceof Error &&
        (error.name.includes('Quota') ||
          error.message.includes('quota') ||
          error.message.includes('storage'))
      ) {
        // Queue the write for when space is available
        connectivityService.queueWrite('save', key, data).catch(console.error);
      }

      throw error;
    }
  }

  private static maybeCreateSnapshot(project: EnhancedProject): void {
    if (!this.autoSnapshotEnabled || !this.isSchemaCompatible(project)) {
      return;
    }

    if (this.lastAutoSnapshot === 0) {
      // Create snapshot in background
      setTimeout(() => {
        this.maybeCreateSnapshotAsync(project).catch(console.error);
      }, 100);
    }
  }

  private static async maybeCreateSnapshotAsync(project: EnhancedProject): Promise<void> {
    if (!this.autoSnapshotEnabled || !this.isSchemaCompatible(project)) {
      return;
    }

    try {
      await snapshotService.createSnapshot(project as any, {
        description: 'Auto-snapshot after save',
        isAutomatic: true,
      });
      this.lastAutoSnapshot = Date.now();
    } catch (error) {
      console.warn('Failed to create auto-snapshot:', error);
    }
  }

  private static isSchemaCompatible(project: EnhancedProject): boolean {
    // Check if project has the structure expected by the schema
    return (
      project &&
      typeof project.id === 'string' &&
      typeof project.name === 'string' &&
      Array.isArray(project.chapters) &&
      project.createdAt !== undefined &&
      project.updatedAt !== undefined
    );
  }

  private static deleteProjectData(projectId: string): void {
    // Delete all data related to a project
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes(`_${projectId}_`) ||
          key.endsWith(`_${projectId}`) ||
          key === `${this.PROJECT_PREFIX}${projectId}`)
      ) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      }
    }
  }

  private static async cleanupOrphanedSessions(): Promise<number> {
    try {
      const projects = this.loadAllProjects();
      const projectIds = new Set(projects.map((p) => p.id));
      let cleanedCount = 0;

      for (const project of projects) {
        if (project.sessions) {
          const originalLength = project.sessions.length;
          project.sessions = project.sessions.filter((session) =>
            projectIds.has(session.projectId),
          );

          if (project.sessions.length < originalLength) {
            cleanedCount += originalLength - project.sessions.length;
            this.saveProject(project);
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned sessions:', error);
      return 0;
    }
  }

  // ==============================================
  // STATIC INITIALIZATION
  // ==============================================

  /**
   * Initializes the storage service with connectivity monitoring and automatic saves.
   * Call this before using any storage service methods.
   * @returns Cleanup function to unsubscribe from events
   */
  public static init(): () => void {
    if (this._initialized) {
      console.warn('EnhancedStorageService already initialized');
      return () => {};
    }

    // Initialize connectivity monitoring
    try {
      const unsubscribe = connectivityService.onStatusChange((status) => {
        try {
          if (status?.isOnline) {
            if (status.queuedWrites > 0) {
              devLog.debug('Processing queued storage operations...');
            }
          }
        } catch (error) {
          console.error('Error in connectivity status handler:', error);
        }
      });

      this._initialized = true;
      this._cleanup = unsubscribe;
      return unsubscribe;
    } catch (error) {
      const msg = 'Failed to initialize connectivity monitoring';
      console.error(msg, error);
      throw new Error(msg, { cause: error });
    }
  }

  /**
   * Clean up any active subscriptions and monitoring
   */
  public static cleanup(): void {
    try {
      this._cleanup?.();
      this._initialized = false;
      this._cleanup = undefined;
    } catch (error) {
      console.error('Error during storage service cleanup:', error);
    }
  }
}

// Backward compatibility exports
export default EnhancedStorageService;

// New enhanced methods for gradual migration
export const enhancedStorageService = {
  // Core initialization
  init: EnhancedStorageService.init.bind(EnhancedStorageService),
  cleanup: EnhancedStorageService.cleanup.bind(EnhancedStorageService),

  // Legacy methods (unchanged)
  saveProject: EnhancedStorageService.saveProject.bind(EnhancedStorageService),
  loadProject: EnhancedStorageService.loadProject.bind(EnhancedStorageService),
  loadAllProjects: EnhancedStorageService.loadAllProjects.bind(EnhancedStorageService),
  updateProjectContent: EnhancedStorageService.updateProjectContent.bind(EnhancedStorageService),
  addWritingSession: EnhancedStorageService.addWritingSession.bind(EnhancedStorageService),

  // New enhanced methods
  saveProjectSafe: EnhancedStorageService.saveProjectSafe.bind(EnhancedStorageService),
  deleteProjectSafe: EnhancedStorageService.deleteProjectSafe.bind(EnhancedStorageService),
  getStorageStats: EnhancedStorageService.getStorageStats.bind(EnhancedStorageService),
  performMaintenance: EnhancedStorageService.performMaintenance.bind(EnhancedStorageService),
  exportProjectBackup: EnhancedStorageService.exportProjectBackup.bind(EnhancedStorageService),
  getRecentWritingSessions:
    EnhancedStorageService.getRecentWritingSessions.bind(EnhancedStorageService),
  setAutoSnapshotEnabled:
    EnhancedStorageService.setAutoSnapshotEnabled.bind(EnhancedStorageService),
};
