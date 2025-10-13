// src/components/Onboarding/TourController.ts
type TourId = 'feature-tour' | (string & {});

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

const state: {
  running: boolean;
  id: TourId | undefined;
} = {
  running: false,
  id: undefined,
};

function dispatch<T>(name: TourEventName, detail: T) {
  if (!bus) return;
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export class TourController {
  static isTourRunning(): boolean {
    return state.running;
  }

  static currentTourId(): TourId | undefined {
    return state.id;
  }

  /**
   * Idempotent start. If a tour is already running, does nothing.
   * Your overlay should listen for `tour:start`:
   *   window.addEventListener('tour:start', (e) => { ... })
   */
  static async startTour(id: TourId): Promise<boolean> {
    if (!bus) return false;
    if (state.running && state.id === id) return true;

    state.running = true;
    state.id = id;
    // expose for quick console checks
    bus.__inkwell = bus.__inkwell || {};
    bus.__inkwell.tour = { running: true, id };

    dispatch<TourStartDetail>('tour:start', { id });
    return true;
  }

  /** Programmatic stop; overlay can also dispatch this on Done. */
  static stopTour(reason: TourStopDetail['reason'] = 'program'): void {
    if (!bus || !state.running) return;
    const id = state.id as TourId;
    state.running = false;
    state.id = undefined;
    bus.__inkwell = bus.__inkwell || {};
    bus.__inkwell.tour = { running: false, id: undefined };
    dispatch<TourStopDetail>('tour:stop', { id, reason });
  }

  /** Optional helpers your overlay can call to broadcast progress */
  static emitTourStep(stepId: string, index: number): void {
    if (!bus || !state.running || !state.id) return;
    dispatch<TourStepDetail>('tour:step', { id: state.id, stepId, index });
  }

  static emitTourComplete(): void {
    if (!bus || !state.running || !state.id) return;
    const id = state.id;
    this.stopTour('program');
    dispatch<TourCompleteDetail>('tour:complete', { id });
  }

  static emitTourError(message: string): void {
    if (!bus || !state.id) return;
    dispatch<TourErrorDetail>('tour:error', { id: state.id, message });
  }
}
