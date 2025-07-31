import React, { useState, useCallback, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { logActivity } from "@/utils/activityLogger";

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

  const handleRemoveScene = useCallback(
    (id: number) => {
      const scene = scenes.find((s) => s.id === id);
      setScenes((prev) => prev.filter((s) => s.id !== id));
      logActivity(`Scene removed: ${scene?.title ?? "Untitled"}`, "timeline");
      showToast("Scene removed from timeline", "success");
    },
    [scenes, showToast]
  );

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Timeline Manager
      </h2>

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
        <button
          onClick={handleAddScene}
          className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Add Scene
        </button>
      </div>

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

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Total scenes: {totalScenes}
      </div>
    </div>
  );
};

export default TimelinePanel;
