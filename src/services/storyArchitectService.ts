// src/services/storyArchitectService.ts - UPDATED WITH REAL API
import claudeService from './claudeService';

import type { Character, EnhancedProject } from '../types/project';

export interface StoryPremise {
  title: string;
  genre: string;
  premise: string;
  targetLength: 'short' | 'novella' | 'novel' | 'epic';
  tone: string;
  themes?: string[];
  setting?: string;
  // Enhanced character-driven options
  focusType?: 'plot-driven' | 'character-driven' | 'balanced';
  povStyle?: 'single-pov' | 'dual-pov' | 'multi-pov' | 'alternating-pov';
  characterCount?: 'minimal' | 'moderate' | 'ensemble';
  relationshipFocus?: string[]; // Types of relationships to emphasize
  characterDevelopmentDepth?: 'light' | 'moderate' | 'deep';
  narrativePerspective?: 'first-person' | 'third-limited' | 'third-omniscient' | 'mixed';
}

export interface GeneratedOutline {
  title: string;
  genre: string;
  summary: string;
  chapters: GeneratedChapter[];
  characters: GeneratedCharacter[];
  themes: string[];
  plotPoints: string[];
}

export interface GeneratedChapter {
  title: string;
  summary: string;
  scenes: GeneratedScene[];
  wordTarget: number;
  plotFunction: string; // Setup, Rising Action, Climax, etc.
}

export interface GeneratedScene {
  title: string;
  summary: string;
  characters: string[];
  purpose: string;
  conflict: string;
  wordTarget: number;
  // Enhanced multi-POV properties
  povCharacter?: string; // Primary POV for this scene
  povType?: 'first-person' | 'third-limited' | 'third-omniscient' | 'second-person';
  emotionalArc?: SceneEmotionalArc;
  characterGrowth?: SceneCharacterGrowth[];
  relationships?: SceneRelationshipDevelopment[];
  atmospherics?: SceneAtmospherics;
  plotThreads?: string[]; // Which plot threads this scene advances
}

export interface SceneEmotionalArc {
  opening: string; // Emotional state at scene start
  climax: string; // Peak emotional moment
  closing: string; // Emotional resolution
  tension: 'low' | 'medium' | 'high' | 'climactic';
}

export interface SceneCharacterGrowth {
  character: string;
  growthType: 'realization' | 'skill' | 'relationship' | 'belief' | 'fear';
  description: string;
  impact: 'setup' | 'development' | 'breakthrough' | 'setback';
}

export interface SceneRelationshipDevelopment {
  characters: [string, string]; // Two characters in relationship
  development: 'introduction' | 'bonding' | 'conflict' | 'resolution' | 'separation';
  description: string;
}

export interface SceneAtmospherics {
  setting: string;
  mood: string;
  sensoryDetails: string[];
  symbolism?: string;
}

export interface GeneratedCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  motivation: string;
  conflict: string;
  arc: string;
  // Enhanced character arc properties
  arcStages?: CharacterArcStage[];
  internalConflict?: string;
  externalConflict?: string;
  relationships?: CharacterRelationship[];
  voiceProfile?: CharacterVoice;
  povChapters?: number[]; // Which chapters this character has POV in
  growthMoments?: GrowthMoment[];
}

export interface CharacterArcStage {
  chapter: number;
  stage:
    | 'introduction'
    | 'inciting_incident'
    | 'first_plot_point'
    | 'midpoint'
    | 'crisis'
    | 'climax'
    | 'resolution';
  description: string;
  internalState: string;
  externalChallenge: string;
  growth: string;
}

export interface CharacterRelationship {
  withCharacter: string;
  type: 'ally' | 'enemy' | 'mentor' | 'love_interest' | 'rival' | 'family' | 'neutral';
  dynamics: string;
  arcInfluence: string; // How this relationship affects character growth
}

export interface CharacterVoice {
  vocabulary: 'formal' | 'casual' | 'technical' | 'poetic' | 'streetwise';
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  emotionalExpression: 'direct' | 'reserved' | 'dramatic' | 'subtle';
  speechPatterns: string[];
  distinctiveTraits: string[];
}

export interface GrowthMoment {
  chapter: number;
  scene: string;
  catalyst: string; // What triggers the growth
  realization: string; // What the character learns
  actionChange: string; // How their behavior changes
  impact: 'minor' | 'moderate' | 'major';
}

