// src/services/editorConsistencyDecorator.ts - Real-time consistency checking for editor
import { Node } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import type { EnhancedProject } from '@/types/project';
import type { Scene, Chapter } from '@/types/writing';
import { debounce } from '@/utils/debounce';
import { phraseAnalysisService } from '@/utils/textAnalysis';

import { voiceConsistencyService } from './voiceConsistencyService';

export interface EditorIssue {
  id: string;
  type: 'character' | 'voice' | 'phrase' | 'timeline' | 'world' | 'plot';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  startPos: number;
  endPos: number;
  text: string;
}

export interface ConsistencyDecorationOptions {
  enableCharacterChecks: boolean;
  enableVoiceChecks: boolean;
  enablePhraseChecks: boolean;
  enableTimelineChecks: boolean;
  debounceMs: number;
  minWordCount: number;
}

class EditorConsistencyDecorator {
  private currentIssues: EditorIssue[] = [];
  private decorations: DecorationSet = DecorationSet.empty;
  private analysisCallbacks: ((issues: EditorIssue[]) => void)[] = [];
  private defaultOptions: ConsistencyDecorationOptions = {
    enableCharacterChecks: true,
    enableVoiceChecks: true,
    enablePhraseChecks: true,
    enableTimelineChecks: false, // More expensive, disabled by default
    debounceMs: 1500,
    minWordCount: 50,
  };

  // Debounced analysis function
  private debouncedAnalyze = debounce(
    (
      content: string,
      project: EnhancedProject,
      scene: Scene,
      chapter: Chapter,
      options: ConsistencyDecorationOptions,
    ) => {
      this.performRealTimeAnalysis(content, project, scene, chapter, options);
    },
    this.defaultOptions.debounceMs,
  );

