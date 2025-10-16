import { useState } from 'react';

import { useProfileActions } from '../../hooks/useProfileActions';
import { profileService } from '../../services/ProfileService';
import { Profile } from '../../types/profile';

interface ProfileActionsProps {
  profile: Profile;
  onComplete?: () => void;
}

export function ProfileActions({ profile, onComplete }: ProfileActionsProps) {
  const { busy, archiveProfile, deleteProfile } = useProfileActions();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const handleDelete = async () => {
    if (confirmName !== profile.name) return;
    await deleteProfile(profile.id);
    setIsDeleteOpen(false);
    onComplete?.();
  };

  const handleArchive = async () => {
    await archiveProfile(profile.id);
    onComplete?.();
  };

  const openDeleteModal = async () => {
    const dependencyCounts = await profileService.getDependencyCounts(profile.id);
    setCounts(dependencyCounts);
    setIsDeleteOpen(true);
  };

  return (
    <div className="relative">
      <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Profile actions">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
        <button
          onClick={handleArchive}
          disabled={busy}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Archive...
        </button>
        <button
          onClick={openDeleteModal}
          disabled={busy}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          Delete...
        </button>
      </div>

      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Delete Profile</h3>

            {counts && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside">
                  <li>{counts.projects} projects</li>
                  <li>{counts.chapters} chapters</li>
                  <li>{counts.timelineItems} timeline items</li>
                  <li>{counts.snapshots} snapshots</li>
                </ul>
              </div>
            )}

            <p className="mb-4">
              Type <strong>{profile.name}</strong> to confirm deletion
            </p>

            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              placeholder="Type profile name to confirm"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmName !== profile.name || busy}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