class StoryArchitectService {
  private getPrompt(premise: StoryPremise): string {
    const lengthGuide = {
      short: '10,000-40,000 words (5-15 chapters)',
      novella: '40,000-70,000 words (15-25 chapters)',
      novel: '70,000-120,000 words (25-40 chapters)',
      epic: '120,000+ words (40+ chapters)',
    };

    const characterGuidance = this.getCharacterGenerationGuidance(premise);
    const povGuidance = this.getPOVGuidance(premise);

    return `You are a professional story architect specializing in character-driven narratives. Generate a comprehensive outline for a ${premise.genre} story with deep character development and compelling arcs.

**STORY PREMISE:**
Title: ${premise.title}
Genre: ${premise.genre}
Target Length: ${lengthGuide[premise.targetLength]}
Tone: ${premise.tone}
${premise.setting ? `Setting: ${premise.setting}` : ''}
${premise.themes?.length ? `Themes: ${premise.themes.join(', ')}` : ''}
${characterGuidance}
${povGuidance}

**PREMISE:**
${premise.premise}

Please respond with a JSON object containing a complete story outline. Use this EXACT structure:

{
  "title": "Generated title (can refine the provided one)",
  "genre": "${premise.genre}",
  "summary": "2-3 sentence story summary",
  "themes": ["theme1", "theme2", "theme3"],
  "plotPoints": ["key plot point 1", "key plot point 2", "etc"],
  "characters": [
    {
      "name": "Character Name",
      "role": "protagonist|antagonist|supporting|minor",
      "description": "Physical and personality description",
      "motivation": "What drives this character",
      "conflict": "Internal or external conflict",
      "arc": "How they change throughout the story",
      "internalConflict": "Character's internal struggle or flaw",
      "externalConflict": "External obstacles they face",
      "povChapters": [1, 3, 5],
      "voiceProfile": {
        "vocabulary": "formal|casual|technical|poetic|streetwise",
        "sentenceLength": "short|medium|long|varied",
        "emotionalExpression": "direct|reserved|dramatic|subtle",
        "speechPatterns": ["distinctive phrases or habits"],
        "distinctiveTraits": ["unique voice characteristics"]
      },
      "arcStages": [
        {
          "chapter": 1,
          "stage": "introduction|inciting_incident|first_plot_point|midpoint|crisis|climax|resolution",
          "description": "What happens to character in this stage",
          "internalState": "Character's emotional/mental state",
          "externalChallenge": "External challenge they face",
          "growth": "How they grow or change"
        }
      ],
      "relationships": [
        {
          "withCharacter": "Other Character Name",
          "type": "ally|enemy|mentor|love_interest|rival|family|neutral",
          "dynamics": "How they interact",
          "arcInfluence": "How this relationship affects character growth"
        }
      ]
    }
  ],
  "chapters": [
    {
      "title": "Chapter Title",
      "summary": "2-3 sentence chapter summary",
      "plotFunction": "Setup|Inciting Incident|Rising Action|Midpoint|Climax|Falling Action|Resolution",
      "wordTarget": 2500,
      "scenes": [
        {
          "title": "Scene Title",
          "summary": "1-2 sentence scene description",
          "characters": ["Character 1", "Character 2"],
          "purpose": "What this scene accomplishes for the story",
          "conflict": "The tension/conflict in this scene",
          "wordTarget": 800,
          "povCharacter": "Character Name",
          "povType": "first-person|third-limited|third-omniscient",
          "emotionalArc": {
            "opening": "Starting emotional state",
            "climax": "Peak emotional moment",
            "closing": "Emotional resolution",
            "tension": "low|medium|high|climactic"
          },
          "characterGrowth": [
            {
              "character": "Character Name",
              "growthType": "realization|skill|relationship|belief|fear",
              "description": "What growth occurs",
              "impact": "setup|development|breakthrough|setback"
            }
          ],
          "atmospherics": {
            "setting": "Where scene takes place",
            "mood": "Overall scene mood",
            "sensoryDetails": ["sight", "sound", "smell details"],
            "symbolism": "Optional symbolic elements"
          },
          "plotThreads": ["which plot threads this scene advances"]
        }
      ]
    }
  ]
}

**GUIDELINES:**
- Create ${premise.targetLength === 'short' ? '8-12' : premise.targetLength === 'novella' ? '15-20' : premise.targetLength === 'novel' ? '25-35' : '35-45'} chapters
- Each chapter should have 2-4 scenes with specific POV assignments
- Include detailed character arcs with development stages across story structure
- Generate ${characterGuidance.includes('minimal') ? '2-3' : characterGuidance.includes('moderate') ? '4-6' : '6-8'} main characters with rich psychological depth
- Follow proper story structure aligned with character growth milestones
- Assign POV characters strategically based on story needs and character arcs
- Include detailed character relationships that influence growth and conflict
- Create distinct voice profiles for each major character
- Map character internal/external conflicts to plot progression
- Ensure each scene serves both plot advancement and character development
- Balance emotional arcs with plot beats
- Include sensory details and atmospheric elements in each scene
- Design character growth moments that feel earned and authentic

Your entire response must be valid JSON only. Do not include any text outside the JSON structure.`;
  }

