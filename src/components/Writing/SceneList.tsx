// src/components/Writing/SceneList.tsx - Fixed imports
import { FileText, Target, Clock, Trash2 } from 'lucide-react';
import React from 'react';
import { Scene, SceneStatus } from '../../types/writing';
import { cn } from '../../utils/cn';

interface SceneListProps {
  scenes: Scene[];
  currentSceneId?: string;
  onSceneSelect: (scene: Scene) => void;
  onSceneDelete?: (sceneId: string) => void;
  className?: string;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  currentSceneId,
  onSceneSelect,
  onSceneDelete,
  className,
}) => {
  const getStatusColor = (status: SceneStatus) => {
    switch (status) {
      case SceneStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case SceneStatus.REVISION:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case SceneStatus.COMPLETE:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
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

  const getProgressPercentage = (scene: Scene) => {
    if (!scene.wordCountGoal || scene.wordCountGoal === 0) return 0;
    return Math.min((scene.wordCount / scene.wordCountGoal) * 100, 100);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {scenes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scenes yet</p>
          <p className="text-sm">Create your first scene to get started</p>
        </div>
      ) : (
        scenes.map((scene) => {
          const isActive = scene.id === currentSceneId;
          const progressPercentage = getProgressPercentage(scene);

          return (
            <div
              key={scene.id}
              className={cn(
                'group relative p-4 rounded-lg border cursor-pointer transition-all',
                'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
                isActive
                  ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700',
              )}
              onClick={() => onSceneSelect(scene)}
            >
              {/* Scene Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'font-medium truncate',
                      isActive
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-gray-100',
                    )}
                  >
                    {scene.title || 'Untitled Scene'}
                  </h4>
                  {scene.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {scene.summary}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div
                  className={cn(
                    'ml-3 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                    getStatusColor(scene.status),
                  )}
                >
                  <span className="mr-1">{getStatusIcon(scene.status)}</span>
                  {scene.status.charAt(0).toUpperCase() + scene.status.slice(1)}
                </div>
              </div>

              {/* Scene Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  {/* Word Count */}
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{scene.wordCount} words</span>
                  </div>

                  {/* Goal Progress */}
                  {scene.wordCountGoal && scene.wordCountGoal > 0 && (
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <div className="flex items-center space-x-1">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500',
                            )}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs">{Math.round(progressPercentage)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{scene.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions Menu */}
                {onSceneDelete && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete scene "${scene.title}"?`)) {
                          onSceneDelete(scene.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      title="Delete scene"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
