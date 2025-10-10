// Plot Boards feature types and data models
// Kanban-style visualization for story structure and scene organization

import { Scene, Chapter, TimelineEvent } from '../../domain/types';

/* ========= Core Plot Board Types ========= */
export interface PlotBoard {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  columns: PlotColumn[];
  settings: PlotBoardSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotColumn {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  color: string;
  order: number;
  cards: PlotCard[];
  type: PlotColumnType;
  settings: PlotColumnSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  order: number;
  // Links to existing data
  sceneId?: string;
  chapterId?: string;
  timelineEventIds?: string[];
  // Card-specific data
  status: PlotCardStatus;
  priority: PlotCardPriority;
  tags: string[];
  wordCount?: number;
  estimatedLength?: number; // in scenes/pages
  notes?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ========= Enums ========= */
export enum PlotColumnType {
  ACT = 'act',
  CHAPTER = 'chapter',
  CHARACTER_ARC = 'character_arc',
  SUBPLOT = 'subplot',
  THEME = 'theme',
  CUSTOM = 'custom',
}

export enum PlotCardStatus {
  IDEA = 'idea',
  OUTLINED = 'outlined',
  DRAFT = 'draft',
  REVISION = 'revision',
  COMPLETE = 'complete',
  CUT = 'cut',
}

export enum PlotCardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/* ========= Settings ========= */
export interface PlotBoardSettings {
  showWordCounts: boolean;
  showTimeline: boolean;
  showCharacters: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
  compactView: boolean;
  enableQuickActions: boolean;
}

export interface PlotColumnSettings {
  autoColor: boolean;
  showCardCount: boolean;
  collapsible: boolean;
  sortBy: 'order' | 'title' | 'status' | 'priority';
  showProgress: boolean;
}

/* ========= Template Types ========= */
export interface PlotBoardTemplate {
  id: string;
  name: string;
  description: string;
  category: PlotTemplateCategory;
  columns: PlotColumnTemplate[];
  tags: string[];
  isBuiltIn: boolean;
}

export interface PlotColumnTemplate {
  title: string;
  description: string;
  type: PlotColumnType;
  color: string;
  order: number;
  defaultCards?: PlotCardTemplate[];
}

export interface PlotCardTemplate {
  title: string;
  description: string;
  status: PlotCardStatus;
  priority: PlotCardPriority;
  tags: string[];
}

export enum PlotTemplateCategory {
  THREE_ACT = 'three_act',
  HEROES_JOURNEY = 'heroes_journey',
  SEVEN_POINT = 'seven_point',
  ROMANCE = 'romance',
  MYSTERY = 'mystery',
  CUSTOM = 'custom',
}

/* ========= View Types ========= */
export interface PlotBoardView {
  id: string;
  boardId: string;
  name: string;
  filters: PlotBoardFilters;
  sorting: PlotBoardSorting;
  grouping: PlotBoardGrouping;
  isDefault: boolean;
}

export interface PlotBoardFilters {
  statuses?: PlotCardStatus[];
  priorities?: PlotCardPriority[];
  tags?: string[];
  characters?: string[];
  chapters?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PlotBoardSorting {
  field: 'order' | 'title' | 'status' | 'priority' | 'wordCount' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PlotBoardGrouping {
  enabled: boolean;
  field: 'status' | 'priority' | 'character' | 'chapter' | 'tag';
}

/* ========= Action Types ========= */
export interface PlotBoardAction {
  type: PlotBoardActionType;
  timestamp: Date;
  userId?: string;
  cardId?: string;
  columnId?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export enum PlotBoardActionType {
  CARD_CREATED = 'card_created',
  CARD_UPDATED = 'card_updated',
  CARD_MOVED = 'card_moved',
  CARD_DELETED = 'card_deleted',
  COLUMN_CREATED = 'column_created',
  COLUMN_UPDATED = 'column_updated',
  COLUMN_DELETED = 'column_deleted',
  BOARD_UPDATED = 'board_updated',
}

/* ========= Integration Types ========= */
export interface PlotSceneLink {
  sceneId: string;
  scene: Scene;
  chapter: Chapter;
  isLinked: boolean;
  wordCount: number;
  status: PlotCardStatus;
}

export interface PlotTimelineLink {
  eventId: string;
  event: TimelineEvent;
  isLinked: boolean;
  cardIds: string[];
}

/* ========= Default Templates ========= */
export const DEFAULT_PLOT_TEMPLATES: PlotBoardTemplate[] = [
  {
    id: 'three-act-structure',
    name: 'Three-Act Structure',
    description: 'Classic three-act story structure with setup, confrontation, and resolution',
    category: PlotTemplateCategory.THREE_ACT,
    tags: ['structure', 'classic', 'beginner'],
    isBuiltIn: true,
    columns: [
      {
        title: 'Act I - Setup',
        description: 'Introduce characters, world, and inciting incident',
        type: PlotColumnType.ACT,
        color: '#10B981', // green
        order: 1,
        defaultCards: [
          {
            title: 'Opening Scene',
            description: 'Hook the reader and establish the story world',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.HIGH,
            tags: ['opening', 'hook'],
          },
          {
            title: 'Inciting Incident',
            description: 'The event that launches the main story',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.CRITICAL,
            tags: ['plot point', 'catalyst'],
          },
        ],
      },
      {
        title: 'Act II - Confrontation',
        description: 'Rising action, obstacles, and character development',
        type: PlotColumnType.ACT,
        color: '#F59E0B', // yellow
        order: 2,
        defaultCards: [
          {
            title: 'First Pinch Point',
            description: 'First major obstacle or setback',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.HIGH,
            tags: ['obstacle', 'conflict'],
          },
          {
            title: 'Midpoint',
            description: 'Major revelation or point of no return',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.CRITICAL,
            tags: ['revelation', 'midpoint'],
          },
          {
            title: 'Second Pinch Point',
            description: 'Darkest moment before the climax',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.HIGH,
            tags: ['crisis', 'dark moment'],
          },
        ],
      },
      {
        title: 'Act III - Resolution',
        description: 'Climax and resolution of the story',
        type: PlotColumnType.ACT,
        color: '#EF4444', // red
        order: 3,
        defaultCards: [
          {
            title: 'Climax',
            description: 'The final confrontation or decisive moment',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.CRITICAL,
            tags: ['climax', 'confrontation'],
          },
          {
            title: 'Resolution',
            description: 'Wrap up loose ends and show the new normal',
            status: PlotCardStatus.IDEA,
            priority: PlotCardPriority.MEDIUM,
            tags: ['resolution', 'ending'],
          },
        ],
      },
    ],
  },
  {
    id: 'heroes-journey',
    name: "Hero's Journey",
    description: "Joseph Campbell's monomyth structure for adventure stories",
    category: PlotTemplateCategory.HEROES_JOURNEY,
    tags: ['monomyth', 'adventure', 'classic'],
    isBuiltIn: true,
    columns: [
      {
        title: 'Ordinary World',
        description: "Hero's normal life before the adventure begins",
        type: PlotColumnType.ACT,
        color: '#8B5CF6', // purple
        order: 1,
      },
      {
        title: 'Call to Adventure',
        description: 'The problem or challenge that starts the journey',
        type: PlotColumnType.ACT,
        color: '#06B6D4', // cyan
        order: 2,
      },
      {
        title: 'Refusal of the Call',
        description: "Hero's reluctance to accept the challenge",
        type: PlotColumnType.ACT,
        color: '#84CC16', // lime
        order: 3,
      },
      {
        title: 'Special World',
        description: 'Hero enters the world of adventure',
        type: PlotColumnType.ACT,
        color: '#F97316', // orange
        order: 4,
      },
      {
        title: 'Return with Elixir',
        description: 'Hero returns home transformed with wisdom/power',
        type: PlotColumnType.ACT,
        color: '#EC4899', // pink
        order: 5,
      },
    ],
  },
];

/* ========= Default Board Settings ========= */
export const DEFAULT_BOARD_SETTINGS: PlotBoardSettings = {
  showWordCounts: true,
  showTimeline: true,
  showCharacters: true,
  colorScheme: 'auto',
  compactView: false,
  enableQuickActions: true,
};

export const DEFAULT_COLUMN_SETTINGS: PlotColumnSettings = {
  autoColor: true,
  showCardCount: true,
  collapsible: false,
  sortBy: 'order',
  showProgress: true,
};
