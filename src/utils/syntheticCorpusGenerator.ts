// src/utils/syntheticCorpusGenerator.ts
import type { EnhancedProject } from '@/types/project';
import { ChapterStatus, SceneStatus, type Chapter, type Scene } from '@/types/writing';

export type GenreKey = 'fantasy' | 'mystery' | 'romance' | 'sci-fi' | 'literary';

export interface CorpusGenerationOptions {
  targetWordCount: number; // e.g., 150_000
  chapterCount: number; // e.g., 40–60
  scenesPerChapter: number; // e.g., 18–22 (to reach ~700–1200 scenes total)
  avgWordsPerScene: number; // advisory; final varies per scene
  genreStyle: GenreKey;
  includeCharacters: boolean;
  includePlotNotes: boolean;
  seed?: number;
}

export interface GeneratedCorpus {
  project: EnhancedProject;
  chapters: Chapter[];
  stats: {
    totalWords: number;
    totalScenes: number;
    totalChapters: number;
    avgWordsPerScene: number;
    generationTime: number; // ms
  };
}

/**
 * Synthetic Corpus Generator for Performance Testing
 * - Realistic content with genre-specific vocab
 * - Stable variability via seeded RNG
 * - Outputs chapters/scenes shaped for search & performance benchmarks
 */
export class SyntheticCorpusGenerator {
  private rng: () => number;
  private nameIndex = 0;
  private plotIndex = 0;

  // Public for benchmark helpers and external callers that want vocab.
  public static readonly STORY_ELEMENTS: Record<
    GenreKey,
    { characters: string[]; locations: string[]; concepts: string[] }
  > = {
    fantasy: {
      characters: [
        'Aeliana',
        'Theron',
        'Lyra',
        'Gareth',
        'Seraphina',
        'Darius',
        'Elara',
        'Kael',
        'Mirin',
        'Aldrich',
        'Zara',
        'Bran',
        'Celestine',
        'Dorian',
        'Faye',
        'Gideon',
      ],
      locations: [
        'Shadowmere',
        'Dragonspire',
        'Whispering Woods',
        'Crystal Caverns',
        'Thornwick',
        'Starfall Keep',
        'Mistral Valley',
        'Ironhold',
        'Silverbrook',
        'Stormhaven',
      ],
      concepts: [
        'ancient magic',
        'dragon bond',
        'crystal power',
        'shadow realm',
        'elven wisdom',
        'dwarf forge',
        'phoenix flame',
        'moonstone',
        'spell weaving',
        'prophecy',
      ],
    },
    mystery: {
      characters: [
        'Detective Morgan',
        'Sarah Chen',
        'Professor Blake',
        'Dr. Williams',
        'Inspector Hayes',
        'Agent Carter',
        'Ms. Rodriguez',
        'Captain Stone',
        'David Park',
        'Emma Foster',
      ],
      locations: [
        'Victorian mansion',
        'downtown precinct',
        'university library',
        'old warehouse',
        'crime scene',
        'forensics lab',
        'coffee shop',
        'courthouse',
        'hotel lobby',
      ],
      concepts: [
        'murder weapon',
        'alibi',
        'evidence',
        'witness testimony',
        'DNA analysis',
        'fingerprints',
        'motive',
        'red herring',
        'cold case',
        'breakthrough',
      ],
    },
    'sci-fi': {
      characters: [
        'Commander Vex',
        'Dr. Singh',
        'Captain Torres',
        'Engineer Kim',
        'Pilot Chen',
        'Admiral Cross',
        'Scientist Ray',
        'Colonist Webb',
        'AI Unit 7',
        'Agent Nova',
      ],
      locations: [
        'space station',
        'Mars colony',
        'starship bridge',
        'research lab',
        'alien world',
        'lunar base',
        'asteroid mining',
        'quantum lab',
        'cryogenic bay',
        'teleporter',
      ],
      concepts: [
        'faster than light',
        'quantum field',
        'alien contact',
        'terraforming',
        'AI consciousness',
        'time dilation',
        'wormhole',
        'neural interface',
        'genetic modification',
        'dark matter',
      ],
    },
    romance: {
      characters: [
        'Elena',
        'Marco',
        'Rhea',
        'Jonah',
        'Anya',
        'Caleb',
        'Sofia',
        'Luca',
        'Maya',
        'Nikolai',
      ],
      locations: [
        'seaside café',
        'old harbor',
        'bookshop',
        'gallery',
        'city park',
        'vineyard',
        'winter market',
        'train platform',
        'town square',
        'riverside path',
      ],
      concepts: [
        'missed connection',
        'second chance',
        'love letter',
        'rivalry',
        'secret admirer',
        'forgiveness',
        'reunion',
        'promise',
        'hesitation',
        'spark',
      ],
    },
    literary: {
      characters: [
        'Nadia',
        'Elias',
        'Marta',
        'Hector',
        'Iris',
        'Samir',
        'Ava',
        'Tomas',
        'Lina',
        'Julian',
      ],
      locations: [
        'apartment stairwell',
        'factory floor',
        'supper club',
        'tenement roof',
        'riverwalk',
        'train platform',
        'country road',
        'museum hall',
        'office elevator',
        'streetcar',
      ],
      concepts: [
        'memory',
        'betrayal',
        'migration',
        'silence',
        'inheritance',
        'longing',
        'mercy',
        'duty',
        'regret',
        'becoming',
      ],
    },
  };

