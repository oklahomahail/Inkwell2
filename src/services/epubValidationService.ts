// src/services/epubValidationService.ts
// EPUB validation service for quality checking

import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/writing';

export interface EPUBValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  location?: string;
  severity: 'critical' | 'major' | 'minor';
  suggestion?: string;
}

export interface EPUBValidationReport {
  isValid: boolean;
  issues: EPUBValidationIssue[];
  metadata: {
    hasTitle: boolean;
    hasAuthor: boolean;
    hasUniqueId: boolean;
    chaptersCount: number;
    totalWordCount: number;
    hasTableOfContents: boolean;
  };
  qualityScore: number; // 0-100
  readinessLevel: 'not-ready' | 'needs-work' | 'good' | 'excellent';
}

export interface DOCXValidationReport {
  isValid: boolean;
  issues: EPUBValidationIssue[];
  formatting: {
    hasProperMargins: boolean;
    hasCorrectFontSize: boolean;
    hasDoubleSpacing: boolean;
    hasRunningHeader: boolean;
    hasPageNumbers: boolean;
    wordCountEstimate: number;
    pageEstimate: number;
  };
  manuscriptCompliance: number; // 0-100
  readinessLevel: 'not-ready' | 'needs-work' | 'good' | 'excellent';
}

class EPUBValidationService {
  /**
   * Validate EPUB readiness of a project
   */
  validateEPUBProject(project: EnhancedProject, chapters: Chapter[]): EPUBValidationReport {
    const issues: EPUBValidationIssue[] = [];

    // Metadata validation
    const metadata = this.validateMetadata(project, issues);

    // Content validation
    this.validateContent(project, chapters, issues);

    // Structure validation
    this.validateStructure(chapters, issues);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(issues, metadata);
    const readinessLevel = this.determineReadinessLevel(qualityScore, issues);

    return {
      isValid: !issues.some((issue) => issue.type === 'error'),
      issues,
      metadata,
      qualityScore,
      readinessLevel,
    };
  }

  /**
   * Validate DOCX/manuscript readiness of a project
   */
  validateManuscriptProject(project: EnhancedProject, chapters: Chapter[]): DOCXValidationReport {
    const issues: EPUBValidationIssue[] = [];

    // Manuscript format validation
    const formatting = this.validateManuscriptFormatting(project, chapters, issues);

    // Content validation for manuscripts
    this.validateManuscriptContent(project, chapters, issues);

    // Calculate manuscript compliance score
    const manuscriptCompliance = this.calculateManuscriptCompliance(formatting, issues);
    const readinessLevel = this.determineReadinessLevel(manuscriptCompliance, issues);

    return {
      isValid: !issues.some((issue) => issue.type === 'error'),
      issues,
      formatting,
      manuscriptCompliance,
      readinessLevel,
    };
  }

  private validateMetadata(project: EnhancedProject, issues: EPUBValidationIssue[]) {
    const metadata = {
      hasTitle: !!project.name?.trim(),
      hasAuthor: false, // We don't have author info in project yet
      hasUniqueId: !!project.id,
      chaptersCount: project.chapters?.length || 0,
      totalWordCount: project.currentWordCount || 0,
      hasTableOfContents: (project.chapters?.length || 0) > 1,
    };

    // Validate title
    if (!metadata.hasTitle) {
      issues.push({
        type: 'error',
        code: 'EPUB-001',
        message: 'Project title is required for EPUB export',
        severity: 'critical',
        suggestion: 'Add a title to your project in the project settings',
      });
    } else if (project.name.length > 255) {
      issues.push({
        type: 'warning',
        code: 'EPUB-002',
        message: 'Project title is very long and may be truncated in some readers',
        severity: 'minor',
        suggestion: 'Consider using a shorter title (under 255 characters)',
      });
    }

    // Validate author
    if (!metadata.hasAuthor) {
      issues.push({
        type: 'warning',
        code: 'EPUB-003',
        message: 'Author information is missing',
        severity: 'major',
        suggestion: 'Add author information for proper EPUB metadata',
      });
    }

    // Validate content length
    if (metadata.totalWordCount < 1000) {
      issues.push({
        type: 'warning',
        code: 'EPUB-004',
        message: 'Content is very short for an EPUB publication',
        severity: 'minor',
        suggestion: 'Consider expanding content or using a different format',
      });
    }

    // Validate chapters
    if (metadata.chaptersCount === 0) {
      issues.push({
        type: 'error',
        code: 'EPUB-005',
        message: 'No chapters found for EPUB export',
        severity: 'critical',
        suggestion: 'Create at least one chapter with content',
      });
    }

    return metadata;
  }

