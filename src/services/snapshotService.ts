// @ts-nocheck
// src/services/snapshotService.ts
import {
  Project,
  SnapshotMetadata,
  validateProject,
  validateSnapshot,
} from '../validation/projectSchema';

interface SnapshotData {
  metadata: SnapshotMetadata;
  project: Project;
}

class SnapshotService {
  private static readonly SNAPSHOT_PREFIX = 'inkwell_snapshot_';
  private static readonly SNAPSHOT_INDEX_KEY = 'inkwell_snapshot_index';
  private static readonly MAX_SNAPSHOTS = 15;
  private static readonly AUTO_SNAPSHOT_INTERVAL = 10 * 60 * 1000; // 10 minutes

  private autoSnapshotTimer: ReturnType<typeof setInterval> | null = null;
  private lastSnapshotTime: number = 0;

  /**
   * Create a new snapshot of a project
   */
  async createSnapshot(
    project: Project,
    options: {
      description?: string;
      isAutomatic?: boolean;
      tags?: string[];
    } = {},
  ): Promise<SnapshotMetadata> {
    try {
      // Validate project data
      const validation = validateProject(project);
      if (!validation.success) {
        throw new Error(`Cannot snapshot invalid project: ${validation.error}`);
      }

      const timestamp = new Date().toISOString();
      const snapshotId = `${project.id}_${Date.now()}`;

      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(project);

      // Create metadata
      const metadata: SnapshotMetadata = {
        id: snapshotId,
        projectId: project.id,
        timestamp,
        version: project.version || '1.0.0',
        description:
          options.description || (options.isAutomatic ? 'Automatic snapshot' : 'Manual snapshot'),
        wordCount: project.currentWordCount,
        chaptersCount: project.chapters.length,
        size: JSON.stringify(project).length,
        checksum,
        isAutomatic: options.isAutomatic ?? false,
        tags: options.tags,
      };

      // Store snapshot data
      const snapshotData: SnapshotData = {
        metadata,
        project: validation.data,
      };

      const snapshotKey = `${SnapshotService.SNAPSHOT_PREFIX}${snapshotId}`;
      localStorage.setItem(snapshotKey, JSON.stringify(snapshotData));

      // Update snapshot index
      await this.updateSnapshotIndex(metadata);

      // Clean up old snapshots
      await this.cleanupOldSnapshots(project.id);

      console.log(`Snapshot created: ${snapshotId}`, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw new Error(
        `Snapshot creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all snapshots for a project
   */
  async getSnapshots(projectId: string): Promise<SnapshotMetadata[]> {
    try {
      const index = this.getSnapshotIndex();
      return index
        .filter((snapshot) => snapshot.projectId === projectId)
        .sort((a, _b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get snapshots:', error);
      return [];
    }
  }

  /**
   * Restore a project from a snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<Project> {
    try {
      const snapshotKey = `${SnapshotService.SNAPSHOT_PREFIX}${snapshotId}`;
      const snapshotDataStr = localStorage.getItem(snapshotKey);

      if (!snapshotDataStr) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }

      const snapshotData: SnapshotData = JSON.parse(snapshotDataStr);

      // Validate snapshot metadata
      const metadataValidation = validateSnapshot(snapshotData.metadata);
      if (!metadataValidation.success) {
        throw new Error(`Invalid snapshot metadata: ${metadataValidation.error}`);
      }

      // Validate project data
      const projectValidation = validateProject(snapshotData.project);
      if (!projectValidation.success) {
        throw new Error(`Invalid project data in snapshot: ${projectValidation.error}`);
      }

      // Verify checksum if available
      if (snapshotData.metadata.checksum) {
        const currentChecksum = await this.calculateChecksum(snapshotData.project);
        if (currentChecksum !== snapshotData.metadata.checksum) {
          console.warn(`Checksum mismatch for snapshot ${snapshotId}. Data may be corrupted.`);
        }
      }

      console.log(`Snapshot restored: ${snapshotId}`);
      return projectValidation.data;
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      throw new Error(
        `Snapshot restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a specific snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      const snapshotKey = `${SnapshotService.SNAPSHOT_PREFIX}${snapshotId}`;
      localStorage.removeItem(snapshotKey);

      // Update index
      const index = this.getSnapshotIndex();
      const updatedIndex = index.filter((snapshot) => snapshot.id !== snapshotId);
      localStorage.setItem(SnapshotService.SNAPSHOT_INDEX_KEY, JSON.stringify(updatedIndex));

      console.log(`Snapshot deleted: ${snapshotId}`);
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw new Error(
        `Snapshot deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   /**
 * Start automatic snapshot creation
 */
  startAutoSnapshots(project: Project): void {
    this.stopAutoSnapshots();

    this.autoSnapshotTimer = setInterval(async () => {
      try {
        // Only create auto-snapshot if project has been modified
        const now = Date.now();
        if (now - this.lastSnapshotTime > SnapshotService.AUTO_SNAPSHOT_INTERVAL) {
          await this.createSnapshot(project, {
            description: `Auto-snapshot at ${new Date().toLocaleTimeString()}`,
            isAutomatic: true,
            tags: ['auto'],
          });
          this.lastSnapshotTime = now;
        }
      } catch (error) {
        console.error('Auto-snapshot failed:', error);
      }
    }, SnapshotService.AUTO_SNAPSHOT_INTERVAL) as any;

    console.log('Auto-snapshots started');
  }
  /**
   * Stop automatic snapshot creation
   */
  stopAutoSnapshots(): void {
    if (this.autoSnapshotTimer) {
      clearInterval(this.autoSnapshotTimer);
      this.autoSnapshotTimer = null;
      console.log('Auto-snapshots stopped');
    }
  }

  /**
   * Get storage usage for snapshots
   */
  getSnapshotStorageUsage(): {
    totalSize: number;
    snapshotCount: number;
    details: Array<{ id: string; size: number }>;
  } {
    try {
      const index = this.getSnapshotIndex();
      let totalSize = 0;
      const details: Array<{ id: string; size: number }> = [];

      for (const snapshot of index) {
        const snapshotKey = `${SnapshotService.SNAPSHOT_PREFIX}${snapshot.id}`;
        const snapshotData = localStorage.getItem(snapshotKey);
        if (snapshotData) {
          const size = snapshotData.length;
          totalSize += size;
          details.push({ id: snapshot.id, size });
        }
      }

      return { totalSize, snapshotCount: index.length, details };
    } catch (error) {
      console.error('Failed to calculate snapshot storage usage:', error);
      return { totalSize: 0, snapshotCount: 0, details: [] };
    }
  }

  /**
   * Clean up snapshots to free space
   */
  async emergencyCleanup(projectId: string, keepCount: number = 5): Promise<number> {
    try {
      const snapshots = await this.getSnapshots(projectId);
      const toDelete = snapshots.slice(keepCount);

      for (const snapshot of toDelete) {
        await this.deleteSnapshot(snapshot.id);
      }

      console.log(`Emergency cleanup: removed ${toDelete.length} snapshots`);
      return toDelete.length;
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      return 0;
    }
  }

  // Private methods

  private getSnapshotIndex(): SnapshotMetadata[] {
    try {
      const indexStr = localStorage.getItem(SnapshotService.SNAPSHOT_INDEX_KEY);
      if (!indexStr) return [];

      const index = JSON.parse(indexStr);
      return Array.isArray(index) ? index : [];
    } catch (error) {
      console.error('Failed to load snapshot index:', error);
      return [];
    }
  }

  private async updateSnapshotIndex(metadata: SnapshotMetadata): Promise<void> {
    try {
      const index = this.getSnapshotIndex();
      index.push(metadata);
      localStorage.setItem(SnapshotService.SNAPSHOT_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update snapshot index:', error);
      throw error;
    }
  }

  private async cleanupOldSnapshots(projectId: string): Promise<void> {
    try {
      const snapshots = await this.getSnapshots(projectId);
      const autoSnapshots = snapshots.filter((s) => s.isAutomatic);

      if (autoSnapshots.length > SnapshotService.MAX_SNAPSHOTS) {
        const toDelete = autoSnapshots.slice(SnapshotService.MAX_SNAPSHOTS);
        for (const snapshot of toDelete) {
          await this.deleteSnapshot(snapshot.id);
        }
        console.log(`Cleaned up ${toDelete.length} old auto-snapshots`);
      }
    } catch (error) {
      console.error('Failed to cleanup old snapshots:', error);
    }
  }

  private async calculateChecksum(project: Project): Promise<string> {
    try {
      // Simple checksum based on project content
      const content = JSON.stringify(project, Object.keys(project).sort());
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    } catch (error) {
      console.error('Failed to calculate checksum:', error);
      return '';
    }
  }
}

// Export singleton instance
export const snapshotService = new SnapshotService();
export default snapshotService;
