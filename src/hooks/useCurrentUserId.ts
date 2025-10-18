import { useUser } from '@clerk/clerk-react';

export function useCurrentUserId() {
  const { user, isSignedIn } = useUser();
  return isSignedIn ? (user?.id ?? null) : null;
}
