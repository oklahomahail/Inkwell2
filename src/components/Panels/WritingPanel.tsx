// src/components/Panels/WritingPanel.tsx - Fixed version
import React, { useState, useCallback } from 'react';
import {
  PlusCircle,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import TipTapEditor from '@/components/Writing/TipTapEditor';
import ClaudeToolbar from '@/components/Writing/ClaudeToolbar';
import { SceneHeader } from '@/components/Writing/SceneHeader';
import ExportDialog from '@/components/Writing/ExportDialog';
import { Scene, SceneStatus, Chapter } from '@/types/writing';
import { generateId } from '@/utils/idUtils';
import { cn } from '@/utils/cn';

interface WritingPanelProps {
  draftText: string;
  onChangeText: (text: string) => void;
  onTextSelect: () => void;
  selectedText: string;
}

const WritingPanel: React.FC<WritingPanelProps> = ({
  draftText,
  onChangeText,
  onTextSelect,
  selectedText,
}) => {
  const { currentProject, updateProject } = useAppContext();
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [showSceneList, setShowSceneList] = useState(true);
  const [exportDialog, setExportDialog] = useState<{
    isOpen: boolean;
    type: 'scene' | 'chapter';
    data: Scene | Chapter | null;
    title: string;
  }>({
    isOpen: false,
    type: 'scene',
    data: null,
    title: '',
  });

  // Initialize with mock data if no chapter exists
  const initializeChapter = (): Chapter => ({
    id: 'chapter-1',
    title: currentProject?.name || 'Chapter 1',
    order: 0,
    scenes: [
      {
        id: 'scene-1',
        title: 'Opening Scene',
        content: draftText || '<p>Start writing your story here...</p>',
        status: SceneStatus.DRAFT,
        order: 0,
        wordCount: 0,
        wordCountGoal: 500,
        summary: 'The opening of our story',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    totalWordCount: 0,
    status: 'draft' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const chapter = currentChapter || initializeChapter();
  const scenes: Scene[] = chapter.scenes; // Fixed: chapter is never undefined due to fallback above
  const currentScene = scenes.find((s) => s.id === currentSceneId);
  const currentSceneIndex = scenes.findIndex((s) => s.id === currentSceneId);

  const handleSceneUpdate = useCallback(
    (sceneId: string, updates: Partial<Scene>) => {
      const updatedScenes = scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date() } : scene,
      );

      const updatedChapter = {
        ...chapter,
        scenes: updatedScenes,
        totalWordCount: updatedScenes.reduce((sum, scene) => sum + scene.wordCount, 0),
        updatedAt: new Date(),
      };

      setCurrentChapter(updatedChapter);

      // Update parent component
      const updatedScene = updatedScenes.find((s) => s.id === sceneId);
      if (updatedScene?.content) {
        onChangeText(updatedScene.content);
      }

      // Save to current project
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          content: updatedScene?.content || currentProject.content,
          updatedAt: Date.now(),
        };
        updateProject(updatedProject);
      }
    },
    [scenes, chapter, currentProject, updateProject, onChangeText],
  );

  const handleSceneSelect = useCallback((sceneId: string) => {
    setCurrentSceneId(sceneId);
  }, []);

  const handleAddScene = () => {
    const newScene: Scene = {
      id: generateId('scene'),
      title: `Scene ${scenes.length + 1}`,
      content: '<p>New scene content...</p>',
      status: SceneStatus.DRAFT,
      order: scenes.length,
      wordCount: 0,
      wordCountGoal: 500,
      summary: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedChapter = {
      ...chapter,
      scenes: [...scenes, newScene],
      updatedAt: new Date(),
    };

    setCurrentChapter(updatedChapter);
    setCurrentSceneId(newScene.id);
  };

  const navigateToScene = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? Math.max(0, currentSceneIndex - 1)
        : Math.min(scenes.length - 1, currentSceneIndex + 1);

    if (scenes[newIndex]) {
      handleSceneSelect(scenes[newIndex].id);
    }
  };

  const handleContentChange = useCallback(
    (content: string) => {
      if (!currentScene) return;
      handleSceneUpdate(currentScene.id, { content });
    },
    [currentScene, handleSceneUpdate],
  );

  const handleWordCountChange = useCallback(
    (wordCount: number) => {
      if (!currentScene) return;
      handleSceneUpdate(currentScene.id, { wordCount });
    },
    [currentScene, handleSceneUpdate],
  );

  const handleInsertText = (text: string) => {
    if (!currentScene) return;
    const newContent = currentScene.content + '\n\n' + text;
    handleSceneUpdate(currentScene.id, { content: newContent });
  };

  const handleExportScene = () => {
    if (!currentScene) return;
    setExportDialog({
      isOpen: true,
      type: 'scene',
      data: currentScene,
      title: currentScene.title,
    });
  };

  const handleExportChapter = () => {
    setExportDialog({
      isOpen: true,
      type: 'chapter',
      data: chapter,
      title: chapter.title,
    });
  };

  // Auto-select first scene if none selected
  React.useEffect(() => {
    if (!currentSceneId && scenes.length > 0 && scenes[0]) {
      setCurrentSceneId(scenes[0].id);
    }
  }, [currentSceneId, scenes]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a project from the dashboard to start writing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProject.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {scenes.length} scenes • {chapter.totalWordCount} words
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportChapter}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Chapter
            </button>

            <button
              onClick={handleAddScene}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Scene
            </button>
          </div>
        </div>

        {/* Claude Toolbar */}
        <ClaudeToolbar
          selectedText={selectedText}
          onInsertText={handleInsertText}
          sceneTitle={currentScene?.title}
          currentContent={currentScene?.content}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene List Sidebar */}
        {showSceneList && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 dark:text-white">{chapter.title}</h2>
                <button
                  onClick={() => setShowSceneList(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2 space-y-1 max-h-full overflow-y-auto">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneSelect(scene.id)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    scene.id === currentSceneId
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {scene.title || `Scene ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500">{scene.status}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {scene.wordCount} words
                    {scene.wordCountGoal && ` / ${scene.wordCountGoal}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Writing Area */}
        <div className="flex-1 flex flex-col">
          {currentScene ? (
            <>
              {/* Scene Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  {!showSceneList && (
                    <button
                      onClick={() => setShowSceneList(true)}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Scene Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateToScene('prev')}
                      disabled={currentSceneIndex === 0}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Scene {currentSceneIndex + 1} of {scenes.length}
                    </span>
                    <button
                      onClick={() => navigateToScene('next')}
                      disabled={currentSceneIndex === scenes.length - 1}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportScene}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Export Scene
                    </button>

                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Save className="w-4 h-4 inline mr-2" />
                      Save
                    </button>
                  </div>
                </div>

                <SceneHeader
                  title={currentScene.title}
                  status={currentScene.status}
                  wordGoal={currentScene.wordCountGoal}
                  words={currentScene.wordCount}
                  onChange={(updates) => handleSceneUpdate(currentScene.id, updates)}
                />
              </div>

              {/* TipTap Editor */}
              <div className="flex-1 p-6 overflow-auto">
                <TipTapEditor
                  value={currentScene.content}
                  onChange={handleContentChange}
                  onWordCountChange={handleWordCountChange}
                  placeholder={`Start writing "${currentScene.title}"...`}
                  className="min-h-full"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  No Scenes Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create your first scene to start writing
                </p>
                <button
                  onClick={handleAddScene}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create First Scene
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      {exportDialog.data && (
        <ExportDialog
          isOpen={exportDialog.isOpen}
          onClose={() => setExportDialog((prev) => ({ ...prev, isOpen: false }))}
          type={exportDialog.type}
          data={exportDialog.data}
          title={exportDialog.title}
        />
      )}
    </div>
  );
};

export default WritingPanel;
