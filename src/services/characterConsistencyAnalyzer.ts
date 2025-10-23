// src/services/characterConsistencyAnalyzer.ts
// Character trait and behavior consistency checking

import type { EnhancedProject } from '@/types/project';
import type { Scene, Chapter } from '@/types/writing';

import claudeService from './claudeService';

export interface CharacterTraitIssue {
  id: string;
  characterId: string;
  characterName: string;
  type:
    | 'personality-contradiction'
    | 'behavior-inconsistency'
    | 'voice-mismatch'
    | 'relationship-conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  textSegment: string;
  startPos: number;
  endPos: number;
  evidence: {
    established: string; // Previously established trait/behavior
    contradicting: string; // Current contradicting behavior
    location: string; // Where the contradiction occurs
  };
}

export interface CharacterAnalysisResult {
  issues: CharacterTraitIssue[];
  confidence: 'low' | 'medium' | 'high';
  analysisTime: number;
  charactersAnalyzed: string[]; // character IDs
}

type ClaudeResponse = { content: string } | { content?: string };

class CharacterConsistencyAnalyzer {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { result: CharacterAnalysisResult; timestamp: number }>();

  /**
   * Analyze character consistency in a scene using AI-powered analysis
   */
  async analyzeCharacterConsistency(
    text: string,
    project: EnhancedProject,
    scene: Scene,
    chapter: Chapter,
  ): Promise<CharacterAnalysisResult> {
    const cacheKey = `${project.id}-${scene.id}-${this.hashText(text)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    const startTime = Date.now();

    try {
      // Extract character references from the current text
      const characterReferences = this.extractCharacterReferences(text, project);
      if (characterReferences.length === 0) {
        const emptyResult: CharacterAnalysisResult = {
          issues: [],
          confidence: 'high',
          analysisTime: Date.now() - startTime,
          charactersAnalyzed: [],
        };
        return emptyResult;
      }

      // Build character and scene context for AI analysis
      const characterContext = this.buildCharacterContext(project, characterReferences);
      const sceneContext = this.buildSceneContext(scene, chapter, project);

      // Generate AI prompt
      const prompt = this.buildCharacterAnalysisPrompt(
        text,
        characterContext,
        sceneContext,
        characterReferences,
        project,
      );

      if (!claudeService.isConfigured()) {
        throw new Error('Claude API not configured');
      }

      // Send to Claude for analysis
      const response = (await claudeService.sendMessage(prompt, {
        maxTokens: 3000,
        projectContext: `${characterContext}\n\n${sceneContext}`,
      })) as ClaudeResponse;

      // Parse the AI response
      const issues = await this.parseCharacterAnalysisResponse(
        response?.content || '',
        text,
        project,
      );

      const result: CharacterAnalysisResult = {
        issues,
        confidence: issues.length > 0 ? 'high' : 'medium',
        analysisTime: Date.now() - startTime,
        charactersAnalyzed: characterReferences,
      };

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Character consistency analysis failed:', error);

      // Return empty result on error to not interrupt writing flow
      return {
        issues: [],
        confidence: 'low',
        analysisTime: Date.now() - startTime,
        charactersAnalyzed: [],
      };
    }
  }

  /**
   * Extract character names mentioned in the text
   */
  private extractCharacterReferences(text: string, project: EnhancedProject): string[] {
    const references = new Set<string>();
    const plainText = this.stripHTML(text);

    (project.characters ?? []).forEach((character) => {
      const name = (character.name || '').toLowerCase();
      if (!name) return;

      const regex = new RegExp(`\\b${this.escapeRegex(name)}\\b`, 'gi');
      if (regex.test(plainText)) {
        references.add(character.id);
      }

      // Check for simple possible aliases (nicknames, first name)
      const possibleAliases = this.extractPossibleAliases(character.name || '');
      possibleAliases.forEach((alias) => {
        const aliasRegex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
        if (aliasRegex.test(plainText)) {
          references.add(character.id);
        }
      });
    });

    return Array.from(references);
  }

  /**
   * Build character context for AI analysis
   */
  private buildCharacterContext(project: EnhancedProject, characterIds: string[]): string {
    const relevantCharacters = (project.characters ?? []).filter((c) =>
      characterIds.includes(c.id),
    );

    const context: string[] = ['CHARACTER PROFILES:'];
    relevantCharacters.forEach((char) => {
      context.push(`\n**${char.name}** (${char.role ?? 'Unspecified Role'}):`);
      if (char.description) context.push(`Description: ${char.description}`);
      if (Array.isArray(char.personality) && char.personality.length > 0) {
        context.push(`Personality Traits: ${char.personality.join(', ')}`);
      }
      if (char.goals) context.push(`Goals/Motivations: ${char.goals}`);
      if (char.conflicts) context.push(`Internal/External Conflicts: ${char.conflicts}`);
      if (char.backstory) context.push(`Backstory: ${char.backstory}`);

      // Relationships
      if (Array.isArray(char.relationships) && char.relationships.length > 0) {
        const relationshipInfo = char.relationships
          .map(
            (rel) =>
              `${rel.relationshipType} with ${this.getCharacterName(project, rel.characterId)}: ${rel.description}`,
          )
          .join('; ');
        context.push(`Relationships: ${relationshipInfo}`);
      }
    });

    return context.join('\n');
  }

  /**
   * Build scene context for analysis
   */
  private buildSceneContext(scene: Scene, chapter: Chapter, project: EnhancedProject): string {
    return [
      'SCENE CONTEXT:',
      `Project: ${project.name}`,
      `Chapter: ${chapter.title}`,
      `Scene: ${scene.title}`,
      `Scene Summary: ${scene.summary || 'No summary available'}`,
      '',
      'STORY CONTEXT:',
      `Genre: ${project.genre || 'Unspecified'}`,
      `Target Audience: ${project.targetAudience || 'General'}`,
      `Project Description: ${project.description || 'No description'}`,
    ].join('\n');
  }

  /**
   * Build AI prompt for character analysis
   */
  private buildCharacterAnalysisPrompt(
    text: string,
    characterContext: string,
    sceneContext: string,
    characterIds: string[],
    project: EnhancedProject,
  ): string {
    const focusNames =
      characterIds
        .map((id) => this.getCharacterNameById(project, id))
        .filter(Boolean)
        .join(', ') || 'N/A';

    return `You are a Character Consistency Guardian, an expert at identifying character trait contradictions and behavioral inconsistencies in creative writing.

${characterContext}

${sceneContext}

SCENE TEXT TO ANALYZE:
"""
${text}
"""

ANALYSIS TASK:
Analyze the scene text for any character consistency issues. Look for:
1. Personality Contradictions: Characters acting against their established personality traits
2. Behavioral Inconsistencies: Characters behaving in ways that contradict their established patterns
3. Voice/Dialogue Mismatches: Characters speaking in ways that don't match their established voice
4. Relationship Conflicts: Character interactions that contradict established relationships

Focus on characters: ${focusNames}

Respond with a JSON array of issues found. Use this EXACT structure:
[
  {
    "characterName": "Character Name",
    "type": "personality-contradiction|behavior-inconsistency|voice-mismatch|relationship-conflict",
    "severity": "low|medium|high|critical",
    "title": "Brief issue description",
    "description": "Detailed explanation of the inconsistency",
    "suggestion": "Specific recommendation to fix the issue",
    "textSegment": "Exact text that contains the issue",
    "evidence": {
      "established": "Previously established trait/behavior",
      "contradicting": "Current contradicting behavior",
      "location": "Where this issue occurs in the scene"
    }
  }
]

Return an empty array [] if no consistency issues are found. Be thorough but focus on significant inconsistencies that would break character believability.`;
  }

  /**
   * Parse AI response into structured issues
   */
  private async parseCharacterAnalysisResponse(
    response: string,
    originalText: string,
    project: EnhancedProject,
  ): Promise<CharacterTraitIssue[]> {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON found in character analysis response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        console.warn('Parsed character analysis response is not an array');
        return [];
      }

      const issues: CharacterTraitIssue[] = [];
      const plainText = this.stripHTML(originalText);

      parsed.forEach((issue: any, i: number) => {
        if (!issue?.characterName || !issue?.textSegment) return;

        // Find the character by name (case-insensitive)
        const character = (project.characters ?? []).find(
          (c) => (c.name || '').toLowerCase() === String(issue.characterName).toLowerCase(),
        );
        if (!character) return;

        // Find the position of the text segment
        const segmentIndex = plainText
          .toLowerCase()
          .indexOf(String(issue.textSegment).toLowerCase());
        if (segmentIndex === -1) return;

        issues.push({
          id: `character-${character.id}-${i}-${Date.now()}`,
          characterId: character.id,
          characterName: character.name,
          type: issue.type || ('personality-contradiction' as CharacterTraitIssue['type']),
          severity: issue.severity || 'medium',
          title: issue.title || `Character consistency issue for ${character.name}`,
          description: issue.description || 'Character behavior inconsistency detected',
          suggestion: issue.suggestion || 'Review character traits and adjust behavior accordingly',
          textSegment: issue.textSegment,
          startPos: segmentIndex,
          endPos: segmentIndex + String(issue.textSegment).length,
          evidence: {
            established: issue.evidence?.established || 'Previously established trait',
            contradicting: issue.evidence?.contradicting || 'Current contradicting behavior',
            location: issue.evidence?.location || 'Current scene',
          },
        });
      });

      return issues;
    } catch (error) {
      console.error('Failed to parse character analysis response:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private stripHTML(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
  }

  private extractPossibleAliases(name: string): string[] {
    const aliases: string[] = [];
    const parts = name.split(' ');

    // First name only
    if (parts.length > 1 && parts[0]) {
      aliases.push(parts[0]);
    }

    // Common nickname patterns
    const firstName = parts[0];
    if (firstName && firstName.endsWith('y') && firstName.length > 3) {
      aliases.push(firstName.slice(0, -1) + 'ie'); // Bobby -> Bobbie
    }

    return aliases;
  }

  private getCharacterName(project: EnhancedProject, characterId: string): string {
    const character = (project.characters ?? []).find((char) => char.id === characterId);
    return character ? character.name : 'Unknown Character';
  }

  private getCharacterNameById(project: EnhancedProject, characterId: string): string {
    const character = (project.characters ?? []).find((c) => c.id === characterId);
    return character?.name || `Character-${characterId}`;
  }
}

export const characterConsistencyAnalyzer = new CharacterConsistencyAnalyzer();
