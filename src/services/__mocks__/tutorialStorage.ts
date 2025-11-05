// Mock tutorialStorage service for tests

export interface TutorialPreferences {
  neverShowAgain: boolean;
  remindMeLater: boolean;
  completedTours: string[];
  tourDismissals: number;
  remindMeLaterUntil?: number;
}

export interface CompletionChecklist {
  createProject: boolean;
  addChapter: boolean;
  addCharacter: boolean;
  writeContent: boolean;
  useTimeline: boolean;
  exportProject: boolean;
  useAI: boolean;
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  tourType: string;
  startedAt: number;
  completedAt?: number;
  isCompleted: boolean;
  totalSteps: number;
  lastActiveAt: number;
}

export interface TutorialStorage {
  isProfileActive: boolean;
  getPreferences(): Promise<TutorialPreferences | null>;
  getChecklist(): Promise<CompletionChecklist | null>;
  getAllProgress(): Promise<Array<{ slug: string; progress: TutorialProgress }>>;
  setPreferences(prefs: TutorialPreferences): Promise<void>;
  setChecklist(checklist: CompletionChecklist): Promise<void>;
  setProgress(stepId: string, progress: TutorialProgress): Promise<void>;
  clearProgress(): Promise<void>;
}

export const useTutorialStorage = (): TutorialStorage => {
  return {
    isProfileActive: true,
    getPreferences: async () => null,
    getChecklist: async () => null,
    getAllProgress: async () => [],
    setPreferences: async () => {},
    setChecklist: async () => {},
    setProgress: async () => {},
    clearProgress: async () => {},
  };
};
