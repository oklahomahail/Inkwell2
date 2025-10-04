// src/services/advancedCharacterConsistencyAnalyzer.ts
// Advanced character consistency analysis with relationships, traits, and evolution tracking

import claudeService from './claudeService';
import { voiceConsistencyService } from './voiceConsistencyService';

import type { GeneratedCharacter } from './storyArchitectService';
import type { EnhancedProject } from '../types/project';

export interface CharacterTraitContradiction {
  id: string;
  characterId: string;
  characterName: string;
  traitType: 'physical' | 'personality' | 'background' | 'skill' | 'preference';
  originalTrait: string;
  contradictingText: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    chapterId?: string;
    sceneId?: string;
    position?: number;
  };
  suggestion: string;
  confidence: number; // 0-1
  context: string;
}

export interface CharacterRelationshipInconsistency {
  id: string;
  characterA: string;
  characterB: string;
  relationshipType:
    | 'romantic'
    | 'friendship'
    | 'family'
    | 'professional'
    | 'antagonistic'
    | 'unknown';
  inconsistencyType:
    | 'sudden_change'
    | 'contradictory_interaction'
    | 'missing_development'
    | 'timeline_error';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    chapterId?: string;
    sceneId?: string;
  };
  suggestion: string;
}

export interface CharacterVoiceEvolution {
  characterId: string;
  characterName: string;
  timeline: Array<{
    chapterId: string;
    chapterTitle: string;
    voiceMetrics: {
      avgSentenceLength: number;
      vocabularyRichness: number;
      formalityLevel: number;
      emotionalTone: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    sampleSize: number;
    deviationFromBaseline: number;
  }>;
  overallTrend: 'consistent' | 'gradual_change' | 'abrupt_change' | 'erratic';
  recommendations: string[];
}

export interface AdvancedCharacterReport {
  projectId: string;
  characterId: string;
  characterName: string;
  generatedAt: number;
  traitContradictions: CharacterTraitContradiction[];
  relationshipIssues: CharacterRelationshipInconsistency[];
  voiceEvolution: CharacterVoiceEvolution;
  overallConsistencyScore: number; // 0-100
  recommendations: string[];
}

class AdvancedCharacterConsistencyAnalyzer {
  private readonly STORAGE_KEY = 'advanced_character_analysis';

  /**
   * Perform comprehensive character consistency analysis
   */
  async analyzeCharacterConsistency(
    project: EnhancedProject,
    characterId: string,
    options: {
      includeRelationships?: boolean;
      includeVoiceEvolution?: boolean;
      deepAnalysis?: boolean;
    } = {},
  ): Promise<AdvancedCharacterReport> {
    const {
      includeRelationships = true,
      includeVoiceEvolution = true,
      deepAnalysis = false,
    } = options;

    const character = project.characters.find((c) => c.id === characterId);
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    console.log(`Starting advanced analysis for character: ${character.name}`);

    // Run parallel analyses
    const [traitContradictions, relationshipIssues, voiceEvolution] = await Promise.all([
      this.analyzeTraitContradictions(project, character, deepAnalysis),
      includeRelationships
        ? this.analyzeRelationshipConsistency(project, character)
        : Promise.resolve([]),
      includeVoiceEvolution
        ? this.analyzeVoiceEvolution(project, character)
        : Promise.resolve(this.createEmptyVoiceEvolution(character)),
    ]);

    // Calculate overall consistency score
    const overallConsistencyScore = this.calculateOverallScore(
      traitContradictions,
      relationshipIssues,
      voiceEvolution,
    );

    // Generate recommendations
    const recommendations = this.generateAdvancedRecommendations(
      traitContradictions,
      relationshipIssues,
      voiceEvolution,
    );

    const report: AdvancedCharacterReport = {
      projectId: project.id,
      characterId: character.id,
      characterName: character.name,
      generatedAt: Date.now(),
      traitContradictions,
      relationshipIssues,
      voiceEvolution,
      overallConsistencyScore,
      recommendations,
    };

    // Cache the report
    this.saveReport(report);

    return report;
  }

