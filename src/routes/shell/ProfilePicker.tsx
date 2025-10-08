// src/routes/shell/ProfilePicker.tsx - Profile creation and selection

import { Plus, User, Palette } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useProfileContext } from '../../context/ProfileContext';
import { Profile } from '../../types/profile';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function ProfilePicker() {
  const navigate = useNavigate();
  const { profiles, createProfile, setActiveProfile, isLoading, error } = useProfileContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSelectProfile = async (profile: Profile) => {
    try {
      await setActiveProfile(profile.id);
      navigate(`/p/${profile.id}/dashboard`);
    } catch (error) {
      console.error('Failed to select profile:', error);
      setFormError('Failed to select profile. Please try again.');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProfileName.trim();

    if (!name) {
      setFormError('Profile name is required');
      return;
    }

    if (profiles.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setFormError('A profile with this name already exists');
      return;
    }

    setFormError(null);

    try {
      const profile = await createProfile(name, {
        color: selectedColor,
        displayName: name,
      });

      await setActiveProfile(profile.id);
      navigate(`/p/${profile.id}/dashboard`);
    } catch (error) {
      console.error('Failed to create profile:', error);
      setFormError('Failed to create profile. Please try again.');
    }
  };

  const resetForm = () => {
    setNewProfileName('');
    setSelectedColor(PRESET_COLORS[0]);
    setFormError(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Inkwell</h1>
          <p className="text-gray-600">Choose a profile to continue or create a new one</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{formError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Existing Profiles */}
          {profiles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Profile</h2>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: profile.color || '#6B7280' }}
                    >
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {profile.displayName || profile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created {profile.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Profile */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus size={20} className="mr-2 text-gray-400" />
              <span className="text-gray-600">Create New Profile</span>
            </button>
          ) : (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="profileName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profile Name
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter profile name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette size={16} className="inline mr-1" />
                  Profile Color
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Profile
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {profiles.length === 0 && !isCreating && (
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              You haven't created any profiles yet. Click above to create your first profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
