// @ts-nocheck
// src/test/syntheticCorpusGenerator.ts
import type { EnhancedProject, Character, ProjectChapter, ProjectScene } from '@/types/project';
import type { Scene, Chapter } from '@/types/writing';
import devLog from "@/utils/devLog";

export interface CorpusSettings {
  targetWordCount: number; // 150,000 words
  chapterCount: number; // 40-60 chapters
  sceneCount: number; // 700-1200 scenes
  characterCount: number; // 15-25 characters
  seed?: number; // For reproducible generation
}

// Convert Chapter/Scene status to ProjectChapter/ProjectScene status
type ProjectStatus = 'completed' | 'planned' | 'in-progress';

const convertStatus = (status: string): ProjectStatus => {
  switch (status) {
    case 'complete':
      return 'completed';
    case 'draft':
      return 'planned';
    case 'in_progress':
    case 'in-progress':
      return 'in-progress';
    default:
      return 'planned';
  }
};

export interface GeneratedCorpus {
  project: EnhancedProject;
  chapters: Chapter[];
  characters: Character[];
  stats: {
    totalWords: number;
    totalScenes: number;
    totalChapters: number;
    averageWordsPerScene: number;
    averageWordsPerChapter: number;
  };
}

// Writing pattern templates based on your sample
const SCENE_PATTERNS = {
  dialogue: [
    '"[CHARACTER_NAME]!" [CHARACTER_NAME] called out as [ACTION]. "[DIALOGUE_LINE]!"',
    '"[DIALOGUE_LINE]," [CHARACTER_NAME] mumbled, [ACTION].',
    '[CHARACTER_NAME] straightened up. "[DIALOGUE_LINE]"',
    '"[DIALOGUE_LINE]?" [CHARACTER_NAME] wondered. "[FOLLOW_UP]"',
    '"[DIALOGUE_LINE]," [CHARACTER_NAME] replied, [ACTION].',
  ],

  action: [
    '[CHARACTER_NAME] weaved between [LOCATION_DETAIL], [HIS_HER] mind still fixed on [PLOT_ELEMENT].',
    'At [HIS_HER] [LOCATION], [CHARACTER_NAME] paused. [THOUGHT_PROCESS]',
    '[CHARACTER_NAME] could barely focus during [ACTIVITY]. [HIS_HER] mind drifted back to [PLOT_ELEMENT].',
    'As they hurried toward [LOCATION], [CHARACTER_NAME] realized [REALIZATION].',
    '[CHARACTER_NAME] [ACTION_VERB] as [DESCRIPTION_OF_ACTION].',
  ],

  description: [
    'The [LOCATION] was [ADJECTIVE], with [DETAIL_1] and [DETAIL_2].',
    '[SOUND_DESCRIPTION] echoed through [LOCATION], sending [PEOPLE] [ACTION_VERB] like [SIMILE].',
    'The smell of [SMELL] filled the [LOCATION], and [ADDITIONAL_DETAIL].',
    '[LOCATION_ELEMENT] jutted [DIRECTION] from [BASE] like [COMPARISON], its [TEXTURE] [ADJECTIVE] and [ADJECTIVE].',
    "The [OBJECT] felt [TEXTURE] beneath [CHARACTER_NAME]'s [BODY_PART]. [REFLECTION].",
  ],

  internal: [
    '[CHARACTER_NAME] felt [HIS_HER] [BODY_PART] [ACTION] as [SITUATION].',
    'What [QUESTION] had [PAST_ELEMENT] held? Had [SPECULATION]?',
    'How could [CHARACTER_NAME] focus on [MUNDANE_THING] when there was [EXCITING_THING]?',
    'With all the [DISTRACTION], [CHARACTER_NAME] had completely forgotten about [IMPORTANT_THING].',
    "If [CHARACTER_NAME] couldn't [BASIC_ACTION], what else was [CHARACTER_NAME] forgetting?",
  ],
};

