import React, { useState, useEffect } from "react";

interface Scene {
  id: string;
  title: string;
  description: string;
}

const LOCAL_STORAGE_KEY = "timelineScenes";

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Load scenes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setScenes(JSON.parse(saved));
      } catch {
        // fallback if JSON fails
        setScenes([]);
      }
    } else {
      setScenes([
        { id: "1", title: "Opening Scene", description: "Introduce characters and setting" },
        { id: "2", title: "Inciting Incident", description: "The event that changes everything" },
        { id: "3", title: "First Turning Point", description: "A decision is made" }
      ]);
    }
  }, []);

  // Save scenes to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scenes));
  }, [scenes]);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = scenes.findIndex((scene) => scene.id === draggedId);
    const targetIndex = scenes.findIndex((scene) => scene.id === targetId);
    const newScenes = [...scenes];
    const [moved] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, moved);
    setScenes(newScenes);
    setDraggedId(null);
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      title: "New Scene",
      description: "Describe the scene..."
    };
    setScenes((prev) => [...prev, newScene]);
  };

  const handleDeleteScene = (id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
  };

  return (
    <div className="p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-4">Timeline</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Drag to reorder scenes. Click to edit. Add or remove as needed.
      </p>
      <button
        onClick={handleAddScene}
        className="mb-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        + Add Scene
      </button>
      <div className="space-y-4">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            draggable
            onDragStart={() => handleDragStart(scene.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(scene.id)}
            className="p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 cursor-move"
          >
            <div className="flex justify-between items-center mb-2">
              <input
                type="text"
                value={scene.title}
                onChange={(e) =>
                  setScenes((prev) =>
                    prev.map((s) =>
                      s.id === scene.id ? { ...s, title: e.target.value } : s
                    )
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
            <textarea
              value={scene.description}
              onChange={(e) =>
                setScenes((prev) =>
                  prev.map((s) =>
                    s.id === scene.id ? { ...s, description: e.target.value } : s
                  )
                )
              }
              rows={3}
              className="w-full bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 text-sm resize-none"
              placeholder="Scene description..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePanel;