  private static readonly SCENE_TEMPLATES: readonly string[] = [
    'The {character} discovered {concept} in the {location}, changing everything they thought they knew.',
    'As dawn broke over {location}, {character} realized the {concept} was more dangerous than expected.',
    'The meeting at {location} revealed that {character} had been wrong about the {concept}.',
    'Hidden within {location}, the {concept} pulsed with an energy {character} had never felt.',
    'When {character} entered {location}, the {concept} immediately drew their attention.',
    'The revelation about {concept} at {location} left {character} questioning their beliefs.',
    'Through the shadows of {location}, {character} pursued the truth behind the {concept}.',
  ] as const;

  constructor(seed?: number) {
    this.rng = this.createSeededRNG(seed ?? Date.now());
  }

  /**
   * Generate a complete synthetic corpus for testing.
   */
  async generateCorpus(options: CorpusGenerationOptions): Promise<GeneratedCorpus> {
    const startTime = Date.now();

    // Distribute words across chapters/scenes; final totals vary per scene.
    const wordsPerChapter = Math.max(
      1,
      Math.floor(options.targetWordCount / Math.max(1, options.chapterCount)),
    );
    const scenesPerChapterBase = Math.max(1, options.scenesPerChapter);
    const avgWordsPerScene = Math.max(50, Math.floor(wordsPerChapter / scenesPerChapterBase));

    // Project metadata
    const project = this.generateProject(options);

    // Chapters and scenes
    const chapters = await this.generateChapters(options, avgWordsPerScene);

    // Stats
    const totalWords = chapters.reduce((sum, ch) => sum + (ch.totalWordCount ?? 0), 0);
    const totalScenes = chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);
    const generationTime = Date.now() - startTime;