  private validateContent(
    project: EnhancedProject,
    chapters: Chapter[],
    issues: EPUBValidationIssue[],
  ) {
    chapters.forEach((chapter, index) => {
      const chapterNumber = index + 1;

      // Validate chapter title
      if (!chapter.title?.trim()) {
        issues.push({
          type: 'warning',
          code: 'EPUB-101',
          message: `Chapter ${chapterNumber} is missing a title`,
          location: `Chapter ${chapterNumber}`,
          severity: 'minor',
          suggestion: 'Add a descriptive title to improve navigation',
        });
      }

      // Validate chapter content
      if (!chapter.scenes?.length) {
        issues.push({
          type: 'warning',
          code: 'EPUB-102',
          message: `Chapter ${chapterNumber} has no scenes or content`,
          location: `Chapter ${chapterNumber}`,
          severity: 'major',
          suggestion: 'Add content to this chapter or remove it',
        });
      } else {
        // Check for empty scenes
        const emptyScenes = chapter.scenes.filter((scene) => !scene.content?.trim()).length;
        if (emptyScenes > 0) {
          issues.push({
            type: 'warning',
            code: 'EPUB-103',
            message: `Chapter ${chapterNumber} has ${emptyScenes} empty scene(s)`,
            location: `Chapter ${chapterNumber}`,
            severity: 'minor',
            suggestion: 'Remove empty scenes or add content to them',
          });
        }
      }

      // Check chapter length
      const wordCount = chapter.totalWordCount || 0;
      if (wordCount < 100) {
        issues.push({
          type: 'info',
          code: 'EPUB-104',
          message: `Chapter ${chapterNumber} is very short (${wordCount} words)`,
          location: `Chapter ${chapterNumber}`,
          severity: 'minor',
          suggestion: 'Consider expanding this chapter or merging with another',
        });
      }
    });
  }

  private validateStructure(chapters: Chapter[], issues: EPUBValidationIssue[]) {
    // Check for logical chapter ordering
    const chapterOrders = chapters.map((ch) => ch.order).filter((order) => order !== undefined);
    if (chapterOrders.length > 0) {
      const sortedOrders = [...chapterOrders].sort((a, b) => a - b);
      const hasGaps = sortedOrders.some((order, index) => {
        const previousOrder = sortedOrders[index - 1];
        return index > 0 && previousOrder !== undefined && order !== previousOrder + 1;
      });

      if (hasGaps) {
        issues.push({
          type: 'info',
          code: 'EPUB-201',
          message: 'Chapter ordering has gaps or inconsistencies',
          severity: 'minor',
          suggestion: 'Review chapter order for logical progression',
        });
      }
    }

    // Check for very uneven chapter lengths
    if (chapters.length > 1) {
      const wordCounts = chapters.map((ch) => ch.totalWordCount || 0).filter((count) => count > 0);
      if (wordCounts.length > 1) {
        const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
        const hasExtremeLengths = wordCounts.some((count) => count < avg * 0.2 || count > avg * 5);

        if (hasExtremeLengths) {
          issues.push({
            type: 'info',
            code: 'EPUB-202',
            message: 'Chapters have very uneven lengths',
            severity: 'minor',
            suggestion: 'Consider balancing chapter lengths for better reading experience',
          });
        }
      }
    }
  }

  private validateManuscriptFormatting(
    project: EnhancedProject,
    chapters: Chapter[],
    issues: EPUBValidationIssue[],
  ) {
    const totalWordCount = chapters.reduce((sum, ch) => sum + (ch.totalWordCount || 0), 0);

    const formatting = {
      hasProperMargins: true, // We assume template has proper margins
      hasCorrectFontSize: true, // Template enforces 12pt
      hasDoubleSpacing: true, // Template enforces 2.0 spacing
      hasRunningHeader: true, // Template includes header
      hasPageNumbers: true, // Template includes page numbers
      wordCountEstimate: totalWordCount,
      pageEstimate: Math.ceil(totalWordCount / 250), // Roughly 250 words per double-spaced page
    };

    // Check word count for manuscript submissions
    if (totalWordCount < 50000) {
      issues.push({
        type: 'info',
        code: 'MS-001',
        message: `Word count (${totalWordCount.toLocaleString()}) may be low for novel manuscript submissions`,
        severity: 'minor',
        suggestion:
          'Most novels are 70,000-100,000 words. Verify this aligns with your target genre.',
      });
    } else if (totalWordCount > 120000) {
      issues.push({
        type: 'warning',
        code: 'MS-002',
        message: `Word count (${totalWordCount.toLocaleString()}) is high for first-time novel submissions`,
        severity: 'minor',
        suggestion:
          'Consider if the manuscript could be tightened. Very long first novels are harder to sell.',
      });
    }

    return formatting;
  }

