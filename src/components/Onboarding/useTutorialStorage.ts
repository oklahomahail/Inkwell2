// src/components/Onboarding/useTutorialStorage.ts
type TourId = 'feature-tour' | (string & {});
export interface TourProgress {
  id: TourId;
  launchedAt?: number;
  completed?: boolean;
  completedAt?: number;
  stepIndex?: number;
}

const KEY = (id: TourId) => `tour:${id}:progress`;

function safeParse(json: string | null): TourProgress | undefined {
  try {
    return json ? (JSON.parse(json) as TourProgress) : undefined;
  } catch {
    return undefined;
  }
}
function safeSave(id: TourId, value: TourProgress | undefined) {
  try {
    if (typeof window === 'undefined') return;
    if (!value) localStorage.removeItem(KEY(id));
    else localStorage.setItem(KEY(id), JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getTourProgress(id: TourId): TourProgress | undefined {
  if (typeof window === 'undefined') return undefined;
  return safeParse(localStorage.getItem(KEY(id)));
}

export function markTourLaunched(id: TourId) {
  const prev = getTourProgress(id) ?? { id };
  safeSave(id, { ...prev, launchedAt: Date.now(), completed: false });
}

export function markTourStep(id: TourId, stepIndex: number) {
  const prev = getTourProgress(id) ?? { id };
  safeSave(id, { ...prev, stepIndex });
}

export function markTourCompleted(id: TourId) {
  const prev = getTourProgress(id) ?? { id };
  safeSave(id, { ...prev, completed: true, completedAt: Date.now() });
}

export function resetProgress(id: TourId) {
  safeSave(id, undefined);
}
