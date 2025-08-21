// src/components/Writing/SceneNavigationPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
  Clock,
  Trash2,
  Copy,
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { storageService } from '@/services/storageService';
import { generateId } from '@/utils/id';
import { Chapter, Scene, SceneStatus, ChapterStatus } from '@/types/writing';

interface SceneNavigationPanelProps {
  currentSceneId?: string;
  onSceneSelect: (scene: Scene, chapter: Chapter) => void;
  onSceneCreate: (chapterId: string) => void;
  className?: string;
}

interface ChapterWithExpanded extends Chapter {
  isExpanded: boolean;
}

const SceneNavigationPanel: React.FC<SceneNavigationPanelProps> = ({
  currentSceneId,
  onSceneSelect,
  onSceneCreate,
  className = '',
}) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();
  const [chapters, setChapters] = useState<ChapterWithExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Load chapters and scenes
  useEffect(() => {
    const loadChapters = async () => {
      if (!currentProject) {
        setChapters([]);
        setLoading(false);
        return;
      }

      try {
        const loadedChapters = await storageService.loadWritingChapters(currentProject.id);
        const chaptersWithExpanded = loadedChapters.map((chapter) => ({
          ...chapter,
          isExpanded: true, // Start with all chapters expanded
        }));
        setChapters(chaptersWithExpanded);
      } catch (error) {
        console.error('Failed to load chapters:', error);
        showToast('Failed to load chapters', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [currentProject]);

  // Status indicators
  const getStatusIcon = (status: SceneStatus) => {
    switch (status) {
      case SceneStatus.COMPLETE:
        return <CheckCircle size={14} className="text-green-500" />;
      case SceneStatus.REVISION:
        return <Clock size={14} className="text-yellow-500" />;
      default:
        return <Circle size={14} className="text-gray-400" />;
    }
  };

  const getChapterStatusColor = (status: ChapterStatus) => {
    switch (status) {
      case ChapterStatus.COMPLETE:
        return 'text-green-600 dark:text-green-400';
      case ChapterStatus.IN_PROGRESS:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, isExpanded: !chapter.isExpanded } : chapter,
      ),
    );
  };

  // Create new scene
  const handleCreateScene = async (chapterId: string) => {
    if (!currentProject) {
      showToast('No project selected', 'error');
      return;
    }

    try {
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter) {
        showToast('Chapter not found', 'error');
        return;
      }

      const newScene: Scene = {
        id: generateId('scene'),
        title: `Scene ${chapter.scenes.length + 1}`,
        content: '',
        wordCount: 0,
        status: SceneStatus.DRAFT,
        order: chapter.scenes.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveScene(currentProject.id, newScene);

      // Refresh chapters
      const updatedChapters = await storageService.loadWritingChapters(currentProject.id);
      const chaptersWithExpanded = updatedChapters.map((ch) => ({
        ...ch,
        isExpanded: chapters.find((c) => c.id === ch.id)?.isExpanded ?? true,
      }));
      setChapters(chaptersWithExpanded);

      showToast(`Created ${newScene.title}`, 'success');
      onSceneCreate(chapterId);
    } catch (error) {
      console.error('Failed to create scene:', error);
      showToast('Failed to create scene', 'error');
    }
  };

  // Create new chapter
  const handleCreateChapter = async () => {
    if (!currentProject) {
      showToast('No project selected', 'error');
      return;
    }

    try {
      const newChapter: Chapter = {
        id: generateId('chapter'),
        title: `Chapter ${chapters.length + 1}`,
        order: chapters.length,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedChapters = [
        ...chapters.map((c) => ({ ...c, isExpanded: c.isExpanded })),
        newChapter,
      ];
      await storageService.saveWritingChapters(
        currentProject.id,
        updatedChapters.map((c) => ({ ...c, isExpanded: undefined })),
      );

      // Update local state
      setChapters([...chapters, { ...newChapter, isExpanded: true }]);
      showToast(`Created ${newChapter.title}`, 'success');
    } catch (error) {
      console.error('Failed to create chapter:', error);
      showToast('Failed to create chapter', 'error');
    }
  };

  // Handle scene actions
  const handleSceneAction = async (action: string, scene: Scene, chapter: Chapter) => {
    setShowDropdown(null);

    switch (action) {
      case 'duplicate':
        try {
          const duplicatedScene: Scene = {
            ...scene,
            id: generateId('scene'),
            title: `${scene.title} (Copy)`,
            order: chapter.scenes.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await storageService.saveScene(currentProject!.id, duplicatedScene);

          // Refresh chapters
          const updatedChapters = await storageService.loadWritingChapters(currentProject!.id);
          const chaptersWithExpanded = updatedChapters.map((ch) => ({
            ...ch,
            isExpanded: chapters.find((c) => c.id === ch.id)?.isExpanded ?? true,
          }));
          setChapters(chaptersWithExpanded);

          showToast('Scene duplicated', 'success');
        } catch (error) {
          showToast('Failed to duplicate scene', 'error');
        }
        break;

      case 'delete':
        if (confirm(`Delete "${scene.title}"? This cannot be undone.`)) {
          try {
            // Implementation would need to be added to storage service
            showToast('Delete functionality coming soon', 'info');
          } catch (error) {
            showToast('Failed to delete scene', 'error');
          }
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className={`p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No project selected</p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Scenes</h3>
          <button
            onClick={handleCreateChapter}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            title="New Chapter"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Project info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentProject.name}</p>
      </div>

      {/* Chapter and Scene List */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No chapters yet</p>
            <button
              onClick={handleCreateChapter}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              Create First Chapter
            </button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-1">
                {/* Chapter Header */}
                <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group">
                  <button onClick={() => toggleChapter(chapter.id)} className="flex-shrink-0">
                    {chapter.isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium truncate ${getChapterStatusColor(chapter.status)}`}
                    >
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {chapter.scenes.length} scenes • {chapter.totalWordCount.toLocaleString()}{' '}
                      words
                    </p>
                  </div>

                  <button
                    onClick={() => handleCreateScene(chapter.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                    title="New Scene"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Scenes */}
                {chapter.isExpanded && (
                  <div className="ml-6 space-y-1">
                    {chapter.scenes.map((scene) => (
                      <div
                        key={scene.id}
                        className={`
                          flex items-center space-x-2 p-2 rounded cursor-pointer group relative
                          ${
                            currentSceneId === scene.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={() => onSceneSelect(scene, chapter)}
                      >
                        {getStatusIcon(scene.status)}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {scene.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {scene.wordCount?.toLocaleString() || 0} words
                          </p>
                        </div>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(showDropdown === scene.id ? null : scene.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                          >
                            <MoreVertical size={12} />
                          </button>

                          {/* Dropdown menu */}
                          {showDropdown === scene.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-32">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSceneAction('duplicate', scene, chapter);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                              >
                                <Copy size={12} />
                                <span>Duplicate</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSceneAction('delete', scene, chapter);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center space-x-2"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {chapter.scenes.length === 0 && (
                      <div className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          No scenes in this chapter
                        </p>
                        <button
                          onClick={() => handleCreateScene(chapter.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Create first scene
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Total Chapters:</span>
            <span>{chapters.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Scenes:</span>
            <span>{chapters.reduce((total, ch) => total + ch.scenes.length, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Words:</span>
            <span>
              {chapters.reduce((total, ch) => total + ch.totalWordCount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneNavigationPanel;
