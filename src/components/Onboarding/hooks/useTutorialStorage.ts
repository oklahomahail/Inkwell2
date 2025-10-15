export interface TourProgress {
  completed?: boolean;
  stepIndex: number;
  variant?: string;
  startedAt?: number;
}

export function getTourProgress(id: string): TourProgress | null {
  try {
    const data = localStorage.getItem(`tour:${id}:progress`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function markTourLaunched(id: string): void {
  const progress: TourProgress = {
    stepIndex: 0,
    startedAt: Date.now(),
  };
  localStorage.setItem(`tour:${id}:progress`, JSON.stringify(progress));
}

export function markTourCompleted(id: string): void {
  const progress: TourProgress = {
    completed: true,
    stepIndex: -1, // Sentinel value
  };
  localStorage.setItem(`tour:${id}:completed`, JSON.stringify(progress));
  resetProgress(id); // Clear progress when completed
}

export function resetProgress(id: string): void {
  localStorage.removeItem(`tour:${id}:progress`);
}
