// ProfileAppShell.tsx - Shell component for profile-specific views
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useProfile } from '@/context/ProfileContext';

interface ProfileAppShellProps {
  children?: React.ReactNode;
}

function _ProfileAppShell({ children }: ProfileAppShellProps) {
  const { profileId } = useParams<{ profileId: string }>();
  const { activeProfile } = useProfile();

  if (!profileId || !activeProfile) {
    return <Navigate to="/profiles" replace />;
  }

  return <div className="profile-shell">{children}</div>;
}

export const ProfileAppShell = _ProfileAppShell;