  /**
   * Analyze character trait contradictions using AI
   */
  private async analyzeCharacterTraits(
    project: EnhancedProject,
    character: GeneratedCharacter,
    deepAnalysis: boolean = false,
  ): Promise<CharacterTraitContradiction[]> {
    if (!claudeService.isConfigured()) {
      console.warn('Claude not configured, skipping trait contradiction analysis');
      return [];
    }

    try {
      const characterProfile = this.buildCharacterProfile(character);
      const storyContent = this.extractCharacterContent(project, character.id);

      const prompt = this.buildTraitAnalysisPrompt(
        character,
        characterProfile,
        storyContent,
        deepAnalysis,
      );

      const response = await claudeService.sendMessage(prompt, {
        maxTokens: deepAnalysis ? 3000 : 1500,
        // Low temperature for factual analysis
      });

      return this.parseTraitContradictions(response);
    } catch (error) {
      console.error('Trait contradiction analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze relationship consistency between characters
   */
  private async analyzeRelationshipConsistency(
    project: EnhancedProject,
    character: GeneratedCharacter,
  ): Promise<CharacterRelationshipInconsistency[]> {
    if (!claudeService.isConfigured()) {
      return [];
    }

    try {
      const relationships = this.extractCharacterRelationships(project, character.id);
      if (relationships.length === 0) {
        return [];
      }

      const prompt = this.buildRelationshipAnalysisPrompt(character, relationships, project);

      const response = await claudeService.sendMessage(prompt, {
        maxTokens: 2000,
        // Low temperature for consistency
      });

      return this.parseRelationshipIssues(response);
    } catch (error) {
      console.error('Relationship analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze character voice evolution across chapters
   */
  private async analyzeVoiceEvolution(
    project: EnhancedProject,
    character: GeneratedCharacter,
  ): Promise<CharacterVoiceEvolution> {
    try {
      const chapterData = [];

      // Analyze each chapter for this character's voice
      for (const chapter of project.chapters) {
        const dialogue = this.extractCharacterDialogue(chapter.content, character.name);

        if (dialogue.length > 0) {
          const voiceMetrics = await this.analyzeChapterVoice(
            project.id,
            character,
            dialogue,
            chapter.id,
          );

          chapterData.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            voiceMetrics,
            sampleSize: dialogue.join(' ').split(' ').length,
            deviationFromBaseline: 0, // Will calculate after baseline
          });
        }
      }

      // Calculate baseline and deviations
      const baseline = this.calculateVoiceBaseline(chapterData);
      chapterData.forEach((data) => {
        data.deviationFromBaseline = this.calculateVoiceDeviation(data.voiceMetrics, baseline);
      });

      const overallTrend = this.determineVoiceTrend(chapterData);
      const recommendations = this.generateVoiceRecommendations(chapterData, overallTrend);

      return {
        characterId: character.id,
        characterName: character.name,
        timeline: chapterData,
        overallTrend,
        recommendations,
      };
    } catch (error) {
      console.error('Voice evolution analysis failed:', error);
      return this.createEmptyVoiceEvolution(character);
    }
  }

  /**
   * Build detailed character profile for analysis
   */
  private buildCharacterProfile(character: GeneratedCharacter): string {
    const profile = [];

    profile.push(`CHARACTER: ${character.name}`);
    profile.push(`ROLE: ${character.role}`);
    profile.push(`DESCRIPTION: ${character.description}`);

    if (character.personality?.length > 0) {
      profile.push(`PERSONALITY TRAITS: ${character.personality.join(', ')}`);
    }

    if (character.goals) {
      profile.push(`GOALS: ${character.goals}`);
    }

    if (character.conflicts) {
      profile.push(`CONFLICTS: ${character.conflicts}`);
    }

    if (character.background) {
      profile.push(`BACKGROUND: ${character.background}`);
    }

    if (character.physicalDescription) {
      profile.push(`PHYSICAL DESCRIPTION: ${character.physicalDescription}`);
    }

    return profile.join('\n');
  }

  /**
   * Extract content relevant to a specific character
   */
  private extractCharacterContent(project: EnhancedProject, characterId: string): string {
    const character = project.characters.find((c) => c.id === characterId);
    if (!character) return '';

    const content = [];

    for (const chapter of project.chapters) {
      const chapterText = chapter.content.replace(/<[^>]*>/g, '');

      // Find sections where this character is mentioned or speaking
      const characterMentions = this.findCharacterSections(chapterText, character.name);

      characterMentions.forEach((section, index) => {
        content.push(`CHAPTER ${chapter.title} - Section ${index + 1}:\n${section}\n`);
      });
    }

    return content.join('\n');
  }

  /**
   * Find sections of text where a character is mentioned or active
   */
  private findCharacterSections(text: string, characterName: string): string[] {
    const sections = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const characterLower = characterName.toLowerCase();

    let currentSection = '';
    let sectionLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const sentenceLower = sentence.toLowerCase();

      if (
        sentenceLower.includes(characterLower) ||
        sentenceLower.includes('"') || // Potential dialogue
        (currentSection && sectionLength < 3)
      ) {
        // Continue short sections

        currentSection += sentence + '. ';
        sectionLength++;

        // End section if it gets long or we hit a clear break
        if (
          sectionLength >= 5 ||
          (i < sentences.length - 1 && !sentences[i + 1].toLowerCase().includes(characterLower))
        ) {
          if (currentSection.length > 50) {
            sections.push(currentSection.trim());
          }
          currentSection = '';
          sectionLength = 0;
        }
      } else if (currentSection) {
        // End current section
        if (currentSection.length > 50) {
          sections.push(currentSection.trim());
        }
        currentSection = '';
        sectionLength = 0;
      }
    }

    // Add final section if any
    if (currentSection.length > 50) {
      sections.push(currentSection.trim());
    }

    return sections;
  }

  /**
   * Build trait analysis prompt for Claude
   */
  private buildTraitAnalysisPrompt(
    character: Character,
    profile: string,
    storyContent: string,
    deepAnalysis: boolean,
  ): string {
    return `You are an expert literary character analyst. Analyze the following character for trait contradictions and inconsistencies.

CHARACTER PROFILE:
${profile}

STORY CONTENT FEATURING THIS CHARACTER:
${storyContent}

Please analyze this content and identify any contradictions or inconsistencies in the character's traits, behavior, or established characteristics.

${
  deepAnalysis
    ? `
PERFORM DEEP ANALYSIS including:
- Subtle personality inconsistencies
- Behavioral pattern deviations
- Skill level contradictions
- Physical description conflicts
- Background/history contradictions
- Dialogue/voice inconsistencies
`
    : `
FOCUS ON MAJOR CONTRADICTIONS:
- Clear personality contradictions
- Obvious physical description conflicts
- Major behavioral inconsistencies
`
}

Respond with a JSON array of contradictions using this EXACT structure:

[
  {
    "traitType": "physical|personality|background|skill|preference",
    "originalTrait": "Description of established trait",
    "contradictingText": "Text that contradicts the trait", 
    "severity": "low|medium|high|critical",
    "confidence": 0.85,
    "context": "Brief context where contradiction occurs",
    "suggestion": "How to resolve this contradiction"
  }
]

Focus on actual contradictions, not character development or growth. Your entire response must be valid JSON only.`;
  }

  /**
   * Build relationship analysis prompt
   */
  private buildRelationshipAnalysisPrompt(
    character: Character,
    relationships: any[],
    project: EnhancedProject,
  ): string {
    const relationshipText = relationships
      .map((r) => `${character.name} with ${r.otherCharacter}: ${r.interactions.join(' ... ')}`)
      .join('\n\n');

    return `Analyze the relationship consistency for ${character.name} in this story.

RELATIONSHIPS TO ANALYZE:
${relationshipText}

PROJECT CONTEXT:
${project.name} - ${project.description}

Look for relationship inconsistencies such as:
- Sudden unexplained relationship changes
- Contradictory interactions between characters
- Missing relationship development
- Timeline errors in relationships

Respond with a JSON array using this structure:

[
  {
    "characterB": "Other character name",
    "relationshipType": "romantic|friendship|family|professional|antagonistic|unknown",
    "inconsistencyType": "sudden_change|contradictory_interaction|missing_development|timeline_error",
    "description": "Description of the inconsistency",
    "severity": "low|medium|high|critical",
    "suggestion": "How to fix this relationship issue"
  }
]

Your entire response must be valid JSON only.`;
  }

  /**
   * Parse trait contradictions from Claude response
   */
  private parseTraitContradictions(response: any): CharacterTraitContradiction[] {
    try {
      const responseText =
        typeof response === 'string' ? response : response.content || response.text || '';

      // Clean response
      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(cleanResponse);

      if (!Array.isArray(parsed)) {
        console.warn('Invalid response format for trait contradictions');
        return [];
      }

      return parsed.map((item, index) => ({
        id: `trait-${Date.now()}-${index}`,
        characterId: '', // Will be set by caller
        characterName: '', // Will be set by caller
        traitType: item.traitType || 'personality',
        originalTrait: item.originalTrait || 'Unknown trait',
        contradictingText: item.contradictingText || 'No text provided',
        severity: item.severity || 'medium',
        location: {},
        suggestion: item.suggestion || 'Review this contradiction',
        confidence: item.confidence || 0.5,
        context: item.context || 'No context provided',
      }));
    } catch (error) {
      console.error('Failed to parse trait contradictions:', error);
      return [];
    }
  }

  /**
   * Parse relationship issues from Claude response
   */
  private parseRelationshipIssues(response: any): CharacterRelationshipInconsistency[] {
    try {
      const responseText =
        typeof response === 'string' ? response : response.content || response.text || '';

      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(cleanResponse);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item, index) => ({
        id: `relationship-${Date.now()}-${index}`,
        characterA: '', // Will be set by caller
        characterB: item.characterB || 'Unknown character',
        relationshipType: item.relationshipType || 'unknown',
        inconsistencyType: item.inconsistencyType || 'contradictory_interaction',
        description: item.description || 'Relationship inconsistency detected',
        severity: item.severity || 'medium',
        location: {},
        suggestion: item.suggestion || 'Review this relationship',
      }));
    } catch (error) {
      console.error('Failed to parse relationship issues:', error);
      return [];
    }
  }

  /**
   * Extract character relationships from project
   */
  private extractCharacterRelationships(project: EnhancedProject, characterId: string): any[] {
    // This is a simplified version - could be enhanced with more sophisticated relationship detection
    const character = project.characters.find((c) => c.id === characterId);
    if (!character) return [];

    const relationships = [];

    // Look for interactions with other characters in the story content
    for (const chapter of project.chapters) {
      const interactions = this.findCharacterInteractions(
        chapter.content,
        character.name,
        project.characters,
      );
      relationships.push(...interactions);
    }

    return relationships;
  }

  /**
   * Find character interactions in text
   */
  private findCharacterInteractions(
    text: string,
    characterName: string,
    allCharacters: Character[],
  ): any[] {
    const interactions = [];
    const otherCharacters = allCharacters.filter((c) => c.name !== characterName);

    for (const otherChar of otherCharacters) {
      const interactionTexts = this.findInteractionsBetweenCharacters(
        text,
        characterName,
        otherChar.name,
      );

      if (interactionTexts.length > 0) {
        interactions.push({
          otherCharacter: otherChar.name,
          interactions: interactionTexts,
        });
      }
    }

    return interactions;
  }

  /**
   * Find text sections where two characters interact
   */
  private findInteractionsBetweenCharacters(text: string, char1: string, char2: string): string[] {
    const interactions = [];
    const sentences = text.split(/[.!?]+/);

    let currentInteraction = '';
    let hasChar1 = false;
    let hasChar2 = false;

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();

      if (lowerSentence.includes(char1.toLowerCase())) hasChar1 = true;
      if (lowerSentence.includes(char2.toLowerCase())) hasChar2 = true;

      currentInteraction += sentence + '. ';

      if (hasChar1 && hasChar2 && currentInteraction.length > 100) {
        interactions.push(currentInteraction.trim());
        currentInteraction = '';
        hasChar1 = false;
        hasChar2 = false;
      } else if (currentInteraction.length > 500) {
        // Reset if interaction gets too long without both characters
        currentInteraction = '';
        hasChar1 = false;
        hasChar2 = false;
      }
    }

    return interactions.slice(0, 5); // Limit to 5 interactions
  }

