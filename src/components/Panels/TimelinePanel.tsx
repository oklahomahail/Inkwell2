// src/components/Panels/TimelinePanel.tsx
import React, { useEffect, useState, useCallback } from 'react';

import { useClaude } from '@/context/ClaudeProvider'; // Add this import
import { useToast } from '@/context/ToastContext';
import { logActivity } from '@/utils/activityLogger';

interface Scene {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  isLoading?: boolean;
}

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [history, setHistory] = useState<Scene[][]>([[]]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [sceneSuggestions, setSceneSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { sendMessage } = useClaude();
  const { showToast } = useToast();

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('timeline_scenes');
    if (stored) {
      try {
        const parsed: Scene[] = JSON.parse(stored);
        setScenes(parsed);
        setHistory([parsed]);
      } catch {
        console.warn('Failed to parse stored scenes.');
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('timeline_scenes', JSON.stringify(scenes));
  }, [scenes]);

  const pushHistory = useCallback((newScenes: Scene[]) => {
    const safeScenes: Scene[] = Array.isArray(newScenes) ? newScenes : [];
    setHistory((prev) => [...prev.slice(-20), safeScenes]); // Keep 20 undo levels
    setRedoStack([]); // Clear redo stack
    setScenes(safeScenes);
  }, []);

  const handleUndo = () => {
    if (history.length > 1) {
      const current = history[history.length - 1] ?? [];
      const newHistory = history.slice(0, -1);
      const lastScenes = newHistory[newHistory.length - 1] ?? [];
      setRedoStack((prev) => [...prev, current]);
      setScenes(lastScenes);
      setHistory(newHistory);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const restored: Scene[] = redoStack[redoStack.length - 1] ?? [];
      setRedoStack((prev) => prev.slice(0, -1));
      pushHistory(restored);
    }
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      title: 'New Scene',
      description: 'Describe the scene...',
      timestamp: new Date().toLocaleTimeString(),
    };
    pushHistory([...scenes, newScene]);
    logActivity(`Scene added: ${newScene.title}`, 'timeline');
    showToast('Scene added to timeline', 'success');
  };

  const handleDeleteScene = (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    pushHistory(scenes.filter((scene) => scene.id !== id));
    logActivity(`Scene removed: ${scene?.title ?? 'Untitled'}`, 'timeline');
    showToast('Scene removed from timeline', 'info');
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = scenes.findIndex((s) => s.id === draggedId);
    const targetIndex = scenes.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(draggedIndex, 1);

    if (!moved) return;

    reordered.splice(targetIndex, 0, moved);
    pushHistory(reordered);
    setDraggedId(null);
  };

  const handleSuggestScenes = async () => {
    try {
      const response = await sendMessage(
        'Generate 5 creative scene ideas for a story timeline. Keep each idea brief and engaging.',
      );
      const ideas = response
        .split(/\n?\d[.)-]/)
        .map((i: string) => i.trim())
        .filter(Boolean);
      setSceneSuggestions(ideas);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate scene suggestions:', error);
      showToast('Failed to generate scene suggestions', 'error');
    }
  };

  const handleImproveDescription = async (id: string) => {
    pushHistory(scenes.map((s) => (s.id === id ? { ...s, isLoading: true } : s)));
    const scene = scenes.find((s) => s.id === id);
    if (!scene) return;

    try {
      const improved = await sendMessage(
        `Improve this scene description to be more vivid and engaging: "${scene.description}"`,
      );
      pushHistory(
        scenes.map((s) => (s.id === id ? { ...s, description: improved, isLoading: false } : s)),
      );
      showToast('Scene description improved', 'success');
    } catch {
      pushHistory(scenes.map((s) => (s.id === id ? { ...s, isLoading: false } : s)));
      showToast('Failed to improve description', 'error');
    }
  };

  const handleSuggestTransition = async (scene: Scene, next?: Scene) => {
    try {
      const prompt = `Suggest a smooth narrative transition from:

"${scene.title}: ${scene.description}"

to:

"${next ? `${next.title}: ${next.description}` : '[no next scene]'}"`;

      const response = await sendMessage(prompt);
      alert(`Suggested transition:\n\n${response}`);
    } catch (error) {
      console.error('Failed to suggest transition:', error);
      showToast('Failed to suggest transition', 'error');
    }
  };

  const handleAnalyzeTension = async (scene: Scene) => {
    try {
      const prompt = `Analyze the dramatic tension of this scene:

"${scene.title}: ${scene.description}"

What's at stake, how strong is the conflict, and how can it be improved?`;

      const response = await sendMessage(prompt);
      alert(`Tension analysis:\n\n${response}`);
    } catch (error) {
      console.error('Failed to analyze tension:', error);
      showToast('Failed to analyze tension', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-lg font-semibold font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Timeline Manager
      </h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleAddScene}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Add Scene
        </button>
        <button
          onClick={handleSuggestScenes}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          ✨ Suggest Scenes
        </button>
        <button
          onClick={handleUndo}
          disabled={history.length <= 1}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          ↩ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          ↪ Redo
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Suggested Scenes</h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2">
            {sceneSuggestions.map((idea, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    pushHistory([
                      ...scenes,
                      {
                        id: Date.now().toString(),
                        title: `Scene ${scenes.length + 1}`,
                        description: idea,
                        timestamp: new Date().toLocaleTimeString(),
                      },
                    ]);
                    setShowSuggestions(false);
                    showToast('Scene added from suggestion', 'success');
                  }}
                  className="w-full text-left px-3 py-1 text-sm rounded hover:bg-blue-100 dark:hover:bg-gray-600"
                >
                  {idea}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {scenes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No scenes in the timeline yet. Add your first one above.
          </p>
        ) : (
          scenes.map((scene, index) => (
            <div
              key={scene.id}
              draggable
              onDragStart={() => handleDragStart(scene.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(scene.id)}
              className={`p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 cursor-move transition-transform duration-200 ${
                draggedId === scene.id ? 'opacity-50 scale-105' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={scene.title}
                  onChange={(e) =>
                    pushHistory(
                      scenes.map((s) => (s.id === scene.id ? { ...s, title: e.target.value } : s)),
                    )
                  }
                  className="text-lg font-semibold font-semibold w-full bg-transparent border-none outline-none text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleDeleteScene(scene.id)}
                  className="ml-4 text-red-500 hover:underline text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <textarea
                  value={scene.description}
                  onChange={(e) =>
                    pushHistory(
                      scenes.map((s) =>
                        s.id === scene.id ? { ...s, description: e.target.value } : s,
                      ),
                    )
                  }
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="Describe the scene..."
                />
              </div>

              {scene.timestamp && (
                <p className="text-xs text-gray-400 mb-2">Added at: {scene.timestamp}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleImproveDescription(scene.id)}
                  disabled={scene.isLoading}
                  className="text-xs px-3 py-1 border rounded text-blue-600 border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {scene.isLoading ? 'Improving...' : '✨ Improve'}
                </button>
                <button
                  onClick={() => handleSuggestTransition(scene, scenes[index + 1])}
                  className="text-xs px-3 py-1 border rounded text-green-600 border-green-600 hover:bg-green-100 dark:hover:bg-gray-700"
                >
                  ➡ Suggest Transition
                </button>
                <button
                  onClick={() => handleAnalyzeTension(scene)}
                  className="text-xs px-3 py-1 border rounded text-yellow-600 border-yellow-600 hover:bg-yellow-100 dark:hover:bg-gray-700"
                >
                  ⚡ Analyze Tension
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Total scenes: {scenes.length}
      </div>
    </div>
  );
};

export default TimelinePanel;
