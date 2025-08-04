// src/types/writing.ts
export type ExportFormat = 'markdown' | 'txt' | 'docx';

export interface WritingSession {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  wordCount: number;
  charactersTyped: number;
  backspacesUsed: number;
  timeActive: number; // milliseconds
}

export interface WritingStats {
  totalWords: number;
  totalCharacters: number;
  averageWordsPerSession: number;
  totalWritingTime: number; // milliseconds
  longestSession: number; // milliseconds
  currentStreak: number; // days
  longestStreak: number; // days
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxBackups: number;
}

export interface WritingPreferences {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'auto';
  autoSave: AutoSaveConfig;
  wordCountGoal?: number;
  dailyWordGoal?: number;
}