  /**
   * Extract dialogue for a character from text
   */
  private extractCharacterDialogue(text: string, characterName: string): string[] {
    const dialogue = [];
    const dialoguePattern = /[""]([^""]+)[""]|"([^"]+)"/g;
    let match;

    while ((match = dialoguePattern.exec(text)) !== null) {
      const quotedText = match[1] || match[2];

      // Look for character name in surrounding text
      const beforeText = text.substring(Math.max(0, match.index - 100), match.index);
      const afterText = text.substring(
        match.index + match[0].length,
        match.index + match[0].length + 100,
      );
      const context = (beforeText + afterText).toLowerCase();

      if (context.includes(characterName.toLowerCase())) {
        dialogue.push(quotedText);
      }
    }

    return dialogue;
  }

  /**
   * Analyze voice metrics for a character in a chapter
   */
  private async analyzeChapterVoice(
    projectId: string,
    character: Character,
    dialogue: string[],
    chapterId: string,
  ): Promise<any> {
    // Use voice consistency service to analyze
    const voiceAnalysis = await voiceConsistencyService.analyzeCharacterDialogue(
      projectId,
      character.name,
      dialogue,
    );

    // Convert to our format
    return {
      avgSentenceLength: dialogue.join(' ').split(/[.!?]+/).length / dialogue.length,
      vocabularyRichness: this.calculateVocabularyRichness(dialogue.join(' ')),
      formalityLevel: this.calculateFormalityLevel(dialogue.join(' ')),
      emotionalTone: this.determineEmotionalTone(dialogue.join(' ')),
      confidence: Math.min(dialogue.length / 10, 1), // Based on sample size
    };
  }

  /**
   * Calculate vocabulary richness (type-token ratio)
   */
  private calculateVocabularyRichness(text: string): number {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const uniqueWords = new Set(words);
    return words.length > 0 ? uniqueWords.size / words.length : 0;
  }

  /**
   * Calculate formality level based on word choice
   */
  private calculateFormalityLevel(text: string): number {
    const formalWords = /\b(furthermore|moreover|consequently|nevertheless|however|therefore)\b/gi;
    const casualWords = /\b(yeah|okay|gonna|wanna|kinda|sorta|ain't)\b/gi;
    const contractions = /\b\w+'(t|re|ve|ll|d)\b/g;

    const formalCount = (text.match(formalWords) || []).length;
    const casualCount = (text.match(casualWords) || []).length;
    const contractionCount = (text.match(contractions) || []).length;

    const words = text.split(/\s+/).length;
    const formalScore = (formalCount / words) * 100;
    const casualScore = ((casualCount + contractionCount) / words) * 100;

    return Math.max(0, Math.min(1, (formalScore - casualScore + 5) / 10));
  }

  /**
   * Determine emotional tone of text
   */
  private determineEmotionalTone(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = /\b(happy|joy|love|great|wonderful|amazing|good|excellent|fantastic)\b/gi;
    const negativeWords = /\b(sad|angry|hate|terrible|awful|bad|horrible|disgusting|furious)\b/gi;
    const exclamations = /!/g;
    const questions = /\?/g;

    const positiveCount = (text.match(positiveWords) || []).length;
    const negativeCount = (text.match(negativeWords) || []).length;
    const exclamationCount = (text.match(exclamations) || []).length;

    if (positiveCount > negativeCount || exclamationCount > 2) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Calculate voice baseline from chapter data
   */
  private calculateVoiceBaseline(chapterData: any[]): any {
    if (chapterData.length === 0) {
      return {
        avgSentenceLength: 0,
        vocabularyRichness: 0,
        formalityLevel: 0.5,
        confidence: 0,
      };
    }

    return {
      avgSentenceLength:
        chapterData.reduce((sum, d) => sum + d.voiceMetrics.avgSentenceLength, 0) /
        chapterData.length,
      vocabularyRichness:
        chapterData.reduce((sum, d) => sum + d.voiceMetrics.vocabularyRichness, 0) /
        chapterData.length,
      formalityLevel:
        chapterData.reduce((sum, d) => sum + d.voiceMetrics.formalityLevel, 0) / chapterData.length,
      confidence:
        chapterData.reduce((sum, d) => sum + d.voiceMetrics.confidence, 0) / chapterData.length,
    };
  }

  /**
   * Calculate voice deviation from baseline
   */
  private calculateVoiceDeviation(voiceMetrics: any, baseline: any): number {
    const lengthDiff = Math.abs(voiceMetrics.avgSentenceLength - baseline.avgSentenceLength);
    const richnessDiff = Math.abs(voiceMetrics.vocabularyRichness - baseline.vocabularyRichness);
    const formalityDiff = Math.abs(voiceMetrics.formalityLevel - baseline.formalityLevel);

    return (lengthDiff + richnessDiff + formalityDiff) / 3;
  }

  /**
   * Determine overall voice trend
   */
  private determineVoiceTrend(
    chapterData: any[],
  ): 'consistent' | 'gradual_change' | 'abrupt_change' | 'erratic' {
    if (chapterData.length < 3) return 'consistent';

    const deviations = chapterData.map((d) => d.deviationFromBaseline);
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

    if (avgDeviation < 0.1) return 'consistent';

    // Check for gradual vs abrupt changes
    let gradualChanges = 0;
    let abruptChanges = 0;

    for (let i = 1; i < deviations.length; i++) {
      const change = Math.abs(deviations[i] - deviations[i - 1]);
      if (change > 0.2) abruptChanges++;
      else if (change > 0.05) gradualChanges++;
    }

    if (abruptChanges > gradualChanges) return 'abrupt_change';
    if (gradualChanges > 0) return 'gradual_change';
    return 'erratic';
  }

  /**
   * Generate voice recommendations
   */
  private generateVoiceRecommendations(chapterData: any[], trend: string): string[] {
    const recommendations = [];

    switch (trend) {
      case 'abrupt_change':
        recommendations.push('Consider smoothing sudden changes in character voice');
        recommendations.push('Review major voice shifts for proper story justification');
        break;
      case 'erratic':
        recommendations.push('Work on maintaining consistent character voice patterns');
        recommendations.push('Consider creating a voice guide for this character');
        break;
      case 'gradual_change':
        recommendations.push('Voice evolution looks natural - good character development');
        break;
      default:
        recommendations.push('Character voice is well-maintained throughout the story');
    }

    return recommendations;
  }

  /**
   * Create empty voice evolution for characters with insufficient data
   */
  private createEmptyVoiceEvolution(character: Character): CharacterVoiceEvolution {
    return {
      characterId: character.id,
      characterName: character.name,
      timeline: [],
      overallTrend: 'consistent',
      recommendations: ['Not enough dialogue data for voice analysis'],
    };
  }

  /**
   * Calculate overall consistency score
   */
  private calculateOverallScore(
    traitContradictions: CharacterTraitContradiction[],
    relationshipIssues: CharacterRelationshipInconsistency[],
    voiceEvolution: CharacterVoiceEvolution,
  ): number {
    let score = 100;

    // Deduct for trait contradictions
    traitContradictions.forEach((contradiction) => {
      switch (contradiction.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    // Deduct for relationship issues
    relationshipIssues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          score -= 12;
          break;
        case 'high':
          score -= 8;
          break;
        case 'medium':
          score -= 4;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    // Deduct for voice inconsistency
    if (voiceEvolution.overallTrend === 'abrupt_change') score -= 10;
    else if (voiceEvolution.overallTrend === 'erratic') score -= 8;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate advanced recommendations
   */
  private generateAdvancedRecommendations(
    traitContradictions: CharacterTraitContradiction[],
    relationshipIssues: CharacterRelationshipInconsistency[],
    voiceEvolution: CharacterVoiceEvolution,
  ): string[] {
    const recommendations = [];

    if (traitContradictions.length > 0) {
      recommendations.push('Review character bible to resolve trait contradictions');
      if (traitContradictions.some((t) => t.severity === 'critical')) {
        recommendations.push('Address critical trait contradictions immediately');
      }
    }

    if (relationshipIssues.length > 0) {
      recommendations.push('Develop character relationship arcs more consistently');
    }

    if (
      voiceEvolution.overallTrend === 'abrupt_change' ||
      voiceEvolution.overallTrend === 'erratic'
    ) {
      recommendations.push('Work on maintaining consistent character voice');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent character consistency! Keep up the good work.');
    }

    return recommendations;
  }

  /**
   * Save character analysis report
   */
  private saveReport(report: AdvancedCharacterReport): void {
    try {
      const reports = this.getStoredReports();
      const key = `${report.projectId}-${report.characterId}`;
      reports[key] = report;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save advanced character report:', error);
    }
  }

  /**
   * Get stored character analysis reports
   */
  private getStoredReports(): Record<string, AdvancedCharacterReport> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load stored reports:', error);
      return {};
    }
  }

  /**
   * Get character analysis report
   */
  getReport(projectId: string, characterId: string): AdvancedCharacterReport | null {
    const reports = this.getStoredReports();
    const key = `${projectId}-${characterId}`;
    return reports[key] || null;
  }

  /**
   * Get all reports for a project
   */
  getProjectReports(projectId: string): AdvancedCharacterReport[] {
    const reports = this.getStoredReports();
    return Object.values(reports).filter((report) => report.projectId === projectId);
  }

  /**
   * Clear reports for a project
   */
  clearProjectReports(projectId: string): void {
    try {
      const reports = this.getStoredReports();
      const filteredReports = Object.fromEntries(
        Object.entries(reports).filter(([key, report]) => report.projectId !== projectId),
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredReports));
    } catch (error) {
      console.error('Failed to clear project reports:', error);
    }
  }
}

export const advancedCharacterConsistencyAnalyzer = new AdvancedCharacterConsistencyAnalyzer();
