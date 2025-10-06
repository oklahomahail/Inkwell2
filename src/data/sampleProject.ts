// src/data/sampleProject.ts
import { Project, CharacterRole, SceneStatus, ChapterStatus } from '../domain/types';

export const createSampleProject = (): Project => {
  return {
    id: 'sample-project-demo',
    name: 'The Midnight Library',
    description:
      'A mystery novel about a librarian who discovers that books in her library come alive after midnight.',
    content: `Chapter 1: The First Night

Elena had worked at the Whitmore Public Library for three years, but she had never stayed past closing time until that Tuesday evening. The autumn rain drummed against the tall windows as she finished cataloging the new arrivals, her desk lamp casting a warm circle of light in the otherwise dark building.

The grandfather clock in the corner struck midnight with its deep, resonant chimes. Elena looked up from her work, stretching her tired shoulders, when she heard it—a soft rustling sound coming from the fiction section.

She froze, listening intently. The sound came again, like pages being turned, whispered conversations, footsteps on carpet. Her logical mind told her it was just the old building settling, but her instincts suggested something else entirely.

Grabbing her flashlight, Elena crept toward the source of the sound. As she rounded the corner into the mystery section, she gasped. The books were glowing with a soft, ethereal light, and shadowy figures moved between the stacks—characters from the stories, as real as she was.

"Welcome to the true library," said a familiar voice. Elena turned to see Miss Marple herself, adjusting her hat with a knowing smile. "We've been waiting for someone like you."

Chapter 2: The Secret Keepers

Elena's hands trembled as she reached for the nearest shelf to steady herself. This couldn't be real. Books didn't come to life. Fictional characters didn't step out of their pages to greet librarians working late shifts.

"I'm hallucinating," she whispered. "Too much coffee, not enough sleep."

"Oh, my dear," Miss Marple said with a gentle laugh, "this is as real as the nose on your face. You see, some libraries are special. They're bridges between the world of stories and the world of reality. Whitmore Library is one of them, and you, Elena, are its new Guardian."

"Guardian?" Elena's voice cracked. She looked around and saw more figures emerging from the shadows: Hercule Poirot adjusting his mustache, Sherlock Holmes examining a book with his magnifying glass, and Nancy Drew flipping through what appeared to be a case file.

"Every midnight," Holmes said, his voice crisp and authoritative, "we emerge to solve mysteries that span both worlds. Cold cases that the living cannot solve, mysteries that bridge fiction and reality."

Nancy Drew stepped forward, her eyes bright with excitement. "There's been a murder, Elena. Right here in your library. A murder that happened fifty years ago, and the killer is still alive."

Elena felt her knees go weak. "A murder? Here?"

"The previous librarian," Poirot said gravely. "Madame Rose Whitmore, the founder's daughter. She died under mysterious circumstances, and her case was never solved. But we've been investigating, collecting clues, waiting for the right person to help us."

"Why me?" Elena asked.

Miss Marple smiled warmly. "Because, dear, you have the gift. You can see us, speak with us, help us bridge the gap between story and reality. Not everyone can do that."

As if to prove her point, the library around them began to shift and change. The modern fixtures faded, replaced by gaslight and Victorian furnishings. Elena found herself in the library as it existed fifty years ago, and there, sitting at what was now her desk, was a young woman with striking resemblance to the portrait that hung in the main reading room.

"Rose Whitmore," Elena breathed.

"The game, as they say, is afoot," Holmes declared. "And you, Miss Elena, are about to become part of the greatest mystery you've ever imagined."`,

    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago

    chapters: [
      {
        id: 'chapter-1',
        title: 'The First Night',
        order: 1,
        scenes: [
          {
            id: 'scene-1-1',
            title: 'Elena Works Late',
            content: `Elena had worked at the Whitmore Public Library for three years, but she had never stayed past closing time until that Tuesday evening...`,
            status: SceneStatus.COMPLETE,
            order: 1,
            wordCount: 850,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        ],
        totalWordCount: 850,
        status: ChapterStatus.COMPLETE,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'chapter-2',
        title: 'The Secret Keepers',
        content: `Elena's hands trembled as she reached for the nearest shelf to steady herself...`,
        order: 2,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'chapter-3',
        title: 'Clues in the Shadows',
        content: `As the library transformed around them, Elena felt like she was stepping into a living story...`,
        order: 3,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      },
    ],

    characters: [
      {
        id: 'elena-martinez',
        name: 'Elena Martinez',
        role: CharacterRole.PROTAGONIST,
        description:
          'A 28-year-old librarian with a quiet demeanor but sharp observational skills. She discovers she has the rare ability to communicate with fictional characters.',
        backstory:
          'Elena studied Literature in college and has always felt more comfortable in the world of books than in social situations. She lives alone in a small apartment above the old bookstore downtown.',
        traits: ['Observant', 'Introverted', 'Curious', 'Loyal'],
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'miss-marple',
        name: 'Miss Jane Marple',
        role: CharacterRole.SUPPORTING,
        description:
          "The famous detective from Agatha Christie's novels, appearing as a wise and gentle guide to help Elena understand her new abilities.",
        backstory:
          'Emerges from the mystery section every midnight to help solve cases that bridge the fictional and real worlds.',
        traits: ['Wise', 'Perceptive', 'Kind', 'Experienced'],
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'rose-whitmore',
        name: 'Rose Whitmore',
        role: CharacterRole.MINOR,
        description:
          'The previous librarian who died under mysterious circumstances 50 years ago. Her spirit appears in visions and memories.',
        backstory:
          "Daughter of the library's founder, she was passionate about books and helping the community. Her murder was never solved.",
        traits: ['Determined', 'Compassionate', 'Mysterious', 'Tragic'],
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      },
    ],

    beatSheet: [
      {
        id: 'opening-image',
        title: 'Opening Image',
        description:
          'Elena working alone in the library after hours, establishing the quiet, mysterious atmosphere.',
        type: 'plot',
        order: 1,
        completed: true,
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'inciting-incident',
        title: 'The Books Come Alive',
        description:
          'At midnight, Elena discovers that fictional characters emerge from the books in the library.',
        type: 'plot',
        order: 2,
        completed: true,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'first-plot-point',
        title: "The Guardian's Call",
        description:
          "Miss Marple reveals Elena is the new Guardian and tells her about Rose Whitmore's unsolved murder.",
        type: 'plot',
        order: 3,
        completed: true,
        createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'first-investigation',
        title: 'Investigating the Past',
        description:
          "Elena begins working with the fictional detectives to investigate Rose's murder.",
        type: 'plot',
        order: 4,
        completed: false,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'midpoint-twist',
        title: 'The Killer Still Lives',
        description:
          "Discovery that Rose's murderer is still alive and may be aware of Elena's investigation.",
        type: 'plot',
        order: 5,
        completed: false,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 24 * 60 * 60 * 1000,
      },
    ],
  };
};

// Project templates for different genres
export const PROJECT_TEMPLATES = {
  mystery: {
    name: 'Mystery Novel Template',
    description: 'A template for writing mystery and detective fiction',
    chapters: [
      { title: 'The Crime', content: '' },
      { title: 'The Investigation Begins', content: '' },
      { title: 'First Clues', content: '' },
      { title: 'Red Herrings', content: '' },
      { title: 'The Revelation', content: '' },
    ],
    characters: [
      { name: 'Detective', role: 'Protagonist' },
      { name: 'Victim', role: 'Victim' },
      { name: 'Suspect 1', role: 'Suspect' },
      { name: 'Suspect 2', role: 'Suspect' },
    ],
    beatSheet: [
      { title: 'Inciting Incident', description: 'The crime is discovered' },
      { title: 'First Plot Point', description: 'Detective takes the case' },
      { title: 'Midpoint', description: 'Major revelation or twist' },
      { title: 'Climax', description: 'Confrontation with the culprit' },
      { title: 'Resolution', description: 'Case is solved' },
    ],
  },

  romance: {
    name: 'Romance Novel Template',
    description: 'A template for writing romantic fiction',
    chapters: [
      { title: 'The Meeting', content: '' },
      { title: 'First Impressions', content: '' },
      { title: 'Growing Attraction', content: '' },
      { title: 'The Conflict', content: '' },
      { title: 'The Resolution', content: '' },
    ],
    characters: [
      { name: 'Love Interest 1', role: 'Protagonist' },
      { name: 'Love Interest 2', role: 'Love Interest' },
      { name: 'Best Friend', role: 'Supporting' },
      { name: 'The Obstacle', role: 'Antagonist' },
    ],
    beatSheet: [
      { title: 'Meet Cute', description: 'The romantic leads meet' },
      { title: 'Building Tension', description: 'Romantic tension develops' },
      { title: 'The Kiss', description: 'First romantic moment' },
      { title: 'The Crisis', description: 'Something threatens the relationship' },
      { title: 'Happy Ending', description: 'Love conquers all' },
    ],
  },

  scifi: {
    name: 'Science Fiction Template',
    description: 'A template for writing science fiction stories',
    chapters: [
      { title: 'The World', content: '' },
      { title: 'The Discovery', content: '' },
      { title: 'The Journey', content: '' },
      { title: 'The Challenge', content: '' },
      { title: 'The New Reality', content: '' },
    ],
    characters: [
      { name: 'The Explorer', role: 'Protagonist' },
      { name: 'The Mentor', role: 'Mentor' },
      { name: 'The Scientist', role: 'Supporting' },
      { name: 'The Threat', role: 'Antagonist' },
    ],
    beatSheet: [
      { title: 'Ordinary World', description: 'Establish the status quo' },
      { title: 'The Discovery', description: 'Something changes everything' },
      { title: 'New World', description: 'Enter the unknown' },
      { title: 'The Test', description: 'Face the greatest challenge' },
      { title: 'Return Changed', description: 'Hero returns transformed' },
    ],
  },
};

export const getTourTips = () => [
  {
    category: 'Writing',
    tips: [
      'Set a daily word count goal to maintain momentum',
      "Write first, edit later - don't get stuck on perfection",
      "Use the AI assistant to overcome writer's block",
      'Create detailed character profiles to keep personalities consistent',
    ],
  },
  {
    category: 'Organization',
    tips: [
      'Break your story into chapters for better structure',
      'Use the timeline feature to track story progression',
      'Tag scenes and chapters for easy navigation',
      'Keep notes about plot threads and character arcs',
    ],
  },
  {
    category: 'Productivity',
    tips: [
      'Focus mode helps eliminate distractions while writing',
      'Use keyboard shortcuts for faster navigation',
      'Set writing sessions with specific goals',
      'Track your progress to stay motivated',
    ],
  },
];
