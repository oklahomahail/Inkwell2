// src/services/localGatewayImpl.ts
// Production implementation for IndexedDB operations that syncService requires.
// Wired to existing chaptersService IndexedDB schema.

import devLog from '@/utils/devLog';

import type { LocalGateway, LocalChapter, LocalProject, CloudChapterData } from './localGateway';

/**
 * Production implementation wired to IndexedDB via chaptersService schema
 */
export class LocalGatewayImpl implements LocalGateway {
  private db: IDBDatabase | null = null;
  private DB_NAME = 'inkwell_chapters';
  private META_STORE = 'chapter_meta';
  private DOC_STORE = 'chapter_docs';
  private PROJECT_STORE = 'projects'; // Assuming projects are stored here

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(projectId: string): Promise<LocalProject | null> {
    try {
      const db = await this.getDB();

      // Try to read from projects store if it exists
      if (db.objectStoreNames.contains(this.PROJECT_STORE)) {
        return new Promise((resolve) => {
          const tx = db.transaction(this.PROJECT_STORE, 'readonly');
          const request = tx.objectStore(this.PROJECT_STORE).get(projectId);
          request.onsuccess = () => {
            const proj = request.result;
            if (proj) {
              resolve({ id: proj.id, title: proj.title || proj.name || 'Untitled' });
            } else {
              resolve({ id: projectId, title: 'Untitled Project' });
            }
          };
          request.onerror = () => resolve({ id: projectId, title: 'Untitled Project' });
        });
      }

      // Fallback if no project store
      return { id: projectId, title: 'Untitled Project' };
    } catch (error) {
      devLog.warn('[LocalGateway] getProject failed:', error);
      return { id: projectId, title: 'Untitled Project' };
    }
  }

  async getChapters(projectId: string): Promise<LocalChapter[]> {
    try {
      const db = await this.getDB();

      // Read chapter metadata
      const metaList = await new Promise<Array<any>>((resolve, reject) => {
        const tx = db.transaction(this.META_STORE, 'readonly');
        const store = tx.objectStore(this.META_STORE);
        const index = store.index('projectId');
        const request = index.getAll(projectId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (metaList.length === 0) return [];

      // Read chapter documents
      const docs = await new Promise<Array<any>>((resolve, reject) => {
        const tx = db.transaction(this.DOC_STORE, 'readonly');
        const store = tx.objectStore(this.DOC_STORE);
        const ids = metaList.map((m) => m.id);
        const results: any[] = [];

        let pending = ids.length;
        ids.forEach((id) => {
          const req = store.get(id);
          req.onsuccess = () => {
            if (req.result) results.push(req.result);
            pending--;
            if (pending === 0) resolve(results);
          };
          req.onerror = () => {
            pending--;
            if (pending === 0) resolve(results);
          };
        });
      });

      // Merge meta + doc into LocalChapter shape
      const docMap = new Map(docs.map((d) => [d.id, d]));
      return metaList
        .map((meta) => {
          const doc = docMap.get(meta.id);
          return {
            id: meta.id,
            project_id: projectId,
            order_index: meta.index ?? 0,
            content: doc?.content || '',
            updated_at: meta.updatedAt || new Date().toISOString(),
          };
        })
        .sort((a, b) => a.order_index - b.order_index);
    } catch (error) {
      devLog.error('[LocalGateway] getChapters failed:', error);
      return [];
    }
  }

  async replaceProjectFromCloud(
    projectId: string,
    data: { chapters: CloudChapterData[] },
  ): Promise<void> {
    try {
      const db = await this.getDB();

      // Simple last-writer-wins: delete all local chapters for this project, then insert cloud ones
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([this.META_STORE, this.DOC_STORE], 'readwrite');

        // Delete existing chapters
        const metaStore = tx.objectStore(this.META_STORE);
        const index = metaStore.index('projectId');
        const delReq = index.openCursor(IDBKeyRange.only(projectId));

        delReq.onsuccess = (e: Event) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };

        const docStore = tx.objectStore(this.DOC_STORE);

        // Insert new chapters
        data.chapters.forEach((ch) => {
          const meta = {
            id: ch.id,
            projectId,
            title: `Chapter ${ch.order_index + 1}`,
            index: ch.order_index,
            status: 'draft',
            wordCount: typeof ch.content === 'string' ? ch.content.split(/\s+/).length : 0,
            sceneCount: 0,
            tags: [],
            createdAt: ch.updated_at,
            updatedAt: ch.updated_at,
          };
          metaStore.add(meta);

          const doc = {
            id: ch.id,
            content: ch.content,
            version: 1,
          };
          docStore.add(doc);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      devLog.log(
        `[LocalGateway] Replaced ${data.chapters.length} chapters for project ${projectId}`,
      );
    } catch (error) {
      devLog.error('[LocalGateway] replaceProjectFromCloud failed:', error);
      throw error;
    }
  }
}

export const localGateway: LocalGateway = new LocalGatewayImpl();
