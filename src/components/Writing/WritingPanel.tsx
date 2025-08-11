// src/components/Writing/WritingPanel.tsx - Complete integration example
import React, { useEffect, useReducer, useState } from 'react';
import { SceneEditor } from './SceneEditor';
import { SceneList } from './SceneList';
import { Scene, SceneStatus } from '../../types/writing';
import { writingReducer, WritingState } from '../../reducers/writingReducer';
import { storageService } from '../../services/storageService';
import { useFocusMode } from '../../hooks/useFocusMode';
import { cn } from '../../utils/cn';
import { Plus, BookOpen } from 'lucide-react';
import { generateId } from '../../utils/id';

const initialState: WritingState = {
  currentProject: null,
  chapters: [],
  currentScene: null,
  isLoading: false,
  error: null,
};

export const WritingPanel: React.FC = () => {
  const [state, dispatch] = useReducer(writingReducer, initialState);
  const { isFocusMode } = useFocusMode();
  const [showSceneList, setShowSceneList] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await storageService.init();
        // Load chapters and scenes
        // This would be your actual data loading logic
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load writing data' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  const handleSceneUpdate = async (sceneId: string, updates: Partial<Scene>) => {
    dispatch({ type: 'UPDATE_SCENE', payload: { sceneId, updates } });
    
    try {
      await storageService.updateScene(sceneId, updates);
    } catch (error) {
      console.error('Failed to save scene:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save scene changes' });
    }
  };

  const handleSceneSelect = (scene: Scene) => {
    dispatch({ type: 'SET_CURRENT_SCENE', payload: scene });
  };

  const handleCreateNewScene = () => {
    const newScene: Scene = {
      id: generateId(),
      title: 'New Scene',
      content: '',
      wordCount: 0,
      wordCountGoal: 500,
      status: SceneStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: state.chapters[0]?.scenes.length || 0,
    };

    // Add to first chapter or create one
    if (state.chapters.length === 0) {
      // Create first chapter logic here
    } else {
      dispatch({ 
        type: 'ADD_SCENE', 
        payload: { chapterId: state.chapters[0].id, scene: newScene }
      });
    }

    dispatch({ type: 'SET_CURRENT_SCENE', payload: newScene });
  };

  const handleSave = async () => {
    if (!state.currentScene) return;
    
    try {
      await storageService.saveScene(state.currentScene);
      // Show success notification
    } catch (error) {
      console.error('Failed to save:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save scene' });
    }
  };

  // Get all scenes from all chapters
  const allScenes = state.chapters.flatMap(chapter => chapter.scenes);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your writing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex",
      isFocusMode ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : ""
    )}>
      {/* Scene List Sidebar */}
      {!isFocusMode && showSceneList && (
        <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Scenes
              </h2>
              <button
                onClick={handleCreateNewScene}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Create new scene"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <SceneList
              scenes={allScenes}
              currentSceneId={state.currentScene?.id}
              onSceneSelect={handleSceneSelect}
              onSceneDelete={(sceneId) => {
                // Implement delete logic
                console.log('Delete scene:', sceneId);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {state.currentScene ? (
          <SceneEditor
            scene={state.currentScene}
            onSceneUpdate={handleSceneUpdate}
            onSave={handleSave}
            className="flex-1 p-4"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Inkwell
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a scene from the sidebar or create a new one to start writing.
              </p>
              <button
                onClick={handleCreateNewScene}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Scene
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          {state.error}
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};