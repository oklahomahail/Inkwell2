import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, Suspense, lazy } from 'react';
import { Send, Book, Users, Map, Lightbulb, Settings, Plus, ChevronDown, ChevronUp, Save, Upload, Download, Moon, Sun, FileText, Zap, Eye, Clock, Calendar, AlertTriangle, CheckCircle, XCircle, ArrowRight, Filter, Search, Star, Edit3, FolderOpen, Archive, Home, BarChart3 } from 'lucide-react';

// Constants
const CONSTANTS = {
  MESSAGE_LIMIT: 50,
  AUTO_SAVE_INTERVAL: 30000,
  STORAGE_KEY: 'complete-writing-platform-v2',
  DEFAULT_TARGET_WORDS: 80000,
  CONFLICT_AGE_THRESHOLD: 1,
  DEBOUNCE_DELAY: 300,
  MAX_TIMELINE_EVENTS: 1000,
} as const;

// Utility functions
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Core Types
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  storyTime: {
    type: 'absolute' | 'relative' | 'age-based';
    date?: string;
    daysSinceStart?: number;
    characterAge?: { characterId: string; age: number };
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    season?: 'spring' | 'summer' | 'fall' | 'winter';
  };
  chapterId?: string;
  characters: string[];
  plotRelevance: 'major' | 'minor' | 'background';
  eventType: 'action' | 'dialogue' | 'internal' | 'flashback' | 'foreshadowing';
  tags: string[];
  notes: string;
  createdAt: Date;
  order: number;
}

interface TimelineConflict {
  id: string;
  type: 'character-age' | 'date-inconsistency' | 'season-mismatch' | 'travel-time' | 'custom';
  severity: 'low' | 'medium' | 'high';
  description: string;
  relatedEventIds: string[];
  resolved: boolean;
}

interface Project {
  id: string;
  title: string;
  genre: string;
  targetAudience: string;
  targetWordCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastOpened: Date;
  description?: string;
  status: 'planning' | 'drafting' | 'revising' | 'completed' | 'archived';
  isFavorite?: boolean;
  timeline: {
    storyStartDate?: string;
    timeScale: 'days' | 'weeks' | 'months' | 'years';
    trackingMode: 'linear' | 'multi-thread' | 'flashback-heavy';
  };
}

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  status: 'outlined' | 'in-progress' | 'drafted' | 'revised';
  notes: string;
  content?: string;
  scenes: number;
  completedScenes: number;
  order: number;
  lastEdited?: Date;
  timelineSpan: {
    startEventId?: string;
    endEventId?: string;
    estimatedDuration?: number;
  };
}

interface Character {
  id: string;
  name: string;
  role: string;
  importance: 'primary' | 'secondary' | 'minor';
  arc: string;
  notes: string;
  tags?: string[];
  timeline: {
    birthDate?: string;
    ageAtStoryStart?: number;
    keyMilestones: Array<{
      eventId: string;
      age?: number;
      description: string;
    }>;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: string;
}

interface ProjectData {
  project: Project;
  chapters: Chapter[];
  characters: Character[];
  timelineEvents: TimelineEvent[];
  timelineConflicts: TimelineConflict[];
  messages: ChatMessage[];
  currentMode: string;
}

interface AppState {
  projects: { [projectId: string]: ProjectData };
  currentProjectId: string | null;
  theme: 'light' | 'dark';
  settings: {
    autoSave: boolean;
    messageLimit: number;
    streamingEnabled: boolean;
  };
  activeView: 'dashboard' | 'writing' | 'timeline' | 'analysis';
}

// Genre configurations
const genreConfigs = {
  'middle-grade-adventure': {
    label: 'Middle Grade Adventure',
    audience: 'middle-grade',
    targetWords: 40000,
    description: 'Adventure stories for ages 8-12 with young protagonists',
    themes: ['friendship', 'courage', 'discovery', 'family']
  },
  'adult-mystery': {
    label: 'Adult Mystery',
    audience: 'adult',
    targetWords: 80000,
    description: 'Mystery/thriller for mature readers',
    themes: ['suspense', 'investigation', 'secrets', 'justice']
  },
  'ya-fantasy': {
    label: 'Young Adult Fantasy',
    audience: 'young-adult',
    targetWords: 70000,
    description: 'Fantasy adventure for teens with magical elements',
    themes: ['magic', 'coming-of-age', 'heroism', 'romance']
  },
  'literary-fiction': {
    label: 'Literary Fiction',
    audience: 'adult',
    targetWords: 85000,
    description: 'Character-driven stories exploring human experience',
    themes: ['relationships', 'identity', 'society', 'growth']
  },
  'romance': {
    label: 'Contemporary Romance',
    audience: 'adult',
    targetWords: 75000,
    description: 'Modern love stories with happy endings',
    themes: ['love', 'relationships', 'chemistry', 'happily-ever-after']
  },
  'scifi': {
    label: 'Science Fiction',
    audience: 'adult',
    targetWords: 90000,
    description: 'Speculative fiction exploring technology and future',
    themes: ['technology', 'future', 'exploration', 'humanity']
  }
} as const;

// Data validation
const validateProjectData = (data: any): data is ProjectData => {
  return (
    data &&
    typeof data.project === 'object' &&
    Array.isArray(data.chapters) &&
    Array.isArray(data.characters) &&
    Array.isArray(data.timelineEvents) &&
    Array.isArray(data.messages)
  );
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      setError(new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
  </div>
);

// Storage Hook with better error handling
const useAppStorage = (): [AppState, (updates: Partial<AppState>) => void] => {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(CONSTANTS.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and migrate data if necessary
        return {
          projects: parsed.projects || {},
          currentProjectId: parsed.currentProjectId || null,
          theme: parsed.theme || 'light',
          activeView: parsed.activeView || 'dashboard',
          settings: {
            autoSave: true,
            messageLimit: CONSTANTS.MESSAGE_LIMIT,
            streamingEnabled: true,
            ...parsed.settings
          }
        };
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Clear corrupted data
      localStorage.removeItem(CONSTANTS.STORAGE_KEY);
    }
    
    return {
      projects: {},
      currentProjectId: null,
      theme: 'light',
      activeView: 'dashboard',
      settings: {
        autoSave: true,
        messageLimit: CONSTANTS.MESSAGE_LIMIT,
        streamingEnabled: true
      }
    };
  });

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      try {
        localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving data:', error);
        // Handle storage quota exceeded
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          // Could implement cleanup logic here
          alert('Storage quota exceeded. Please consider archiving old projects.');
        }
      }
      return newState;
    });
  }, []);

  return [appState, updateAppState];
};

