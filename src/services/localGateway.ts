// src/services/localGateway.ts
// Interface for IndexedDB operations that syncService requires.
// This is a stub to decouple sync logic from your actual IndexedDB implementation.

export interface LocalChapter {
  id: string;
  project_id: string;
  order_index: number;
  content: unknown;
  updated_at: string;
}

export interface LocalProject {
  id: string;
  title: string;
}

export interface CloudChapterData {
  id: string;
  content: unknown;
  order_index: number;
  updated_at: string;
}

export interface LocalGateway {
  /**
   * Fetch project metadata from local IndexedDB.
   */
  getProject(projectId: string): Promise<LocalProject | null>;

  /**
   * Fetch all chapters for a project from local IndexedDB.
   */
  getChapters(projectId: string): Promise<LocalChapter[]>;

  /**
   * Replace local project content with data pulled from cloud.
   * This should overwrite chapters (or merge based on your conflict strategy).
   */
  replaceProjectFromCloud(projectId: string, data: { chapters: CloudChapterData[] }): Promise<void>;
}

// TODO: Wire this to your actual IndexedDB service (e.g., storageManager or enhancedStorageService)
// Example stub implementation:
export class LocalGatewayStub implements LocalGateway {
  async getProject(projectId: string): Promise<LocalProject | null> {
    // Replace with actual IndexedDB query
    console.warn('LocalGatewayStub.getProject not implemented', projectId);
    return null;
  }

  async getChapters(projectId: string): Promise<LocalChapter[]> {
    // Replace with actual IndexedDB query
    console.warn('LocalGatewayStub.getChapters not implemented', projectId);
    return [];
  }

  async replaceProjectFromCloud(
    projectId: string,
    data: { chapters: CloudChapterData[] },
  ): Promise<void> {
    // Replace with actual IndexedDB write
    console.warn('LocalGatewayStub.replaceProjectFromCloud not implemented', projectId, data);
  }
}

export const localGateway: LocalGateway = new LocalGatewayStub();
