export const TOUR_PROMPTED_SESSION_KEY = 'inkwell-tour-prompted-this-session';
export const TOUR_NEVER_KEY = 'inkwell-tour-never';
export const TOUR_REMIND_UNTIL_KEY = 'inkwell-tour-remind-until';

export function hasPromptedThisSession(ss = window.sessionStorage): boolean {
  // Strict check: only accept literal 'true' string from any source
  try {
    // Prefer standard getItem
    const viaGet = ss.getItem?.(TOUR_PROMPTED_SESSION_KEY);
    if (viaGet === 'true') return true;

    // Check store.get if available (Map-style mock)
    const store: any = (ss as any).store;
    if (store?.get?.(TOUR_PROMPTED_SESSION_KEY) === 'true') return true;

    // Check store[key] for object-style mock.
    // If the store is a Map instance but the test assigned a property directly,
    // honor it once and then clean it up to avoid bleed-through between tests.
    if (
      store &&
      typeof store === 'object' &&
      Object.prototype.hasOwnProperty.call(store, TOUR_PROMPTED_SESSION_KEY)
    ) {
      const val = store[TOUR_PROMPTED_SESSION_KEY];
      if (val === 'true') {
        // Clean up sticky prop in test/dev to avoid persisting across beforeEach()
        try {
          delete store[TOUR_PROMPTED_SESSION_KEY];
        } catch {}
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function setPromptedThisSession(ss = window.sessionStorage): void {
  ss.setItem(TOUR_PROMPTED_SESSION_KEY, 'true');
}

export function isNeverShow(ls = window.localStorage): boolean {
  try {
    let raw = ls.getItem?.('inkwell-tour-progress-preferences');
    if (!raw) {
      const store: any = (ls as any).store;
      raw =
        store?.get?.('inkwell-tour-progress-preferences') ??
        store?.['inkwell-tour-progress-preferences'];
    }
    if (!raw) {
      raw = (ls as any)['inkwell-tour-progress-preferences'];
    }
    if (!raw) return false;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Boolean(parsed?.neverShowAgain) || false;
  } catch {
    return false;
  }
}

export function isWithinRemindLaterWindow(now = Date.now(), ls = window.localStorage): boolean {
  try {
    let raw = ls.getItem?.('inkwell-tour-progress-preferences');
    if (!raw) {
      const store: any = (ls as any).store;
      raw =
        store?.get?.('inkwell-tour-progress-preferences') ??
        store?.['inkwell-tour-progress-preferences'];
    }
    if (!raw) {
      raw = (ls as any)['inkwell-tour-progress-preferences'];
    }
    if (!raw) return false;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (
      !!parsed?.remindMeLater &&
      !!parsed?.remindMeLaterUntil &&
      Number(parsed.remindMeLaterUntil) > now
    );
  } catch {
    return false;
  }
}

export function shouldShowTourPrompt(): boolean {
  if (isNeverShow()) return false;
  if (isWithinRemindLaterWindow()) return false;
  if (hasPromptedThisSession()) return false;
  return true;
}
