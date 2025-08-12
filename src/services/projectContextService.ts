import { EnhancedProject } from '@/types/project';

export class ProjectContextService {
  private static instance: ProjectContextService;

  static getInstance(): ProjectContextService {
    if (!ProjectContextService.instance) {
      ProjectContextService.instance = new ProjectContextService();
    }
    return ProjectContextService.instance;
  }

  buildClaudeContext(
    project: EnhancedProject,
    _currentText: string,
    _selectedText?: string,
    _requestType?: 'continuation' | 'improvement' | 'character-analysis' | 'plot-development',
  ): string {
    const context: string[] = [];

    // Project Overview
    context.push(`PROJECT: ${project.name}`);
    if (project.genre) context.push(`Genre: ${project.genre}`);
    if (project.description) context.push(`Synopsis: ${project.description}`);

    // Relevant Characters (simplified for now)
    if (project.characters && project.characters.length > 0) {
      context.push('\nCHARACTERS:');
      project.characters.slice(0, 3).forEach((char) => {
        context.push(`- ${char.name} (${char.role}): ${char.description}`);
      });
    }

    // Recent Content
    if (project.recentContent) {
      const recentWords = project.recentContent.split(' ').slice(-200).join(' ');
      context.push(`\nRECENT CONTENT:\n${recentWords}`);
    }

    return context.join('\n');
  }

  estimateTokenCount(context: string): number {
    return Math.ceil(context.length / 4);
  }
}

export const projectContextService = ProjectContextService.getInstance();