  private validateManuscriptContent(
    project: EnhancedProject,
    chapters: Chapter[],
    issues: EPUBValidationIssue[],
  ) {
    // Check for placeholder text that should be replaced
    const placeholderPatterns = [
      /\[your name\]/i,
      /\[author name\]/i,
      /\[insert.*\]/i,
      /\[todo.*\]/i,
      /\[surname\]/i,
      /\[address\]/i,
      /\[phone\]/i,
      /\[email\]/i,
    ];

    chapters.forEach((chapter, index) => {
      const chapterNumber = index + 1;

      chapter.scenes?.forEach((scene, sceneIndex) => {
        if (scene.content) {
          placeholderPatterns.forEach((pattern) => {
            if (pattern.test(scene.content)) {
              issues.push({
                type: 'warning',
                code: 'MS-101',
                message: `Placeholder text found in Chapter ${chapterNumber}, Scene ${sceneIndex + 1}`,
                location: `Chapter ${chapterNumber}, Scene ${sceneIndex + 1}`,
                severity: 'major',
                suggestion: 'Replace placeholder text with actual content before submission',
              });
            }
          });
        }
      });
    });

    // Check project-level placeholders
    if (project.description?.includes('[') || project.genre?.includes('[')) {
      issues.push({
        type: 'warning',
        code: 'MS-102',
        message: 'Project description or genre contains placeholder text',
        severity: 'major',
        suggestion: 'Update project metadata with actual information',
      });
    }
  }

  private calculateQualityScore(issues: EPUBValidationIssue[], metadata: any): number {
    let score = 100;

    // Deduct points based on issue severity
    issues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    });

    // Bonus points for good metadata
    if (metadata.hasTitle) score += 5;
    if (metadata.hasAuthor) score += 5;
    if (metadata.hasTableOfContents) score += 5;
    if (metadata.totalWordCount > 10000) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateManuscriptCompliance(formatting: any, issues: EPUBValidationIssue[]): number {
    let score = 100;

    // Deduct for formatting issues
    if (!formatting.hasProperMargins) score -= 15;
    if (!formatting.hasCorrectFontSize) score -= 15;
    if (!formatting.hasDoubleSpacing) score -= 15;
    if (!formatting.hasRunningHeader) score -= 10;
    if (!formatting.hasPageNumbers) score -= 10;

    // Deduct for content issues
    issues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 3;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private determineReadinessLevel(
    score: number,
    issues: EPUBValidationIssue[],
  ): 'not-ready' | 'needs-work' | 'good' | 'excellent' {
    const hasCriticalIssues = issues.some((issue) => issue.severity === 'critical');

    if (hasCriticalIssues || score < 50) {
      return 'not-ready';
    } else if (score < 70) {
      return 'needs-work';
    } else if (score < 90) {
      return 'good';
    } else {
      return 'excellent';
    }
  }

  /**
   * Get a pre-export checklist for manuscript submissions
   */
  getManuscriptChecklist(project: EnhancedProject): Array<{
    item: string;
    completed: boolean;
    required: boolean;
    suggestion?: string;
  }> {
    const totalWordCount = project.currentWordCount || 0;

    return [
      {
        item: 'Project has a clear title',
        completed: !!project.name?.trim(),
        required: true,
        suggestion: 'Add a compelling title that represents your work',
      },
      {
        item: 'Word count is appropriate for genre',
        completed: totalWordCount >= 50000 && totalWordCount <= 120000,
        required: false,
        suggestion: 'Novels typically range 70k-100k words for most genres',
      },
      {
        item: 'All chapters have titles',
        completed: (project.chapters || []).every((ch) => !!ch.title?.trim()),
        required: false,
        suggestion: 'Clear chapter titles improve navigation and professional appearance',
      },
      {
        item: 'No placeholder text remains',
        completed: !this.hasPlaceholderText(project),
        required: true,
        suggestion: 'Replace all [brackets] and placeholder text with actual content',
      },
      {
        item: 'Genre is specified',
        completed: !!project.genre?.trim() && !project.genre.includes('['),
        required: true,
        suggestion: 'Specify the genre for proper categorization',
      },
      {
        item: 'Project description/synopsis exists',
        completed: !!project.description?.trim() && project.description.length > 50,
        required: false,
        suggestion: 'A good synopsis is essential for submissions',
      },
    ];
  }

  private hasPlaceholderText(project: EnhancedProject): boolean {
    const placeholderPattern = /\[.*\]/;

    if (placeholderPattern.test(project.name || '')) return true;
    if (placeholderPattern.test(project.description || '')) return true;
    if (placeholderPattern.test(project.genre || '')) return true;

    return (project.chapters || []).some((chapter) =>
      chapter.scenes?.some((scene: any) => placeholderPattern.test(scene.content || '')),
    );
  }
}

export const epubValidationService = new EPUBValidationService();
export default epubValidationService;
