// src/services/TourStorage.ts
import { enhancedStorageService } from './storageService';

export type TourName = 'simple' | 'spotlight';

export interface TourProgress {
  seen: boolean;
  step: number;
}

const STORAGE_KEYS = {
  TUTORIAL_SEEN: (profileId: string, tourName: TourName) =>
    `inkwell.tutorial.${profileId}.${tourName}.seen`,
  TUTORIAL_STEP: (profileId: string, tourName: TourName) =>
    `inkwell.tutorial.${profileId}.${tourName}.step`,
};

export class TourStorage {
  constructor(private profileId: string) {}

  getTourProgress(tour: TourName): TourProgress {
    const seen =
      enhancedStorageService.getItem(STORAGE_KEYS.TUTORIAL_SEEN(this.profileId, tour)) === 'true';
    const step =
      Number(enhancedStorageService.getItem(STORAGE_KEYS.TUTORIAL_STEP(this.profileId, tour))) || 0;
    return { seen, step };
  }

  startTour(tour: TourName): void {
    const { seen } = this.getTourProgress(tour);
    if (seen) return; // No-op if already completed

    enhancedStorageService.setItem(STORAGE_KEYS.TUTORIAL_SEEN(this.profileId, tour), 'false');
    enhancedStorageService.setItem(STORAGE_KEYS.TUTORIAL_STEP(this.profileId, tour), '0');
  }

  endTour(tour: TourName): void {
    enhancedStorageService.setItem(STORAGE_KEYS.TUTORIAL_SEEN(this.profileId, tour), 'true');
    enhancedStorageService.removeItem(STORAGE_KEYS.TUTORIAL_STEP(this.profileId, tour));
  }

  setTourStep(tour: TourName, step: number): void {
    enhancedStorageService.setItem(STORAGE_KEYS.TUTORIAL_STEP(this.profileId, tour), String(step));
  }

  resetTour(tour: TourName): void {
    enhancedStorageService.removeItem(STORAGE_KEYS.TUTORIAL_SEEN(this.profileId, tour));
    enhancedStorageService.removeItem(STORAGE_KEYS.TUTORIAL_STEP(this.profileId, tour));
  }
}

export const createTourStorage = (profileId: string) => new TourStorage(profileId);
