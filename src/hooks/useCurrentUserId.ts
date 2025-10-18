import { useAuth } from '@/context/AuthContext';

export function useCurrentUserId() {
  const { user } = useAuth();
  return user?.id ?? null;
}
