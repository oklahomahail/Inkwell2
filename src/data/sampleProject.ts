// src/data/sampleProject.ts
import { Project, CharacterRole, SceneStatus, ChapterStatus } from '../domain/types';

export const createSampleProject = (): Project => {
  return {
    id: 'sample-project-demo',
    name: 'The Midnight Library',
    description:
      'A mystery novel about a librarian who discovers that books in her library come alive after midnight.',
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
        order: 2,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'chapter-3',
        title: 'Clues in the Shadows',
        order: 3,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
    characters: [
      {
        id: 'elena-martinez',
        name: 'Elena Martinez',
        role: CharacterRole.PROTAGONIST,
        description:
          'A 28-year-old librarian with a quiet demeanor but sharp observational skills. She discovers she has the rare ability to communicate with fictional characters.',
        traits: ['Observant', 'Introverted', 'Curious', 'Loyal'],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'miss-marple',
        name: 'Miss Jane Marple',
        role: CharacterRole.SUPPORTING,
        description:
          "The famous detective from Agatha Christie's novels, appearing as a wise and gentle guide to help Elena understand her new abilities.",
        traits: ['Wise', 'Perceptive', 'Kind', 'Experienced'],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'rose-whitmore',
        name: 'Rose Whitmore',
        role: CharacterRole.MINOR,
        description:
          'The previous librarian who died under mysterious circumstances 50 years ago. Her spirit appears in visions and memories.',
        traits: ['Determined', 'Compassionate', 'Mysterious', 'Tragic'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
    timelineEvents: [],
    writingSessions: [],
    metadata: {
      totalWordCount: 2850,
      targetWordCount: 80000,
      genre: 'Mystery',
      tags: ['mystery', 'library', 'supernatural'],
    },
    settings: {
      autoSaveEnabled: true,
      autoSaveInterval: 300000,
      backupEnabled: true,
      theme: 'dark' as const,
    },
  };
};

// Project templates for different genres
export const PROJECT_TEMPLATES = {
  mystery: {
    name: 'Mystery Novel Template',
    description: 'A template for writing mystery and detective fiction',
    chapters: [
      { title: 'The Crime' },
      { title: 'The Investigation Begins' },
      { title: 'First Clues' },
      { title: 'Red Herrings' },
      { title: 'The Revelation' },
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
      { title: 'The Meeting' },
      { title: 'First Impressions' },
      { title: 'Growing Attraction' },
      { title: 'The Conflict' },
      { title: 'The Resolution' },
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
      { title: 'The World' },
      { title: 'The Discovery' },
      { title: 'The Journey' },
      { title: 'The Challenge' },
      { title: 'The New Reality' },
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
