export type WithRev = { client_rev: number; updated_at: string };
export type Conflict<T> = { table: string; local: T; remote: T };

export function isConflict(local: WithRev, remote: WithRev): boolean {
  return Number(remote.client_rev) > Number(local.client_rev);
}

export function nextRev(current: number) {
  return (current || 0) + 1;
}