  async generateOutline(premise: StoryPremise): Promise<GeneratedOutline> {
    try {
      console.log(
        '🎯 Story Architect: Generating outline with real Claude API for:',
        premise.title,
      );

      // Validate Claude service is configured
      if (!claudeService.isConfigured()) {
        throw new Error('Claude API key not configured. Please check your settings.');
      }

      // Build the comprehensive prompt
      const prompt = this.getPrompt(premise);

      // 🔧 Use the new dedicated story generation method
      const claudeResponse = await claudeService.generateStoryOutline(prompt);

      if (!claudeResponse || !claudeResponse.trim()) {
        throw new Error('Empty response from AI service');
      }

      console.log('✅ Story Architect: Received response from Claude API');

      // Parse the JSON response with better error handling
      let cleanResponse = claudeResponse.trim();

      // Remove markdown formatting if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      // Additional cleanup for common Claude formatting
      cleanResponse = cleanResponse.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

      let parsedOutline: GeneratedOutline;

      try {
        parsedOutline = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw response:', claudeResponse);
        console.log('Cleaned response:', cleanResponse);

        // Try to extract JSON from the response if it's embedded in text
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedOutline = JSON.parse(jsonMatch[0]);
            console.log('🔧 Successfully extracted JSON from response');
          } catch (__secondParseError) {
            throw new Error('Could not parse JSON from Claude response. Please try again.');
          }
        } else {
          throw new Error('No valid JSON found in Claude response. Please try again.');
        }
      }

      // Validate the structure
      if (!parsedOutline.title || !parsedOutline.chapters || !parsedOutline.characters) {
        console.warn('Invalid outline structure:', parsedOutline);
        throw new Error('Invalid outline structure received from AI. Please try again.');
      }

      // Additional validation
      if (!Array.isArray(parsedOutline.chapters) || parsedOutline.chapters.length === 0) {
        throw new Error('No chapters generated. Please try again.');
      }

      if (!Array.isArray(parsedOutline.characters) || parsedOutline.characters.length === 0) {
        throw new Error('No characters generated. Please try again.');
      }

      console.log('🎉 Story Architect: Successfully generated story outline');
      console.log(
        `Generated ${parsedOutline.chapters.length} chapters with ${parsedOutline.characters.length} characters`,
      );

      // Post-process to enhance character arcs and POV assignments
      this.enhanceGeneratedOutline(parsedOutline, premise);

