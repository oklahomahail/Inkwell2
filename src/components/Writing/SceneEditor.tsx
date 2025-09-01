// src/components/Writing/SceneEditor.tsx
import { Save, Settings, Target, Clock, FileText, ChevronDown } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Scene, SceneStatus } from '../../types/writing';
import { cn } from '../../utils/cn';

import TipTapEditor from './TipTapEditor';

interface SceneEditorProps {
  scene: Scene;
  onSceneUpdate: (sceneId: string, updates: Partial<Scene>) => void;
  onSave?: () => void;
  className?: string;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  scene,
  onSceneUpdate,
  onSave,
  className,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localTitle, setLocalTitle] = useState(scene.title);
  const [localSummary, setLocalSummary] = useState(scene.summary || '');
  const [localGoal, setLocalGoal] = useState(scene.wordCountGoal || 0);

  const handleContentChange = useCallback(
    (content: string) => {
      onSceneUpdate(scene.id, {
        content,
        updatedAt: new Date(),
      });
    },
    [scene.id, onSceneUpdate],
  );

  const handleWordCountChange = useCallback(
    (wordCount: number) => {
      onSceneUpdate(scene.id, {
        wordCount,
        updatedAt: new Date(),
      });
    },
    [scene.id, onSceneUpdate],
  );

  const handleStatusChange = (status: SceneStatus) => {
    onSceneUpdate(scene.id, {
      status,
      updatedAt: new Date(),
    });
  };

  const handleTitleBlur = () => {
    if (localTitle !== scene.title) {
      onSceneUpdate(scene.id, {
        title: localTitle,
        updatedAt: new Date(),
      });
    }
  };

  const handleSummaryBlur = () => {
    if (localSummary !== scene.summary) {
      onSceneUpdate(scene.id, {
        summary: localSummary,
        updatedAt: new Date(),
      });
    }
  };

  const handleGoalUpdate = () => {
    if (localGoal !== scene.wordCountGoal) {
      onSceneUpdate(scene.id, {
        wordCountGoal: localGoal,
        updatedAt: new Date(),
      });
    }
  };

  const getStatusColor = (status: SceneStatus) => {
    switch (status) {
      case SceneStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case SceneStatus.REVISION:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case SceneStatus.COMPLETE:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SceneStatus) => {
    switch (status) {
      case SceneStatus.DRAFT:
        return '✏️';
      case SceneStatus.REVISION:
        return '🔄';
      case SceneStatus.COMPLETE:
        return '✅';
      default:
        return '📝';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Scene Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 space-y-4">
        {/* Title and Status Row */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-xl font-bold bg-transparent border-none outline-none flex-1 mr-4"
            placeholder="Scene title..."
          />

          <div className="flex items-center space-x-2">
            {/* Status Selector */}
            <div className="relative">
              <select
                value={scene.status}
                onChange={(e) => handleStatusChange(e.target.value as SceneStatus)}
                className={cn(
                  'appearance-none px-3 py-1 rounded-full text-sm font-medium border cursor-pointer',
                  getStatusColor(scene.status),
                )}
              >
                <option value={SceneStatus.DRAFT}>{getStatusIcon(SceneStatus.DRAFT)} Draft</option>
                <option value={SceneStatus.REVISION}>
                  {getStatusIcon(SceneStatus.REVISION)} Revision
                </option>
                <option value={SceneStatus.COMPLETE}>
                  {getStatusIcon(SceneStatus.COMPLETE)} Complete
                </option>
              </select>
              <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 pointer-events-none" />
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Scene settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Save Button */}
            <button
              onClick={onSave}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Save
            </button>
          </div>
        </div>

        {/* Scene Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scene Summary (optional)
          </label>
          <textarea
            value={localSummary}
            onChange={(e) => setLocalSummary(e.target.value)}
            onBlur={handleSummaryBlur}
            placeholder="Brief summary of what happens in this scene..."
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm resize-none"
            rows={2}
          />
        </div>

        {/* Scene Settings (Collapsible) */}
        {showSettings && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Word Count Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Word Count Goal
                </label>
                <input
                  type="number"
                  value={localGoal}
                  onChange={(e) => setLocalGoal(parseInt(e.target.value) || 0)}
                  onBlur={handleGoalUpdate}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
                  min="0"
                  placeholder="0"
                />
              </div>

              {/* Current Stats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Current Words
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                  {scene.wordCount} words
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Last Updated
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                  {scene.updatedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TipTap Editor */}
      <TipTapEditor
        value={scene.content}
        onChange={handleContentChange}
        onWordCountChange={handleWordCountChange}
        placeholder={`Start writing "${scene.title}"...`}
        className="bg-white dark:bg-gray-900"
      />
    </div>
  );
};
