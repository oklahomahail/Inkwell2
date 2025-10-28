import { devLog, devWarn, devError } from '@/utils/devLog';

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

// Counter guard to prevent rapid restart loops
interface RestartAttempt {
  timestamp: number;
  tourId: TourId;
}

const RESTART_WINDOW_MS = 5000; // 5 second window
const MAX_RESTARTS = 3; // Max 3 restarts within window

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
  restartAttempts: [] as RestartAttempt[],
};

/**
 * Check if tour restarts are happening too rapidly (potential loop)
 */
function isRestartLoop(tourId: TourId): boolean {
  const now = Date.now();

  // Clean up old attempts outside the window
  state.restartAttempts = state.restartAttempts.filter(
    (attempt) => now - attempt.timestamp < RESTART_WINDOW_MS,
  );

  // Count recent attempts for this tour
  const recentAttempts = state.restartAttempts.filter((attempt) => attempt.tourId === tourId);

  if (recentAttempts.length >= MAX_RESTARTS) {
    devError(
      `[TourController] 🔄 RESTART LOOP DETECTED for "${tourId}". ` +
        `${recentAttempts.length} attempts in ${RESTART_WINDOW_MS}ms. Blocking further restarts.`,
    );
    return true;
  }

  return false;
}

/**
 * Record a restart attempt
 */
function recordRestartAttempt(tourId: TourId): void {
  state.restartAttempts.push({
    timestamp: Date.now(),
    tourId,
  });
  devLog(
    `[TourController] 📝 Restart attempt recorded for "${tourId}" (${state.restartAttempts.length} total in window)`,
  );
}

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
  devLog(
    `[TourController] 🎬 startTour called: id="${id}", profileId="${profileId}", force=${opts?.force}`,
  );

  if (!bus) {
    devError('[TourController] ❌ No window/bus available');
    return false;
  }

  // Check for restart loop (unless force is explicitly set)
  if (!opts?.force && isRestartLoop(id)) {
    emitTourError('Tour restart loop detected. Please wait before trying again.');
    devWarn(`[TourController] ⚠️ Tour "${id}" blocked due to restart loop`);
    return false;
  }

  if (state.running && state.id === id && !opts?.force) {
    devLog(`[TourController] ℹ️ Tour "${id}" already running, skipping start`);
    return false;
  }

  // Record this restart attempt
  recordRestartAttempt(id);

  state.running = true;
  state.id = id;
  // expose for quick console checks
  bus.__inkwell = bus.__inkwell || {};
  bus.__inkwell.tour = { running: true, id };

  devLog(`[TourController] ✅ Tour "${id}" started successfully`);
  dispatch<TourStartDetail>('tour:start', { id });
  return true;
}

/** Programmatic stop; overlay can also dispatch this on Done. */
export function stopTour(reason: TourStopDetail['reason'] = 'program') {
  if (!bus || !state.running) {
    devLog('[TourController] ℹ️ stopTour called but no tour running');
    return;
  }
  const id = state.id as TourId;
  state.running = false;
  state.id = undefined;
  bus.__inkwell = bus.__inkwell || {};
  bus.__inkwell.tour = { running: false };
  devLog(`[TourController] ⏹️ Tour "${id}" stopped (reason: ${reason})`);
  dispatch<TourStopDetail>('tour:stop', { id, reason });
}

/** Optional helpers your overlay can call to broadcast progress */
export function emitTourStep(stepId: string, index: number) {
  if (!bus || !state.running || !state.id) return;
  devLog(`[TourController] 👣 Step progress: "${stepId}" (${index + 1})`);
  dispatch<TourStepDetail>('tour:step', { id: state.id, stepId, index });
}
export function emitTourComplete() {
  if (!bus || !state.running || !state.id) return;
  const id = state.id;
  devLog(`[TourController] 🎉 Tour "${id}" completed`);
  stopTour('program');
  dispatch<TourCompleteDetail>('tour:complete', { id });
}
export function emitTourError(message: string) {
  if (!bus || !state.id) return;
  devError(`[TourController] ❌ Tour error in "${state.id}": ${message}`);
  dispatch<TourErrorDetail>('tour:error', { id: state.id, message });
}

// Back-compat for places that still call TourController.startTour(...)
export const TourController = { startTour, isTourRunning };