      return parsedOutline;
    } catch (error) {
      console.error('❌ Story Architect API Error:', error);

      // Provide helpful error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Claude API key not configured. Please set your API key in settings.');
        }
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          // For JSON errors, fall back to mock generation so users aren't stuck
          console.log('⚠️ JSON parsing failed, falling back to mock generation');
          return this.generateMockOutline(premise);
        }
      }

      throw new Error(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    }
  }

  private generateMockOutline(premise: StoryPremise): GeneratedOutline {
    console.log('🔄 Using fallback mock generation for:', premise.title);

    const mockOutline: GeneratedOutline = {
      title: premise.title,
      genre: premise.genre,
      summary: `A ${premise.genre.toLowerCase()} story about ${premise.premise}`,
      themes: premise.themes || ['adventure', 'discovery', 'growth'],
      plotPoints: [
        `Introduce the main character in ${premise.setting || 'their world'}`,
        'Present the inciting incident that changes everything',
        'Character faces obstacles and learns important lessons',
        'Climactic confrontation with the main conflict',
        'Resolution and character transformation',
      ],
      characters: [
        {
          name: 'Protagonist',
          role: 'protagonist',
          description: `A determined individual navigating ${premise.genre.toLowerCase()} challenges`,
          motivation: 'To overcome obstacles and achieve their goal',
          conflict: 'Internal struggle between fear and courage',
          arc: 'Grows from uncertain to confident',
        },
        {
          name: 'Ally',
          role: 'supporting',
          description: 'Loyal companion who provides support',
          motivation: 'To help the protagonist succeed',
          conflict: 'Balancing their own needs with loyalty',
          arc: 'Learns the value of true friendship',
        },
        {
          name: 'Antagonist',
          role: 'antagonist',
          description: 'Force opposing the protagonist',
          motivation: 'To maintain control or achieve opposing goals',
          conflict: 'Represents the main obstacle to overcome',
          arc: 'Either defeated or redeemed by story end',
        },
      ],
      chapters: this.generateMockChapters(premise),
    };

    return mockOutline;
  }

  private generateMockChapters(premise: StoryPremise): GeneratedChapter[] {
    const chapterCount =
      premise.targetLength === 'short' ? 8 : premise.targetLength === 'novella' ? 15 : 25;
    const chapters: GeneratedChapter[] = [];

    for (let i = 0; i < chapterCount; i++) {
      const isBeginning = i < 3;
      const isMiddle = i >= 3 && i < chapterCount - 3;
      const isEnd = i >= chapterCount - 3;

      let plotFunction = 'Rising Action';
      if (isBeginning) plotFunction = i === 0 ? 'Setup' : 'Inciting Incident';
      if (isMiddle && i === Math.floor(chapterCount / 2)) plotFunction = 'Midpoint';
      if (isEnd) plotFunction = i === chapterCount - 1 ? 'Resolution' : 'Climax';

      chapters.push({
        title: `Chapter ${i + 1}`,
        summary: `Chapter ${i + 1} continues the story progression.`,
        plotFunction,
        wordTarget: premise.targetLength === 'short' ? 1500 : 2500,
        scenes: [
          {
            title: `Scene ${i + 1}.1`,
            summary: 'Opening scene of the chapter.',
            characters: ['Protagonist'],
            purpose: 'Advance the plot',
            conflict: 'Character faces a challenge',
            wordTarget: 800,
          },
          {
            title: `Scene ${i + 1}.2`,
            summary: 'Continuation of chapter events.',
            characters: ['Protagonist', 'Ally'],
            purpose: 'Character development',
            conflict: 'Internal or interpersonal tension',
            wordTarget: 700,
          },
        ],
      });
    }

    return chapters;
  }

  // Convert generated outline to your existing project structure
  convertToProject(
    outline: GeneratedOutline,
    existingProject?: EnhancedProject,
  ): Partial<EnhancedProject> {
    const characters: Character[] = outline.characters.map((char) => ({
      id: `char-${char.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: char.name,
      role: char.role,
      description: char.description,
      personality: [char.motivation, 'determined'],
      backstory: '',
      goals: char.motivation,
      conflicts: char.conflict,
      appearance: '',
      relationships: [],
      appearsInChapters: [],
      notes: `Character Arc: ${char.arc}\n\nGenerated by Story Architect`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    return {
      ...existingProject,
      name: outline.title,
      genre: outline.genre,
      description: outline.summary,
      characters,
      updatedAt: Date.now(),
    };
  }

  // Generate chapters and scenes for the writing editor
  generateChaptersAndScenes(outline: GeneratedOutline) {
    return outline.chapters.map((chapter, index) => ({
      id: `chapter-${index + 1}`,
      title: chapter.title,
      summary: chapter.summary,
      content: `# ${chapter.title}\n\n*${chapter.summary}*\n\n*Plot Function: ${chapter.plotFunction}*\n\n---\n\n[Write your chapter here...]`,
      wordCount: 0,
      targetWordCount: chapter.wordTarget,
      status: 'planned' as const,
      order: index + 1,
      charactersInChapter: [],
      plotPointsResolved: [],
      notes: `Generated by Story Architect\nPlot Function: ${chapter.plotFunction}\nTarget Words: ${chapter.wordTarget}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scenes: chapter.scenes.map((scene, sceneIndex) => ({
        id: `scene-${index + 1}-${sceneIndex + 1}`,
        title: scene.title,
        content: `# ${scene.title}\n\n*${scene.summary}*\n\n*Characters: ${scene.characters.join(', ')}*\n\n*Purpose: ${scene.purpose}*\n\n*Conflict: ${scene.conflict}*\n\n---\n\n[Write your scene here...]`,
        summary: scene.summary,
        characters: scene.characters,
        purpose: scene.purpose,
        conflict: scene.conflict,
        wordTarget: scene.wordTarget,
        wordCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
    }));
  }

  // Helper method to validate story architect request
  validateRequest(premise: Partial<StoryPremise>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!premise.premise?.trim()) {
      errors.push('Story premise is required');
    }

    if (!premise.genre?.trim()) {
      errors.push('Genre is required');
    }

    if (!premise.tone?.trim()) {
      errors.push('Tone is required');
    }

    if (!premise.targetLength) {
      errors.push('Story length is required');
    }

    if (premise.premise && premise.premise.length < 10) {
      errors.push('Premise should be at least 10 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to estimate generation time
  getEstimatedGenerationTime(length: string): number {
    const times = {
      short: 45, // 45 seconds
      novella: 60, // 1 minute
      novel: 90, // 1.5 minutes
      epic: 120, // 2 minutes
    };
    return times[length as keyof typeof times] || 60;
  }

  // Enhanced character generation guidance
  private getCharacterGenerationGuidance(premise: StoryPremise): string {
    const focusType = premise.focusType || 'balanced';
    const characterCount = premise.characterCount || 'moderate';
    const developmentDepth = premise.characterDevelopmentDepth || 'moderate';

    let guidance = `\n**CHARACTER FOCUS:** ${focusType}`;
    guidance += `\n**CHARACTER COUNT:** ${characterCount}`;
    guidance += `\n**DEVELOPMENT DEPTH:** ${developmentDepth}`;

    if (premise.relationshipFocus?.length) {
      guidance += `\n**RELATIONSHIP FOCUS:** ${premise.relationshipFocus.join(', ')}`;
    }

    return guidance;
  }

  // POV guidance for generation
  private getPOVGuidance(premise: StoryPremise): string {
    const povStyle = premise.povStyle || 'single-pov';
    const perspective = premise.narrativePerspective || 'third-limited';

    let guidance = `\n**POV STYLE:** ${povStyle}`;
    guidance += `\n**NARRATIVE PERSPECTIVE:** ${perspective}`;

    switch (povStyle) {
      case 'single-pov':
        guidance += '\n**POV INSTRUCTIONS:** Maintain single POV throughout, usually protagonist';
        break;
      case 'dual-pov':
        guidance +=
          '\n**POV INSTRUCTIONS:** Alternate between two main characters, balanced distribution';
        break;
      case 'multi-pov':
        guidance +=
          '\n**POV INSTRUCTIONS:** Use 3-4 POV characters, ensure each serves story purpose';
        break;
      case 'alternating-pov':
        guidance +=
          '\n**POV INSTRUCTIONS:** Systematic POV switching, clear pattern per chapter/scene';
        break;
    }

    return guidance;
  }

  // Enhanced character arc generation
  private generateCharacterArcStages(
    character: GeneratedCharacter,
    totalChapters: number,
  ): CharacterArcStage[] {
    const stages: CharacterArcStage[] = [];
    const keyPoints = {
      introduction: 1,
      inciting_incident: Math.ceil(totalChapters * 0.15),
      first_plot_point: Math.ceil(totalChapters * 0.25),
      midpoint: Math.ceil(totalChapters * 0.5),
      crisis: Math.ceil(totalChapters * 0.75),
      climax: Math.ceil(totalChapters * 0.9),
      resolution: totalChapters,
    };

    Object.entries(keyPoints).forEach(([stage, chapter]) => {
      stages.push({
        chapter,
        stage: stage as CharacterArcStage['stage'],
        description: this.getStageDescription(stage, character),
        internalState: this.getInternalState(stage, character),
        externalChallenge: this.getExternalChallenge(stage, character),
        growth: this.getGrowthDescription(stage, character),
      });
    });

    return stages;
  }

  private getStageDescription(stage: string, character: GeneratedCharacter): string {
    const templates = {
      introduction: `Introduce ${character.name} in their normal world`,
      inciting_incident: `${character.name} encounters the call to adventure`,
      first_plot_point: `${character.name} commits to the journey`,
      midpoint: `${character.name} faces a major revelation or setback`,
      crisis: `${character.name} confronts their deepest fear`,
      climax: `${character.name} makes final stand against opposition`,
      resolution: `${character.name} emerges transformed`,
    };
    return (
      templates[stage as keyof typeof templates] || `${character.name} continues their journey`
    );
  }

  private getInternalState(stage: string, _character: GeneratedCharacter): string {
    const states = {
      introduction: 'Comfortable but restless',
      inciting_incident: 'Confused and resistant',
      first_plot_point: 'Determined but uncertain',
      midpoint: 'Struggling with doubt',
      crisis: 'Facing inner demons',
      climax: 'Fully committed and clear',
      resolution: 'Peaceful and changed',
    };
    return states[stage as keyof typeof states] || 'Continuing growth';
  }

  private getExternalChallenge(stage: string, character: GeneratedCharacter): string {
    return `External obstacles related to ${character.conflict}`;
  }

  private getGrowthDescription(stage: string, character: GeneratedCharacter): string {
    return `Character development aligned with ${character.arc}`;
  }

  // Enhanced POV assignment for scenes
  private assignPOVToScenes(chapters: GeneratedChapter[], characters: GeneratedCharacter[]): void {
    const povCharacters = characters.filter((c) => c.povChapters && c.povChapters.length > 0);

    chapters.forEach((chapter, chapterIndex) => {
      const chapterNum = chapterIndex + 1;
      const povChar = povCharacters.find((c) => c.povChapters?.includes(chapterNum));

      chapter.scenes.forEach((scene) => {
        if (!scene.povCharacter && povChar) {
          scene.povCharacter = povChar.name;
          scene.povType = 'third-limited'; // Default, could be customized
        }
      });
    });
  }

  // Enhance generated outline with additional character arc details
  private enhanceGeneratedOutline(outline: GeneratedOutline, premise: StoryPremise): void {
    // Enhance characters with missing arc stages if not provided by AI
    outline.characters.forEach((character) => {
      if (!character.arcStages || character.arcStages.length === 0) {
        character.arcStages = this.generateCharacterArcStages(character, outline.chapters.length);
      }

      // Fill in missing POV chapters if not specified
      if (!character.povChapters || character.povChapters.length === 0) {
        character.povChapters = this.assignPOVChapters(character, outline.chapters.length, premise);
      }

      // Generate missing relationships
      if (!character.relationships) {
        character.relationships = this.generateCharacterRelationships(
          character,
          outline.characters,
        );
      }

      // Create voice profile if missing
      if (!character.voiceProfile) {
        character.voiceProfile = this.generateVoiceProfile(character);
      }
    });

    // Assign POV to scenes that don't have it
    this.assignPOVToScenes(outline.chapters, outline.characters);

    // Enhance scenes with missing emotional arcs
    outline.chapters.forEach((chapter) => {
      chapter.scenes.forEach((scene) => {
        if (!scene.emotionalArc) {
          scene.emotionalArc = this.generateSceneEmotionalArc(scene, chapter);
        }

        if (!scene.characterGrowth) {
          scene.characterGrowth = this.generateSceneCharacterGrowth(scene, outline.characters);
        }

        if (!scene.atmospherics) {
          scene.atmospherics = this.generateSceneAtmospherics(scene);
        }
      });
    });
  }

  // Helper methods for enhancement
  private assignPOVChapters(
    character: GeneratedCharacter,
    totalChapters: number,
    premise: StoryPremise,
  ): number[] {
    const povStyle = premise.povStyle || 'single-pov';
    const chapters: number[] = [];

    switch (povStyle) {
      case 'single-pov':
        if (character.role === 'protagonist') {
          // Protagonist gets most/all chapters
          chapters.push(...Array.from({ length: totalChapters }, (_, i) => i + 1));
        }
        break;
      case 'dual-pov':
        if (character.role === 'protagonist' || character.role === 'antagonist') {
          // Alternate chapters between two main characters
          const isFirst = character.role === 'protagonist';
          for (let i = isFirst ? 1 : 2; i <= totalChapters; i += 2) {
            chapters.push(i);
          }
        }
        break;
      case 'multi-pov':
      case 'alternating-pov':
        if (character.role !== 'minor') {
          // Distribute chapters among main characters
          const chapterSpread = Math.ceil(totalChapters / 4); // Assuming 4 POV chars max
          const startChapter =
            character.role === 'protagonist' ? 1 : character.role === 'antagonist' ? 2 : 3;
          for (let i = startChapter; i <= totalChapters; i += chapterSpread) {
            chapters.push(i);
          }
        }
        break;
    }

    return chapters;
  }

  private generateCharacterRelationships(
    character: GeneratedCharacter,
    allCharacters: GeneratedCharacter[],
  ): CharacterRelationship[] {
    const relationships: CharacterRelationship[] = [];

    allCharacters.forEach((otherChar) => {
      if (otherChar.name !== character.name) {
        const relationshipType = this.determineRelationshipType(character, otherChar);
        if (relationshipType !== 'neutral' || Math.random() > 0.5) {
          // Include some neutral relationships
          relationships.push({
            withCharacter: otherChar.name,
            type: relationshipType,
            dynamics: `Complex relationship dynamics between ${character.name} and ${otherChar.name}`,
            arcInfluence: `This relationship helps ${character.name} grow by challenging their ${character.conflict}`,
          });
        }
      }
    });

    return relationships;
  }

  private determineRelationshipType(
    char1: GeneratedCharacter,
    char2: GeneratedCharacter,
  ): CharacterRelationship['type'] {
    if (char1.role === 'protagonist' && char2.role === 'antagonist') return 'enemy';
    if (char1.role === 'antagonist' && char2.role === 'protagonist') return 'enemy';
    if (char2.role === 'supporting') return 'ally';
    return 'neutral';
  }

  private generateVoiceProfile(character: GeneratedCharacter): CharacterVoice {
    // Generate voice profile based on character role and description
    const profiles = {
      protagonist: {
        vocabulary: 'casual',
        sentenceLength: 'varied',
        emotionalExpression: 'direct',
      },
      antagonist: { vocabulary: 'formal', sentenceLength: 'long', emotionalExpression: 'dramatic' },
      supporting: { vocabulary: 'casual', sentenceLength: 'medium', emotionalExpression: 'subtle' },
      minor: { vocabulary: 'casual', sentenceLength: 'short', emotionalExpression: 'reserved' },
    };

    const baseProfile = profiles[character.role as keyof typeof profiles] || profiles.supporting;

    return {
      vocabulary: baseProfile.vocabulary as CharacterVoice['vocabulary'],
      sentenceLength: baseProfile.sentenceLength as CharacterVoice['sentenceLength'],
      emotionalExpression: baseProfile.emotionalExpression as CharacterVoice['emotionalExpression'],
      speechPatterns: [`Distinctive ${character.role} speech patterns`],
      distinctiveTraits: [
        `Voice traits reflecting ${(character as any).personality || 'their nature'}`,
      ],
    };
  }

  private generateSceneEmotionalArc(
    scene: GeneratedScene,
    _chapter: GeneratedChapter,
  ): SceneEmotionalArc {
    return {
      opening: 'Scene opens with establishing mood',
      climax: `Peak tension: ${scene.conflict}`,
      closing: 'Resolution leading to next scene',
      tension: scene.purpose.includes('climax')
        ? 'climactic'
        : scene.conflict.includes('major')
          ? 'high'
          : 'medium',
    };
  }

  private generateSceneCharacterGrowth(
    scene: GeneratedScene,
    _characters: GeneratedCharacter[],
  ): SceneCharacterGrowth[] {
    return scene.characters.map((charName) => ({
      character: charName,
      growthType: 'realization',
      description: `${charName} experiences growth through ${scene.purpose}`,
      impact: 'development',
    }));
  }

  private generateSceneAtmospherics(scene: GeneratedScene): SceneAtmospherics {
    return {
      setting: 'Scene setting details',
      mood: scene.conflict.includes('tense') ? 'tense' : 'contemplative',
      sensoryDetails: ['Visual details', 'Audio atmosphere', 'Emotional undertones'],
      symbolism: 'Symbolic elements that reinforce themes',
    };
  }

  // Check if Claude is available for story generation
  isAvailable(): boolean {
    return claudeService.isConfigured();
  }

  // Get helpful error message for setup
  getSetupMessage(): string {
    if (!claudeService.isConfigured()) {
      return 'To use Story Architect, please configure your Claude API key in Settings. You can get an API key from https://console.anthropic.com/';
    }
    return '';
  }
}

export const storyArchitectService = new StoryArchitectService();
