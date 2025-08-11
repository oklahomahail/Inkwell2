// ========================================
// ENHANCED TYPE DEFINITIONS
// ========================================

// src/types/project.ts
export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  personality: string[];
  backstory: string;
  goals: string;
  conflicts: string;
  appearance: string;
  relationships: CharacterRelationship[];
  appearsInChapters: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterRelationship {
  characterId: string;
  relationshipType: 'friend' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival' | 'ally';
  description: string;
  status: 'active' | 'past' | 'complicated';
}

export interface PlotNote {
  id: string;
  title: string;
  content: string;
  type: 'outline' | 'idea' | 'conflict' | 'resolution' | 'subplot' | 'theme';
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'in-progress' | 'completed' | 'abandoned';
  relatedCharacters: string[];
  chapterReferences: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorldBuildingNote {
  id: string;
  title: string;
  content: string;
  type: 'location' | 'culture' | 'magic-system' | 'technology' | 'history' | 'politics' | 'geography';
  relatedCharacters: string[];
  relatedPlots: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  summary?: string;
  content: string;
  wordCount: number;
  targetWordCount?: number;
  status: 'planned' | 'in-progress' | 'first-draft' | 'revised' | 'completed';
  order: number;
  charactersInChapter: string[];
  plotPointsResolved: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  wordsAdded: number;
  productivity: number; // words per minute
  focusTime: number; // time actually writing vs pausing
  notes?: string;
}

// Enhanced Project interface
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
  currentChapterId?: string;
  recentContent: string; // Last 1000 words for context
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  
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
    contextLength: 'short' | 'medium' | 'long';
  };
}
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
