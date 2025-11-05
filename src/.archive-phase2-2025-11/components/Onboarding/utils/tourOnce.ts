const KEY = (profileId: string, tourId: string) => `inkwell:${profileId}:autostart:${tourId}`;

export function hasStartedOnce(profileId: string, tourId: string) {
  try {
    return localStorage.getItem(KEY(profileId, tourId)) === '1';
  } catch {
    return false;
  }
}

export function markStarted(profileId: string, tourId: string) {
  try {
    localStorage.setItem(KEY(profileId, tourId), '1');
  } catch {}
}
