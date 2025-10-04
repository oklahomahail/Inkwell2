// src/services/realTimeConsistencyCoordinator.ts - Unified real-time consistency checking coordinator
import type { EnhancedProject } from '@/types/project';
import type { Scene, Chapter } from '@/types/writing';
import { debounce } from '@/utils/debounce';
import { phraseAnalysisService } from '@/utils/textAnalysis';

import { characterConsistencyAnalyzer } from './characterConsistencyAnalyzer';
import { voiceConsistencyService } from './voiceConsistencyService';

import type { CharacterTraitIssue } from './characterConsistencyAnalyzer';
import type { VoiceConsistencyWarning } from './voiceConsistencyService';

// Unified issue type that includes all consistency issues
export type UnifiedConsistencyIssue = {
  id: string;
  type:
    | 'character'
    | 'voice'
    | 'phrase'
    | 'timeline'
    | 'world'
    | 'plot'
    | 'voice-inconsistency'
    | 'personality-contradiction'
    | 'behavior-inconsistency'
    | 'voice-mismatch'
    | 'relationship-conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  startPos: number;
  endPos: number;
  text: string;
  source: 'character-analyzer' | 'voice-service' | 'phrase-analysis' | 'timeline-check';
  metadata?: Record<string, any>;
};

export interface ConsistencyAnalysisOptions {
  enableCharacterChecks: boolean;
  enableVoiceChecks: boolean;
  enablePhraseChecks: boolean;
  enableTimelineChecks: boolean;
  debounceMs: number;
  minWordCount: number;
  confidenceThreshold: number;
}

export interface ConsistencyAnalysisResult {
  issues: UnifiedConsistencyIssue[];
  analysisTime: number;
  totalChecks: number;
  cacheHits: number;
}

class RealTimeConsistencyCoordinator {
  private readonly CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
  private cache = new Map<string, { result: ConsistencyAnalysisResult; timestamp: number }>();
  private analysisCallbacks: ((issues: UnifiedConsistencyIssue[]) => void)[] = [];
  private currentIssues: UnifiedConsistencyIssue[] = [];

  private defaultOptions: ConsistencyAnalysisOptions = {
    enableCharacterChecks: true,
    enableVoiceChecks: true,
    enablePhraseChecks: true,
    enableTimelineChecks: false, // More expensive, disabled by default
    debounceMs: 1500,
    minWordCount: 50,
    confidenceThreshold: 0.4,
  };

  // Debounced analysis function
  private debouncedAnalyze = debounce(
    (
      content: string,
      project: EnhancedProject,
      scene: Scene,
      chapter: Chapter,
      options: ConsistencyAnalysisOptions,
    ) => {
      this.performComprehensiveAnalysis(content, project, scene, chapter, options);
    },
    this.defaultOptions.debounceMs,
  );

