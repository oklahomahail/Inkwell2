// src/services/__tests__/projectsDB.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { EnhancedProject } from '@/types/project';

import { ProjectsDB } from '../projectsDB';

describe('ProjectsDB', () => {
  const mockProject: EnhancedProject = {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project',
    genre: 'Fantasy',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    recentContent: '',
    sessions: [],
    claudeContext: {
      includeCharacters: true,
      includePlotNotes: true,
      includeWorldBuilding: true,
      maxCharacters: 5,
      maxPlotNotes: 10,
      contextLength: 'medium' as const,
    },
  };

  beforeEach(async () => {
    // Clear database before each test
    try {
      await ProjectsDB.clearAll();
    } catch (error) {
      // Database might not exist yet
    }
  });

  afterEach(() => {
    // Close connection after each test
    ProjectsDB.close();
  });

  it('should save and load a project', async () => {
    await ProjectsDB.saveProject(mockProject);

    const loaded = await ProjectsDB.loadProject(mockProject.id);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(mockProject.id);
    expect(loaded?.name).toBe(mockProject.name);
    expect(loaded?.description).toBe(mockProject.description);
  });

  it('should update project updatedAt timestamp on save', async () => {
    const originalTime = mockProject.updatedAt;
    await ProjectsDB.saveProject(mockProject);

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    await ProjectsDB.saveProject(mockProject);
    const loaded = await ProjectsDB.loadProject(mockProject.id);

    expect(loaded?.updatedAt).toBeGreaterThan(originalTime);
  });

  it('should load all projects', async () => {
    const project1 = { ...mockProject, id: 'project-1', name: 'Project 1' };
    const project2 = { ...mockProject, id: 'project-2', name: 'Project 2' };

    await ProjectsDB.saveProject(project1);
    await ProjectsDB.saveProject(project2);

    const projects = await ProjectsDB.loadAllProjects();
    expect(projects.length).toBe(2);
    expect(projects.map((p) => p.id)).toContain('project-1');
    expect(projects.map((p) => p.id)).toContain('project-2');
  });

  it('should delete a project', async () => {
    await ProjectsDB.saveProject(mockProject);

    let loaded = await ProjectsDB.loadProject(mockProject.id);
    expect(loaded).toBeDefined();

    await ProjectsDB.deleteProject(mockProject.id);

    loaded = await ProjectsDB.loadProject(mockProject.id);
    expect(loaded).toBeNull();
  });

  it('should return null for non-existent project', async () => {
    const loaded = await ProjectsDB.loadProject('non-existent-id');
    expect(loaded).toBeNull();
  });

  it('should count projects correctly', async () => {
    expect(await ProjectsDB.getCount()).toBe(0);

    await ProjectsDB.saveProject({ ...mockProject, id: 'project-1' });
    expect(await ProjectsDB.getCount()).toBe(1);

    await ProjectsDB.saveProject({ ...mockProject, id: 'project-2' });
    expect(await ProjectsDB.getCount()).toBe(2);

    await ProjectsDB.deleteProject('project-1');
    expect(await ProjectsDB.getCount()).toBe(1);
  });

  it('should query projects by index', async () => {
    await ProjectsDB.saveProject({ ...mockProject, id: 'fantasy-1', genre: 'Fantasy' });
    await ProjectsDB.saveProject({ ...mockProject, id: 'scifi-1', genre: 'Sci-Fi' });
    await ProjectsDB.saveProject({ ...mockProject, id: 'fantasy-2', genre: 'Fantasy' });

    const fantasyProjects = await ProjectsDB.queryProjects('genre', 'Fantasy');
    expect(fantasyProjects.length).toBe(2);
    expect(fantasyProjects.map((p) => p.id)).toContain('fantasy-1');
    expect(fantasyProjects.map((p) => p.id)).toContain('fantasy-2');
  });

  it('should handle concurrent saves', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      ProjectsDB.saveProject({
        ...mockProject,
        id: `project-${i}`,
        name: `Project ${i}`,
      }),
    );

    await Promise.all(promises);

    const count = await ProjectsDB.getCount();
    expect(count).toBe(10);
  });

  it('should report connection status', () => {
    // After any test operations, the DB should be connected
    expect(ProjectsDB.isConnected()).toBe(true);
  });

  it('should clear all projects', async () => {
    await ProjectsDB.saveProject({ ...mockProject, id: 'project-1' });
    await ProjectsDB.saveProject({ ...mockProject, id: 'project-2' });

    expect(await ProjectsDB.getCount()).toBe(2);

    await ProjectsDB.clearAll();

    expect(await ProjectsDB.getCount()).toBe(0);
  });
});
