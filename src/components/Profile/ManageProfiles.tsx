// src/components/Profile/ManageProfiles.tsx
import { Trash2, Check, Plus, Edit3 } from 'lucide-react';
import React, { useState } from 'react';

import { useProfile } from '@/context/ProfileContext';
import type { Profile } from '@/types/profile';

interface ManageProfilesProps {
  /** Called when a profile is switched */
  onProfileSwitch?: (profile: Profile) => void;
  /** Called when a profile is deleted */
  onProfileDelete?: (profileId: string) => void;
}

export default function ManageProfiles({ onProfileSwitch, onProfileDelete }: ManageProfilesProps) {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    deleteProfile,
    createProfile,
    updateProfile,
    isLoading,
    error,
  } = useProfile();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const handleSwitch = async (profile: Profile) => {
    try {
      await setActiveProfile(profile.id);
      onProfileSwitch?.(profile);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    }
  };

  const handleDelete = async (profile: Profile) => {
    const confirmMessage = `Delete profile "${profile.name}"? This cannot be undone.`;
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    // Prevent deleting the last profile
    if (profiles.length <= 1) {
      alert('Cannot delete the last profile. Create a new profile first.');
      return;
    }

    try {
      await deleteProfile(profile.id);
      onProfileDelete?.(profile.id);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile. Please try again.');
    }
  };

  const handleStartEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setEditName(profile.name);
  };

  const handleSaveEdit = async (profileId: string) => {
    if (!editName.trim()) return;

    try {
      await updateProfile(profileId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    try {
      const newProfile = await createProfile(newProfileName.trim());
      await setActiveProfile(newProfile.id);
      setIsCreating(false);
      setNewProfileName('');
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const formatDate = (date: Date | string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border p-4 md:p-6 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500">Loading profiles...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border p-4 md:p-6 bg-white">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Profiles</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Profile
          </button>
        </div>
        <p className="text-sm text-neutral-600">Switch between, rename, or delete profiles.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create new profile form */}
      {isCreating && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Create New Profile</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProfile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewProfileName('');
                }
              }}
              autoFocus
            />
            <button
              onClick={handleCreateProfile}
              disabled={!newProfileName.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewProfileName('');
              }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profiles list */}
      <ul className="divide-y divide-gray-100">
        {profiles.map((profile) => (
          <li key={profile.id} className="flex items-center justify-between py-4">
            <div className="flex-1 min-w-0">
              {editingId === profile.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(profile.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(profile.id)}
                    className="rounded-md bg-green-600 p-1.5 text-white hover:bg-green-700"
                    title="Save"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-md border p-1.5 hover:bg-gray-50"
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Profile color indicator */}
                  <div
                    className="w-3 h-3 rounded-full border border-gray-200"
                    style={{ backgroundColor: profile.color || '#6b7280' }}
                    title={`${profile.name} color`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 truncate">
                        {profile.displayName || profile.name}
                      </div>
                      {profile.id === activeProfile?.id && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      Created {formatDate(profile.createdAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {editingId !== profile.id && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleStartEdit(profile)}
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  title="Rename profile"
                >
                  <Edit3 className="w-3 h-3" />
                </button>

                {profile.id !== activeProfile?.id && (
                  <button
                    onClick={() => handleSwitch(profile)}
                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    Make active
                  </button>
                )}

                <button
                  onClick={() => handleDelete(profile)}
                  className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                  title="Delete profile"
                  disabled={profiles.length <= 1}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {profiles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No profiles found.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Create your first profile
          </button>
        </div>
      )}
    </section>
  );
}
