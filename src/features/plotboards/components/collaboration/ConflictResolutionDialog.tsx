// Conflict Resolution Dialog Component for Plot Boards Collaboration
// Handles merge conflicts when multiple users edit the same items

import React, { useState, useEffect } from 'react';

import {
  CollaborativeConflict,
  ConflictType,
  ResolutionStrategy,
  CollaborativeUser,
  ConflictResolution,
} from '../../collaboration/types';

import { UserAvatar } from './UserAvatar';

interface ConflictResolutionDialogProps {
  conflict: CollaborativeConflict;
  conflictingUsers: CollaborativeUser[];
  currentUser: CollaborativeUser;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflict,
  conflictingUsers,
  currentUser,
  onResolve,
  onCancel,
  isOpen,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>(
    ResolutionStrategy.KEEP_LOCAL,
  );
  const [notes, setNotes] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [mergedVersion, setMergedVersion] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setSelectedStrategy(ResolutionStrategy.KEEP_LOCAL);
      setNotes('');
      setShowComparison(false);
      setMergedVersion(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = () => {
    const resolution: ConflictResolution = {
      strategy: selectedStrategy,
      result: getResultForStrategy(selectedStrategy),
      mergedVersion: mergedVersion || undefined,
      notes: notes.trim() || undefined,
    };

    onResolve(resolution);
  };

  const getResultForStrategy = (strategy: ResolutionStrategy) => {
    switch (strategy) {
      case ResolutionStrategy.KEEP_LOCAL:
        return conflict.localVersion;
      case ResolutionStrategy.KEEP_REMOTE:
        return conflict.remoteVersion;
      case ResolutionStrategy.MERGE_CHANGES:
        return mergedVersion || attemptAutoMerge();
      case ResolutionStrategy.MANUAL_MERGE:
        return mergedVersion;
      case ResolutionStrategy.CREATE_DUPLICATE:
        return {
          ...conflict.remoteVersion,
          id: `${conflict.remoteVersion.id}_duplicate_${Date.now()}`,
        };
      default:
        return conflict.localVersion;
    }
  };

  const attemptAutoMerge = () => {
    // Simple auto-merge logic - in practice this would be more sophisticated
    if (conflict.type === ConflictType.CONCURRENT_EDIT) {
      const merged = { ...conflict.localVersion };

      // Merge specific fields based on conflict type
      if (conflict.localVersion && conflict.remoteVersion) {
        // For cards, merge non-conflicting fields
        if (conflict.localVersion.title !== conflict.remoteVersion.title) {
          merged.title = conflict.remoteVersion.title; // Take remote title
        }
        if (conflict.localVersion.description !== conflict.remoteVersion.description) {
          merged.description = conflict.remoteVersion.description; // Take remote description
        }
        // Keep local timestamps
        merged.updatedAt = conflict.localVersion.updatedAt;
      }

      return merged;
    }

    return conflict.localVersion;
  };

  const getConflictDescription = () => {
    const descriptions = {
      [ConflictType.CONCURRENT_EDIT]: 'Multiple users edited the same item simultaneously',
      [ConflictType.DELETE_CONFLICT]: 'One user deleted an item while another was editing it',
      [ConflictType.MOVE_CONFLICT]: 'Multiple users moved the same item to different locations',
      [ConflictType.PERMISSION_CONFLICT]: 'Permission changes conflict with ongoing edits',
      [ConflictType.VERSION_MISMATCH]: 'Version mismatch detected during synchronization',
    };
    return descriptions[conflict.type] || 'Unknown conflict type';
  };

  const getItemTypeName = () => {
    if (conflict.localVersion?.title !== undefined) return 'Card';
    if (conflict.localVersion?.columns !== undefined) return 'Board';
    if (conflict.localVersion?.cards !== undefined) return 'Column';
    return 'Item';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        />

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Resolve Conflict</h3>
                <p className="text-sm text-gray-500">{getConflictDescription()}</p>
              </div>
            </div>

            {/* Users Involved */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Conflicting users:</span>
              <div className="flex -space-x-1">
                {conflictingUsers.map((user) => (
                  <UserAvatar
                    key={user.id}
                    user={user}
                    size="sm"
                    showPresence={false}
                    className="border-2 border-white"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Conflicted {getItemTypeName()}: {conflict.localVersion?.title || conflict.targetId}
              </h4>
              <p className="text-xs text-gray-600">
                Created at: {new Date(conflict.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Resolution Strategy Selection */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Choose Resolution Strategy</h4>

            <div className="space-y-3">
              {/* Keep Local Version */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value={ResolutionStrategy.KEEP_LOCAL}
                  checked={selectedStrategy === ResolutionStrategy.KEEP_LOCAL}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Keep Your Version</div>
                  <div className="text-xs text-gray-500">
                    Discard remote changes and keep your local version
                  </div>
                </div>
              </label>

              {/* Keep Remote Version */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value={ResolutionStrategy.KEEP_REMOTE}
                  checked={selectedStrategy === ResolutionStrategy.KEEP_REMOTE}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Keep Remote Version</div>
                  <div className="text-xs text-gray-500">
                    Accept incoming changes and discard your version
                  </div>
                </div>
              </label>

              {/* Auto Merge */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value={ResolutionStrategy.MERGE_CHANGES}
                  checked={selectedStrategy === ResolutionStrategy.MERGE_CHANGES}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Auto-merge Changes</div>
                  <div className="text-xs text-gray-500">
                    Automatically combine non-conflicting changes
                  </div>
                </div>
              </label>

              {/* Manual Merge */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value={ResolutionStrategy.MANUAL_MERGE}
                  checked={selectedStrategy === ResolutionStrategy.MANUAL_MERGE}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Manual Merge</div>
                  <div className="text-xs text-gray-500">Manually review and merge changes</div>
                </div>
              </label>

              {/* Create Duplicate */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value={ResolutionStrategy.CREATE_DUPLICATE}
                  checked={selectedStrategy === ResolutionStrategy.CREATE_DUPLICATE}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Create Duplicate</div>
                  <div className="text-xs text-gray-500">Keep both versions as separate items</div>
                </div>
              </label>
            </div>
          </div>

          {/* Comparison View */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Compare Versions</h4>
              <button
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </button>
            </div>

            {showComparison && (
              <div className="grid grid-cols-2 gap-4">
                {/* Local Version */}
                <div className="border rounded-lg">
                  <div className="bg-blue-50 px-3 py-2 border-b">
                    <div className="text-sm font-medium text-blue-900">Your Version</div>
                    <div className="text-xs text-blue-600">
                      {currentUser.displayName} •{' '}
                      {new Date(conflict.localVersion?.updatedAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3">
                    <VersionPreview version={conflict.localVersion} />
                  </div>
                </div>

                {/* Remote Version */}
                <div className="border rounded-lg">
                  <div className="bg-red-50 px-3 py-2 border-b">
                    <div className="text-sm font-medium text-red-900">Remote Version</div>
                    <div className="text-xs text-red-600">
                      {conflictingUsers.find((u) => u.id !== currentUser.id)?.displayName ||
                        'Other user'}{' '}
                      • {new Date(conflict.remoteVersion?.updatedAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3">
                    <VersionPreview version={conflict.remoteVersion} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Merge Editor */}
          {selectedStrategy === ResolutionStrategy.MANUAL_MERGE && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Manual Merge Editor</h4>
              <ManualMergeEditor
                localVersion={conflict.localVersion}
                remoteVersion={conflict.remoteVersion}
                onMergedVersionChange={setMergedVersion}
              />
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Resolution Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add notes about why you chose this resolution..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleResolve}
              disabled={selectedStrategy === ResolutionStrategy.MANUAL_MERGE && !mergedVersion}
            >
              Resolve Conflict
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========= Version Preview Component ========= */

interface VersionPreviewProps {
  version: any;
  className?: string;
}

const VersionPreview: React.FC<VersionPreviewProps> = ({ version, className = '' }) => {
  if (!version) {
    return <div className="text-sm text-gray-500 italic">No data available</div>;
  }

  const renderField = (key: string, value: any) => {
    if (value === null || value === undefined) return null;

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <div key={key} className="mb-2">
            <span className="text-xs font-medium text-gray-700">{key}:</span>
            <div className="ml-2 text-xs text-gray-600">
              {value.length > 0 ? value.join(', ') : 'Empty array'}
            </div>
          </div>
        );
      } else if (value instanceof Date) {
        return (
          <div key={key} className="mb-2">
            <span className="text-xs font-medium text-gray-700">{key}:</span>
            <span className="ml-2 text-xs text-gray-600">{value.toLocaleString()}</span>
          </div>
        );
      } else {
        return (
          <div key={key} className="mb-2">
            <span className="text-xs font-medium text-gray-700">{key}:</span>
            <div className="ml-2 text-xs text-gray-600">{JSON.stringify(value, null, 1)}</div>
          </div>
        );
      }
    }

    return (
      <div key={key} className="mb-2">
        <span className="text-xs font-medium text-gray-700">{key}:</span>
        <span className="ml-2 text-xs text-gray-600">{String(value)}</span>
      </div>
    );
  };

  return (
    <div className={`text-sm space-y-1 ${className}`}>
      {Object.entries(version)
        .filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key))
        .map(([key, value]) => renderField(key, value))}
    </div>
  );
};

/* ========= Manual Merge Editor Component ========= */

interface ManualMergeEditorProps {
  localVersion: any;
  remoteVersion: any;
  onMergedVersionChange: (merged: any) => void;
}

const ManualMergeEditor: React.FC<ManualMergeEditorProps> = ({
  localVersion,
  remoteVersion,
  onMergedVersionChange,
}) => {
  const [mergedData, setMergedData] = useState<any>({ ...localVersion });

  useEffect(() => {
    onMergedVersionChange(mergedData);
  }, [mergedData, onMergedVersionChange]);

  const handleFieldChange = (fieldPath: string, value: any) => {
    const newMerged = { ...mergedData };

    // Simple dot-notation field path handling
    const keys = fieldPath.split('.');
    let current = newMerged;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      if (!current[key]) current[key] = {};
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
    setMergedData(newMerged);
  };

  const getConflictingFields = () => {
    const conflicts: string[] = [];

    const compareObjects = (local: any, remote: any, prefix = '') => {
      if (!local || !remote) return;

      Object.keys({ ...local, ...remote }).forEach((key) => {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        const localValue = local[key];
        const remoteValue = remote[key];

        if (localValue !== remoteValue) {
          if (typeof localValue === 'object' && typeof remoteValue === 'object') {
            compareObjects(localValue, remoteValue, fieldPath);
          } else {
            conflicts.push(fieldPath);
          }
        }
      });
    };

    compareObjects(localVersion, remoteVersion);
    return conflicts;
  };

  const conflictingFields = getConflictingFields();

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="space-y-4">
        {conflictingFields.map((fieldPath) => (
          <FieldMergeEditor
            key={fieldPath}
            fieldPath={fieldPath}
            localValue={getFieldValue(localVersion, fieldPath)}
            remoteValue={getFieldValue(remoteVersion, fieldPath)}
            currentValue={getFieldValue(mergedData, fieldPath)}
            onChange={(value) => handleFieldChange(fieldPath, value)}
          />
        ))}

        {conflictingFields.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No conflicting fields detected. Auto-merge will be used.
          </div>
        )}
      </div>
    </div>
  );
};

/* ========= Field Merge Editor Component ========= */

interface FieldMergeEditorProps {
  fieldPath: string;
  localValue: any;
  remoteValue: any;
  currentValue: any;
  onChange: (value: any) => void;
}

const FieldMergeEditor: React.FC<FieldMergeEditorProps> = ({
  fieldPath,
  localValue,
  remoteValue,
  currentValue,
  onChange,
}) => {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-sm font-medium text-gray-900 mb-2">{fieldPath.split('.').pop()}</div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Local Value */}
        <label className="flex items-start space-x-2">
          <input
            type="radio"
            name={`merge-${fieldPath}`}
            checked={currentValue === localValue}
            onChange={() => onChange(localValue)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-xs text-blue-600 font-medium">Your version</div>
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              {String(localValue || 'Empty')}
            </div>
          </div>
        </label>

        {/* Remote Value */}
        <label className="flex items-start space-x-2">
          <input
            type="radio"
            name={`merge-${fieldPath}`}
            checked={currentValue === remoteValue}
            onChange={() => onChange(remoteValue)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-xs text-red-600 font-medium">Remote version</div>
            <div className="text-xs text-gray-600 bg-red-50 p-2 rounded">
              {String(remoteValue || 'Empty')}
            </div>
          </div>
        </label>

        {/* Custom Value */}
        <label className="flex items-start space-x-2">
          <input
            type="radio"
            name={`merge-${fieldPath}`}
            checked={currentValue !== localValue && currentValue !== remoteValue}
            onChange={() => {
              /* Custom input will handle this */
            }}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-xs text-gray-700 font-medium">Custom</div>
            <input
              type="text"
              className="text-xs w-full p-2 border rounded"
              value={
                currentValue !== localValue && currentValue !== remoteValue ? currentValue : ''
              }
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter custom value..."
            />
          </div>
        </label>
      </div>
    </div>
  );
};

// Helper function to get nested field values
function getFieldValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
