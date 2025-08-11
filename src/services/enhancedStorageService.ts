import { EnhancedProject } from '@/types/project';

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
  
  static saveProject(project: EnhancedProject): void {
    try {
      const projects = this.loadAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      const updatedProject = {
        ...project,
        updatedAt: Date.now()
      };
      
      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.push(updatedProject);
      }
      
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }
  
  static loadProject(projectId: string): EnhancedProject | null {
    try {
      const projects = this.loadAllProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }
  
  static loadAllProjects(): EnhancedProject[] {
    try {
      const stored = localStorage.getItem(this.PROJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }
  
  static updateProjectContent(projectId: string, content: string): void {
    const project = this.loadProject(projectId);
    if (project) {
      const words = content.split(' ');
      project.recentContent = words.slice(-1000).join(' ');
      project.currentWordCount = words.length;
      
      this.saveProject(project);
    }
  }
  
  static addWritingSession(projectId: string, session: Omit<WritingSession, 'id' | 'projectId'>): void {
    const project = this.loadProject(projectId);
    if (project) {
      const newSession: WritingSession = {
        ...session,
        id: `session_${Date.now()}`,
        projectId
      };
      
      project.sessions = project.sessions || [];
      project.sessions.push(newSession);
      this.saveProject(project);
    }
  }
}
