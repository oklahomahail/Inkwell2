export type TourName = 'simple' | 'spotlight';

export interface TourProgress {
  step: number;
  seen: boolean;
  completedAt?: number;
}

export interface SimpleTourStorage {
  getTourProgress: (tour: TourName) => TourProgress;
  startTour: (tour: TourName) => void;
  endTour: (tour: TourName) => void;
  setTourStep: (tour: TourName, step: number) => void;
  resetTour: (tour: TourName) => void;
}

export function createTourStorage(profileId: string | null): SimpleTourStorage {
  const getKey = (tour: TourName) => `tour:${profileId || 'default'}:${tour}`;

  const getTourProgress = (tour: TourName): TourProgress => {
    try {
      const stored = localStorage.getItem(getKey(tour));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }
    return { step: 0, seen: false };
  };

  const saveTourProgress = (tour: TourName, progress: TourProgress) => {
    try {
      localStorage.setItem(getKey(tour), JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  };

  const startTour = (tour: TourName) => {
    const progress = getTourProgress(tour);
    saveTourProgress(tour, { ...progress, step: 0, seen: true });
  };

  const endTour = (tour: TourName) => {
    const progress = getTourProgress(tour);
    saveTourProgress(tour, { ...progress, completedAt: Date.now() });
  };

  const setTourStep = (tour: TourName, step: number) => {
    const progress = getTourProgress(tour);
    saveTourProgress(tour, { ...progress, step });
  };

  const resetTour = (tour: TourName) => {
    saveTourProgress(tour, { step: 0, seen: false });
  };

  return {
    getTourProgress,
    startTour,
    endTour,
    setTourStep,
    resetTour,
  };
}
