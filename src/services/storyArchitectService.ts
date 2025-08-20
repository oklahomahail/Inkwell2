// src/services/storyArchitectService.ts
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
      console.log('Story Architect: Generating outline with real Claude API for:', premise.title);

      // Build the comprehensive prompt
      const prompt = this.getPrompt(premise);

      // Call the real Claude API
      const claudeResponse = await claudeService.sendMessage(prompt);

      // Extract the actual text response (handle different response formats)
      const responseText =
        typeof claudeResponse === 'string'
          ? claudeResponse
          : claudeResponse?.content || claudeResponse?.text || '';

      if (!responseText || !responseText.trim()) {
        throw new Error('Empty response from AI service');
      }

      console.log('Story Architect: Received response from Claude API');

      // Parse the JSON response
      let cleanResponse = responseText.trim();

      // Remove any markdown formatting
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      const parsedOutline: GeneratedOutline = JSON.parse(cleanResponse);

      // Validate the structure
      if (!parsedOutline.title || !parsedOutline.chapters || !parsedOutline.characters) {
        throw new Error('Invalid outline structure received from AI');
      }

      console.log('Story Architect: Successfully generated story outline');
      console.log(
        `Generated ${parsedOutline.chapters.length} chapters with ${parsedOutline.characters.length} characters`,
      );

      return parsedOutline;
    } catch (error) {
      console.error('Story Architect API Error:', error);

      // Provide helpful error messages and fallbacks
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Claude API key not configured. Please check your settings.');
        }
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          console.log('Story Architect: JSON parse error, falling back to mock...');
          // Fall back to mock generation if API response can't be parsed
          return this.generateMockOutline(premise);
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }

      throw new Error(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private generateMockOutline(premise: StoryPremise): GeneratedOutline {
    console.log('Using fallback mock generation for:', premise.title);

    // Generate a mock outline based on the premise
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
      chapters: [
        {
          title: 'The Beginning',
          summary: `Introduction to the world of ${premise.title} and its main character.`,
          plotFunction: 'Setup',
          wordTarget: Math.floor(
            premise.targetLength === 'short'
              ? 1500
              : premise.targetLength === 'novella'
                ? 2000
                : 2500,
          ),
          scenes: [
            {
              title: 'Opening Scene',
              summary: 'Establish the ordinary world and main character.',
              characters: ['Protagonist'],
              purpose: 'Character introduction and world-building',
              conflict: 'Hints of underlying tension or dissatisfaction',
              wordTarget: 800,
            },
            {
              title: 'The Call to Adventure',
              summary: 'Something disrupts the normal world.',
              characters: ['Protagonist', 'Ally'],
              purpose: 'Introduce the main conflict or opportunity',
              conflict: 'Character must make a difficult choice',
              wordTarget: 900,
            },
          ],
        },
        {
          title: 'The Journey',
          summary: 'Character embarks on their adventure and faces challenges.',
          plotFunction: 'Rising Action',
          wordTarget: Math.floor(
            premise.targetLength === 'short'
              ? 2000
              : premise.targetLength === 'novella'
                ? 2500
                : 3000,
          ),
          scenes: [
            {
              title: 'First Steps',
              summary: 'Character begins their journey with initial obstacles.',
              characters: ['Protagonist', 'Ally'],
              purpose: 'Show character growth and world exploration',
              conflict: 'Learning to navigate new challenges',
              wordTarget: 1000,
            },
            {
              title: 'Major Obstacle',
              summary: 'Character faces their biggest challenge yet.',
              characters: ['Protagonist', 'Antagonist'],
              purpose: 'Test character resolve and introduce main opposition',
              conflict: 'Direct confrontation with antagonistic force',
              wordTarget: 1200,
            },
          ],
        },
        {
          title: 'The Resolution',
          summary: 'Character overcomes the final challenge and finds resolution.',
          plotFunction: 'Climax',
          wordTarget: Math.floor(
            premise.targetLength === 'short'
              ? 1500
              : premise.targetLength === 'novella'
                ? 2000
                : 2500,
          ),
          scenes: [
            {
              title: 'Final Confrontation',
              summary: 'Character faces the ultimate test of their growth.',
              characters: ['Protagonist', 'Antagonist', 'Ally'],
              purpose: 'Resolve the main conflict',
              conflict: 'Everything the character has learned is put to the test',
              wordTarget: 1000,
            },
            {
              title: 'New Beginning',
              summary: 'Character returns to their world, transformed.',
              characters: ['Protagonist', 'Ally'],
              purpose: 'Show how the character has changed',
              conflict: 'Integration of lessons learned',
              wordTarget: 800,
            },
          ],
        },
      ],
    };

    return mockOutline;
  }

  // Convert generated outline to your existing project structure
  convertToProject(
    outline: GeneratedOutline,
    existingProject?: EnhancedProject,
  ): Partial<EnhancedProject> {
    // Convert to your Character type structure
    const characters: Character[] = outline.characters.map((char) => ({
      id: `char-${char.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: char.name,
      role: char.role,
      description: char.description,
      personality: [char.motivation, 'determined'], // Extract personality traits from motivation
      backstory: '', // Empty, user can fill in
      goals: char.motivation,
      conflicts: char.conflict,
      appearance: '', // Empty, user can fill in
      relationships: [], // Empty array, user can add relationships
      appearsInChapters: [], // Will be populated when chapters are created
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
      // Note: We'll create chapters/scenes in the next step
      updatedAt: Date.now(),
    };
  }

  private generateActs(outline: GeneratedOutline) {
    const chapters = outline.chapters;
    const totalChapters = chapters.length;

    // Standard 3-act structure
    const act1End = Math.floor(totalChapters * 0.25);
    const act2End = Math.floor(totalChapters * 0.75);

    return [
      {
        id: 'act-1',
        title: 'Act I - Setup',
        description: 'Introduce characters, world, and inciting incident',
        chapters: chapters.slice(0, act1End).map((ch) => ch.title),
        percentage: 25,
      },
      {
        id: 'act-2',
        title: 'Act II - Confrontation',
        description: 'Rising action, obstacles, and midpoint revelation',
        chapters: chapters.slice(act1End, act2End).map((ch) => ch.title),
        percentage: 50,
      },
      {
        id: 'act-3',
        title: 'Act III - Resolution',
        description: 'Climax, falling action, and resolution',
        chapters: chapters.slice(act2End).map((ch) => ch.title),
        percentage: 25,
      },
    ];
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
      charactersInChapter: [], // Will be populated based on scenes
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
}

export const storyArchitectService = new StoryArchitectService();