const VOCABULARY_POOLS = {
  characters: [
    'Henry',
    'Eleanor',
    'Zach',
    'Nate',
    'Sarah',
    'Marcus',
    'Emma',
    'Alex',
    'Riley',
    'Jordan',
    'Taylor',
    'Morgan',
    'Casey',
    'Blake',
    'Quinn',
    'Mrs. Peterson',
    'Mr. Thompson',
    'Dr. Williams',
    'Coach Martinez',
  ],

  locations: [
    'hallway',
    'classroom',
    'cafeteria',
    'library',
    'gymnasium',
    'office',
    'art room',
    'science lab',
    'auditorium',
    'courtyard',
    'locker area',
    'stairwell',
    'parking lot',
    'field',
    'entrance',
  ],

  objects: [
    'locker',
    'desk',
    'chair',
    'notebook',
    'backpack',
    'column',
    'door',
    'window',
    'board',
    'cart',
    'table',
    'wall',
    'floor',
    'ceiling',
  ],

  emotions: [
    'excited',
    'nervous',
    'curious',
    'frustrated',
    'determined',
    'confused',
    'worried',
    'hopeful',
    'surprised',
    'thoughtful',
    'amused',
    'focused',
  ],

  actions: [
    'hurried',
    'walked',
    'ran',
    'paused',
    'stopped',
    'turned',
    'looked',
    'listened',
    'whispered',
    'shouted',
    'gestured',
    'pointed',
    'grabbed',
  ],
};

class SyntheticCorpusGenerator {
  private settings: CorpusSettings;
  private rng: () => number;

