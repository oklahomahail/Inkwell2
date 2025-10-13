// src/services/tourStorage.ts
import type { TourStep } from '@/types/tour';

export interface TourProgress {
  currentStep: number;
  completedSteps: string[];
  steps: TourStep[];
  isActive: boolean;
  lastUpdate: Date;
}

export interface TourStorage {
  getProgress(): Promise<TourProgress | null>;
  setProgress(progress: TourProgress): Promise<void>;
  getCompletedTours(): Promise<string[]>;
  markTourCompleted(tourId: string): Promise<void>;
  clearProgress(tourId?: string): Promise<void>;
}

// LocalStorage-based implementation of TourStorage
export class LocalTourStorage implements TourStorage {
  private readonly PROGRESS_KEY = 'tour_progress';
  private readonly COMPLETED_TOURS_KEY = 'completed_tours';

  async getProgress(): Promise<TourProgress | null> {
    try {
      const stored = localStorage.getItem(this.PROGRESS_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      if (!parsed) return null;

      return {
        ...parsed,
        lastUpdate: new Date(parsed.lastUpdate),
      };
    } catch (error) {
      console.warn('Failed to load tour progress:', error);
      return null;
    }
  }

  async setProgress(progress: TourProgress): Promise<void> {
    try {
      localStorage.setItem(
        this.PROGRESS_KEY,
        JSON.stringify({
          ...progress,
          lastUpdate: new Date(),
        }),
      );
    } catch (error) {
      console.warn('Failed to save tour progress:', error);
      throw error;
    }
  }

  async getCompletedTours(): Promise<string[]> {
    try {
      const stored = localStorage.getItem(this.COMPLETED_TOURS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load completed tours:', error);
      return [];
    }
  }

  async markTourCompleted(tourId: string): Promise<void> {
    try {
      const completed = await this.getCompletedTours();
      if (!completed.includes(tourId)) {
        completed.push(tourId);
        localStorage.setItem(this.COMPLETED_TOURS_KEY, JSON.stringify(completed));
      }
    } catch (error) {
      console.warn('Failed to mark tour as completed:', error);
      throw error;
    }
  }

  async clearProgress(tourId?: string): Promise<void> {
    try {
      if (tourId) {
        const progress = await this.getProgress();
        if (progress && progress.steps[0]?.tourId === tourId) {
          localStorage.removeItem(this.PROGRESS_KEY);
        }
      } else {
        localStorage.removeItem(this.PROGRESS_KEY);
        localStorage.removeItem(this.COMPLETED_TOURS_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear tour progress:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tourStorage = new LocalTourStorage();
