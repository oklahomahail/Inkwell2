// src/routes/profile/ProfilePage.tsx
import React, { useEffect } from 'react';

import { useProfile } from '@/context/ProfileContext';

export function ProfilePage() {
  // Set suppression immediately when component loads (before useEffect)
  React.useMemo(() => {
    sessionStorage.setItem('inkwell:tour:suppress', 'profiles');
  }, []);

  useEffect(() => {
    // Ensure suppression is maintained during component lifecycle
    sessionStorage.setItem('inkwell:tour:suppress', 'profiles');
    return () => sessionStorage.removeItem('inkwell:tour:suppress');
  }, []);

  const { activeProfile } = useProfile();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile Settings</h1>
      {activeProfile && (
        <div>
          <p className="text-gray-600">Manage your profile settings and preferences here.</p>
          {/* Profile settings UI will go here */}
        </div>
      )}
    </div>
  );
}