  constructor(settings: CorpusSettings) {
    this.settings = settings;

    // Simple seeded random number generator for reproducibility
    let seed = settings.seed || Date.now();
    this.rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  generate(): GeneratedCorpus {
    const startTime = Date.now();
    devLog.debug('Generating synthetic corpus...');

    // Generate characters first
    const characters = this.generateCharacters();

    // Generate chapters and scenes
    const chapters = this.generateChapters(characters);

    // Create project wrapper
    const project = this.createProject(characters, chapters);

    // Calculate stats
    const stats = this.calculateStats(chapters);

    const generationTime = Date.now() - startTime;
    devLog.debug(`Corpus generated in ${generationTime}ms:`, stats);

    return { project, chapters, characters, stats };
  }

  private generateCharacters(): Character[] {
    const count = this.randomBetween(15, 25);
    const characters: Character[] = [];

    for (let i = 0; i < count; i++) {
      const name = this.pickRandom(VOCABULARY_POOLS.characters);
      const role = this.pickWeighted([
        { value: 'protagonist', weight: 0.1 },
        { value: 'antagonist', weight: 0.1 },
        { value: 'supporting', weight: 0.3 },
        { value: 'minor', weight: 0.5 },
      ]) as any;

      characters.push({
        id: `char_${i}`,
        name: `${name}${i > VOCABULARY_POOLS.characters.length ? ` ${i}` : ''}`,
        role,
        description: this.generateCharacterDescription(),
        personality: this.generatePersonalityTraits(),
        backstory: this.generateBackstory(),
        goals: this.generateGoals(),
        conflicts: this.generateConflicts(),
        appearance: this.generateAppearance(),
        relationships: [],
        appearsInChapters: [],
        notes: '',
        createdAt: Date.now() - this.randomBetween(0, 30 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - this.randomBetween(0, 7 * 24 * 60 * 60 * 1000),
      });
    }

    return characters;
  }

  private generateChapters(characters: Character[]): Chapter[] {
    const chapterCount = this.randomBetween(40, 60);
    const totalScenes = this.randomBetween(700, 1200);
    const chapters: Chapter[] = [];

    let scenesGenerated = 0;
    let wordsGenerated = 0;

    for (let chapterIndex = 0; chapterIndex < chapterCount; chapterIndex++) {
      const remainingScenes = totalScenes - scenesGenerated;
      const remainingChapters = chapterCount - chapterIndex;
      const avgScenesPerChapter = Math.max(1, Math.round(remainingScenes / remainingChapters));

      // Generate 1-5 scenes per chapter, weighted toward 2-3
      const scenesInChapter = Math.min(
        this.pickWeighted([
          { value: 1, weight: 0.1 },
          { value: 2, weight: 0.3 },
          { value: 3, weight: 0.4 },
          { value: 4, weight: 0.15 },
          { value: 5, weight: 0.05 },
        ]),
        remainingScenes - scenesGenerated,
      );

      const scenes = this.generateScenes(scenesInChapter, chapterIndex, characters);
      const chapterWordCount = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);

      chapters.push({
        id: `chapter_${chapterIndex}`,
        title: this.generateChapterTitle(chapterIndex),
        order: chapterIndex,
        scenes,
        totalWordCount: chapterWordCount,
        status: this.pickWeighted([
          { value: 'complete', weight: 0.7 },
          { value: 'draft', weight: 0.2 },
          { value: 'in_progress', weight: 0.1 },
        ]) as any,
        createdAt: new Date(Date.now() - this.randomBetween(0, 90 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date(Date.now() - this.randomBetween(0, 7 * 24 * 60 * 60 * 1000)),
      });

      scenesGenerated += scenesInChapter;
      wordsGenerated += chapterWordCount;

      // Stop if we've hit our targets
      if (scenesGenerated >= totalScenes || wordsGenerated >= this.settings.targetWordCount) {
        break;
      }
    }

    return chapters;
  }

  private generateScenes(count: number, chapterIndex: number, characters: Character[]): Scene[] {
    const scenes: Scene[] = [];
    const targetWordsPerScene = Math.round(
      this.settings.targetWordCount / this.settings.sceneCount,
    );

    for (let sceneIndex = 0; sceneIndex < count; sceneIndex++) {
      // Vary scene length: 80-120% of target, with some longer outliers
      const wordCount = Math.round(
        targetWordsPerScene * (0.8 + this.rng() * 0.4) * (this.rng() < 0.1 ? 1.5 : 1),
      );

      const content = this.generateSceneContent(wordCount, characters);

      scenes.push({
        id: `scene_${chapterIndex}_${sceneIndex}`,
        title: this.generateSceneTitle(chapterIndex, sceneIndex),
        content,
        status: this.pickWeighted([
          { value: 'complete', weight: 0.8 },
          { value: 'draft', weight: 0.15 },
          { value: 'revision', weight: 0.05 },
        ]) as any,
        order: sceneIndex,
        wordCount,
        wordCountGoal: Math.round(wordCount * (0.9 + this.rng() * 0.2)),
        summary: content.split('.')[0] + '...',
        createdAt: new Date(Date.now() - this.randomBetween(0, 60 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date(Date.now() - this.randomBetween(0, 3 * 24 * 60 * 60 * 1000)),
      });
    }

    return scenes;
  }

  private generateSceneContent(targetWords: number, characters: Character[]): string {
    const paragraphs: string[] = [];
    let currentWords = 0;

    // Pick 1-3 characters for this scene
    const sceneCharacters = this.shuffleArray([...characters]).slice(
      0,
      this.randomBetween(1, Math.min(3, characters.length)),
    );

    while (currentWords < targetWords) {
      const patternType = this.pickWeighted([
        { value: 'dialogue', weight: 0.35 },
        { value: 'action', weight: 0.3 },
        { value: 'description', weight: 0.2 },
        { value: 'internal', weight: 0.15 },
      ]);

      const pattern = this.pickRandom(SCENE_PATTERNS[patternType as keyof typeof SCENE_PATTERNS]);
      const paragraph = this.fillPattern(pattern, sceneCharacters);

      paragraphs.push(paragraph);
      currentWords += paragraph.split(' ').length;

      // Add scene breaks occasionally
      if (paragraphs.length > 1 && this.rng() < 0.1) {
        paragraphs.push('***');
      }
    }

    return paragraphs.join('\n\n');
  }

  private fillPattern(pattern: string, characters: Character[]): string {
    const character = this.pickRandom(characters);
    const substitutions: Record<string, string> = {
      '[CHARACTER_NAME]': character.name,
      '[HIS_HER]': this.rng() < 0.5 ? 'his' : 'her',
      '[ACTION]': this.pickRandom(VOCABULARY_POOLS.actions) + 'ed',
      '[LOCATION]': this.pickRandom(VOCABULARY_POOLS.locations),
      '[OBJECT]': this.pickRandom(VOCABULARY_POOLS.objects),
      '[DIALOGUE_LINE]': this.generateDialogueLine(),
      '[FOLLOW_UP]': this.generateDialogueLine(),
      '[PLOT_ELEMENT]': this.generatePlotElement(),
      '[THOUGHT_PROCESS]': this.generateThought(),
      '[ACTIVITY]': this.generateActivity(),
      '[REALIZATION]': this.generateRealization(),
      '[ACTION_VERB]': this.pickRandom(VOCABULARY_POOLS.actions),
      '[ADJECTIVE]': this.pickRandom(VOCABULARY_POOLS.emotions),
      '[LOCATION_DETAIL]': this.generateLocationDetail(),
      '[SOUND_DESCRIPTION]': this.generateSoundDescription(),
      '[PEOPLE]': 'students',
      '[SIMILE]': this.generateSimile(),
      '[SMELL]': this.generateSmell(),
      '[ADDITIONAL_DETAIL]': this.generateDetail(),
      '[TEXTURE]': this.generateTexture(),
      '[DIRECTION]': this.pickRandom(['up', 'down', 'out', 'in']),
      '[BASE]': this.pickRandom(['the floor', 'the wall', 'the ground']),
      '[COMPARISON]': this.generateComparison(),
      '[BODY_PART]': this.pickRandom(['fingertips', 'hands', 'face', 'shoulders']),
      '[REFLECTION]': this.generateReflection(),
      '[QUESTION]': this.generateQuestion(),
      '[PAST_ELEMENT]': this.generatePastElement(),
      '[SPECULATION]': this.generateSpeculation(),
      '[MUNDANE_THING]': this.generateMundaneThing(),
      '[EXCITING_THING]': this.generateExcitingThing(),
      '[DISTRACTION]': this.generateDistraction(),
      '[IMPORTANT_THING]': this.generateImportantThing(),
      '[BASIC_ACTION]': this.generateBasicAction(),
    };

    let result = pattern;
    for (const [placeholder, replacement] of Object.entries(substitutions)) {
      result = result.replace(
        new RegExp(
          placeholder.replace(/[.*+?^${}()|\[\]\\]/g, (match) => '\\' + match),
          'g',
        ),
        replacement,
      );
    }

    return result;
  }

  // Helper generation methods
  private generateDialogueLine(): string {
    const starters = [
      'I think we should',
      'What if we',
      "Maybe it's",
      'Do you remember when',
      "I can't believe",
      'That reminds me of',
      'We need to',
      'Have you considered',
    ];
    return this.pickRandom(starters) + ' ' + this.generateSimplePhrase();
  }

  private generateSimplePhrase(): string {
    const phrases = [
      'check it out',
      'figure this out',
      'be more careful',
      'think about it',
      'solve this mystery',
      'work together',
      'find the truth',
      'keep looking',
    ];
    return this.pickRandom(phrases);
  }

  private generatePlotElement(): string {
    return this.pickRandom([
      'the mysterious discovery',
      'their earlier conversation',
      'the strange column',
      'what they had found',
      'the hidden secret',
      'the unexpected clue',
    ]);
  }

  private generateChapterTitle(index: number): string {
    const templates = [
      `Chapter ${index + 1}: The Discovery`,
      `Chapter ${index + 1}: Unexpected Findings`,
      `Chapter ${index + 1}: Following Clues`,
      `Chapter ${index + 1}: The Investigation`,
      `Chapter ${index + 1}: New Questions`,
      `Chapter ${index + 1}: Hidden Truths`,
    ];
    return this.pickRandom(templates);
  }

  private generateSceneTitle(chapterIndex: number, sceneIndex: number): string {
    const templates = [
      'The Hallway Discovery',
      'Lunch Discussion',
      'After School Plans',
      'In the Classroom',
      'The Investigation Begins',
      'Unexpected Revelations',
    ];
    return this.pickRandom(templates);
  }

  // Additional helper methods for content generation...
  private generateCharacterDescription(): string {
    return 'A curious student with a keen eye for detail and adventure.';
  }

  private generatePersonalityTraits(): string[] {
    return this.shuffleArray(['curious', 'determined', 'thoughtful', 'adventurous', 'loyal']).slice(
      0,
      3,
    );
  }

  private generateBackstory(): string {
    return 'Has always been drawn to mysteries and unexpected discoveries.';
  }

  private generateGoals(): string {
    return "To uncover the truth behind the school's mysteries.";
  }

  private generateConflicts(): string {
    return 'Sometimes gets distracted from schoolwork by adventures.';
  }

  private generateAppearance(): string {
    return 'Average height with bright, inquisitive eyes.';
  }

  // Utility methods
  private pickRandom<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    const index = Math.floor(this.rng() * array.length);
    return array[index]!;
  }

  private pickWeighted<T>(options: Array<{ value: T; weight: number }>): T {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = this.rng() * totalWeight;

    for (const option of options) {
      if (random < option.weight) {
        return option.value;
      }
      random -= option.weight;
    }

    // Fallback to last option if rounding errors occur
    return options[options.length - 1]!.value;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(min + this.rng() * (max - min + 1));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      // Use explicit temp variable to avoid TypeScript strict null issues
      const itemI = result[i];
      const itemJ = result[j];
      if (itemI !== undefined && itemJ !== undefined) {
        result[i] = itemJ;
        result[j] = itemI;
      }
    }
    return result;
  }

  private createProject(characters: Character[], chapters: Chapter[]): EnhancedProject {
    const totalWords = chapters.reduce((sum, ch) => sum + ch.totalWordCount, 0);

    // Convert writing.ts Chapter[] to project.ts Chapter[] format
    const projectChapters: ProjectChapter[] = chapters.map((ch, index) => ({
      scenes: ch.scenes.map(
        (s): ProjectScene => ({
          id: s.id,
          title: s.title,
          content: s.content,
          wordCount: s.wordCount,
          status: convertStatus(s.status),
          order: s.order,
          createdAt: s.createdAt.getTime(),
          updatedAt: s.updatedAt.getTime(),
        }),
      ),
      id: ch.id,
      _title: ch.title,
      _summary: `Chapter ${ch.order + 1} summary`,
      _content: ch.scenes.map((s) => s.content).join('\n\n'),
      wordCount: ch.totalWordCount,
      targetWordCount: Math.round(ch.totalWordCount * 1.1),
      status: convertStatus(ch.status),
      order: ch.order,
      charactersInChapter: characters.slice(0, 3).map((c) => c.id), // Sample characters
      plotPointsResolved: [], // Empty for synthetic data
      notes: '',
      createdAt: ch.createdAt.getTime(),
      updatedAt: ch.updatedAt.getTime(),
    }));

    // Safe access to first chapter/scene with fallback
    const firstChapter = chapters.length > 0 ? chapters[0] : null;
    const firstScene =
      firstChapter?.scenes && firstChapter.scenes.length > 0 ? firstChapter.scenes[0] : null;
    const recentContent = firstScene?.content?.slice(0, 1000) || 'No content available';

    return {
      id: 'synthetic_project',
      name: 'Synthetic Fiction Project',
      description: 'Generated corpus for search performance testing',
      genre: 'Middle Grade Adventure',
      targetAudience: 'Middle Grade',
      targetWordCount: this.settings.targetWordCount,
      currentWordCount: totalWords,
      characters,
      plotNotes: [],
      worldBuilding: [],
      chapters: projectChapters,
      recentContent,
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
      sessions: [],
      dailyGoal: 1000,
      claudeContext: {
        includeCharacters: true,
        includePlotNotes: true,
        includeWorldBuilding: true,
        maxCharacters: 5,
        maxPlotNotes: 10,
        contextLength: 'medium',
      },
    };
  }

  private calculateStats(chapters: Chapter[]) {
    const totalScenes = chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);
    const totalWords = chapters.reduce((sum, ch) => sum + ch.totalWordCount, 0);

    return {
      totalWords,
      totalScenes,
      totalChapters: chapters.length,
      averageWordsPerScene: Math.round(totalWords / totalScenes),
      averageWordsPerChapter: Math.round(totalWords / chapters.length),
    };
  }

  // Stub implementations for missing generators
  private generateThought(): string {
    return this.pickRandom([
      'What secrets had this place held?',
      'How could they solve this mystery?',
      "Something didn't seem right about this.",
    ]);
  }

  private generateActivity(): string {
    return this.pickRandom(['class', 'the lesson', 'the discussion', 'the presentation']);
  }

  private generateRealization(): string {
    return this.pickRandom([
      'this mystery was more complex than expected',
      'they needed to work together',
      'something important was happening',
    ]);
  }

  private generateLocationDetail(): string {
    return this.pickRandom([
      'seventh graders clustered around lockers',
      'students rushing to class',
      'teachers in the hallway',
    ]);
  }

  private generateSoundDescription(): string {
    return this.pickRandom(['The warning bell', 'Footsteps', 'Voices', 'The loudspeaker']);
  }

  private generateSimile(): string {
    return this.pickRandom(['startled fish', 'scattered leaves', 'rushing water']);
  }

  private generateSmell(): string {
    return this.pickRandom(['pizza', 'fresh bread', 'cleaning supplies', 'old books']);
  }

  private generateDetail(): string {
    return this.pickRandom([
      'conversations created a buzz like a low roar',
      'students chatted at nearby tables',
      'the atmosphere was filled with energy',
    ]);
  }

  private generateTexture(): string {
    return this.pickRandom(['cool', 'rough', 'smooth', 'warm']);
  }

  private generateComparison(): string {
    return this.pickRandom(['an obelisk', 'a monument', 'a pillar', 'a tower']);
  }

  private generateReflection(): string {
    return this.pickRandom([
      'Its secrets had been locked away for decades',
      'What mysteries did it hold?',
      'There was something important about this',
    ]);
  }

  private generateQuestion(): string {
    return this.pickRandom(['secrets', 'mysteries', 'stories', 'treasures']);
  }

  private generatePastElement(): string {
    return this.pickRandom([
      'the old lockers',
      'previous students',
      'former teachers',
      'past generations',
    ]);
  }

  private generateSpeculation(): string {
    return this.pickRandom([
      'students decades ago stuffed them with notes and forgotten lunches',
      'they held important documents and memories',
      'teachers used them for storage',
    ]);
  }

  private generateMundaneThing(): string {
    return this.pickRandom(['homework', 'the quiz', 'taking notes', 'listening to lectures']);
  }

  private generateExcitingThing(): string {
    return this.pickRandom([
      'a mystery a few halls away',
      'an adventure waiting',
      'secrets to uncover',
    ]);
  }

  private generateDistraction(): string {
    return this.pickRandom([
      'excitement about their discovery',
      'thoughts of adventure',
      'the mysterious finding',
    ]);
  }

  private generateImportantThing(): string {
    return this.pickRandom(['the science quiz', 'their homework', 'the upcoming test']);
  }

  private generateBasicAction(): string {
    return this.pickRandom([
      'remember a simple quiz',
      'focus on schoolwork',
      'pay attention in class',
    ]);
  }
}

// Export the generator class and a convenience function
export { SyntheticCorpusGenerator };

export function _generateSyntheticCorpus(settings: Partial<CorpusSettings> = {}): GeneratedCorpus {
  const defaultSettings: CorpusSettings = {
    targetWordCount: 150000,
    chapterCount: 50,
    sceneCount: 900,
    characterCount: 20,
    seed: 12345, // Fixed seed for reproducible results
  };

  const generator = new SyntheticCorpusGenerator({ ...defaultSettings, ...settings });
  return generator.generate();
}
