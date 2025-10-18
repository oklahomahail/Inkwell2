import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  return user ? children : <Navigate to="/sign-in" replace />;
}
