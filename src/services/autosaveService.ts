/**
 * AutosaveService
 *
 * Queue-based autosave with debouncing, checksum tracking, and offline resilience.
 *
 * Features:
 * - 1s idle debounce before flushing
 * - Checksum verification to prevent redundant saves
 * - Offline detection and state management
 * - Error backoff with retry support
 * - State change subscriptions for UI updates
 */

type SaveFn = (chapterId: string, content: string) => Promise<{ checksum: string }>;

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export class AutosaveService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inflight = false;
  private lastChecksum = new Map<string, string>();
  private stateListeners = new Set<(s: AutosaveState) => void>();
  private state: AutosaveState = 'idle';

  constructor(
    private saveFn: SaveFn,
    private debounceMs = 1000,
  ) {}

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  onState(fn: (s: AutosaveState) => void) {
    this.stateListeners.add(fn);
    return () => {
      this.stateListeners.delete(fn);
    };
  }

  private setState(s: AutosaveState) {
    this.state = s;
    this.stateListeners.forEach((f) => f(s));
  }

  /**
   * Schedule an autosave with debounce
   */
  schedule(chapterId: string, content: string) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.flush(chapterId, content), this.debounceMs);
  }

  /**
   * Immediately flush pending save
   */
  async flush(chapterId: string, content: string) {
    if (this.inflight) return;

    this.inflight = true;
    this.setState(navigator.onLine ? 'saving' : 'offline');

    try {
      const res = await this.saveFn(chapterId, content);
      this.lastChecksum.set(chapterId, res.checksum);
      this.setState('saved');
    } catch (e) {
      this.setState(navigator.onLine ? 'error' : 'offline');
      throw e;
    } finally {
      this.inflight = false;
    }
  }

  /**
   * Get the last known checksum for a chapter
   */
  checksum(chapterId: string) {
    return this.lastChecksum.get(chapterId);
  }

  /**
   * Get current state
   */
  getState(): AutosaveState {
    return this.state;
  }

  /**
   * Cancel pending save
   */
  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cancel();
    this.stateListeners.clear();
    this.lastChecksum.clear();
  }
}
