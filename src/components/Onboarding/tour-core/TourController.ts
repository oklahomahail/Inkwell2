export type StartOptions = { force?: boolean };

type TourId = 'feature-tour' | 'spotlight' | 'simple' | (string & {});

type TourEventName = 'tour:start' | 'tour:stop' | 'tour:step' | 'tour:complete' | 'tour:error';

interface TourStartDetail {
  id: TourId;
}
interface TourStopDetail {
  id: TourId;
  reason?: 'user' | 'program' | 'error';
}
interface TourStepDetail {
  id: TourId;
  stepId: string;
  index: number;
}
interface TourCompleteDetail {
  id: TourId;
}
interface TourErrorDetail {
  id: TourId;
  message: string;
}

declare global {
  interface Window {
    __inkwell?: {
      tour?: {
        running: boolean;
        id?: string;
      };
    };
  }
}

const bus = (typeof window !== 'undefined' ? window : undefined) as
  | (Window & typeof globalThis)
  | undefined;

const state = {
  running: false,
  id: undefined as TourId | undefined,
};

function dispatch<T>(name: TourEventName, detail: T) {
  if (!bus) return;
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export function isTourRunning() {
  return state.running;
}

export function currentTourId(): TourId | undefined {
  return state.id;
}

/**
 * Idempotent start. If a tour is already running, does nothing.
 * Your overlay should listen for `tour:start`:
 *   window.addEventListener('tour:start', (e) => { ... })
 */
export async function startTour(
  id: TourId,
  profileId?: string,
  opts?: StartOptions,
): Promise<boolean> {
  if (!bus) return false;
  if (state.running && state.id === id && !opts?.force) return false;

  state.running = true;
  state.id = id;
  // expose for quick console checks
  bus.__inkwell = bus.__inkwell || {};
  bus.__inkwell.tour = { running: true, id };

  dispatch<TourStartDetail>('tour:start', { id });
  return true;
}

/** Programmatic stop; overlay can also dispatch this on Done. */
export function stopTour(reason: TourStopDetail['reason'] = 'program') {
  if (!bus || !state.running) return;
  const id = state.id as TourId;
  state.running = false;
  state.id = undefined;
  bus.__inkwell = bus.__inkwell || {};
  bus.__inkwell.tour = { running: false };
  dispatch<TourStopDetail>('tour:stop', { id, reason });
}

/** Optional helpers your overlay can call to broadcast progress */
export function emitTourStep(stepId: string, index: number) {
  if (!bus || !state.running || !state.id) return;
  dispatch<TourStepDetail>('tour:step', { id: state.id, stepId, index });
}
export function emitTourComplete() {
  if (!bus || !state.running || !state.id) return;
  const id = state.id;
  stopTour('program');
  dispatch<TourCompleteDetail>('tour:complete', { id });
}
export function emitTourError(message: string) {
  if (!bus || !state.id) return;
  dispatch<TourErrorDetail>('tour:error', { id: state.id, message });
}

// Back-compat for places that still call TourController.startTour(...)
export const TourController = { startTour, isTourRunning };
