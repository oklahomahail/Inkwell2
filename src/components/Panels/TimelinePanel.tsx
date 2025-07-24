import React, { useState, useEffect, useRef } from "react";
import { useToastContext } from "@/context/ToastContext";

interface Scene {
  id: string;
  title: string;
  description: string;
  order: number;
  sceneType?: "action" | "dialogue" | "exposition" | "climax" | "resolution";
  dateInStory?: string;
}

interface DragState {
  draggedId: string | null;
  dragOverId: string | null;
  dropPosition: "before" | "after" | null;
  isDragging: boolean;
}

interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  showSavedIndicator: boolean;
}

const TimelinePanel: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    dragOverId: null,
    dropPosition: null,
    isDragging: false,
  });
  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    showSavedIndicator: false,
  });
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [jumpToScene, setJumpToScene] = useState<number | null>(null);
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  const { showToast } = useToastContext();
  const timelineRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load scenes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("timeline_scenes");
      if (stored) {
        const loadedScenes = JSON.parse(stored);
        const scenesWithOrder = loadedScenes.map((scene: any, index: number) => ({
          ...scene,
          order: scene.order ?? index,
        }));
        setScenes(scenesWithOrder.sort((a: Scene, b: Scene) => a.order - b.order));
      }
    } catch (error) {
      console.warn("Failed to load timeline scenes", error);
    }
  }, []);

  // Save scenes to localStorage with visual feedback
  useEffect(() => {
    if (scenes.length > 0) {
      setSaveState(prev => ({ ...prev, isSaving: true }));
      
      // Clear any existing save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem("timeline_scenes", JSON.stringify(scenes));
        setSaveState({
          isSaving: false,
          lastSaved: new Date(),
          showSavedIndicator: true,
        });
        
        // Hide the saved indicator after 2 seconds
        setTimeout(() => {
          setSaveState(prev => ({ ...prev, showSavedIndicator: false }));
        }, 2000);
      }, 500);
    }
  }, [scenes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Jump to scene functionality
  useEffect(() => {
    if (jumpToScene !== null && timelineRef.current) {
      const sceneElement = timelineRef.current.querySelector(`[data-scene-index="${jumpToScene}"]`);
      if (sceneElement) {
        sceneElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        setJumpToScene(null);
      }
    }
  }, [jumpToScene]);

  const handleAddScene = (insertAtIndex?: number) => {
    const newOrder = insertAtIndex ?? (scenes.length > 0 ? Math.max(...scenes.map(s => s.order)) + 1 : 0);
    const newScene: Scene = {
      id: Date.now().toString(),
      title: "",
      description: "",
      order: newOrder,
      sceneType: "exposition",
      dateInStory: "",
    };

    // If inserting at a specific position, adjust other scene orders
    if (insertAtIndex !== undefined) {
      const updatedScenes = scenes.map(scene => 
        scene.order >= insertAtIndex ? { ...scene, order: scene.order + 1 } : scene
      );
      setScenes([...updatedScenes, newScene].sort((a, b) => a.order - b.order));
    } else {
      setScenes(prev => [...prev, newScene].sort((a, b) => a.order - b.order));
    }

    setSelectedSceneId(newScene.id);
    setIsAddingScene(false);
    showToast({ message: "Scene added to timeline", type: "success" });
  };

  const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
    setScenes(prev =>
      prev.map(scene =>
        scene.id === id ? { ...scene, ...updates } : scene
      )
    );
  };

  const handleRemoveScene = (id: string) => {
    setScenes(prev => prev.filter(scene => scene.id !== id));
    if (selectedSceneId === id) {
      setSelectedSceneId(null);
    }
    showToast({ message: "Scene removed from timeline", type: "info" });
  };

  const moveScene = (sceneId: string, direction: "up" | "down") => {
    const currentIndex = scenes.findIndex(s => s.id === sceneId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= scenes.length) return;

    const updatedScenes = [...scenes];
    [updatedScenes[currentIndex], updatedScenes[newIndex]] = [updatedScenes[newIndex], updatedScenes[currentIndex]];
    
    // Update order values
    const reorderedScenes = updatedScenes.map((scene, index) => ({
      ...scene,
      order: index,
    }));

    setScenes(reorderedScenes);
    showToast({ message: "Scene reordered", type: "success" });
  };

  // Enhanced Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDragState({
      draggedId: sceneId,
      dragOverId: null,
      dropPosition: null,
      isDragging: true,
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);
  };

  const handleDragOver = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    
    // Calculate drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const centerX = rect.left + rect.width / 2;
    const dropPosition = mouseX < centerX ? "before" : "after";

    setDragState(prev => ({
      ...prev,
      dragOverId: sceneId,
      dropPosition,
    }));
    setHoveredSceneId(sceneId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Element;
    
    // Only clear if we're not moving to another scene card or its children
    if (!relatedTarget || 
        (!relatedTarget.closest('[data-scene-card]') && 
         !relatedTarget.hasAttribute('data-scene-card'))) {
      setDragState(prev => ({
        ...prev,
        dragOverId: null,
        dropPosition: null,
      }));
      setHoveredSceneId(null);
    }
  };

  const handleDragEnd = () => {
    setDragState({
      draggedId: null,
      dragOverId: null,
      dropPosition: null,
      isDragging: false,
    });
    setHoveredSceneId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    const draggedSceneId = dragState.draggedId;
    
    if (!draggedSceneId || draggedSceneId === targetSceneId) {
      handleDragEnd();
      return;
    }

    const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId);
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      handleDragEnd();
      return;
    }

    const updatedScenes = [...scenes];
    const [draggedScene] = updatedScenes.splice(draggedIndex, 1);
    
    // Simplified insertion logic - just use dropPosition consistently
    let insertIndex = targetIndex;
    if (dragState.dropPosition === "after") {
      insertIndex = targetIndex + 1;
    }
    // For "before", insertIndex stays as targetIndex
    
    updatedScenes.splice(insertIndex, 0, draggedScene);
    
    // Update order values
    const reorderedScenes = updatedScenes.map((scene, index) => ({
      ...scene,
      order: index,
    }));

    setScenes(reorderedScenes);
    handleDragEnd();
    showToast({ message: "Scene reordered", type: "success" });
  };

  const getSceneTypeColor = (type: Scene["sceneType"]) => {
    switch (type) {
      case "action": return "bg-red-500/20 border-red-400/50 text-red-300";
      case "dialogue": return "bg-blue-500/20 border-blue-400/50 text-blue-300";
      case "exposition": return "bg-green-500/20 border-green-400/50 text-green-300";
      case "climax": return "bg-purple-500/20 border-purple-400/50 text-purple-300";
      case "resolution": return "bg-yellow-500/20 border-yellow-400/50 text-yellow-300";
      default: return "bg-gray-500/20 border-gray-400/50 text-gray-300";
    }
  };

  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Story Timeline</h2>
          <div className="flex items-center space-x-4">
            <p className="text-gray-400 text-sm">Drag scenes to reorder • Click to edit details</p>
            {/* Save Status Indicator */}
            {saveState.showSavedIndicator && (
              <div className="flex items-center space-x-2 text-green-400 text-sm animate-fade-in">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved</span>
              </div>
            )}
            {saveState.isSaving && (
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => handleAddScene()}
          className="px-6 py-3 bg-gradient-to-r from-[#0073E6] to-[#0056B3] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          + Add Scene
        </button>
      </div>

      {/* Mini-map Navigation */}
      {scenes.length > 5 && (
        <div className="mb-6 p-4 bg-[#1A2233] rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-300">Quick Jump:</span>
            <span className="text-xs text-gray-500">({scenes.length} scenes)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => setJumpToScene(index)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-[#0073E6] text-gray-300 hover:text-white rounded transition-colors"
                title={scene.title || `Scene ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative">
        {scenes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No scenes yet</h3>
            <p className="text-gray-500 mb-6">Start building your story timeline</p>
            <button
              onClick={() => handleAddScene()}
              className="px-6 py-2 bg-[#0073E6] text-white rounded-lg hover:bg-[#0056B3] transition-colors"
            >
              Create First Scene
            </button>
          </div>
        ) : (
          <div 
            ref={timelineRef}
            className="relative overflow-x-auto pb-8"
          >
            {/* Timeline Spine */}
            <div className="absolute top-20 left-8 right-8 h-0.5 bg-gradient-to-r from-[#0073E6]/30 via-[#0073E6] to-[#0073E6]/30"></div>
            
            {/* Scene Cards */}
            <div className="flex space-x-6 min-w-max px-8">
              {scenes.map((scene, index) => (
                <div key={scene.id} className="relative">
                  {/* Drop Indicator - Before */}
                  {dragState.dragOverId === scene.id && dragState.dropPosition === "before" && dragState.draggedId !== scene.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0073E6] rounded-full shadow-lg transform -translate-x-4 z-20"></div>
                  )}
                  
                  <div
                    data-scene-index={index}
                    data-scene-card
                    draggable
                    onDragStart={(e) => handleDragStart(e, scene.id)}
                    onDragOver={(e) => handleDragOver(e, scene.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, scene.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex-shrink-0 transition-all duration-300 cursor-grab active:cursor-grabbing ${
                      dragState.isDragging && dragState.draggedId === scene.id 
                        ? 'opacity-50 scale-95 rotate-2' 
                        : 'hover:scale-105'
                    }`}
                  >
                    {/* Timeline Node */}
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#0073E6] rounded-full border-4 border-[#0A0F1C] shadow-lg z-10"></div>
                    
                    {/* Scene Card */}
                    <div 
                      className={`w-80 bg-[#1A2233] rounded-xl border border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 mt-8 ${
                        selectedSceneId === scene.id ? 'ring-2 ring-[#0073E6] border-[#0073E6]' : 'hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedSceneId(selectedSceneId === scene.id ? null : scene.id)}
                    >
                      {/* Scene Header */}
                      <div className="p-5 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            Scene {index + 1}
                          </span>
                          <div className="flex items-center space-x-2">
                            {/* Keyboard navigation buttons */}
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScene(scene.id, "up");
                                }}
                                disabled={index === 0}
                                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move scene left"
                                aria-label="Move scene left"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScene(scene.id, "down");
                                }}
                                disabled={index === scenes.length - 1}
                                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move scene right"
                                aria-label="Move scene right"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                            
                            <select
                              value={scene.sceneType || "exposition"}
                              onChange={(e) => handleUpdateScene(scene.id, { sceneType: e.target.value as Scene["sceneType"] })}
                              className={`text-xs px-2 py-1 rounded border ${getSceneTypeColor(scene.sceneType)} bg-transparent`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="exposition">Exposition</option>
                              <option value="action">Action</option>
                              <option value="dialogue">Dialogue</option>
                              <option value="climax">Climax</option>
                              <option value="resolution">Resolution</option>
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveScene(scene.id);
                              }}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              aria-label="Delete scene"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => handleUpdateScene(scene.id, { title: e.target.value })}
                          className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none text-white placeholder-gray-500"
                          placeholder="Scene title..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Scene Content */}
                      <div className="p-5">
                        <textarea
                          value={scene.description}
                          onChange={(e) => handleUpdateScene(scene.id, { description: e.target.value })}
                          placeholder="Describe what happens in this scene..."
                          className="w-full h-24 bg-transparent text-gray-300 placeholder-gray-500 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-[#0073E6] resize-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Expanded Details */}
                      {selectedSceneId === scene.id && (
                        <div className="p-5 border-t border-gray-700 bg-[#141B2B]">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Date in Story
                              </label>
                              <input
                                type="text"
                                value={scene.dateInStory || ""}
                                onChange={(e) => handleUpdateScene(scene.id, { dateInStory: e.target.value })}
                                placeholder="e.g., Day 1, Morning, Chapter 3..."
                                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0073E6]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drop Indicator - After */}
                  {dragState.dragOverId === scene.id && dragState.dropPosition === "after" && dragState.draggedId !== scene.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#0073E6] rounded-full shadow-lg transform translate-x-4 z-20"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TimelinePanel;