import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;

  return <>{children}</>;
}
