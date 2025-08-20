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
}

export interface GeneratedCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  motivation: string;
  conflict: string;
  arc: string;
}

class StoryArchitectService {
  private getPrompt(premise: StoryPremise): string {
    const lengthGuide = {
      short: '10,000-40,000 words (5-15 chapters)',
      novella: '40,000-70,000 words (15-25 chapters)',
      novel: '70,000-120,000 words (25-40 chapters)',
      epic: '120,000+ words (40+ chapters)',
    };

    return `You are a professional story architect. Generate a comprehensive outline for a ${premise.genre} story.

**STORY PREMISE:**
Title: ${premise.title}
Genre: ${premise.genre}
Target Length: ${lengthGuide[premise.targetLength]}
Tone: ${premise.tone}
${premise.setting ? `Setting: ${premise.setting}` : ''}
${premise.themes?.length ? `Themes: ${premise.themes.join(', ')}` : ''}

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
      "arc": "How they change throughout the story"
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
          "wordTarget": 800
        }
      ]
    }
  ]
}

**GUIDELINES:**
- Create ${premise.targetLength === 'short' ? '8-12' : premise.targetLength === 'novella' ? '15-20' : premise.targetLength === 'novel' ? '25-35' : '35-45'} chapters
- Each chapter should have 2-4 scenes
- Include 3-6 main characters with clear arcs
- Follow proper story structure (inciting incident by chapter 2-3, midpoint, climax near end)
- Make scenes actionable with clear conflict and purpose
- Ensure character motivations drive plot forward
- Balance action, dialogue, and introspection scenes

Your entire response must be valid JSON only. Do not include any text outside the JSON structure.`;
  }

  async generateOutline(premise: StoryPremise): Promise<GeneratedOutline> {
    try {
      console.log('🎯 Story Architect: Generating outline with real Claude API for:', premise.title);

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
          } catch (secondParseError) {
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
    const chapterCount = premise.targetLength === 'short' ? 8 : premise.targetLength === 'novella' ? 15 : 25;
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