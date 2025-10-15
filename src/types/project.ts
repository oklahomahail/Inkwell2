// src/types/project.ts
// ========================================
// ENHANCED TYPE DEFINITIONS (clean)
// ========================================

/**
 * Relationship kinds between two characters.
 */
export type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'family'
  | 'romantic'
  | 'mentor'
  | 'rival'
  | 'ally';

/**
 * Character roles within the story.
 */
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';

/**
 * Plot note kinds and status.
 */
export type PlotNoteType = 'outline' | 'idea' | 'conflict' | 'resolution' | 'subplot' | 'theme';
export type NotePriority = 'high' | 'medium' | 'low';
export type NoteStatus = 'planned' | 'in-progress' | 'completed' | 'abandoned';

/**
 * World building note kinds.
 */
export type WorldBuildingType =
  | 'location'
  | 'culture'
  | 'magic-system'
  | 'technology'
  | 'history'
  | 'politics'
  | 'geography';

/**
 * Chapter status lifecycle.
 */
export type ChapterStatus = 'planned' | 'in-progress' | 'first-draft' | 'revised' | 'completed';

/**
 * How much Claude context to include.
 */
export type ContextLength = 'short' | 'medium' | 'long';

// ----------------------------------------
// Core Story Types
// ----------------------------------------

export interface CharacterRelationship {
  characterId: string; // references Character.id
  relationshipType: RelationshipType;
  description: string;
  status: 'active' | 'past' | 'complicated';
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  description: string;
  personality: string[]; // e.g., ['curious', 'stubborn']
  backstory: string;
  goals: string;
  conflicts: string;
  appearance: string;
  relationships: CharacterRelationship[];
  appearsInChapters: string[]; // chapter ids
  notes: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface PlotNote {
  id: string;
  title: string;
  content: string;
  type: PlotNoteType;
  priority: NotePriority;
  status: NoteStatus;
  relatedCharacters: string[]; // character ids
  chapterReferences: string[]; // chapter ids
  tags: string[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface WorldBuildingNote {
  id: string;
  title: string;
  content: string;
  type: WorldBuildingType;
  relatedCharacters: string[]; // character ids
  relatedPlots: string[]; // plot note ids
  tags: string[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface Chapter {
  scenes: any;
  id: string;
  title: string;
  summary?: string;
  content: string;
  wordCount: number;
  targetWordCount?: number;
  status: ChapterStatus;
  order: number; // position in the book
  charactersInChapter: string[]; // character ids
  plotPointsResolved: string[]; // plot note ids
  notes: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

// ----------------------------------------
// Writing Sessions
// ----------------------------------------
// IMPORTANT:
// You already have a WritingSession type elsewhere (e.g. src/types/writing.ts).
// To avoid duplicate/ambiguous declarations, we re-export it here.
// If you truly need a different shape for project-level sessions, define a new
// name like `ProjectWritingSession` instead of `WritingSession`.

// WritingSession is now internal to this module
export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  wordsAdded: number;
  productivity: number;
  focusTime: number;
  notes?: string;
}

// ----------------------------------------
// Enhanced Project
// ----------------------------------------

export interface EnhancedProject {
  // Core project info
  id: string;
  name: string;
  description: string;
  genre?: string;
  targetAudience?: string;
  targetWordCount?: number;
  currentWordCount: number;

  // Story elements
  characters: Character[];
  plotNotes: PlotNote[];
  worldBuilding: WorldBuildingNote[];
  chapters: Chapter[];

  // Writing context
  currentChapterId?: string; // chapter id
  /**
   * Last ~1000 words for assistant/contextual tools.
   * Keep this trimmed in code; type is just string.
   */
  recentContent: string;

  // Metadata
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // Writing analytics
  sessions: WritingSession[];
  dailyGoal?: number;

  // Claude context settings
  claudeContext: {
    includeCharacters: boolean;
    includePlotNotes: boolean;
    includeWorldBuilding: boolean;
    maxCharacters: number;
    maxPlotNotes: number;
    contextLength: ContextLength;
  };
}
