// src/data/starterTemplates.ts
import { formatSceneFilename } from '../services/featureFlagService.presets';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'fiction' | 'screenplay' | 'poetry' | 'nonfiction';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedLength: string;
  chapters: TemplateChapter[];
  scenes: TemplateScene[];
  characters?: TemplateCharacter[];
  notes?: TemplateNote[];
  settings?: ProjectSettings;
  tags?: string[];
}

export interface TemplateChapter {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  scenes: string[]; // Scene IDs
}

export interface TemplateScene {
  id: string;
  title: string;
  description?: string;
  chapterId: string;
  orderIndex: number;
  content?: string;
  wordTarget?: number;
  purpose?: string;
  conflictType?: string;
}

export interface TemplateCharacter {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description?: string;
  motivation?: string;
  conflict?: string;
  arc?: string;
}

export interface TemplateNote {
  id: string;
  title: string;
  content: string;
  category: 'plot' | 'character' | 'setting' | 'research' | 'ideas';
}

export interface ProjectSettings {
  targetWordCount?: number;
  genre?: string;
  pointOfView?: 'first' | 'second' | 'third-limited' | 'third-omniscient';
  tense?: 'past' | 'present' | 'future';
  theme?: string;
}

// Starter templates optimized for beginners
export const STARTER_TEMPLATES: ProjectTemplate[] = [
  // Beginner Templates
  {
    id: 'simple-novel',
    name: 'Simple Novel',
    description: 'A basic story structure to get you started',
    icon: '📖',
    category: 'fiction',
    difficulty: 'beginner',
    estimatedLength: '50,000-80,000 words',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        description: 'Opening chapter to hook readers',
        orderIndex: 0,
        scenes: ['opening-scene'],
      },
    ],
    scenes: [
      {
        id: 'opening-scene',
        title: 'Opening scene',
        description: 'Introduce your protagonist and their world',
        chapterId: 'chapter-1',
        orderIndex: 0,
        wordTarget: 1500,
        purpose: 'Hook the reader and establish the protagonist',
        content: `Write your opening scene here. Consider starting with:\n\n• Your main character in action\n• A compelling situation or conflict\n• A sense of the story world\n• A reason for readers to keep reading\n\nRemember: You can always revise later. Just get words on the page!`,
      },
    ],
    settings: {
      targetWordCount: 60000,
      pointOfView: 'third-limited',
      tense: 'past',
    },
    notes: [
      {
        id: 'story-idea',
        title: 'Story Idea',
        content: 'What is your story about? Write a one-sentence summary here.',
        category: 'plot',
      },
      {
        id: 'main-character',
        title: 'Main Character',
        content: 'Who is your protagonist? What do they want? What stands in their way?',
        category: 'character',
      },
    ],
    tags: ['beginner', 'novel', 'fiction'],
  },

  {
    id: 'short-story',
    name: 'Short Story',
    description: 'Perfect for a single sitting read',
    icon: '📝',
    category: 'fiction',
    difficulty: 'beginner',
    estimatedLength: '1,000-5,000 words',
    chapters: [
      {
        id: 'beginning',
        title: 'Beginning',
        description: 'Setup and inciting incident',
        orderIndex: 0,
        scenes: ['hook'],
      },
      {
        id: 'middle',
        title: 'Middle',
        description: 'Development and complications',
        orderIndex: 1,
        scenes: ['development'],
      },
      {
        id: 'end',
        title: 'End',
        description: 'Climax and resolution',
        orderIndex: 2,
        scenes: ['resolution'],
      },
    ],
    scenes: [
      {
        id: 'hook',
        title: 'Hook',
        description: 'Grab attention immediately',
        chapterId: 'beginning',
        orderIndex: 0,
        wordTarget: 500,
        purpose: 'Establish character, conflict, and stakes quickly',
      },
      {
        id: 'development',
        title: 'Development',
        description: 'Deepen conflict and raise stakes',
        chapterId: 'middle',
        orderIndex: 0,
        wordTarget: 1000,
        purpose: 'Show character struggling with the central conflict',
      },
      {
        id: 'resolution',
        title: 'Resolution',
        description: 'Resolve conflict and provide satisfaction',
        chapterId: 'end',
        orderIndex: 0,
        wordTarget: 500,
        purpose: 'Bring the story to a meaningful close',
      },
    ],
    settings: {
      targetWordCount: 2500,
      pointOfView: 'first',
      tense: 'present',
    },
    tags: ['beginner', 'short-story', 'fiction'],
  },

  // Intermediate Templates
  {
    id: 'mystery-3-act',
    name: 'Mystery with 3 Acts',
    description: 'Classic mystery structure with investigation phases',
    icon: '🔍',
    category: 'fiction',
    difficulty: 'intermediate',
    estimatedLength: '70,000-90,000 words',
    chapters: [
      {
        id: 'act-1-setup',
        title: 'Act I: Setup',
        description: 'Introduce detective and crime',
        orderIndex: 0,
        scenes: ['hook', 'crime-discovered'],
      },
      {
        id: 'act-2-investigation',
        title: 'Act II: Investigation',
        description: 'Detective investigates and encounters obstacles',
        orderIndex: 1,
        scenes: ['initial-investigation', 'complications', 'false-leads'],
      },
      {
        id: 'act-3-resolution',
        title: 'Act III: Resolution',
        description: 'Truth revealed and justice served',
        orderIndex: 2,
        scenes: ['breakthrough', 'revelation', 'justice'],
      },
    ],
    scenes: [
      {
        id: 'hook',
        title: 'Hook',
        description: 'Introduce detective in their normal world',
        chapterId: 'act-1-setup',
        orderIndex: 0,
        purpose: 'Establish detective character and skills',
      },
      {
        id: 'crime-discovered',
        title: 'Crime Discovered',
        description: 'The inciting incident - a crime occurs',
        chapterId: 'act-1-setup',
        orderIndex: 1,
        purpose: 'Launch the central mystery',
      },
      {
        id: 'initial-investigation',
        title: 'Initial Investigation',
        description: 'Detective begins gathering clues',
        chapterId: 'act-2-investigation',
        orderIndex: 0,
        purpose: 'Show detective methods and uncover initial leads',
      },
      {
        id: 'complications',
        title: 'Complications',
        description: 'Obstacles arise, stakes increase',
        chapterId: 'act-2-investigation',
        orderIndex: 1,
        purpose: 'Raise tension and show opposition',
      },
      {
        id: 'false-leads',
        title: 'False Leads',
        description: 'Red herrings and dead ends',
        chapterId: 'act-2-investigation',
        orderIndex: 2,
        purpose: 'Mislead reader while building suspense',
      },
      {
        id: 'breakthrough',
        title: 'Breakthrough',
        description: 'Key evidence or realization',
        chapterId: 'act-3-resolution',
        orderIndex: 0,
        purpose: 'Turn the investigation around',
      },
      {
        id: 'revelation',
        title: 'Revelation',
        description: 'Truth is revealed',
        chapterId: 'act-3-resolution',
        orderIndex: 1,
        purpose: 'Expose the criminal and their motive',
      },
      {
        id: 'justice',
        title: 'Justice',
        description: 'Resolution and aftermath',
        chapterId: 'act-3-resolution',
        orderIndex: 2,
        purpose: 'Restore order and provide closure',
      },
    ],
    characters: [
      {
        id: 'detective',
        name: '[Detective Name]',
        role: 'protagonist',
        description: 'Skilled investigator with unique methods',
        motivation: 'Seeks truth and justice',
        conflict: 'Personal flaws or past trauma complicate the investigation',
      },
      {
        id: 'criminal',
        name: '[Criminal Name]',
        role: 'antagonist',
        description: 'The perpetrator of the central crime',
        motivation: 'Whatever drove them to commit the crime',
        conflict: 'Trying to avoid detection while achieving their goals',
      },
    ],
    settings: {
      targetWordCount: 80000,
      genre: 'mystery',
      pointOfView: 'third-limited',
      tense: 'past',
      theme: 'Justice vs. mercy, truth vs. consequences',
    },
    tags: ['intermediate', 'mystery', '3-act', 'investigation'],
  },

  // Advanced Template
  {
    id: 'screenplay-5-beat',
    name: 'Screenplay 5-Beat',
    description: 'Standard screenplay structure for film/TV',
    icon: '🎬',
    category: 'screenplay',
    difficulty: 'advanced',
    estimatedLength: '90-120 pages',
    chapters: [
      {
        id: 'act-1',
        title: 'Act I',
        description: 'Setup (pages 1-25)',
        orderIndex: 0,
        scenes: ['opening-image', 'inciting-incident'],
      },
      {
        id: 'act-2a',
        title: 'Act II-A',
        description: 'Rising action (pages 26-50)',
        orderIndex: 1,
        scenes: ['plot-point-1', 'complications'],
      },
      {
        id: 'act-2b',
        title: 'Act II-B',
        description: 'Midpoint to climax (pages 51-75)',
        orderIndex: 2,
        scenes: ['midpoint', 'plot-point-2'],
      },
      {
        id: 'act-3',
        title: 'Act III',
        description: 'Resolution (pages 76-90)',
        orderIndex: 3,
        scenes: ['climax', 'resolution'],
      },
    ],
    scenes: [
      {
        id: 'opening-image',
        title: 'Opening Image',
        description: 'Visual representation of the story theme',
        chapterId: 'act-1',
        orderIndex: 0,
        purpose: 'Establish tone and theme visually',
      },
      {
        id: 'inciting-incident',
        title: 'Inciting Incident',
        description: 'Event that launches the story',
        chapterId: 'act-1',
        orderIndex: 1,
        purpose: 'Get the story moving and engage protagonist',
      },
      {
        id: 'plot-point-1',
        title: 'Plot Point 1',
        description: 'Protagonist commits to the journey',
        chapterId: 'act-2a',
        orderIndex: 0,
        purpose: 'Lock protagonist into the main conflict',
      },
      {
        id: 'midpoint',
        title: 'Midpoint',
        description: 'False victory or defeat; stakes raised',
        chapterId: 'act-2b',
        orderIndex: 0,
        purpose: 'Shift story direction and raise stakes',
      },
      {
        id: 'plot-point-2',
        title: 'Plot Point 2',
        description: 'All seems lost moment',
        chapterId: 'act-2b',
        orderIndex: 1,
        purpose: 'Propel into final act with maximum stakes',
      },
      {
        id: 'climax',
        title: 'Climax',
        description: 'Final confrontation and resolution',
        chapterId: 'act-3',
        orderIndex: 0,
        purpose: 'Resolve central conflict dramatically',
      },
      {
        id: 'resolution',
        title: 'Resolution',
        description: 'New normal and closing image',
        chapterId: 'act-3',
        orderIndex: 1,
        purpose: 'Show changed world and character growth',
      },
    ],
    settings: {
      targetWordCount: 25000, // Approximate word count for screenplay
      pointOfView: 'third-omniscient',
      tense: 'present',
    },
    tags: ['advanced', 'screenplay', '5-beat', 'film', 'tv'],
  },
];

