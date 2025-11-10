// @ts-nocheck
// src/services/storageService.ts
import { CHAPTER_STATUS } from '@/consts/writing';
import { EnhancedProject, WritingSession } from '@/types/project';
import { type Scene, type Chapter as WritingChapter } from '@/types/writing';
import devLog from '@/utils/devLog';

import { analyticsService } from './analytics';

export class EnhancedStorageService {
  private static PROJECTS_KEY = 'inkwell_enhanced_projects';
  private static writingChaptersKey = (_projectId: string) =>
    `inkwell_writing_chapters_${_projectId}`;

  // ---------- EnhancedProject (unchanged shape) ----------
  static saveProject(project: EnhancedProject): void {
    const startTime = performance.now();
    try {
      const projects = this.loadAllProjects();
      const idx = projects.findIndex((p) => p.id === project.id);
      const updated = { ...project, updatedAt: Date.now() };
      const isNew = idx < 0;
      if (idx >= 0) projects[idx] = updated;
      else projects.push(updated);
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));

      const latency = performance.now() - startTime;
      const dataSize = new Blob([JSON.stringify(updated)]).size;

      // Log storage operation to analytics
      analyticsService.logMetric('storage', 'write.latency', latency, 'ms');
      analyticsService.logMetric('storage', 'write.size', dataSize, 'bytes');
      analyticsService.logEvent(
        'storage',
        isNew ? 'project.create' : 'project.update',
        undefined,
        latency,
        {
          projectId: project.id,
          dataSize,
        },
      );
    } catch (error) {
      const latency = performance.now() - startTime;
      devLog.error('Failed to save project:', error);

      // Log storage error to analytics
      analyticsService.logEvent('storage', 'write.error', 'save_project', latency, {
        projectId: project.id,
        errorMessage: (error as Error)?.message,
      });
    }
  }

  static loadProject(projectId: string): EnhancedProject | null {
    const startTime = performance.now();
    try {
      const projects = this.loadAllProjects();
      const project = projects.find((p) => p.id === projectId) || null;
      const latency = performance.now() - startTime;

      // Log storage read to analytics
      analyticsService.logMetric('storage', 'read.latency', latency, 'ms');
      analyticsService.logEvent('storage', 'project.load', undefined, latency, {
        projectId,
        found: !!project,
      });

      return project;
    } catch (error) {
      const latency = performance.now() - startTime;
      devLog.error('Failed to load project:', error);

      // Log storage error to analytics
      analyticsService.logEvent('storage', 'read.error', 'load_project', latency, {
        projectId,
        errorMessage: (error as Error)?.message,
      });

      return null;
    }
  }

  static loadAllProjects(): EnhancedProject[] {
    try {
      const stored = localStorage.getItem(this.PROJECTS_KEY);
      const projects: EnhancedProject[] = stored ? JSON.parse(stored) : [];

      // Retroactively mark demo projects
      let needsSave = false;
      projects.forEach((project) => {
        if (
          (project.name === 'Welcome to Inkwell' || project.id.startsWith('proj_welcome_')) &&
          !project.isDemo
        ) {
          project.isDemo = true;
          needsSave = true;
        }
      });

      // Save back if we made changes
      if (needsSave) {
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      }

      return projects;
    } catch (error) {
      devLog.error('Failed to load projects:', error);
      return [];
    }
  }

  static updateProjectContent(projectId: string, content: string): void {
    const project = this.loadProject(projectId);
    if (project) {
      const words = content.split(' ');
      (project as any).recentContent = words.slice(-1000).join(' ');
      (project as any).currentWordCount = words.length;
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
      (project as any).sessions = Array.isArray((project as any).sessions)
        ? [...(project as any).sessions, newSession]
        : [newSession];
      this.saveProject(project);
    }
  }

  // ---------- Local-first storage for writing chapters (editor shape) ----------
  static saveWritingChapters(projectId: string, chapters: WritingChapter[]): void {
    try {
      localStorage.setItem(this.writingChaptersKey(projectId), JSON.stringify(chapters));
    } catch (error) {
      devLog.error('Failed to save writing chapters:', error);
    }
  }

  static loadWritingChapters(projectId: string): WritingChapter[] {
    try {
      const raw = localStorage.getItem(this.writingChaptersKey(projectId));
      return raw ? (JSON.parse(raw) as WritingChapter[]) : [];
    } catch (error) {
      devLog.error('Failed to load writing chapters:', error);
      return [];
    }
  }

  // ---------- Scene-level helpers on writing chapters ----------
  static updateSceneInWritingChapters(
    projectId: string,
    sceneId: string,
    updates: Partial<Scene>,
  ): void {
    const chapters = this.loadWritingChapters(projectId);
    const newChapters: WritingChapter[] = chapters.map((ch: WritingChapter) => {
      const nextScenes = ch.scenes.map((s: Scene) =>
        s.id === sceneId ? { ...s, ...updates, updatedAt: new Date() } : s,
      );
      return {
        ...ch,
        scenes: nextScenes,
        totalWordCount: nextScenes.reduce((sum: number, s: Scene) => sum + (s.wordCount || 0), 0),
        updatedAt: new Date(),
      } as WritingChapter;
    });
    this.saveWritingChapters(projectId, newChapters);
  }

  static upsertSceneInWritingChapters(projectId: string, scene: Scene): void {
    const chapters = this.loadWritingChapters(projectId);

    // Try replace existing scene if found
    let found = false;
    const newChapters: WritingChapter[] = chapters.map((ch: WritingChapter) => {
      const idx = ch.scenes.findIndex((s: Scene) => s.id === scene.id);
      if (idx >= 0) {
        found = true;
        const nextScenes: Scene[] = [...ch.scenes];
        nextScenes[idx] = { ...scene, updatedAt: new Date() };
        return {
          ...ch,
          scenes: nextScenes,
          totalWordCount: nextScenes.reduce((sum: number, s: Scene) => sum + (s.wordCount || 0), 0),
          updatedAt: new Date(),
        } as WritingChapter;
      }
      return ch;
    });

    if (!found) {
      if (newChapters.length === 0) {
        // Create first chapter if none exist
        const firstChapter: WritingChapter = {
          id: `chap_${Date.now()}`,
          title: 'Chapter 1',
          order: 0,
          scenes: [{ ...scene, updatedAt: new Date() }],
          totalWordCount: scene.wordCount ?? 0,
          status: CHAPTER_STATUS.DRAFT, // ✅ const enum values
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        newChapters.push(firstChapter);
      } else {
        // Safe access since length > 0
        const first = newChapters[0]!;
        const nextScenes: Scene[] = [...first.scenes, { ...scene, updatedAt: new Date() }];
        newChapters[0] = {
          ...first,
          scenes: nextScenes,
          totalWordCount: nextScenes.reduce((sum: number, s: Scene) => sum + (s.wordCount || 0), 0),
          updatedAt: new Date(),
        } as WritingChapter;
      }
    }

    this.saveWritingChapters(projectId, newChapters);
  }
}

// -------- Facade for UI code (friendly API) --------
export const storageService = {
  init() {
    return Promise.resolve();
  },

  // Projects (unchanged)
  loadAllProjects: (): EnhancedProject[] => EnhancedStorageService.loadAllProjects(),
  loadProject: (projectId: string): EnhancedProject | null =>
    EnhancedStorageService.loadProject(projectId),

  // Writing chapters (editor shape)
  loadWritingChapters: (projectId: string): WritingChapter[] =>
    EnhancedStorageService.loadWritingChapters(projectId),

  saveWritingChapters: (_projectId: string, _chapters: WritingChapter[]) => {
    EnhancedStorageService.saveWritingChapters(_projectId, _chapters);
    return Promise.resolve();
  },

  updateScene(projectId: string, sceneId: string, updates: Partial<Scene>) {
    EnhancedStorageService.updateSceneInWritingChapters(projectId, sceneId, updates);
    return Promise.resolve();
  },

  saveScene(projectId: string, scene: Scene) {
    EnhancedStorageService.upsertSceneInWritingChapters(projectId, scene);
    return Promise.resolve();
  },
};