  /**
   * Register a callback to be notified when issues are updated
   */
  onIssuesUpdated(callback: (issues: UnifiedConsistencyIssue[]) => void): () => void {
    this.analysisCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.analysisCallbacks.indexOf(callback);
      if (index > -1) {
        this.analysisCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Main entry point for real-time consistency analysis
   */
  analyzeContent(
    content: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
    options: Partial<ConsistencyAnalysisOptions> = {},
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Update debounce timing if changed
    if (options.debounceMs && options.debounceMs !== this.defaultOptions.debounceMs) {
      this.debouncedAnalyze = debounce(
        (
          content: string,
          project: EnhancedProject,
          scene: Scene,
          chapter: Chapter,
          options: ConsistencyAnalysisOptions,
        ) => {
          this.performComprehensiveAnalysis(content, project, scene, chapter, options);
        },
        options.debounceMs,
      );
    }

    // Skip if content too short
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
    if (wordCount < mergedOptions.minWordCount) {
      this.updateIssues([]);
      return;
    }

    this.debouncedAnalyze(content, project, scene, chapter, mergedOptions);
  }

  /**
   * Perform comprehensive real-time consistency analysis
   */
  private async performComprehensiveAnalysis(
    content: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
    options: ConsistencyAnalysisOptions,
  ): Promise<void> {
    const startTime = Date.now();
    const cacheKey = `${project.id}-${scene.id}-${this.hashContent(content)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.updateIssues(cached.result.issues);
      return;
    }

    const allIssues: UnifiedConsistencyIssue[] = [];
    const plainText = this.stripHTML(content);
    let totalChecks = 0;
    let cacheHits = 0;

    try {
      // Run all enabled consistency checks in parallel
      const analysisPromises: Promise<UnifiedConsistencyIssue[]>[] = [];

      // 1. Character consistency analysis (AI-powered)
      if (options.enableCharacterChecks) {
        totalChecks++;
        analysisPromises.push(
          this.runCharacterConsistencyAnalysis(plainText, project, scene, chapter),
        );
      }

      // 2. Voice consistency analysis (Pattern-based + AI)
      if (options.enableVoiceChecks) {
        totalChecks++;
        analysisPromises.push(this.runVoiceConsistencyAnalysis(plainText, project.id));
      }

      // 3. Phrase hygiene analysis (Local pattern matching)
      if (options.enablePhraseChecks) {
        totalChecks++;
        analysisPromises.push(this.runPhraseHygieneAnalysis(plainText, project.id));
      }

      // 4. Timeline consistency (Future enhancement - placeholder)
      if (options.enableTimelineChecks) {
        totalChecks++;
        analysisPromises.push(
          this.runTimelineConsistencyAnalysis(plainText, project, scene, chapter),
        );
      }

      // Wait for all analyses to complete
      const results = await Promise.allSettled(analysisPromises);

      // Process results and collect issues
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
        } else {
          console.error(`Consistency check ${index} failed:`, result.reason);
        }
      });

      // Sort issues by severity and position
      const sortedIssues = this.sortAndPrioritizeIssues(allIssues);

      const analysisResult: ConsistencyAnalysisResult = {
        issues: sortedIssues,
        analysisTime: Date.now() - startTime,
        totalChecks,
        cacheHits,
      };

      // Cache the result
      this.cache.set(cacheKey, { result: analysisResult, timestamp: Date.now() });

      // Update current issues and notify callbacks
      this.updateIssues(sortedIssues);
    } catch (error) {
      console.error('Comprehensive consistency analysis failed:', error);
      // Don't interrupt the user's writing flow
      this.updateIssues([]);
    }
  }

  /**
   * Run character consistency analysis
   */
  private async runCharacterConsistencyAnalysis(
    text: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
  ): Promise<UnifiedConsistencyIssue[]> {
    try {
      const result = await characterConsistencyAnalyzer.analyzeCharacterConsistency(
        text,
        project,
        scene,
        chapter,
      );

      return result.issues.map((issue) => this.convertCharacterIssue(issue));
    } catch (error) {
      console.error('Character consistency analysis failed:', error);
      return [];
    }
  }

  /**
   * Run voice consistency analysis
   */
  private async runVoiceConsistencyAnalysis(
    text: string,
    projectId: string,
  ): Promise<UnifiedConsistencyIssue[]> {
    try {
      const warnings = await voiceConsistencyService.analyzeTextForVoiceIssues(text, projectId);
      return warnings.map((warning) => this.convertVoiceWarning(warning));
    } catch (error) {
      console.error('Voice consistency analysis failed:', error);
      return [];
    }
  }

  /**
   * Run phrase hygiene analysis
   */
  private async runPhraseHygieneAnalysis(
    text: string,
    projectId: string,
  ): Promise<UnifiedConsistencyIssue[]> {
    try {
      const analysis = await phraseAnalysisService.analyzeText(text, projectId);
      const issues: UnifiedConsistencyIssue[] = [];

      // Convert phrase analysis to unified issues
      analysis.phrases.forEach((phrase) => {
        phrase.positions.forEach((position, index) => {
          if (phrase.severity === 'high' || phrase.severity === 'medium') {
            issues.push({
              id: `phrase-${phrase.phrase}-${index}-${Date.now()}`,
              type: 'phrase',
              severity: phrase.severity === 'high' ? 'high' : 'medium',
              title: `Overused phrase: "${phrase.phrase}"`,
              description: `This phrase appears ${phrase.count} times (${phrase.ngramSize}-gram)`,
              suggestion: `Consider using synonyms or rephrasing to avoid repetition`,
              startPos: position.start,
              endPos: position.end,
              text: phrase.phrase,
              source: 'phrase-analysis',
              metadata: {
                count: phrase.count,
                ngramSize: phrase.ngramSize,
                allPositions: phrase.positions,
              },
            });
          }
        });
      });

      return issues;
    } catch (error) {
      console.error('Phrase hygiene analysis failed:', error);
      return [];
    }
  }

  /**
   * Run timeline consistency analysis (placeholder for future enhancement)
   */
  private async runTimelineConsistencyAnalysis(
    _text: string,
    _project: EnhancedProject,
    _scene: Scene,
    _chapter: Chapter,
  ): Promise<UnifiedConsistencyIssue[]> {
    // Placeholder - would implement timeline/chronology checking
    return [];
  }

  /**
   * Convert character trait issue to unified format
   */
  private convertCharacterIssue(issue: CharacterTraitIssue): UnifiedConsistencyIssue {
    return {
      id: issue.id,
      type: issue.type,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      suggestion: issue.suggestion,
      startPos: issue.startPos,
      endPos: issue.endPos,
      text: issue.textSegment,
      source: 'character-analyzer',
      metadata: {
        characterId: issue.characterId,
        characterName: issue.characterName,
        evidence: issue.evidence,
      },
    };
  }

  /**
   * Convert voice warning to unified format
   */
  private convertVoiceWarning(warning: VoiceConsistencyWarning): UnifiedConsistencyIssue {
    return {
      id: warning.id,
      type: warning.type,
      severity: warning.severity,
      title: warning.title,
      description: warning.description,
      suggestion: warning.suggestion,
      startPos: warning.startPos,
      endPos: warning.endPos,
      text: warning.textSample,
      source: 'voice-service',
      metadata: {
        characterId: warning.characterId,
        characterName: warning.characterName,
        matchScore: warning.matchScore,
        deviations: warning.deviations,
      },
    };
  }

  /**
   * Sort and prioritize issues by severity and position
   */
  private sortAndPrioritizeIssues(issues: UnifiedConsistencyIssue[]): UnifiedConsistencyIssue[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return issues.sort((a, b) => {
      // First sort by severity (critical first)
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then sort by position in text (earlier issues first)
      return a.startPos - b.startPos;
    });
  }

  /**
   * Update current issues and notify callbacks
   */
  private updateIssues(issues: UnifiedConsistencyIssue[]): void {
    this.currentIssues = issues;

    // Notify all registered callbacks
    this.analysisCallbacks.forEach((callback) => {
      try {
        callback(issues);
      } catch (error) {
        console.error('Error in consistency analysis callback:', error);
      }
    });
  }

  /**
   * Get current issues
   */
  getCurrentIssues(): UnifiedConsistencyIssue[] {
    return [...this.currentIssues];
  }

  /**
   * Clear all current issues
   */
  clearIssues(): void {
    this.updateIssues([]);
  }

  /**
   * Resolve an issue by ID
   */
  resolveIssue(issueId: string): boolean {
    const newIssues = this.currentIssues.filter((issue) => issue.id !== issueId);
    if (newIssues.length !== this.currentIssues.length) {
      this.updateIssues(newIssues);
      return true;
    }
    return false;
  }

  /**
   * Helper methods
   */
  private stripHTML(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null;

    for (const [, { timestamp }] of this.cache) {
      if (oldestTimestamp === null || timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry: oldestTimestamp,
    };
  }
}

export const realTimeConsistencyCoordinator = new RealTimeConsistencyCoordinator();