// Get templates filtered by UI mode
export function getTemplatesForMode(mode: 'beginner' | 'pro'): ProjectTemplate[] {
  if (mode === 'beginner') {
    return STARTER_TEMPLATES.filter((t) => t.difficulty === 'beginner');
  }
  return STARTER_TEMPLATES; // Pro mode gets all templates
}

// Create project from template
export function createProjectFromTemplate(
  template: ProjectTemplate,
  projectName: string,
  authorId?: string,
) {
  const projectId = `project-${Date.now()}`;

  return {
    id: projectId,
    name: projectName,
    description: template.description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    authorId,

    // Template settings
    settings: {
      ...template.settings,
      templateId: template.id,
      templateName: template.name,
    },

    // Chapters with generated IDs
    chapters: template.chapters.map((chapter, index) => ({
      ...chapter,
      id: `${projectId}-${chapter.id}`,
      projectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),

    // Scenes with generated IDs and proper filenames
    scenes: template.scenes.map((scene, _index) => {
      const chapterIndex = template.chapters.findIndex((c) => c.id === scene.chapterId);
      return {
        ...scene,
        id: `${projectId}-${scene.id}`,
        projectId,
        chapterId: `${projectId}-${scene.chapterId}`,
        filename: formatSceneFilename(projectName, chapterIndex, sceneIndex),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        content: scene.content || '', // Ensure content is never undefined
      };
    }),

    // Characters if provided
    characters:
      template.characters?.map((character) => ({
        ...character,
        id: `${projectId}-${character.id}`,
        projectId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })) || [],

    // Notes if provided
    notes:
      template.notes?.map((note) => ({
        ...note,
        id: `${projectId}-${note.id}`,
        projectId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })) || [],

    // Metadata
    metadata: {
      templateUsed: template.id,
      uiMode: template.difficulty === 'beginner' ? 'beginner' : 'pro',
      tags: template.tags || [],
      category: template.category,
      estimatedLength: template.estimatedLength,
    },
  };
}

// Opinionated editor defaults
export const EDITOR_DEFAULTS = {
  beginner: {
    focusMode: true, // Start in distraction-free mode
    autosaveInterval: 2000, // Save every 2 seconds
    softWrap: true, // No horizontal scrolling
    showWordCount: true, // Always show progress
    showAdvancedFormatting: false, // Keep it simple
    spellCheck: true, // Help with typos
    fontSize: 16, // Comfortable reading size
    lineHeight: 1.6, // Easy on the eyes
    theme: 'light', // Simple default theme
  },

  pro: {
    focusMode: false, // Full interface available
    autosaveInterval: 5000, // Less frequent saves
    softWrap: true,
    showWordCount: true,
    showAdvancedFormatting: true, // All formatting options
    spellCheck: true,
    fontSize: 14, // Compact for more content
    lineHeight: 1.5,
    theme: 'system', // Respect system preference
  },
};

// File naming conventions
export const NAMING_CONVENTIONS = {
  project: (name: string) => name.trim() || 'Untitled Project',

  chapter: (index: number, customTitle?: string) => customTitle?.trim() || `Chapter ${index + 1}`,

  scene: (projectName: string, chapterIndex: number, sceneIndex: number, customTitle?: string) => {
    if (customTitle?.trim()) {
      return customTitle.trim();
    }
    return formatSceneFilename(projectName, chapterIndex, sceneIndex);
  },

  note: (category: string, index: number) =>
    `${category.charAt(0).toUpperCase() + category.slice(1)} Note ${index + 1}`,

  character: (role: string, index: number) =>
    `${role.charAt(0).toUpperCase() + role.slice(1)} ${index + 1}`,
};

// Default project settings by genre
export const GENRE_DEFAULTS: Record<string, Partial<ProjectSettings>> = {
  mystery: {
    pointOfView: 'third-limited',
    tense: 'past',
    theme: 'Truth and justice',
  },

  romance: {
    pointOfView: 'third-limited',
    tense: 'past',
    theme: 'Love conquers all',
  },

  'science-fiction': {
    pointOfView: 'third-limited',
    tense: 'past',
    theme: 'Technology and humanity',
  },

  fantasy: {
    pointOfView: 'third-limited',
    tense: 'past',
    theme: 'Good vs. evil',
  },

  literary: {
    pointOfView: 'first',
    tense: 'present',
    theme: 'Human condition',
  },
};