// Auto-save hook
const useAutoSave = (
  data: any,
  saveFunction: (data: any) => void,
  interval: number = CONSTANTS.AUTO_SAVE_INTERVAL,
  enabled: boolean = true
) => {
  const dataRef = React.useRef(data);
  const lastSaveRef = React.useRef<string>('');

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled) return;

    const autoSaveInterval = setInterval(() => {
      const currentDataString = JSON.stringify(dataRef.current);
      if (currentDataString !== lastSaveRef.current) {
        saveFunction(dataRef.current);
        lastSaveRef.current = currentDataString;
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [saveFunction, interval, enabled]);
};

// Custom hooks for feature logic
const useWritingAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    input: string,
    mode: string,
    projectData: ProjectData,
    onUpdateProject: (updates: Partial<ProjectData>) => void
  ) => {
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      id: generateId(),
      role: 'user' as const, 
      content: input, 
      timestamp: new Date(),
      mode 
    };
    
    onUpdateProject({
      messages: [...projectData.messages, userMessage]
    });
    
    setIsLoading(true);

    try {
      const response = await callClaude(
        `You're a ${mode} expert for ${projectData.project.genre} fiction targeting ${projectData.project.targetAudience} readers. 

Project: "${projectData.project.title}"
Description: ${projectData.project.description || 'No description provided'}
Current progress: ${projectData.chapters.length} chapters, ${projectData.characters.length} characters, ${projectData.timelineEvents.length} timeline events

User question: ${input}

Please provide specific, actionable advice tailored to this project.`,
        projectData.project.genre,
        projectData.project.targetAudience
      );

      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: response.content,
        timestamp: new Date(),
        mode
      };

      onUpdateProject({
        messages: [...projectData.messages, userMessage, assistantMessage]
      });
    } catch (error) {
      const errorMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: "I'm ready to help with your writing project! What would you like to work on?",
        timestamp: new Date(),
        mode
      };

      onUpdateProject({
        messages: [...projectData.messages, userMessage, errorMessage]
      });
    }

    setIsLoading(false);
  }, [isLoading]);

  return { sendMessage, isLoading };
};

const useTimeline = (timelineEvents: TimelineEvent[], characters: Character[]) => {
  const sortedEvents = useMemo(() => 
    [...timelineEvents].sort((a, b) => {
      if (a.storyTime.daysSinceStart !== undefined && b.storyTime.daysSinceStart !== undefined) {
        return a.storyTime.daysSinceStart - b.storyTime.daysSinceStart;
      }
      return (a.order || 0) - (b.order || 0);
    }), [timelineEvents]
  );

  const conflicts = useMemo(() => 
    analyzeTimelineConsistency(timelineEvents, characters), 
    [timelineEvents, characters]
  );

  const unresolvedConflicts = useMemo(() => 
    conflicts.filter(c => !c.resolved), 
    [conflicts]
  );

  return {
    sortedEvents,
    conflicts,
    unresolvedConflicts
  };
};

