// Development utility for populating test data
export function devBackfill() {
  const backfillProfiles = () => Promise.resolve();
  const backfillProfilesForCurrentUser = (_userId?: string) => backfillProfiles();
  return {
    backfillProfiles,
    backfillProfilesForCurrentUser,
  };
}
