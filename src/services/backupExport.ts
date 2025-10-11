// src/services/backupExport.ts

import { saveAs } from 'file-saver';
import { z } from 'zod';

import { snapshotAdapter as snapshotService } from '@/services/snapshotAdapter';

// Accept loose input and normalize to a strict shape
const RawChapterSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    scenes: z.array(z.any()).optional(),
    wordCount: z.number().optional(),
  })
  .passthrough();

const RawProjectSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    chapters: z.array(RawChapterSchema).default([]),
    settings: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
  })
  .refine((p) => p.title || p.name, {
    message: "Project must include 'title' or 'name'",
  });

type NormalizedChapter = {
  id: string;
  title: string;
  scenes: unknown[];
  wordCount?: number;
};

export type InkwellProject = {
  id: string;
  title: string; // normalized (from title || name)
  chapters: NormalizedChapter[];
  settings?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
};

type BackupPayload = {
  version: number;
  exportedAt: number;
  checksum: string;
  project: InkwellProject;
};

// Turn any project-ish object into a strict InkwellProject
function _normalizeProject(input: unknown): InkwellProject {
  const raw = RawProjectSchema.parse(input);
  const chapters: NormalizedChapter[] = (raw.chapters || []).map((ch, _idx) => ({
    id: ch.id ?? `ch-${idx + 1}`,
    title: ch.title ?? `Chapter ${idx + 1}`,
    scenes: Array.isArray(ch.scenes) ? ch.scenes : [],
    wordCount: typeof ch.wordCount === 'number' ? ch.wordCount : undefined,
  }));

  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? 'Untitled Project',
    chapters,
    settings: raw.settings,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Create and download a backup of a project
 */
export async function _performBackup(project: unknown): Promise<void> {
  const safe = normalizeProject(project);
  const words = safe.chapters.reduce((acc, _ch) => acc + (ch.wordCount || 0), 0);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    checksum: `${safe.id}:${words}`,
    project: safe,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const name = `inkwell-backup-${safe.title.replace(/\\s+/g, '-').toLowerCase()}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  saveAs(blob, name);
}

/**
 * Import a project from a backup file
 */
export async function _performImport(projectId: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve();

      try {
        const text = await file.text();
        const data = JSON.parse(text) as BackupPayload;

        if (!data?.project?.chapters) {
          alert('Invalid backup file.');
          return resolve();
        }

        // Store as-is; your app uses name/title internally as needed
        await snapshotService.replaceProject(projectId, data.project);
        window.location.reload();
        resolve();
      } catch (error) {
        alert(
          'Failed to import backup: ' + (error instanceof Error ? error.message : 'Unknown error'),
        );
        resolve();
      }
    };

    input.click();
  });
}