const useProjectStats = (projectData: ProjectData) => {
  const stats = useMemo(() => {
    const currentWordCount = projectData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    const progressPercentage = Math.round((currentWordCount / projectData.project.targetWordCount) * 100);
    const completedChapters = projectData.chapters.filter(ch => ch.status === 'drafted' || ch.status === 'revised').length;
    
    const statusDistribution = {
      outlined: projectData.chapters.filter(ch => ch.status === 'outlined').length,
      'in-progress': projectData.chapters.filter(ch => ch.status === 'in-progress').length,
      drafted: projectData.chapters.filter(ch => ch.status === 'drafted').length,
      revised: projectData.chapters.filter(ch => ch.status === 'revised').length
    };

    const characterImportance = {
      primary: projectData.characters.filter(char => char.importance === 'primary').length,
      secondary: projectData.characters.filter(char => char.importance === 'secondary').length,
      minor: projectData.characters.filter(char => char.importance === 'minor').length
    };

    return {
      currentWordCount,
      progressPercentage,
      completedChapters,
      statusDistribution,
      characterImportance,
      totalElements: projectData.characters.length + projectData.timelineEvents.length
    };
  }, [projectData]);

  return stats;
};

// Context Provider
interface WritingPlatformContextType {
  appState: AppState;
  updateAppState: (updates: Partial<AppState>) => void;
  currentProject: ProjectData | null;
  updateCurrentProject: (updates: Partial<ProjectData>) => void;
  createProject: (projectData: Partial<Project>) => void;
  selectProject: (projectId: string) => void;
  archiveProject: (projectId: string) => void;
}

const WritingPlatformContext = createContext<WritingPlatformContextType | null>(null);

export const useWritingPlatform = () => {
  const context = useContext(WritingPlatformContext);
  if (!context) {
    throw new Error('useWritingPlatform must be used within WritingPlatformProvider');
  }
  return context;
};

const WritingPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, updateAppState] = useAppStorage();
  
  const currentProject = appState.currentProjectId ? appState.projects[appState.currentProjectId] : null;

  // Auto-save current project
  useAutoSave(
    currentProject,
    (data: ProjectData) => {
      if (appState.currentProjectId && data) {
        updateAppState({
          projects: {
            ...appState.projects,
            [appState.currentProjectId]: data
          }
        });
      }
    },
    CONSTANTS.AUTO_SAVE_INTERVAL,
    appState.settings.autoSave
  );

  const updateCurrentProject = useCallback((updates: Partial<ProjectData>) => {
    if (appState.currentProjectId && appState.projects[appState.currentProjectId]) {
      const updatedProject = {
        ...appState.projects[appState.currentProjectId],
        ...updates,
        project: {
          ...appState.projects[appState.currentProjectId].project,
          ...updates.project,
          updatedAt: new Date()
        }
      };
      
      updateAppState({
        projects: {
          ...appState.projects,
          [appState.currentProjectId]: updatedProject
        }
      });
    }
  }, [appState.currentProjectId, appState.projects, updateAppState]);

  const createProject = useCallback((projectData: Partial<Project>) => {
    const projectId = generateId();
    const newProject: Project = {
      id: projectId,
      title: projectData.title || 'Untitled Project',
      genre: projectData.genre || 'fiction',
      targetAudience: projectData.targetAudience || 'adult',
      targetWordCount: projectData.targetWordCount || CONSTANTS.DEFAULT_TARGET_WORDS,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpened: new Date(),
      description: projectData.description || '',
      status: projectData.status || 'planning',
      timeline: {
        storyStartDate: new Date().toISOString().split('T')[0],
        timeScale: 'days',
        trackingMode: 'linear'
      }
    };

    const newProjectData: ProjectData = {
      project: newProject,
      chapters: [{
        id: generateId(),
        title: 'Chapter 1',
        wordCount: 0,
        status: 'outlined',
        notes: '',
        scenes: 3,
        completedScenes: 0,
        order: 1,
        timelineSpan: {}
      }],
      characters: [],
      timelineEvents: [],
      timelineConflicts: [],
      messages: [],
      currentMode: 'plot'
    };

    updateAppState({
      projects: {
        ...appState.projects,
        [projectId]: newProjectData
      },
      currentProjectId: projectId,
      activeView: 'writing'
    });
  }, [appState.projects, updateAppState]);

  const selectProject = useCallback((projectId: string) => {
    if (appState.projects[projectId]) {
      const updatedProject = {
        ...appState.projects[projectId],
        project: {
          ...appState.projects[projectId].project,
          lastOpened: new Date()
        }
      };
      
      updateAppState({
        projects: {
          ...appState.projects,
          [projectId]: updatedProject
        },
        currentProjectId: projectId,
        activeView: 'writing'
      });
    }
  }, [appState.projects, updateAppState]);

  const archiveProject = useCallback((projectId: string) => {
    if (appState.projects[projectId]) {
      const updatedProject = {
        ...appState.projects[projectId],
        project: {
          ...appState.projects[projectId].project,
          status: 'archived' as const
        }
      };
      
      updateAppState({
        projects: {
          ...appState.projects,
          [projectId]: updatedProject
        },
        currentProjectId: appState.currentProjectId === projectId ? null : appState.currentProjectId
      });
    }
  }, [appState.projects, appState.currentProjectId, updateAppState]);

  const value: WritingPlatformContextType = {
    appState,
    updateAppState,
    currentProject,
    updateCurrentProject,
    createProject,
    selectProject,
    archiveProject
  };

  return (
    <WritingPlatformContext.Provider value={value}>
      {children}
    </WritingPlatformContext.Provider>
  );
};

