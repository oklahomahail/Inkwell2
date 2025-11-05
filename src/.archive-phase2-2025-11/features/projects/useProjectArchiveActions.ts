import {
  createInkwellArchive,
  importInkwellArchive,
  inspectInkwellArchive,
  listAvailableProjects,
} from '@/utils/projectBundle';

export function useProjectArchiveActions(projectId: string) {
  async function exportArchive() {
    return await createInkwellArchive(projectId);
  }

  async function importArchive(file: File) {
    return await importInkwellArchive(file);
  }

  async function inspect(file: File) {
    return await inspectInkwellArchive(file);
  }

  async function list() {
    return await listAvailableProjects();
  }

  return { exportArchive, importArchive, inspect, list };
}
