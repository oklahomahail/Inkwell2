// src/services/consistencyGuardianService.ts - FIXED VERSION
import type { EnhancedProject } from '../types/project';

import claudeService from './claudeService';
import type { ClaudeResponse } from './claudeService';

export interface ConsistencyIssue {
  id: string;
  type: 'character' | 'timeline' | 'world' | 'plot';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  locationInfo: {
    chapterId?: string;
    sceneId?: string;
    characterId?: string;
    pageReference?: string;
  };
  isResolved: boolean;
  createdAt: number;
  resolvedAt?: number;
}

export interface ConsistencyReport {
  projectId: string;
  generatedAt: number;
  overallScore: number; // 0-100
  issues: ConsistencyIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    characterIssues: number;
    timelineIssues: number;
    worldIssues: number;
    plotIssues: number;
  };
  recommendations: string[];
}

export interface ConsistencyCheckOptions {
  checkCharacters: boolean;
  checkTimeline: boolean;
  checkWorldBuilding: boolean;
  checkPlotThreads: boolean;
  includeMinorIssues: boolean;
  focusChapters?: string[]; // Optional: check only specific chapters
}

class ConsistencyGuardianService {
  private readonly STORAGE_KEY = 'inkwell_consistency_reports';

  async performConsistencyCheck(
    project: EnhancedProject,
    options: ConsistencyCheckOptions = {
      checkCharacters: true,
      checkTimeline: true,
      checkWorldBuilding: true,
      checkPlotThreads: true,
      includeMinorIssues: false,
    },
  ): Promise<ConsistencyReport> {
    console.log('Consistency Guardian: Starting comprehensive analysis');

    if (!claudeService.isConfigured()) {
      throw new Error('Claude API key not configured. Please check your settings.');
    }

    try {
      // Build comprehensive project context
      const projectContext = this.buildProjectContext(project, options);

      // Generate the AI prompt
      const prompt = this.buildConsistencyPrompt(project, projectContext, options);

      // Send to Claude with higher token limit for complex analysis
      const response = await claudeService.sendMessage(prompt, {
        maxTokens: 4000,
        projectContext: projectContext,
      });

      // Parse the structured response
      const issues = this.parseConsistencyResponse(response);

      // Generate the report
      const report = this.generateReport(project.id, issues);

      // Cache the report
      this.saveReport(report);

      console.log(`Consistency Guardian: Found ${issues.length} issues`);
      return report;
    } catch (error) {
      console.error('Consistency Guardian Error:', error);
      throw new Error(
        `Consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private buildProjectContext(project: EnhancedProject, options: ConsistencyCheckOptions): string {
    const context = [];

    // Project overview
    context.push(`PROJECT: ${project.name}`);
    context.push(`GENRE: ${project.genre || 'Unspecified'}`);
    context.push(`DESCRIPTION: ${project.description}`);
    context.push('');

    // Characters (if checking)
    if (options.checkCharacters && project.characters.length > 0) {
      context.push('CHARACTERS:');
      project.characters.forEach((char) => {
        context.push(`- ${char.name} (${char.role}): ${char.description}`);
        if (char.personality.length > 0) {
          context.push(`  Personality: ${char.personality.join(', ')}`);
        }
        if (char.goals) {
          context.push(`  Goals: ${char.goals}`);
        }
        if (char.conflicts) {
          context.push(`  Conflicts: ${char.conflicts}`);
        }
      });
      context.push('');
    }

    // World building (if available and checking)
    if (options.checkWorldBuilding && project.worldBuilding?.length > 0) {
      context.push('WORLD BUILDING:');
      project.worldBuilding.forEach((wb) => {
        context.push(`- ${wb.title} (${wb.type}): ${wb.content.slice(0, 200)}...`);
      });
      context.push('');
    }

    // Plot notes (if available and checking)
    if (options.checkPlotThreads && project.plotNotes?.length > 0) {
      context.push('PLOT THREADS:');
      project.plotNotes.forEach((plot) => {
        context.push(`- ${plot.title} (${plot.type}): ${plot.content.slice(0, 150)}...`);
      });
      context.push('');
    }

    // Chapter content (limited to preserve token space)
    const chaptersToCheck = options.focusChapters
      ? project.chapters.filter((ch) => options.focusChapters!.includes(ch.id))
      : project.chapters;

    context.push('STORY CONTENT:');
    chaptersToCheck.forEach((chapter, index) => {
      context.push(`CHAPTER ${index + 1}: ${chapter.title}`);
      if (chapter.summary) {
        context.push(`Summary: ${chapter.summary}`);
      }

      // Include first 300 words of content for analysis
      const content = chapter.content.replace(/<[^>]*>/g, ''); // Strip HTML
      const words = content.split(/\s+/).slice(0, 300).join(' ');
      context.push(`Content: ${words}${content.split(/\s+/).length > 300 ? '...' : ''}`);
      context.push('');
    });

    return context.join('\n');
  }

  private buildConsistencyPrompt(
    project: EnhancedProject,
    context: string,
    options: ConsistencyCheckOptions,
  ): string {
    return `You are the Consistency Guardian, an expert story analyst. Analyze this writing project for consistency issues across characters, timeline, world-building, and plot threads.

ANALYSIS SCOPE:
${options.checkCharacters ? 'Character consistency (traits, behavior, voice)' : 'Skip character analysis'}
${options.checkTimeline ? 'Timeline accuracy (chronology, aging, events)' : 'Skip timeline analysis'}
${options.checkWorldBuilding ? 'World-building consistency (rules, geography, culture)' : 'Skip world-building analysis'}
${options.checkPlotThreads ? 'Plot thread tracking (unresolved threads, contradictions)' : 'Skip plot analysis'}

PROJECT CONTEXT:
${context}

Please analyze this project thoroughly and respond with a JSON array of consistency issues. Use this EXACT structure:

[
  {
    "type": "character|timeline|world|plot",
    "severity": "low|medium|high|critical",
    "title": "Brief issue title",
    "description": "Detailed description of the inconsistency found",
    "suggestion": "Specific recommendation to fix this issue",
    "locationInfo": {
      "chapterId": "chapter-1",
      "characterId": "char-name",
      "pageReference": "Chapter 2, Scene 1"
    }
  }
]

ANALYSIS GUIDELINES:
- Focus on actual inconsistencies, not stylistic preferences
- Look for character behavior that contradicts established traits
- Check if events occur in logical chronological order
- Verify world-building rules remain consistent
- Track plot threads that are introduced but never resolved
- Note when character motivations change without explanation
- Flag timeline issues (character ages, event sequences)
- Identify contradictory information about the world/setting

SEVERITY LEVELS:
- CRITICAL: Major story-breaking inconsistencies
- HIGH: Significant issues that confuse readers  
- MEDIUM: Noticeable inconsistencies that should be addressed
- LOW: Minor issues that could be improved

${options.includeMinorIssues ? 'Include all issues regardless of severity.' : 'Focus primarily on medium, high, and critical issues.'}

Your entire response must be valid JSON only. Do not include any text outside the JSON array.`;
  }

  private parseConsistencyResponse(response: ClaudeResponse | string): ConsistencyIssue[] {
    try {
      // Extract text from ClaudeResponse object or use string directly
      const responseText =
        typeof response === 'string' ? response : response.content || response.text || '';

      // Clean the response
      let cleanResponse = responseText.trim();

      // Remove markdown formatting if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      // Additional cleanup for common Claude formatting
      cleanResponse = cleanResponse.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

      let parsedIssues: any[];

      try {
        parsedIssues = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw response:', responseText);
        console.log('Cleaned response:', cleanResponse);

        // Try to extract JSON from the response if it's embedded in text
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsedIssues = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted JSON from response');
          } catch (secondParseError) {
            throw new Error('Could not parse JSON from Claude response. Please try again.');
          }
        } else {
          throw new Error('No valid JSON found in Claude response. Please try again.');
        }
      }

      // Validate the structure
      if (!Array.isArray(parsedIssues)) {
        console.warn('Invalid response structure:', parsedIssues);
        throw new Error('Invalid response structure received from AI. Please try again.');
      }

      // Convert to ConsistencyIssue objects with IDs
      return parsedIssues.map((issue, index) => ({
        id: `issue-${Date.now()}-${index}`,
        type: issue.type || 'plot',
        severity: issue.severity || 'medium',
        title: issue.title || 'Consistency Issue',
        description: issue.description || 'No description provided',
        suggestion: issue.suggestion || 'No suggestion provided',
        locationInfo: issue.locationInfo || {},
        isResolved: false,
        createdAt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to parse consistency response:', error);
      console.log(
        'Raw response:',
        typeof response === 'string' ? response : response.content || response.text,
      );

      // Return a fallback issue indicating parsing failed
      return [
        {
          id: `parse-error-${Date.now()}`,
          type: 'plot',
          severity: 'medium',
          title: 'Analysis Parsing Error',
          description:
            'Could not parse the consistency analysis response. This may indicate the story is too complex for a single analysis or there was a service issue.',
          suggestion: 'Try analyzing smaller sections of your story or run the analysis again.',
          locationInfo: {},
          isResolved: false,
          createdAt: Date.now(),
        },
      ];
    }
  }

  private generateReport(projectId: string, issues: ConsistencyIssue[]): ConsistencyReport {
    const now = Date.now();

    // Calculate summary statistics
    const summary = {
      totalIssues: issues.length,
      criticalIssues: issues.filter((i) => i.severity === 'critical').length,
      characterIssues: issues.filter((i) => i.type === 'character').length,
      timelineIssues: issues.filter((i) => i.type === 'timeline').length,
      worldIssues: issues.filter((i) => i.type === 'world').length,
      plotIssues: issues.filter((i) => i.type === 'plot').length,
    };

    // Calculate overall score (100 = perfect, decreases with issues)
    const criticalWeight = 20;
    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 2;

    const totalDeductions = issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'critical':
          return total + criticalWeight;
        case 'high':
          return total + highWeight;
        case 'medium':
          return total + mediumWeight;
        case 'low':
          return total + lowWeight;
        default:
          return total + mediumWeight;
      }
    }, 0);

    const overallScore = Math.max(0, Math.min(100, 100 - totalDeductions));

    // Generate recommendations based on issue patterns
    const recommendations = this.generateRecommendations(issues, summary);

    return {
      projectId,
      generatedAt: now,
      overallScore,
      issues,
      summary,
      recommendations,
    };
  }

  private generateRecommendations(issues: ConsistencyIssue[], summary: any): string[] {
    const recommendations = [];

    if (summary.criticalIssues > 0) {
      recommendations.push(
        'Address critical consistency issues immediately as they may confuse or frustrate readers.',
      );
    }

    if (summary.characterIssues > summary.totalIssues * 0.3) {
      recommendations.push(
        'Consider creating detailed character sheets to track personality traits, motivations, and development arcs.',
      );
    }

    if (summary.timelineIssues > 0) {
      recommendations.push(
        'Create a timeline document to track events, character ages, and chronological progression.',
      );
    }

    if (summary.worldIssues > 0) {
      recommendations.push(
        'Develop a world-building guide to maintain consistency in rules, geography, and cultural elements.',
      );
    }

    if (summary.plotIssues > summary.totalIssues * 0.4) {
      recommendations.push(
        'Use a plot tracking system to ensure all story threads are properly resolved.',
      );
    }

    if (summary.totalIssues === 0) {
      recommendations.push(
        'Excellent consistency! Your story maintains strong internal logic and character coherence.',
      );
    } else if (summary.totalIssues < 5) {
      recommendations.push('Very good consistency with only minor issues to address.');
    }

    return recommendations;
  }

  // Report management methods
  saveReport(report: ConsistencyReport): void {
    try {
      const reports = this.getStoredReports();
      reports[report.projectId] = report;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to save consistency report:', error);
    }
  }

  getReport(projectId: string): ConsistencyReport | null {
    try {
      const reports = this.getStoredReports();
      return reports[projectId] || null;
    } catch (error) {
      console.warn('Failed to load consistency report:', error);
      return null;
    }
  }

  private getStoredReports(): Record<string, ConsistencyReport> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse stored reports:', error);
      return {};
    }
  }

  markIssueResolved(projectId: string, issueId: string): void {
    try {
      const report = this.getReport(projectId);
      if (report) {
        const issue = report.issues.find((i) => i.id === issueId);
        if (issue) {
          issue.isResolved = true;
          issue.resolvedAt = Date.now();
          this.saveReport(report);
        }
      }
    } catch (error) {
      console.warn('Failed to mark issue as resolved:', error);
    }
  }

  markIssueUnresolved(projectId: string, issueId: string): void {
    try {
      const report = this.getReport(projectId);
      if (report) {
        const issue = report.issues.find((i) => i.id === issueId);
        if (issue) {
          issue.isResolved = false;
          delete issue.resolvedAt;
          this.saveReport(report);
        }
      }
    } catch (error) {
      console.warn('Failed to mark issue as unresolved:', error);
    }
  }

  clearReport(projectId: string): void {
    try {
      const reports = this.getStoredReports();
      delete reports[projectId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to clear consistency report:', error);
    }
  }

  // Quick consistency check for specific elements
  async quickCharacterCheck(
    project: EnhancedProject,
    characterName: string,
  ): Promise<ConsistencyIssue[]> {
    const options: ConsistencyCheckOptions = {
      checkCharacters: true,
      checkTimeline: false,
      checkWorldBuilding: false,
      checkPlotThreads: false,
      includeMinorIssues: true,
    };

    const report = await this.performConsistencyCheck(project, options);
    return report.issues.filter(
      (issue) =>
        issue.type === 'character' &&
        (issue.locationInfo.characterId === characterName ||
          issue.description.toLowerCase().includes(characterName.toLowerCase())),
    );
  }

  async quickTimelineCheck(project: EnhancedProject): Promise<ConsistencyIssue[]> {
    const options: ConsistencyCheckOptions = {
      checkCharacters: false,
      checkTimeline: true,
      checkWorldBuilding: false,
      checkPlotThreads: false,
      includeMinorIssues: true,
    };

    const report = await this.performConsistencyCheck(project, options);
    return report.issues.filter((issue) => issue.type === 'timeline');
  }

  // Utility methods
  isAvailable(): boolean {
    return claudeService.isConfigured();
  }

  getSetupMessage(): string {
    if (!claudeService.isConfigured()) {
      return 'To use Consistency Guardian, please configure your Claude API key in Settings. You can get an API key from https://console.anthropic.com/';
    }
    return '';
  }

  getEstimatedAnalysisTime(project: EnhancedProject): number {
    // Estimate based on content length and complexity
    const totalWords = project.chapters.reduce((total, chapter) => {
      const words = chapter.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      return total + words;
    }, 0);

    const characterCount = project.characters?.length || 0;
    const chapterCount = project.chapters.length;

    // Base time: 30 seconds, +10s per 10k words, +5s per character, +2s per chapter
    return Math.max(
      30,
      30 + Math.floor(totalWords / 10000) * 10 + characterCount * 5 + chapterCount * 2,
    );
  }
}

export const consistencyGuardianService = new ConsistencyGuardianService();