// Claude API with better error handling
const callClaude = async (prompt: string, genre: string, audience: string) => {
  try {
    if (typeof window !== 'undefined' && (window as any).claude?.complete) {
      const response = await (window as any).claude.complete(prompt);
      return { content: response };
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const genreResponses = {
      'middle-grade-adventure': `Great question for your middle grade adventure! For ages 8-12, focus on:\n\n• **Age-appropriate challenges**: Problems kids can relate to and solve\n• **Clear moral lessons**: Right vs wrong without heavy complexity\n• **Fast pacing**: Keep the action moving to hold young attention\n• **Relatable protagonists**: Characters aged 10-13 that readers connect with\n\nWhat aspect of your adventure story needs development?`,
      'adult-mystery': `Excellent mystery question! For adult readers, consider:\n\n• **Complex plotting**: Multiple red herrings and layered clues\n• **Psychological depth**: Character motivations and backstories\n• **Realistic procedures**: Authentic investigative methods\n• **Mature themes**: Adult consequences and moral ambiguity\n\nWhat mystery element are you working on?`,
      'default': `I'm here to help with your writing project! Each genre has unique conventions and reader expectations. What specific aspect would you like to explore?`
    };
    
    const genreKey = Object.keys(genreConfigs).find(key => 
      genreConfigs[key as keyof typeof genreConfigs].audience === audience
    ) || 'default';
    
    return { 
      content: genreResponses[genreKey as keyof typeof genreResponses] || genreResponses.default 
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to get response from writing assistant');
  }
};

// Timeline Analysis with better performance
const analyzeTimelineConsistency = (events: TimelineEvent[], characters: Character[]): TimelineConflict[] => {
  const conflicts: TimelineConflict[] = [];

  // Create character lookup map for better performance
  const characterMap = new Map(characters.map(c => [c.id, c]));

  events.forEach((event) => {
    if (event.storyTime.characterAge) {
      const character = characterMap.get(event.storyTime.characterAge.characterId);
      if (character?.timeline.ageAtStoryStart) {
        const expectedAge = character.timeline.ageAtStoryStart + (event.storyTime.daysSinceStart || 0) / 365;
        const declaredAge = event.storyTime.characterAge.age;
        
        if (Math.abs(expectedAge - declaredAge) > CONSTANTS.CONFLICT_AGE_THRESHOLD) {
          conflicts.push({
            id: generateId(),
            type: 'character-age',
            severity: 'medium',
            description: `${character.name} should be ~${expectedAge.toFixed(1)} years old, but event shows ${declaredAge}`,
            relatedEventIds: [event.id],
            resolved: false
          });
        }
      }
    }
  });

  const sortedEvents = [...events].sort((a, b) => (a.order || 0) - (b.order || 0));
  for (let i = 1; i < sortedEvents.length; i++) {
    const prev = sortedEvents[i - 1];
    const curr = sortedEvents[i];
    
    if (prev.storyTime.daysSinceStart !== undefined && curr.storyTime.daysSinceStart !== undefined) {
      if (curr.storyTime.daysSinceStart < prev.storyTime.daysSinceStart) {
        conflicts.push({
          id: generateId(),
          type: 'date-inconsistency',
          severity: 'high',
          description: `Event "${curr.title}" occurs before "${prev.title}" but is ordered after it`,
          relatedEventIds: [prev.id, curr.id],
          resolved: false
        });
      }
    }
  }

  return conflicts;
};

// Lazy load heavy components for better performance
const TimelineInterface = lazy(() => 
  Promise.resolve({ default: React.memo<{
    projectData: ProjectData;
    onUpdateProject: (updates: Partial<ProjectData>) => void;
  }>(({ projectData, onUpdateProject }) => {
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | undefined>();
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

    const { sortedEvents, unresolvedConflicts } = useTimeline(projectData.timelineEvents, projectData.characters);

    const handleCreateEvent = useCallback(() => {
      setEditingEvent(undefined);
      setShowEventModal(true);
    }, []);

    const handleSaveEvent = useCallback((eventData: Partial<TimelineEvent>) => {
      if (editingEvent) {
        const updatedEvents = projectData.timelineEvents.map(e =>
          e.id === editingEvent.id ? { ...e, ...eventData } : e
        );
        onUpdateProject({ timelineEvents: updatedEvents });
      } else {
        const newEvent: TimelineEvent = {
          id: generateId(),
          title: eventData.title || 'Untitled Event',
          description: eventData.description || '',
          storyTime: eventData.storyTime || { type: 'relative', daysSinceStart: 0 },
          characters: eventData.characters || [],
          plotRelevance: eventData.plotRelevance || 'minor',
          eventType: eventData.eventType || 'action',
          tags: eventData.tags || [],
          notes: eventData.notes || '',
          createdAt: new Date(),
          order: eventData.order || projectData.timelineEvents.length
        };
        onUpdateProject({ timelineEvents: [...projectData.timelineEvents, newEvent] });
      }
    }, [editingEvent, projectData.timelineEvents, onUpdateProject]);

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Timeline Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                Story Timeline
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {projectData.timelineEvents.length} events • {unresolvedConflicts.length} conflicts
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('visual')}
                  aria-pressed={viewMode === 'visual'}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'visual' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  List
                </button>
              </div>
              
              <button
                onClick={handleCreateEvent}
                aria-label="Add new timeline event"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus size={16} />
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Conflicts Alert */}
        {unresolvedConflicts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
            <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              {unresolvedConflicts.length} Timeline Conflicts Need Attention
            </h4>
            <div className="space-y-2">
              {unresolvedConflicts.slice(0, 3).map(conflict => (
                <div key={conflict.id} className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">{conflict.severity.toUpperCase()}:</span> {conflict.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {viewMode === 'visual' ? (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
              
              <div className="space-y-6">
                {sortedEvents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No timeline events yet</p>
                    <button
                      onClick={handleCreateEvent}
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      Create your first event
                    </button>
                  </div>
                ) : (
                  sortedEvents.map((event) => {
                    const hasConflict = unresolvedConflicts.some(c => c.relatedEventIds.includes(event.id));
                    const characterNames = event.characters.map(id => 
                      projectData.characters.find(c => c.id === id)?.name || 'Unknown'
                    ).join(', ');
                    
                    return (
                      <div key={event.id} className="relative flex items-start">
                        <div className={`relative z-10 w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                          hasConflict 
                            ? 'bg-red-500 border-red-600' 
                            : event.plotRelevance === 'major' 
                              ? 'bg-blue-600 border-blue-700'
                              : 'bg-gray-400 border-gray-500'
                        }`} aria-hidden="true">
                          {hasConflict && (
                            <AlertTriangle size={8} className="text-white absolute inset-0.5" />
                          )}
                        </div>
                        
                        <div 
                          className={`ml-6 flex-1 p-4 rounded-lg cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            hasConflict 
                              ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setEditingEvent(event)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setEditingEvent(event);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Edit event: ${event.title}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" role="img" aria-label={`${event.eventType} event`}>
                                {getEventIcon(event.eventType)}
                              </span>
                              <h4 className="font-medium text-gray-800 dark:text-gray-200">{event.title}</h4>
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {event.storyTime.daysSinceStart !== undefined && (
                                <span>Day {event.storyTime.daysSinceStart}</span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.description}</p>
                          
                          <div className="flex items-center gap-3 text-xs">
                            {characterNames && (
                              <span className="text-gray-500 dark:text-gray-400">👥 {characterNames}</span>
                            )}
                            {event.storyTime.timeOfDay && (
                              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                                {event.storyTime.timeOfDay}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded ${
                              event.plotRelevance === 'major' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                              event.plotRelevance === 'minor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {event.plotRelevance}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((event) => {
                const hasConflict = unresolvedConflicts.some(c => c.relatedEventIds.includes(event.id));
                const characterNames = event.characters.map(id => 
                  projectData.characters.find(c => c.id === id)?.name || 'Unknown'
                ).join(', ');
                
                return (
                  <div
                    key={event.id}
                    onClick={() => setEditingEvent(event)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditingEvent(event);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Edit event: ${event.title}`}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasConflict 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" role="img" aria-label={`${event.eventType} event`}>
                          {getEventIcon(event.eventType)}
                        </span>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{event.title}</h4>
                        {hasConflict && <AlertTriangle size={16} className="text-red-500" aria-label="Has conflict" />}
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {event.storyTime.daysSinceStart !== undefined && (
                          <span>Day {event.storyTime.daysSinceStart}</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {characterNames && (
                          <span className="text-gray-500 dark:text-gray-400">👥 {characterNames}</span>
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 rounded ${
                        event.plotRelevance === 'major' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        event.plotRelevance === 'minor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {event.plotRelevance}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="event-modal-title" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
              <h3 id="event-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {editingEvent ? 'Edit Timeline Event' : 'Create Timeline Event'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    placeholder="Event title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    placeholder="Event description..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSaveEvent({
                      title: 'New Event',
                      description: 'Event description',
                      storyTime: { type: 'relative', daysSinceStart: 0 },
                      characters: [],
                      plotRelevance: 'minor',
                      eventType: 'action',
                      tags: [],
                      notes: ''
                    });
                    setShowEventModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }) })
);

const AnalysisInterface = lazy(() => 
  Promise.resolve({ default: React.memo<{
    projectData: ProjectData;
  }>(({ projectData }) => {
    const stats = useProjectStats(projectData);
    const { unresolvedConflicts } = useTimeline(projectData.timelineEvents, projectData.characters);

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Project Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
            Project Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Writing Progress</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.progressPercentage}%</p>
              <p className="text-sm text-blue-700 dark:text-blue-500">{stats.currentWordCount.toLocaleString()} / {projectData.project.targetWordCount.toLocaleString()} words</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Chapter Progress</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedChapters}/{projectData.chapters.length}</p>
              <p className="text-sm text-green-700 dark:text-green-500">Chapters completed</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Story Elements</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalElements}</p>
              <p className="text-sm text-purple-700 dark:text-purple-500">{projectData.characters.length} characters, {projectData.timelineEvents.length} events</p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 dark:text-orange-300 mb-2">Timeline Health</h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{unresolvedConflicts.length}</p>
              <p className="text-sm text-orange-700 dark:text-orange-500">Conflicts to resolve</p>
            </div>
          </div>
        </div>

        {/* Writing Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Writing Activity</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Chapter Status Distribution</h4>
              <div className="space-y-2">
                {Object.entries(stats.statusDistribution).map(([status, count]) => {
                  const percentage = projectData.chapters.length > 0 ? (count / projectData.chapters.length) * 100 : 0;
                  
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-gray-600 dark:text-gray-400 capitalize">{status.replace('-', ' ')}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${status}: ${percentage.toFixed(1)}%`}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Character Importance</h4>
              <div className="space-y-2">
                {Object.entries(stats.characterImportance).map(([importance, count]) => {
                  const percentage = projectData.characters.length > 0 ? (count / projectData.characters.length) * 100 : 0;
                  
                  return (
                    <div key={importance} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-gray-600 dark:text-gray-400 capitalize">{importance}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${importance}: ${percentage.toFixed(1)}%`}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {projectData.messages.slice(-5).reverse().map(message => (
              <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`} aria-hidden="true"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {message.role === 'user' ? 'You' : 'Claude'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.timestamp.toLocaleDateString()}
                    </span>
                    {message.mode && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                        {message.mode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {message.content.substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
            
            {projectData.messages.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No activity yet. Start by asking Claude for writing help!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }) })
);

// Helper function for event icons
const getEventIcon = (type: string) => {
  const icons = {
    action: '⚔️',
    dialogue: '💬',
    internal: '🧠',
    flashback: '⏪',
    foreshadowing: '🔮'
  };
  return icons[type as keyof typeof icons] || '📝';
};

// Main Navigation Component with improved accessibility
const Navigation: React.FC<{
  activeView: string;
  onViewChange: (view: string) => void;
  currentProject: ProjectData | null;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}> = React.memo(({ activeView, onViewChange, currentProject, theme, onThemeToggle }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4" role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Writing Platform
          </h1>
          
          {currentProject && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400" aria-hidden="true">•</span>
              <span className="text-gray-600 dark:text-gray-400">{currentProject.project.title}</span>
              
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1" role="tablist">
                {[
                  { id: 'writing', label: 'Writing', icon: Edit3 },
                  { id: 'timeline', label: 'Timeline', icon: Clock },
                  { id: 'analysis', label: 'Analysis', icon: BarChart3 }
                ].map(view => {
                  const Icon = view.icon;
                  return (
                    <button
                      key={view.id}
                      onClick={() => onViewChange(view.id)}
                      role="tab"
                      aria-selected={activeView === view.id}
                      aria-controls={`${view.id}-panel`}
                      className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        activeView === view.id
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {view.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentProject && (
            <button
              onClick={() => onViewChange('dashboard')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Back to projects"
              aria-label="Back to project dashboard"
            >
              <Home size={18} />
            </button>
          )}
          
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
});

// Project Dashboard with improved performance
const ProjectDashboard: React.FC<{
  projects: { [key: string]: ProjectData };
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}> = React.memo(({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
  const [showArchived, setShowArchived] = useState(false);
  
  const { activeProjects, archivedProjects } = useMemo(() => {
    const projectList = Object.values(projects);
    return {
      activeProjects: projectList.filter(p => p.project.status !== 'archived'),
      archivedProjects: projectList.filter(p => p.project.status === 'archived')
    };
  }, [projects]);
  
  const displayProjects = showArchived ? archivedProjects : activeProjects;

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      drafting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      revising: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  }, []);

  const getGenreLabel = useCallback((projectData: ProjectData) => {
    const config = Object.entries(genreConfigs).find(([key, config]) => 
      config.audience === projectData.project.targetAudience
    );
    return config ? config[1].label : projectData.project.genre;
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <FolderOpen size={24} className="text-blue-600 dark:text-blue-400" />
            Your Writing Projects
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                showArchived 
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              }`}
              aria-pressed={showArchived}
            >
              <Archive size={14} className="inline mr-1" />
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
            <button
              onClick={onCreateProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Create new writing project"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {displayProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Book size={48} className="mx-auto mb-2" />
              <p>{showArchived ? 'No archived projects' : 'No active projects yet'}</p>
            </div>
            {!showArchived && (
              <button
                onClick={onCreateProject}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProjects.map((projectData) => {
              const { project, chapters, characters, timelineEvents } = projectData;
              const wordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
              const progress = Math.round((wordCount / (project.targetWordCount || CONSTANTS.DEFAULT_TARGET_WORDS)) * 100);
              
              return (
                <div
                  key={project.id}
                  className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => onSelectProject(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(project.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open project: ${project.title}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      {project.isFavorite && <Star size={16} className="text-yellow-500" aria-label="Favorite project" />}
                      {project.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Genre:</span>
                      <span className="font-medium">{getGenreLabel(projectData)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-medium">{progress}% ({wordCount.toLocaleString()} words)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chapters:</span>
                      <span className="font-medium">{chapters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline Events:</span>
                      <span className="font-medium">{timelineEvents.length}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{width: `${Math.min(progress, 100)}%`}}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Project progress: ${progress}%`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      {new Date(project.lastOpened).toLocaleDateString()}
                    </span>
                    {!showArchived && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                        title="Archive project"
                        aria-label={`Archive project: ${project.title}`}
                      >
                        <Archive size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
});

// Create Project Modal with improved form handling
const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectData: Partial<Project>) => void;
}> = React.memo(({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    genreConfig: 'middle-grade-adventure',
    description: ''
  });

  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleCreate = useCallback(() => {
    const newErrors: { title?: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const config = genreConfigs[formData.genreConfig as keyof typeof genreConfigs];
      onCreate({
        title: formData.title.trim(),
        genre: formData.genreConfig,
        targetAudience: config.audience,
        targetWordCount: config.targetWords,
        description: formData.description.trim(),
        status: 'planning'
      });
      setFormData({ title: '', genreConfig: 'middle-grade-adventure', description: '' });
      setErrors({});
      onClose();
    }
  }, [formData, onCreate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleCreate, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      role="dialog" 
      aria-labelledby="create-project-title" 
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 id="create-project-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Create New Project
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Title <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., The Secret of Willow Creek"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.title 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-red-500 text-xs mt-1" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="genre-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Genre & Audience
            </label>
            <select
              id="genre-select"
              value={formData.genreConfig}
              onChange={(e) => setFormData(prev => ({ ...prev, genreConfig: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.entries(genreConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label} ({config.targetWords.toLocaleString()} words)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {genreConfigs[formData.genreConfig as keyof typeof genreConfigs]?.description}
            </p>
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your story concept..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Project
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Tip: Press Ctrl+Enter to create quickly
        </p>
      </div>
    </div>
  );
});

// Main Writing Interface with improved performance
const WritingInterface: React.FC<{
  projectData: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}> = React.memo(({ projectData, onUpdateProject }) => {
  const [activeMode, setActiveMode] = useState('plot');
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useWritingAssistant();

  const modes = useMemo(() => ({
    plot: { icon: Map, title: 'Plot & Structure', color: 'blue' },
    characters: { icon: Users, title: 'Character Development', color: 'purple' },
    dialogue: { icon: Send, title: 'Dialogue & Voice', color: 'green' },
    worldbuilding: { icon: Book, title: 'World & Setting', color: 'orange' },
    revision: { icon: Edit3, title: 'Revision & Editing', color: 'red' },
    brainstorm: { icon: Lightbulb, title: 'Creative Brainstorming', color: 'yellow' }
  }), []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const currentInput = input;
    setInput('');
    await sendMessage(currentInput, activeMode, projectData, onUpdateProject);
  }, [input, isLoading, activeMode, projectData, onUpdateProject, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Mode Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Writing assistance modes">
          {Object.entries(modes).map(([key, mode]) => {
            const Icon = mode.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveMode(key)}
                role="tab"
                aria-selected={activeMode === key}
                aria-controls={`mode-${key}-panel`}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeMode === key
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {mode.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div 
              className="h-96 overflow-y-auto p-4 space-y-3"
              role="log"
              aria-live="polite"
              aria-label="Writing assistant conversation"
            >
              {projectData.messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <div className="flex justify-center gap-2 mb-4">
                    {React.createElement(modes[activeMode as keyof typeof modes].icon, { 
                      size: 32, 
                      className: "text-blue-600 dark:text-blue-400",
                      'aria-hidden': true 
                    })}
                    <Zap size={32} className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <p className="font-medium">Ready to help with "{projectData.project.title}"!</p>
                  <p className="text-sm mt-2">Current focus: <strong>{modes[activeMode as keyof typeof modes].title}</strong></p>
                  <p className="text-xs mt-1 text-gray-400">Ask me anything about your {projectData.project.genre} project</p>
                </div>
              ) : (
                projectData.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl px-4 py-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                      role={message.role === 'user' ? 'log' : 'status'}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.mode && (
                        <div className="text-xs mt-1 opacity-70">
                          {modes[message.mode as keyof typeof modes]?.title}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
                      <span aria-live="polite">Claude is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 p-4">
              <div className="flex gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Ask about {modes[activeMode as keyof typeof modes].title.toLowerCase()}
                </label>
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask about ${modes[activeMode as keyof typeof modes].title.toLowerCase()}...`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={isLoading}
                  aria-describedby="chat-input-help"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Send message"
                >
                  <Send size={14} aria-hidden="true" />
                </button>
              </div>
              <p id="chat-input-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Project Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Word Count</span>
                  <span>{projectData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0).toLocaleString()} / {projectData.project.targetWordCount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{width: `${Math.min(Math.round((projectData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) / projectData.project.targetWordCount) * 100), 100)}%`}}
                    role="progressbar"
                    aria-valuenow={Math.round((projectData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) / projectData.project.targetWordCount) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Writing progress"
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{projectData.chapters.length}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-500">Chapters</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{projectData.characters.length}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-500">Characters</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{projectData.timelineEvents.length}</div>
                  <div className="text-xs text-green-700 dark:text-green-500">Events</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Quick Add</h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  const newChapter = {
                    id: generateId(),
                    title: `Chapter ${projectData.chapters.length + 1}`,
                    wordCount: 0,
                    status: 'outlined' as const,
                    notes: '',
                    scenes: 3,
                    completedScenes: 0,
                    order: projectData.chapters.length + 1,
                    timelineSpan: {}
                  };
                  onUpdateProject({ chapters: [...projectData.chapters, newChapter] });
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Add Chapter ${projectData.chapters.length + 1}`}
              >
                <Book size={14} aria-hidden="true" />
                Add Chapter
              </button>
              <button 
                onClick={() => {
                  const newCharacter = {
                    id: generateId(),
                    name: 'New Character',
                    role: 'Supporting',
                    importance: 'secondary' as const,
                    arc: '',
                    notes: '',
                    timeline: { keyMilestones: [] }
                  };
                  onUpdateProject({ characters: [...projectData.characters, newCharacter] });
                }}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Add new character"
              >
                <Users size={14} aria-hidden="true" />
                Add Character
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Main Application Component
const CompleteWritingPlatform: React.FC = () => {
  const {
    appState,
    updateAppState,
    currentProject,
    updateCurrentProject,
    createProject,
    selectProject,
    archiveProject
  } = useWritingPlatform();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Theme management
  useEffect(() => {
    document.documentElement.classList.toggle('dark', appState.theme === 'dark');
  }, [appState.theme]);

  const toggleTheme = useCallback(() => {
    updateAppState({ theme: appState.theme === 'light' ? 'dark' : 'light' });
  }, [appState.theme, updateAppState]);

  const changeView = useCallback((view: string) => {
    updateAppState({ activeView: view as any });
  }, [updateAppState]);

  // Show dashboard if no current project
  if (!currentProject || appState.activeView === 'dashboard') {
    return (
      <div className={`min-h-screen transition-colors ${
        appState.theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
          : 'bg-gradient-to-b from-blue-50 to-purple-50'
      }`}>
        <Navigation
          activeView={appState.activeView}
          onViewChange={changeView}
          currentProject={null}
          theme={appState.theme}
          onThemeToggle={toggleTheme}
        />
        
        <ProjectDashboard
          projects={appState.projects}
          onSelectProject={selectProject}
          onCreateProject={() => setShowCreateModal(true)}
          onDeleteProject={archiveProject}
        />
        
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
        />
      </div>
    );
  }

  // Show main interface for current project
  return (
    <div className={`min-h-screen transition-colors ${
      appState.theme === 'dark' 
        ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
        : 'bg-gradient-to-b from-blue-50 to-purple-50'
    }`}>
      <Navigation
        activeView={appState.activeView}
        onViewChange={changeView}
        currentProject={currentProject}
        theme={appState.theme}
        onThemeToggle={toggleTheme}
      />

      <div role="tabpanel" id={`${appState.activeView}-panel`}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {appState.activeView === 'writing' && (
              <WritingInterface
                projectData={currentProject}
                onUpdateProject={updateCurrentProject}
              />
            )}

            {appState.activeView === 'timeline' && (
              <TimelineInterface
                projectData={currentProject}
                onUpdateProject={updateCurrentProject}
              />
            )}

            {appState.activeView === 'analysis' && (
              <AnalysisInterface
                projectData={currentProject}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>📚 <strong>Complete Writing Platform</strong> - Everything you need for fiction writing</p>
        <p className="text-xs mt-1">
          ✅ Multi-project management • ✅ Timeline tracking • ✅ AI assistance • ✅ Progress analytics • ✅ Dark/Light themes
        </p>
      </footer>
    </div>
  );
};

// Main App wrapper with providers
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <WritingPlatformProvider>
        <CompleteWritingPlatform />
      </WritingPlatformProvider>
    </ErrorBoundary>
  );
};

export default App;