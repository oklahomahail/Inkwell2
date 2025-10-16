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

interface TourContextValue {
  prefs: TutorialPreferences | null;
  hydrated: boolean;
  isFirstTimeUser: boolean;
  isActive: boolean;
  startTour: (id: string) => void;
  completeTour: (id: string) => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const defaultPreferences: TutorialPreferences = {
  neverShowAgain: false,
  remindMeLater: false,
  completedTours: [],
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
      setTourActive('full-onboarding');
    }
    if (!isActive) {
      sentActiveOnceRef.current = false;
    }
  }, [isActive, setTourActive]);

  const isFirstTimeUser = useMemo(() => {
    if (!hydrated) return true;
    return !(prefs?.hasLaunched === true || (prefs?.completedTours?.length ?? 0) > 0);
  }, [hydrated, prefs]);

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
    }),
    [prefs, hydrated, isFirstTimeUser, isActive, savePrefs],
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