    return {
      project,
      chapters,
      stats: {
        totalWords,
        totalScenes,
        totalChapters: chapters.length,
        avgWordsPerScene: totalScenes > 0 ? totalWords / totalScenes : 0,
        generationTime,
      },
    };
  }

  /**
   * Project metadata shaped to EnhancedProject.
   * (Dates use epoch ms here, matching common app types.)
   */
  private generateProject(options: CorpusGenerationOptions): EnhancedProject {
    const elements = SyntheticCorpusGenerator.STORY_ELEMENTS[options.genreStyle];

    const project: EnhancedProject = {
      id: `synthetic_${Date.now()}`,
      name: this.generateProjectName(options.genreStyle),
      description: this.generateProjectDescription(options.genreStyle),
      genre: options.genreStyle,
      targetWordCount: options.targetWordCount,
      currentWordCount: 0,
      characters: options.includeCharacters ? this.generateCharacters(elements.characters) : [],
      plotNotes: options.includePlotNotes ? this.generatePlotNotes(elements.concepts) : [],
      worldBuilding: [],
      chapters: [], // populated separately by caller if desired
      recentContent: '',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      updatedAt: Date.now(),
      sessions: this.generateWritingSessions(),
      // keep whatever shape your app expects for Claude context
      claudeContext: {
        includeCharacters: true,
        includePlotNotes: true,
        includeWorldBuilding: false,
        maxCharacters: 5,
        maxPlotNotes: 10,
        contextLength: 'medium',
      } as any,
    };

    return project;
  }

  /**
   * Chapters with realistically varied scene counts and word counts.
   */
  private async generateChapters(
    options: CorpusGenerationOptions,
    avgWordsPerScene: number,
  ): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    const elements = SyntheticCorpusGenerator.STORY_ELEMENTS[options.genreStyle];

    for (let chapterIndex = 0; chapterIndex < options.chapterCount; chapterIndex++) {
      // +/- up to ~3 scenes variability per chapter
      const scenesInChapter = Math.max(
        1,
        Math.floor(options.scenesPerChapter + (this.rng() - 0.5) * 6),
      );
      const scenes: Scene[] = [];

      for (let sceneIndex = 0; sceneIndex < scenesInChapter; sceneIndex++) {
        const scene = this.generateScene(
          chapterIndex,
          sceneIndex,
          avgWordsPerScene,
          elements,
          options.genreStyle,
        );
        scenes.push(scene);
      }

      const totalWordCount = scenes.reduce((sum, s) => sum + (s.wordCount ?? 0), 0);

      const chapter: Chapter = {
        id: `chapter_${chapterIndex}`,
        title: `Chapter ${chapterIndex + 1}: ${this.generateChapterTitle(elements)}`,
        order: chapterIndex,
        scenes,
        totalWordCount,
        status: this.randomChoice([
          ChapterStatus.DRAFT,
          ChapterStatus.IN_PROGRESS,
          ChapterStatus.COMPLETE,
        ]),
        createdAt: new Date(Date.now() - (30 - chapterIndex) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(this.rng() * 7 * 24 * 60 * 60 * 1000)),
      };

      chapters.push(chapter);
    }

    return chapters;
  }

  /**
   * Individual scene with content generated from templates + expansions.
   */
  private generateScene(
    chapterIndex: number,
    sceneIndex: number,
    targetWords: number,
    elements: { characters: string[]; locations: string[]; concepts: string[] },
    genre: GenreKey,
  ): Scene {
    // Vary word count ±40% for realistic distribution
    const wordVariation = (this.rng() - 0.5) * 0.8;
    const actualWords = Math.max(120, Math.floor(targetWords * (1 + wordVariation)));

    const content = this.generateSceneContent(actualWords, elements, genre);

    const scene: Scene = {
      id: `scene_${chapterIndex}_${sceneIndex}`,
      title: this.generateSceneTitle(elements),
      content,
      status: this.randomChoice([SceneStatus.DRAFT, SceneStatus.REVISION, SceneStatus.COMPLETE]),
      order: sceneIndex,
      wordCount: actualWords,
      wordCountGoal: Math.floor(targetWords * 1.1),
      summary: this.generateSceneSummary(elements),
      createdAt: new Date(Date.now() - (30 - chapterIndex) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.floor(this.rng() * 7 * 24 * 60 * 60 * 1000)),
    };

    return scene;
  }

  private generateSceneContent(
    targetWords: number,
    elements: { characters: string[]; locations: string[]; concepts: string[] },
    _genre: GenreKey,
  ): string {
    const paragraphs: string[] = [];
    let currentWords = 0;

    while (currentWords < targetWords) {
      const template = this.randomChoice(SyntheticCorpusGenerator.SCENE_TEMPLATES);
      let paragraph = template
        .replace(/{character}/g, this.randomChoice(elements.characters))
        .replace(/{location}/g, this.randomChoice(elements.locations))
        .replace(/{concept}/g, this.randomChoice(elements.concepts));

      // Expand paragraph into ~80–200 words
      paragraph = this.expandParagraph(paragraph, elements, 80 + Math.floor(this.rng() * 120));

      paragraphs.push(paragraph);
      currentWords += this.countWords(paragraph);
    }

    return paragraphs.join('\n\n');
  }

  private expandParagraph(
    baseSentence: string,
    _elements: { characters: string[]; locations: string[]; concepts: string[] },
    targetWords: number,
  ): string {
    const sentences = [baseSentence];
    let currentWords = this.countWords(baseSentence);

    const expansions = [
      'The air grew thick with tension.',
      'Shadows danced across the walls.',
      'Something felt different about this place.',
      'The silence stretched between them.',
      'A chill ran down their spine.',
      'The implications were staggering.',
      'Time seemed to slow.',
      'Everything had changed.',
      'The mystery deepened.',
      'Questions multiplied.',
    ];

    while (currentWords < targetWords && sentences.length < 6) {
      const expansion = this.randomChoice(expansions);
      sentences.push(expansion);
      currentWords += this.countWords(expansion);
    }

    return sentences.join(' ');
  }

  // Characters / plot notes — shape kept loose to fit various app types
  private generateCharacters(characterNames: string[]): any[] {
    return characterNames.slice(0, 8).map((name) => ({
      id: `char_${this.nameIndex++}`,
      name,
      role: this.randomChoice(['protagonist', 'antagonist', 'supporting', 'minor']),
      description: `${name} is a complex character with hidden depths and surprising motivations.`,
      personality: this.randomChoice([
        ['brave', 'stubborn', 'loyal'],
        ['clever', 'cautious', 'determined'],
        ['mysterious', 'powerful', 'conflicted'],
      ]),
      backstory: `${name} has a complicated past that influences their current actions.`,
      goals: 'To achieve their deepest desire while overcoming internal conflicts.',
      conflicts: 'Struggles between duty and personal desires.',
      appearance: 'Distinctive and memorable features that reflect their personality.',
      relationships: [],
      appearsInChapters: [],
      notes: 'Additional character development notes.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  private generatePlotNotes(concepts: string[]): any[] {
    return concepts.slice(0, 12).map((concept) => ({
      id: `plot_${this.plotIndex++}`,
      title: `The ${concept} Mystery`,
      content: `This plot thread explores the significance of ${concept} and its impact on the story.`,
      type: this.randomChoice(['outline', 'conflict', 'resolution', 'subplot']),
      priority: this.randomChoice(['high', 'medium', 'low']),
      status: this.randomChoice(['planned', 'in-progress', 'completed']),
      relatedCharacters: [],
      chapterReferences: [],
      tags: [concept],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  private generateWritingSessions(): any[] {
    const sessions: any[] = [];
    for (let i = 0; i < 15; i++) {
      const start = Date.now() - i * 24 * 60 * 60 * 1000;
      sessions.push({
        id: `session_${i}`,
        projectId: 'synthetic',
        startTime: new Date(start),
        endTime: new Date(start + (30 + this.rng() * 90) * 60 * 1000),
        wordCount: Math.floor(200 + this.rng() * 800),
        wordsAdded: Math.floor(200 + this.rng() * 800),
        productivity: Number(this.rng().toFixed(2)),
        focusTime: Math.floor(this.rng() * 60),
      });
    }
    return sessions;
  }

  // Helpers

  private generateProjectName(genre: GenreKey): string {
    const titles: Record<GenreKey, string[]> = {
      fantasy: ['The Crystal Prophecy', 'Shadows of Eldoria', "The Dragon's Heir"],
      mystery: ['The Vanishing Act', 'Secrets in the Shadows', 'The Last Witness'],
      'sci-fi': ['Beyond the Stars', 'The Quantum Paradox', 'Colony Zero'],
      romance: ['Letters on the Pier', 'Second Chances', 'Autumn at the Vineyard'],
      literary: ['Inheritance of Silence', 'The Long Streetcar', 'Between Rooms'],
    };
    const pool = titles[genre] ?? titles.fantasy;
    return this.randomChoice(pool);
  }

  private generateProjectDescription(genre: GenreKey): string {
    return `A compelling ${genre} story that explores themes of identity, power, and redemption against a richly detailed backdrop.`;
  }

  private generateChapterTitle(elements: {
    concepts: string[];
    locations: string[];
    characters: string[];
  }): string {
    const formats = [
      'The {concept}',
      'Secrets of {location}',
      "{character}'s Discovery",
      'Journey to {location}',
      'The {concept} Revealed',
    ] as const;

    return this.randomChoice(formats as unknown as string[])
      .replace('{concept}', this.randomChoice(elements.concepts))
      .replace('{location}', this.randomChoice(elements.locations))
      .replace('{character}', this.randomChoice(elements.characters));
  }

  private generateSceneTitle(elements: {
    characters: string[];
    locations: string[];
    concepts: string[];
  }): string {
    return this.randomChoice([
      `Meeting at ${this.randomChoice(elements.locations)}`,
      `${this.randomChoice(elements.characters)}'s Decision`,
      `Discovery in ${this.randomChoice(elements.locations)}`,
      `The ${this.randomChoice(elements.concepts)} Incident`,
    ]);
  }

  private generateSceneSummary(elements: { characters: string[]; concepts: string[] }): string {
    return `A pivotal scene involving ${this.randomChoice(elements.characters)} and the ${this.randomChoice(
      elements.concepts,
    )}.`;
  }

  private createSeededRNG(seed: number): () => number {
    // Simple LCG for determinism across environments
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state & 0xffffffff) / 0x100000000;
    };
  }

  private randomChoice<T>(arr: readonly T[]): T {
    // Assume non-empty arrays; use non-null assertion to satisfy TS.
    return arr[Math.floor(Math.random() * arr.length)] as T;
  }

  private countWords(text: string): number {
    const m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
  }
}

/**
 * Performance benchmark harness for search testing.
 */
export class SearchPerformanceBenchmark {
  /**
   * Generate realistic search queries for testing (names, locations, concepts, mixed).
   */
  static generateSearchQueries(corpus: GeneratedCorpus): string[] {
    const { project } = corpus;
    const queries: string[] = [];

    // Character names and first names
    if (Array.isArray((project as any).characters)) {
      (project as any).characters.forEach((char: any) => {
        if (char?.name) {
          queries.push(char.name);
          const first = String(char.name).split(' ')[0];
          if (first) queries.push(first);
        }
      });
    }

    // Locations and concepts from genre vocab
    const elements =
      SyntheticCorpusGenerator.STORY_ELEMENTS[
        project.genre as keyof typeof SyntheticCorpusGenerator.STORY_ELEMENTS
      ] ?? SyntheticCorpusGenerator.STORY_ELEMENTS.fantasy;

    elements.locations.forEach((loc) => queries.push(loc));
    elements.concepts.forEach((concept) => queries.push(concept));

    // Multi-word and partial fragments
    queries.push(
      'ancient magic power',
      'meeting at location',
      'character discovery',
      'shadow realm portal',
      'crystal energy source',
      'discov',
      'shadow',
      'power',
      'secret',
      'ancient',
    );

    // Cap to a reasonable set
    return queries.slice(0, 100);
  }

  /**
   * Run performance benchmark with percentile reporting. Accepts any search service
   * exposing `search(query, { projectId, maxResults }) -> Promise<Hit[]>`.
   */
  static async runBenchmark(
    searchService: {
      search: (q: string, opts: { projectId: string; maxResults?: number }) => Promise<any[]>;
    },
    corpus: GeneratedCorpus,
    queries: string[],
  ): Promise<{
    p50: number;
    p95: number;
    totalQueries: number;
    avgResultsPerQuery: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const latencies: number[] = [];
    let totalResults = 0;

    for (const query of queries) {
      const t0 = Date.now();
      try {
        const results = await searchService.search(query, {
          projectId: corpus.project.id,
          maxResults: 20,
        });
        latencies.push(Date.now() - t0);
        totalResults += Array.isArray(results) ? results.length : 0;
      } catch {
        latencies.push(5000); // penalty for failed query
      }
    }

    latencies.sort((a, b) => a - b);
    const pick = (p: number) =>
      latencies[Math.min(latencies.length - 1, Math.max(0, Math.floor(latencies.length * p)))] ?? 0;

    const p50 = pick(0.5);
    const p95 = pick(0.95);
    const totalTime = Date.now() - startTime;

    return {
      p50,
      p95,
      totalQueries: queries.length,
      avgResultsPerQuery: queries.length ? totalResults / queries.length : 0,
      totalTime,
    };
  }
}
