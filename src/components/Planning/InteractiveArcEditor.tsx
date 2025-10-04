// src/components/Planning/InteractiveArcEditor.tsx - Interactive drag & drop character arc timeline editor
import { Edit2, RotateCcw, Save, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import type { GeneratedCharacter, CharacterArcStage } from '../../services/storyArchitectService';

interface ArcStagePosition extends CharacterArcStage {
  id: string;
  characterName: string;
  originalChapter: number;
  isDragging: boolean;
}

interface InteractiveArcEditorProps {
  characters: GeneratedCharacter[];
  totalChapters: number;
  onCharacterUpdate?: (character: GeneratedCharacter) => void;
  className?: string;
}

interface DragState {
  stageId: string | null;
  startX: number;
  startChapter: number;
  currentChapter: number;
}

export default function InteractiveArcEditor({
  characters = [],
  totalChapters = 20,
  onCharacterUpdate,
  className = '',
}: InteractiveArcEditorProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    characters[0]?.name || null,
  );
  const [dragState, setDragState] = useState<DragState>({
    stageId: null,
    startX: 0,
    startChapter: 0,
    currentChapter: 0,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  // Create arc stage positions with unique IDs for drag & drop
  const arcStagePositions = useMemo(() => {
    const positions: ArcStagePosition[] = [];
    characters.forEach((character) => {
      character.arcStages?.forEach((stage, index) => {
        positions.push({
          ...stage,
          id: `${character.name}-${index}`,
          characterName: character.name,
          originalChapter: stage.chapter,
          isDragging: dragState.stageId === `${character.name}-${index}`,
        });
      });
    });
    return positions;
  }, [characters, dragState.stageId]);

  const selectedCharacterData = characters.find((char) => char.name === selectedCharacter);
  const selectedCharacterStages = arcStagePositions.filter(
    (pos) => pos.characterName === selectedCharacter,
  );

  // Calculate chapter width for drag calculations
  const chapterWidth = 60; // pixels per chapter

  const handleStageMouseDown = useCallback(
    (e: React.MouseEvent, stageId: string, currentChapter: number) => {
      e.preventDefault();
      setDragState({
        stageId,
        startX: e.clientX,
        startChapter: currentChapter,
        currentChapter,
      });

      // Add global mouse move and up listeners
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - e.clientX;
        const chapterDelta = Math.round(deltaX / chapterWidth);
        const newChapter = Math.max(1, Math.min(totalChapters, currentChapter + chapterDelta));

        setDragState((prev) => ({
          ...prev,
          currentChapter: newChapter,
        }));
      };

      const handleMouseUp = () => {
        setDragState((prev) => {
          if (prev.stageId && prev.currentChapter !== prev.startChapter) {
            setHasUnsavedChanges(true);
            // Update the character's arc stage
            const characterName = prev.stageId.split('-')[0];
            const stageIndex = parseInt(prev.stageId?.split('-')[1] || '0');
            const character = characters.find((char) => char.name === characterName);

            if (character?.arcStages?.[stageIndex]) {
              const updatedCharacter = {
                ...character,
                arcStages: character.arcStages.map((stage, index) =>
                  index === stageIndex ? { ...stage, chapter: prev.currentChapter } : stage,
                ),
              };
              onCharacterUpdate?.(updatedCharacter);
            }
          }

          return {
            stageId: null,
            startX: 0,
            startChapter: 0,
            currentChapter: 0,
          };
        });

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [characters, chapterWidth, totalChapters, onCharacterUpdate],
  );

  const resetCharacterArc = () => {
    if (!selectedCharacterData) return;

    // Reset to original positions (this would need to be tracked separately in a real implementation)
    setHasUnsavedChanges(false);
  };

  const saveChanges = () => {
    setHasUnsavedChanges(false);
    // Additional save logic could go here
  };

  const analyzePacingIssues = useCallback(() => {
    if (!selectedCharacterData?.arcStages) return [];

    const issues = [];
    const sortedStages = [...selectedCharacterData.arcStages].sort((a, b) => a.chapter - b.chapter);

    // Check for stages too close together
    for (let i = 0; i < sortedStages.length - 1; i++) {
      const current = sortedStages[i];
      const next = sortedStages[i + 1];
      if (current && next && next.chapter - current.chapter < 2) {
        issues.push({
          type: 'pacing',
          message: `${current.stage} and ${next.stage} are too close (Ch. ${current.chapter}-${next.chapter})`,
          severity: 'warning' as const,
        });
      }
    }

    // Check for missing key stages
    const stageTypes = sortedStages.map((s) => s.stage);
    if (!stageTypes.includes('inciting_incident')) {
      issues.push({
        type: 'structure',
        message: 'Missing inciting incident in character arc',
        severity: 'error' as const,
      });
    }

    return issues;
  }, [selectedCharacterData]);

  const pacingIssues = analyzePacingIssues();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Interactive Arc Editor
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag arc stages to adjust timing and pacing
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetCharacterArc}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Reset changes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={saveChanges}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCharacter || ''}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {characters.map((character) => (
                <option key={character.name} value={character.name}>
                  {character.name} ({character.role})
                </option>
              ))}
            </select>
          </div>

          {pacingIssues.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">
                {pacingIssues.length} pacing issue{pacingIssues.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="p-6">
        {selectedCharacterData ? (
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {selectedCharacterData.name}'s Arc Timeline
                </h3>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCharacterStages.length} arc stages • {totalChapters} chapters
              </div>
            </div>

            {/* Chapter Numbers */}
            <div className="relative">
              <div className="flex mb-4">
                <div className="w-24 flex-shrink-0"></div>
                <div className="flex-1 flex">
                  {Array.from({ length: totalChapters }, (_, i) => (
                    <div
                      key={i}
                      className="text-center text-xs text-gray-500 dark:text-gray-400"
                      style={{ width: chapterWidth }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Track */}
              <div className="relative">
                <div className="flex items-center">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arc Stages
                  </div>
                  <div className="flex-1 relative h-16 bg-gray-100 dark:bg-gray-700 rounded">
                    {/* Chapter Grid Lines */}
                    {Array.from({ length: totalChapters - 1 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
                        style={{ left: (i + 1) * chapterWidth }}
                      />
                    ))}

                    {/* Arc Stage Markers */}
                    {selectedCharacterStages.map((stage) => {
                      const currentChapter =
                        dragState.stageId === stage.id ? dragState.currentChapter : stage.chapter;

                      return (
                        <div
                          key={stage.id}
                          className={`absolute top-2 w-12 h-12 rounded-full border-2 cursor-grab active:cursor-grabbing transition-all ${
                            stage.stage === 'climax'
                              ? 'bg-red-500 border-red-600 shadow-red-200 dark:shadow-red-900'
                              : stage.stage === 'resolution'
                                ? 'bg-green-500 border-green-600 shadow-green-200 dark:shadow-green-900'
                                : 'bg-blue-500 border-blue-600 shadow-blue-200 dark:shadow-blue-900'
                          } ${
                            stage.isDragging
                              ? 'transform scale-110 shadow-lg z-10'
                              : 'hover:shadow-md'
                          }`}
                          style={{
                            left: (currentChapter - 1) * chapterWidth + chapterWidth / 2 - 24,
                          }}
                          onMouseDown={(e) => handleStageMouseDown(e, stage.id, stage.chapter)}
                          title={`${stage.stage} - Chapter ${currentChapter}`}
                        >
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                            {currentChapter}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Arc Stage Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCharacterStages
                  .sort((a, b) => a.chapter - b.chapter)
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className={`p-3 rounded-lg border ${
                        stage.isDragging
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {stage.stage.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Ch. {stage.chapter}
                          </span>
                          <button
                            onClick={() => setEditingStage(stage.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {stage.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{stage.growth}</span>
                        <span
                          className={`px-2 py-1 rounded-full ${
                            stage.stage === 'climax'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                              : stage.stage === 'resolution'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          }`}
                        >
                          {stage.internalState}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Pacing Issues */}
            {pacingIssues.length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Pacing Analysis
                </h4>
                <div className="space-y-2">
                  {pacingIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-amber-700 dark:text-amber-300">{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a character to edit their arc timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
