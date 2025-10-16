import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';

import { useOnboardingGate } from '@/hooks/useOnboardingGate';

import { useProfile } from '../../context/ProfileContext';
import { useTutorialStorage, type TutorialPreferences } from '../../services/tutorialStorage';

export type TourId = 'core' | 'feature-tour' | 'spotlight' | 'simple' | 'full-onboarding';

export interface TourStep {
  id: string;
  title?: string;
  content?: React.ReactNode;
  anchor?: string;
}

// Re-export from tutorialStorage
export type { TutorialPreferences } from '../../services/tutorialStorage';

interface TourContextValue {
  prefs: TutorialPreferences | null;
  hydrated: boolean;
  isFirstTimeUser: boolean;
  isActive: boolean;
  startTour: (id: string) => void;
  completeTour: (id: string) => void;
  // Additional properties
  tourState: { active: boolean; currentStep: number; steps: TourStep[]; tourId?: TourId } | null;
  setTourSteps: (steps: TourStep[], opts?: { goTo?: number }) => void;
  goToStep: (idx: number) => void;
  preferences: TutorialPreferences | null;
  setNeverShowAgain: (v: boolean) => void;
  setRemindMeLater: (v: boolean) => void;
  logAnalytics: (event: string, payload?: Record<string, any>) => void;
  checklist: string[];
  getChecklistProgress: () => { completed: number; total: number };
  canShowContextualTour: (key: string) => boolean;
  // Extra required properties
  completedTours: string[];
  neverShowAgain: boolean;
  remindMeLater: boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export const CORE_TOUR_STEPS: TourStep[] = [{ id: 'welcome' }, { id: 'profile' }, { id: 'writer' }];

export const TOUR_MAP: Record<TourId, TourStep[]> = {
  core: CORE_TOUR_STEPS,
  'feature-tour': [{ id: 'feat-1' }, { id: 'feat-2' }],
  spotlight: [{ id: 'spot-1' }],
  simple: [{ id: 's1' }, { id: 's2' }],
  'full-onboarding': [...CORE_TOUR_STEPS, { id: 'done' }],
};

export const CompletionChecklist = ['set-profile', 'create-project', 'write-500-words'];

const defaultPreferences: import('../../services/tutorialStorage').TutorialPreferences = {
  neverShowAgain: false,
  remindMeLater: false,
  completedTours: [],
  remindMeLaterUntil: undefined,
  tourDismissals: 0,
};

interface ProfileTourProviderProps {
  children: ReactNode;
}

export const ProfileTourProvider: React.FC<ProfileTourProviderProps> = ({ children }) => {
  const { active: activeProfile } = useProfile();
  const { setTourActive } = useOnboardingGate();
  const tutorialStorage = useTutorialStorage();

  const [prefs, setPrefs] = useState<TutorialPreferences | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tourState, setTourState] = useState<TourContextValue['tourState']>(null);

  const SAVE_DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 0 : 300;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePrefs = useCallback(
    (next: TutorialPreferences) => {
      if (!next) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const run = () => {
        tutorialStorage.setPreferences(next);
      };
      if (SAVE_DEBOUNCE_MS === 0) run();
      else saveTimer.current = setTimeout(run, SAVE_DEBOUNCE_MS);
    },
    [tutorialStorage, SAVE_DEBOUNCE_MS],
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  useEffect(() => {
    const id = activeProfile?.id;
    if (!id) {
      setPrefs(null);
      setHydrated(true);
      return;
    }
    let alive = true;
    (async () => {
      if (process.env.NODE_ENV === 'test' && (window as any).__PROFILE_TOUR_DEBUG__) {
        console.log('hydrating ProfileTourProvider...');
      }
      try {
        const loaded = await tutorialStorage.getPreferences();
        if (!alive) return;
        setPrefs({
          ...defaultPreferences,
          ...(loaded || {}),
          hasLaunched: loaded?.hasLaunched ?? !!loaded,
          completedTours: loaded?.completedTours ?? [],
        });
      } catch (error) {
        if (!alive) return;
        console.warn('Failed to load tutorial data:', error);
        setPrefs(null);
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeProfile?.id]);

  const sentActiveOnceRef = useRef(false);
  useEffect(() => {
    if (isActive && !sentActiveOnceRef.current) {
      sentActiveOnceRef.current = true;
      setTourActive(true);
    }
    if (!isActive) {
      sentActiveOnceRef.current = false;
    }
  }, [isActive, setTourActive]);

  const isFirstTimeUser = useMemo(() => {
    if (!hydrated) return true;
    return !(prefs?.hasLaunched === true || (prefs?.completedTours?.length ?? 0) > 0);
  }, [hydrated, prefs]);

  const setTourSteps = useCallback((steps: TourStep[], opts?: { goTo?: number }) => {
    setTourState({ active: true, currentStep: opts?.goTo ?? 0, steps, tourId: 'core' });
  }, []);

  const goToStep = useCallback((idx: number) => {
    setTourState((s) => (s ? { ...s, currentStep: idx } : s));
  }, []);

  const setNeverShowAgain = (v: boolean) =>
    setPrefs((p) => ({ ...(p ?? defaultPreferences), neverShowAgain: v }));

  const setRemindMeLater = (v: boolean) =>
    setPrefs((p) => ({ ...(p ?? defaultPreferences), remindMeLater: v }));

  const logAnalytics = (event: string, payload?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[tour.analytics]', event, payload ?? {});
    }
  };

  const getChecklistProgress = () => {
    const completed = (prefs?.hasLaunched ? 1 : 0) + (prefs?.completedTours?.length ?? 0);
    return {
      completed: Math.min(completed, CompletionChecklist.length),
      total: CompletionChecklist.length,
    };
  };

  const value = useMemo(
    () => ({
      prefs,
      hydrated,
      isFirstTimeUser,
      isActive,
      startTour: () => setIsActive(true),
      completeTour: (id: string) => {
        setPrefs((prev) => {
          const base = prev ?? defaultPreferences;
          const updated = {
            ...base,
            hasLaunched: true,
            completedTours: Array.from(new Set([...(base.completedTours ?? []), id])),
          };
          savePrefs(updated);
          return updated;
        });
        setIsActive(false);
      },
      // New API surface
      tourState,
      setTourSteps,
      goToStep,
      preferences: prefs,
      setNeverShowAgain,
      setRemindMeLater,
      logAnalytics,
      checklist: CompletionChecklist,
      getChecklistProgress,
      canShowContextualTour: () => true,
      completedTours: prefs?.completedTours ?? [],
      neverShowAgain: prefs?.neverShowAgain ?? false,
      remindMeLater: prefs?.remindMeLater ?? false,
    }),
    [prefs, hydrated, isFirstTimeUser, isActive, savePrefs, tourState, setTourSteps, goToStep],
  );

  return (
    <TourContext.Provider value={value}>
      <div data-testid="tour-state" style={{ display: 'none' }}>
        {JSON.stringify({ hydrated, isFirstTimeUser, isActive })}
      </div>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextValue => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within a ProfileTourProvider');
  return context;
};
