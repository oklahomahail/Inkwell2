/**
 * Demo Store Hook
 * In-memory store for preview mode - no persistence to IndexedDB/localStorage
 */

import { useMemo, useState } from 'react';

import { getDemoProject, type DemoProject } from './demoData';

export interface DemoStoreActions {
  updateChapterLocally: (chapterId: string, content: string) => void;
  resetToDemo: () => void;
}

export interface DemoStore {
  project: DemoProject;
  actions: DemoStoreActions;
}

/**
 * Hook that provides an in-memory demo project
 * Changes are local to the session and never persisted
 */
export function useDemoStore(): DemoStore {
  // Initialize with demo project clone
  const [project, setProject] = useState<DemoProject>(() => getDemoProject());

  const actions = useMemo<DemoStoreActions>(
    () => ({
      /**
       * Update chapter content in memory only
       * Changes will be lost on refresh
       */
      updateChapterLocally: (chapterId: string, content: string) => {
        setProject((prev) => ({
          ...prev,
          chapters: prev.chapters.map((ch) =>
            ch.id === chapterId
              ? {
                  ...ch,
                  content,
                  wordCount: content.split(/\s+/).filter(Boolean).length,
                  updatedAt: new Date().toISOString(),
                }
              : ch,
          ),
          updatedAt: Date.now(),
        }));
      },

      /**
       * Reset to original demo data
       */
      resetToDemo: () => {
        setProject(getDemoProject());
      },
    }),
    [],
  );

  return { project, actions };
}

/**
 * Track that user attempted to persist in preview mode
 * Used for conversion analytics
 */
export function trackPreviewPersistAttempt(action: 'save' | 'export' | 'ai'): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'preview_persist_attempt', {
      action,
      timestamp: Date.now(),
    });
  }
}
