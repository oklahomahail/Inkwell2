<<<<<<< Updated upstream
// src/components/Panels/TimelinePanel.tsx
import React, { useState, useCallback, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { logActivity } from "@/utils/activityLogger";
=======
import React, { useEffect, useState, useCallback } from "react";
import { useClaude } from "@/context/ClaudeProvider";
import MDEditor from "@uiw/react-md-editor";
>>>>>>> Stashed changes

interface Scene {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { showToast } = useToast();

<<<<<<< Updated upstream
  const totalScenes = useMemo(() => scenes.length, [scenes]);

  const handleAddScene = useCallback(() => {
    if (!newTitle.trim()) {
      showToast("Scene title cannot be empty", "error");
      return;
    }
    const newScene: Scene = {
      id: Date.now(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setScenes((prev) => [...prev, newScene]);
    setNewTitle("");
    setNewDescription("");

    logActivity(`Scene added: ${newScene.title}`, "timeline");
    showToast("Scene added to timeline", "success");
  }, [newTitle, newDescription, showToast]);
=======
  const [history, setHistory] = useState<Scene[][]>([[]]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);

  const { generatePlotIdeas, improveText, callClaude } = useClaude();

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("timeline_scenes");
    if (stored) {
      try {
        const parsed: Scene[] = JSON.parse(stored);
        setScenes(parsed);
        setHistory([parsed]);
      } catch {
        console.warn("Failed to parse stored scenes.");
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("timeline_scenes", JSON.stringify(scenes));
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
      title: "New Scene",
      description: "Describe the scene...",
    };
    pushHistory([...scenes, newScene]);
  };

  const handleDeleteScene = (id: string) => {
    pushHistory(scenes.filter((scene) => scene.id !== id));
  };
>>>>>>> Stashed changes

  const handleRemoveScene = useCallback(
    (id: number) => {
      const scene = scenes.find((s) => s.id === id);
      setScenes((prev) => prev.filter((s) => s.id !== id));

<<<<<<< Updated upstream
      logActivity(`Scene removed: ${scene?.title ?? "Untitled"}`, "timeline");
      showToast("Scene removed from timeline", "info");
    },
    [scenes, showToast]
  );
=======
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
      console.error("Failed to generate scene suggestions:", error);
    }
  };

  const handleImproveDescription = async (id: string) => {
    pushHistory(
      scenes.map((s) => (s.id === id ? { ...s, isLoading: true } : s))
    );
    const scene = scenes.find((s) => s.id === id);
    if (!scene) return;

    try {
      const improved = await improveText(scene.description);
      pushHistory(
        scenes.map((s) =>
          s.id === id ? { ...s, description: improved, isLoading: false } : s
        )
      );
    } catch {
      pushHistory(
        scenes.map((s) =>
          s.id === id ? { ...s, isLoading: false } : s
        )
      );
    }
  };

  const handleSuggestTransition = async (scene: Scene, next?: Scene) => {
    try {
      const prompt = `Suggest a smooth narrative transition from:

"${scene.title}: ${scene.description}"

to:

"${next ? `${next.title}: ${next.description}` : "[no next scene]"}"`;

      const response = await callClaude(prompt);
      alert(`Suggested transition:\n\n${response}`);
    } catch (error) {
      console.error("Failed to suggest transition:", error);
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
      console.error("Failed to analyze tension:", error);
    }
  };
>>>>>>> Stashed changes

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Timeline Manager
      </h2>

<<<<<<< Updated upstream
      {/* Scene creation form */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Scene title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:text-gray-200"
        />
        <textarea
          placeholder="Scene description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:text-gray-200"
          rows={3}
        />
=======
      {/* Controls */}
      <div className="flex gap-2 mb-4">
>>>>>>> Stashed changes
        <button
          onClick={handleAddScene}
          className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Add Scene
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

<<<<<<< Updated upstream
      {/* Scene list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {scenes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No scenes in the timeline yet. Add your first one above.
          </p>
        ) : (
          scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex items-start justify-between border rounded p-3 bg-white dark:bg-gray-800 shadow-sm"
            >
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {scene.title}
                </h3>
                {scene.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {scene.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Added at: {scene.timestamp}
                </p>
              </div>
=======
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
              draggedId === scene.id ? "opacity-50 scale-105" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <input
                type="text"
                value={scene.title}
                onChange={(e) =>
                  pushHistory(
                    scenes.map((s) =>
                      s.id === scene.id ? { ...s, title: e.target.value } : s
                    )
                  )
                }
                className="text-lg font-semibold w-full bg-transparent border-none outline-none text-gray-900 dark:text-white"
              />
>>>>>>> Stashed changes
              <button
                onClick={() => handleRemoveScene(scene.id)}
                className="ml-4 text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

<<<<<<< Updated upstream
      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Total scenes: {totalScenes}
=======
            <div data-color-mode="light" className="mb-2">
              <MDEditor
                value={scene.description}
                onChange={(value) =>
                  pushHistory(
                    scenes.map((s) =>
                      s.id === scene.id
                        ? { ...s, description: value || "" }
                        : s
                    )
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
                {scene.isLoading ? "Improving..." : "✨ Improve"}
              </button>
              <button
                onClick={() =>
                  handleSuggestTransition(scene, scenes[index + 1])
                }
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
>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default TimelinePanel;
