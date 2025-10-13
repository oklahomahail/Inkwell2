import type { EnhancedProject } from './project';

export type ProjectUpdate = Partial<EnhancedProject> & {
  id: string;
  content: string;
  updatedAt: number;
};

export type ProjectUpdatePayload = {
  content: string;
  updatedAt: number;
};

export function ensureValidProjectUpdate(
  project: EnhancedProject,
  updates: ProjectUpdate,
): ProjectUpdate {
  return {
    ...updates,
    content: updates.content ?? project.content ?? '',
    id: project.id,
    updatedAt: updates.updatedAt || Date.now(),
  };
}
