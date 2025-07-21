import React, { useState, useEffect } from "react";
import { useToastContext } from "@/context/ToastContext";

interface Scene {
  id: string;
  title: string;
  description: string;
}

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { showToast } = useToastContext();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("timeline_scenes");
      if (stored) setScenes(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("timeline_scenes", JSON.stringify(scenes));
  }, [scenes]);

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      title: `New Scene ${scenes.length + 1}`,
      description: "",
    };
    setScenes((prev) => [...prev, newScene]);
    showToast({ message: "Scene added", type: "success" });
  };

  const handleRemoveScene = (id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
    showToast({ message: "Scene removed", type: "info" });
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Timeline</h2>
      <button
        onClick={handleAddScene}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
      >
        + Add Scene
      </button>
      <ul className="mt-4 space-y-3">
        {scenes.map((scene) => (
          <li key={scene.id} className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
            <input
              type="text"
              value={scene.title}
              onChange={(e) =>
                setScenes((prev) =>
                  prev.map((s) => (s.id === scene.id ? { ...s, title: e.target.value } : s))
                )
              }
              className="w-full text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none"
            />
            <textarea
              value={scene.description}
              onChange={(e) =>
                setScenes((prev) =>
                  prev.map((s) =>
                    s.id === scene.id ? { ...s, description: e.target.value } : s
                  )
                )
              }
              placeholder="Scene description..."
              className="w-full mt-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none"
            />
            <button
              onClick={() => handleRemoveScene(scene.id)}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimelinePanel;