  /**
   * Analyze content and generate decorations for consistency issues
   */
  analyzeContent(
    content: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
    options: Partial<ConsistencyDecorationOptions> = {},
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
          options: ConsistencyDecorationOptions,
        ) => {
          this.performRealTimeAnalysis(content, project, scene, chapter, options);
        },
        options.debounceMs,
      );
    }

    // Skip if content too short
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
    if (wordCount < mergedOptions.minWordCount) {
      this.clearIssues();
      return;
    }

    this.debouncedAnalyze(content, project, scene, chapter, mergedOptions);
  }

  /**
   * Perform real-time consistency analysis
   */
  private async performRealTimeAnalysis(
    content: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
    options: ConsistencyDecorationOptions,
  ): Promise<void> {
    const issues: EditorIssue[] = [];
    const plainText = this.stripHTML(content);

    try {
      // Phrase hygiene checking (fast, local)
      if (options.enablePhraseChecks) {
        const phraseIssues = await this.analyzePhraseIssues(plainText, project.id);
        issues.push(...phraseIssues);
      }

      // Voice consistency checking (medium speed)
      if (options.enableVoiceChecks) {
        const voiceIssues = await this.analyzeVoiceIssues(plainText, project);
        issues.push(...voiceIssues);
      }

      // Character consistency checking (slower, AI-powered)
      if (options.enableCharacterChecks) {
        const characterIssues = await this.analyzeCharacterIssues(plainText, project);
        issues.push(...characterIssues);
      }

      // Timeline consistency checking (slowest, disabled by default)
      if (options.enableTimelineChecks) {
        const timelineIssues = await this.analyzeTimelineIssues(plainText, project);
        issues.push(...timelineIssues);
      }

      this.updateIssues(issues);
    } catch (error) {
      console.error('Real-time consistency analysis failed:', error);
      // Silently continue - don't interrupt the user's writing flow
    }
  }

  /**
   * Analyze phrase hygiene issues
   */
  private async analyzePhraseIssues(text: string, projectId: string): Promise<EditorIssue[]> {
    const issues: EditorIssue[] = [];

    try {
      const analysis = await phraseAnalysisService.analyzeText(text, projectId);

      analysis.phrases.forEach((phrase) => {
        let searchIndex = 0;

        // Calculate frequency per 1000 words
        const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
        const frequency = wordCount > 0 ? (phrase.count / wordCount) * 1000 : 0;

        // Find all occurrences of this phrase
        while (true) {
          const index = text.toLowerCase().indexOf(phrase.phrase.toLowerCase(), searchIndex);
          if (index === -1) break;

          const severity =
            phrase.severity === 'high' ? 'high' : phrase.severity === 'medium' ? 'medium' : 'low';

          issues.push({
            id: `phrase-${phrase.phrase}-${index}`,
            type: 'phrase',
            severity: severity as EditorIssue['severity'],
            title: `Overused phrase: "${phrase.phrase}"`,
            description: `This phrase appears ${phrase.count} times in your text (${frequency.toFixed(1)} per 1000 words)`,
            suggestion: `Consider using synonyms or rephrasing to avoid repetition`,
            startPos: index,
            endPos: index + phrase.phrase.length,
            text: phrase.phrase,
          });

          searchIndex = index + 1;
        }
      });
    } catch (error) {
      console.error('Phrase analysis failed:', error);
    }

    return issues;
  }

  /**
   * Analyze voice consistency issues
   */
  private async analyzeVoiceIssues(text: string, project: EnhancedProject): Promise<EditorIssue[]> {
    const issues: EditorIssue[] = [];

    try {
      // Extract dialogue from the scene
      const dialogueMatches = this.extractDialogue(text);

      for (const dialogue of dialogueMatches) {
        // Try to determine which character is speaking
        const speakingCharacter = this.identifyDialogueSpeaker(
          dialogue.text,
          text,
          dialogue.startPos,
        );

        if (speakingCharacter && project.characters.some((c) => c.name === speakingCharacter)) {
          // Analyze voice consistency for this character
          const voiceAnalysis = await voiceConsistencyService.analyzeCharacterDialogue(
            project.id,
            speakingCharacter,
            [dialogue.text],
          );

          if (voiceAnalysis.deviationScore > 0.7) {
            // High deviation
            issues.push({
              id: `voice-${speakingCharacter}-${dialogue.startPos}`,
              type: 'voice',
              severity: voiceAnalysis.deviationScore > 0.85 ? 'high' : 'medium',
              title: `Voice inconsistency: ${speakingCharacter}`,
              description: `This dialogue doesn't match ${speakingCharacter}'s established voice pattern`,
              suggestion: voiceAnalysis.suggestions[0] || 'Review character voice guidelines',
              startPos: dialogue.startPos,
              endPos: dialogue.endPos,
              text: dialogue.text,
            });
          }
        }
      }
    } catch (error) {
      console.error('Voice analysis failed:', error);
    }

    return issues;
  }

  /**
   * Analyze character consistency issues
   */
  private async analyzeCharacterIssues(
    text: string,
    project: EnhancedProject,
  ): Promise<EditorIssue[]> {
    const issues: EditorIssue[] = [];

    try {
      // For real-time checking, we focus on quick character trait contradictions
      const characterMentions = this.findCharacterMentions(
        text,
        project.characters.map((c) => c.name),
      );

      for (const mention of characterMentions) {
        // Quick trait consistency check
        const character = project.characters.find((c) => c.name === mention.characterName);
        if (!character) continue;

        // Check for obvious contradictions in the surrounding text
        const contextStart = Math.max(0, mention.startPos - 100);
        const contextEnd = Math.min(text.length, mention.endPos + 100);
        const context = text.slice(contextStart, contextEnd);

        const contradictions = this.findTraitContradictions(
          context,
          character,
          mention.characterName,
        );

        for (const contradiction of contradictions) {
          issues.push({
            id: `character-${character.name}-${mention.startPos}-${contradiction.type}`,
            type: 'character',
            severity: 'medium',
            title: `Character trait inconsistency: ${character.name}`,
            description: contradiction.description,
            suggestion: contradiction.suggestion,
            startPos: mention.startPos,
            endPos: mention.endPos,
            text: mention.text,
          });
        }
      }
    } catch (error) {
      console.error('Character analysis failed:', error);
    }

    return issues;
  }

  /**
   * Analyze timeline consistency issues (basic version for real-time)
   */
  private async analyzeTimelineIssues(
    text: string,
    project: EnhancedProject,
  ): Promise<EditorIssue[]> {
    const issues: EditorIssue[] = [];

    try {
      // Look for time-related phrases that might indicate timeline issues
      const timeMarkers = this.findTimeMarkers(text);

      // This is a basic implementation - more sophisticated timeline checking
      // would require full story context and is better done in batch analysis
      for (const marker of timeMarkers) {
        if (this.hasTimelineInconsistency(marker.text, project)) {
          issues.push({
            id: `timeline-${marker.startPos}`,
            type: 'timeline',
            severity: 'low',
            title: 'Potential timeline issue',
            description: `Time reference may need verification: "${marker.text}"`,
            suggestion: 'Check this time reference against your story timeline',
            startPos: marker.startPos,
            endPos: marker.endPos,
            text: marker.text,
          });
        }
      }
    } catch (error) {
      console.error('Timeline analysis failed:', error);
    }

    return issues;
  }

  /**
   * Helper: Strip HTML tags from content
   */
  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim();
  }

  /**
   * Helper: Extract dialogue from text
   */
  private extractDialogue(text: string): Array<{ text: string; startPos: number; endPos: number }> {
    const dialogues = [];
    const dialoguePattern = /"([^"]+)"/g;
    let match;

    while ((match = dialoguePattern.exec(text)) !== null) {
      if (match[1]) {
        dialogues.push({
          text: match[1],
          startPos: match.index,
          endPos: match.index + match[0].length,
        });
      }
    }

    return dialogues;
  }

  /**
   * Helper: Identify which character is speaking
   */
  private identifyDialogueSpeaker(
    dialogue: string,
    context: string,
    position: number,
  ): string | null {
    // Simple heuristic: look for character names in the surrounding text
    const beforeText = context.slice(Math.max(0, position - 50), position);
    const afterText = context.slice(position, Math.min(context.length, position + 50));

    // Look for patterns like "John said" or "Mary replied"
    const speakerPattern = /(\w+)\s+(said|replied|asked|whispered|shouted|exclaimed)/gi;
    const contextText = beforeText + afterText;
    const matches = contextText.match(speakerPattern);

    if (matches && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch) {
        const speakerMatch = lastMatch.match(/(\w+)\s+/);
        if (speakerMatch && speakerMatch[1]) {
          return speakerMatch[1];
        }
      }
    }

    return null;
  }

  /**
   * Helper: Find character mentions in text
   */
  private findCharacterMentions(
    text: string,
    characterNames: string[],
  ): Array<{ characterName: string; startPos: number; endPos: number; text: string }> {
    const mentions = [];

    for (const name of characterNames) {
      let searchIndex = 0;

      while (true) {
        const index = text.toLowerCase().indexOf(name.toLowerCase(), searchIndex);
        if (index === -1) break;

        mentions.push({
          characterName: name,
          startPos: index,
          endPos: index + name.length,
          text: name,
        });

        searchIndex = index + 1;
      }
    }

    return mentions.sort((a, b) => a.startPos - b.startPos);
  }

  /**
   * Helper: Find trait contradictions for a character
   */
  private findTraitContradictions(
    context: string,
    character: any,
    characterName: string,
  ): Array<{ type: string; description: string; suggestion: string }> {
    const contradictions = [];

    // This is a simple implementation - could be expanded with more sophisticated trait checking
    if (character.traits) {
      for (const trait of character.traits) {
        if (trait.type === 'physical' && trait.value) {
          // Check for physical trait contradictions
          const lowerContext = context.toLowerCase();
          const traitValue = trait.value.toLowerCase();

          if (
            trait.name === 'hair_color' &&
            lowerContext.includes(`${characterName.toLowerCase()} has`) &&
            !lowerContext.includes(traitValue)
          ) {
            contradictions.push({
              type: 'physical',
              description: `Text describes ${characterName}'s hair differently than established (${trait.value})`,
              suggestion: `Check that physical descriptions match the character bible entry for ${characterName}`,
            });
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Helper: Find time markers in text
   */
  private findTimeMarkers(text: string): Array<{ text: string; startPos: number; endPos: number }> {
    const markers = [];
    const timePatterns = [
      /\b(yesterday|today|tomorrow)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      /\b(\d{1,2}:\d{2}(?:\s*[ap]m)?)\b/gi,
      /\b(last|next|this)\s+(week|month|year|morning|afternoon|evening|night)\b/gi,
    ];

    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        markers.push({
          text: match[0],
          startPos: match.index,
          endPos: match.index + match[0].length,
        });
      }
    }

    return markers.sort((a, b) => a.startPos - b.startPos);
  }

  /**
   * Helper: Check for timeline inconsistencies (basic)
   */
  private hasTimelineInconsistency(timeReference: string, project: EnhancedProject): boolean {
    // This is a placeholder for more sophisticated timeline checking
    // In a real implementation, this would check against the project's timeline
    return false;
  }

  /**
   * Update current issues and notify listeners
   */
  private updateIssues(issues: EditorIssue[]): void {
    this.currentIssues = issues;
    this.notifyListeners();
  }

  /**
   * Clear all current issues
   */
  private clearIssues(): void {
    this.currentIssues = [];
    this.notifyListeners();
  }

  /**
   * Notify all registered listeners about issue updates
   */
  private notifyListeners(): void {
    this.analysisCallbacks.forEach((callback) => {
      try {
        callback(this.currentIssues);
      } catch (error) {
        console.error('Error notifying consistency analysis listener:', error);
      }
    });
  }

  /**
   * Register a callback to be notified when issues are updated
   */
  onIssuesUpdated(callback: (issues: EditorIssue[]) => void): () => void {
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
   * Get current issues
   */
  getCurrentIssues(): EditorIssue[] {
    return [...this.currentIssues];
  }

  /**
   * Generate TipTap decorations for current issues
   */
  generateDecorations(doc: Node): DecorationSet {
    const decorations: Decoration[] = [];

    for (const issue of this.currentIssues) {
      try {
        const decoration = Decoration.inline(issue.startPos, issue.endPos, {
          class: `consistency-issue consistency-issue--${issue.severity} consistency-issue--${issue.type}`,
          title: `${issue.title}: ${issue.description}`,
          'data-issue-id': issue.id,
        });

        decorations.push(decoration);
      } catch (error) {
        console.error('Error creating decoration for issue:', issue.id, error);
      }
    }

    return DecorationSet.create(doc, decorations);
  }
}

export const editorConsistencyDecorator = new EditorConsistencyDecorator();
export default editorConsistencyDecorator;
