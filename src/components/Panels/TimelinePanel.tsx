import React, { useEffect, useState, useCallback } from 'react';
import { useClaude } from '@/context/ClaudeProvider';
import MDEditor from '@uiw/react-md-editor';

interface Scene {
  id: string;
  title: string;
  description: string;
  isLoading?: boolean;
}

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [sceneSuggestions, setSceneSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [history, setHistory] = useState<Scene[][]>([[]]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);

  const { generatePlotIdeas, improveText, callClaude } = useClaude();

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
    };
    pushHistory([...scenes, newScene]);
  };

  const handleDeleteScene = (id: string) => {
    pushHistory(scenes.filter((scene) => scene.id !== id));
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = scenes.findIndex((s) => s.id === draggedId);
    const targetIndex = scenes.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(draggedIndex, 1);

    if (!moved) return; // Guard: moved should never be undefined, but TS needs assurance.

    reordered.splice(targetIndex, 0, moved);
    pushHistory(reordered);
    setDraggedId(null);
  };

  const handleSuggestScenes = async () => {
    try {
      const response = await generatePlotIdeas();
      const ideas = response
        .split(/\n?\d[.)-]/)
        .map((i: string) => i.trim())
        .filter(Boolean);
      setSceneSuggestions(ideas);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate scene suggestions:', error);
    }
  };

  const handleImproveDescription = async (id: string) => {
    pushHistory(scenes.map((s) => (s.id === id ? { ...s, isLoading: true } : s)));
    const scene = scenes.find((s) => s.id === id);
    if (!scene) return;

    try {
      const improved = await improveText(scene.description);
      pushHistory(
        scenes.map((s) => (s.id === id ? { ...s, description: improved, isLoading: false } : s)),
      );
    } catch {
      pushHistory(scenes.map((s) => (s.id === id ? { ...s, isLoading: false } : s)));
    }
  };

  const handleSuggestTransition = async (scene: Scene, next?: Scene) => {
    try {
      const prompt = `Suggest a smooth narrative transition from:

"${scene.title}: ${scene.description}"

to:

"${next ? `${next.title}: ${next.description}` : '[no next scene]'}"`;

      const response = await callClaude(prompt);
      alert(`Suggested transition:\n\n${response}`);
    } catch (error) {
      console.error('Failed to suggest transition:', error);
    }
  };

  const handleAnalyzeTension = async (scene: Scene) => {
    try {
      const prompt = `Analyze the dramatic tension of this scene:

"${scene.title}: ${scene.description}"

What's at stake, how strong is the conflict, and how can it be improved?`;

      const response = await callClaude(prompt);
      alert(`Tension analysis:\n\n${response}`);
    } catch (error) {
      console.error('Failed to analyze tension:', error);
    }
  };

  return (
    <div className="p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-4">Timeline</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Drag to reorder scenes. Edit as needed. Use Claude to improve or analyze your structure.
      </p>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleAddScene}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          + Add Scene
        </button>
        <button
          onClick={handleSuggestScenes}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          ✨ Suggest Scene Ideas
        </button>
        <button
          onClick={handleUndo}
          disabled={history.length <= 1}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-sm rounded hover:bg-gray-400 disabled:opacity-50"
        >
          ↩ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-sm rounded hover:bg-gray-400 disabled:opacity-50"
        >
          ↪ Redo
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded shadow">
          <h3 className="font-semibold mb-2">Suggested Scenes</h3>
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
                      },
                    ]);
                    setShowSuggestions(false);
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
      <div className="space-y-4">
        {scenes.map((scene, index) => (
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
                className="text-lg font-semibold w-full bg-transparent border-none outline-none text-gray-900 dark:text-white"
              />
              <button
                onClick={() => handleDeleteScene(scene.id)}
                className="ml-4 text-sm text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>

            <div data-color-mode="light" className="mb-2">
              <MDEditor
                value={scene.description}
                onChange={(value) =>
                  pushHistory(
                    scenes.map((s) => (s.id === scene.id ? { ...s, description: value || '' } : s)),
                  )
                }
                preview="edit"
                height={150}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
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
        ))}
      </div>
    </div>
  );
};

export default TimelinePanel;
