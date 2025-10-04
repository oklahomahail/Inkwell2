// src/components/Planning/VoiceEvolutionTracker.tsx - Track character voice evolution throughout their arc
import {
  Mic,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Plus,
  Volume2,
  MessageCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import type { GeneratedCharacter, CharacterVoice } from '../../services/storyArchitectService';

interface VoiceSnapshot {
  id: string;
  chapter: number;
  stage: string;
  voiceProfile: CharacterVoice;
  emotionalState: string;
  contextDescription: string;
  sampleDialogue?: string;
  notes?: string;
}

interface VoiceEvolution {
  character: string;
  snapshots: VoiceSnapshot[];
  consistencyScore: number;
  evolutionStrength: number;
  keyChanges: string[];
  voiceTraits: {
    vocabulary: { initial: string; current: string; changed: boolean };
    sentenceLength: { initial: string; current: string; changed: boolean };
    emotionalExpression: { initial: string; current: string; changed: boolean };
  };
}

interface VoiceEvolutionTrackerProps {
  characters: GeneratedCharacter[];
  onAddSnapshot?: (characterName: string, snapshot: Partial<VoiceSnapshot>) => void;
  onUpdateSnapshot?: (
    characterName: string,
    snapshotId: string,
    updates: Partial<VoiceSnapshot>,
  ) => void;
  className?: string;
}

export default function VoiceEvolutionTracker({
  characters = [],
  onAddSnapshot,
  onUpdateSnapshot,
  className = '',
}: VoiceEvolutionTrackerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>(characters[0]?.name || '');
  const [showAddSnapshot, setShowAddSnapshot] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  // Generate voice evolution data for each character
  const voiceEvolutions = useMemo(() => {
    return characters.map((character): VoiceEvolution => {
      const arcStages = character.arcStages || [];
      const baseVoice = character.voiceProfile;

      // Create snapshots based on arc stages if no custom snapshots exist
      const snapshots: VoiceSnapshot[] = [];

      if (baseVoice) {
        // Initial snapshot
        snapshots.push({
          id: `${character.name}-initial`,
          chapter: arcStages[0]?.chapter || 1,
          stage: 'initial',
          voiceProfile: baseVoice,
          emotionalState: arcStages[0]?.internalState || 'neutral',
          contextDescription: arcStages[0]?.description || 'Character introduction',
        });

        // Evolution snapshots based on arc progression
        const midPoint = Math.floor(arcStages.length / 2);
        const finalStage = arcStages[arcStages.length - 1];

        if (arcStages.length > midPoint && midPoint > 0) {
          const midStage = arcStages[midPoint];
          if (midStage) {
            snapshots.push({
              id: `${character.name}-mid`,
              chapter: midStage.chapter,
              stage: midStage.stage,
              voiceProfile: {
                ...baseVoice,
                emotionalExpression: getEvolvedVoiceTrait(
                  baseVoice.emotionalExpression,
                  midStage.internalState,
                  0.5,
                ),
                speechPatterns: [
                  ...(baseVoice.speechPatterns || []),
                  `Developing ${midStage.growth} patterns`,
                ],
              },
              emotionalState: midStage.internalState,
              contextDescription: midStage.description,
            });
          }
        }

        if (finalStage) {
          snapshots.push({
            id: `${character.name}-final`,
            chapter: finalStage.chapter,
            stage: finalStage.stage,
            voiceProfile: {
              ...baseVoice,
              vocabulary: getEvolvedVoiceTrait(baseVoice.vocabulary, finalStage.internalState, 1),
              emotionalExpression: getEvolvedVoiceTrait(
                baseVoice.emotionalExpression,
                finalStage.internalState,
                1,
              ),
              speechPatterns: [
                ...(baseVoice.speechPatterns || []),
                `Mastered ${finalStage.growth} expression`,
                'Confident communication',
              ],
              distinctiveTraits: [
                ...(baseVoice.distinctiveTraits || []),
                `Transformed by ${character.arc}`,
              ],
            },
            emotionalState: finalStage.internalState,
            contextDescription: finalStage.description,
          });
        }
      }

      // Calculate consistency and evolution metrics
      const consistencyScore = calculateConsistencyScore(snapshots);
      const evolutionStrength = calculateEvolutionStrength(snapshots);
      const keyChanges = identifyKeyChanges(snapshots);
      const voiceTraits = analyzeVoiceTraits(snapshots);

      return {
        character: character.name,
        snapshots,
        consistencyScore,
        evolutionStrength,
        keyChanges,
        voiceTraits,
      };
    });
  }, [characters]);

  const selectedEvolution = voiceEvolutions.find(
    (evolution) => evolution.character === selectedCharacter,
  );

  const handleSnapshotToggle = (snapshotId: string) => {
    if (compareMode) {
      setSelectedSnapshots((prev) => {
        if (prev.includes(snapshotId)) {
          return prev.filter((id) => id !== snapshotId);
        } else if (prev.length < 2) {
          return [...prev, snapshotId];
        }
        return prev;
      });
    }
  };

  function getEvolvedVoiceTrait(original: string, internalState: string, progress: number): string {
    const evolutionMap: { [key: string]: { [state: string]: string } } = {
      vocabulary: {
        simple: progress > 0.5 ? 'complex' : 'moderate',
        formal: progress > 0.5 ? 'eloquent' : 'formal',
        casual: progress > 0.5 ? 'confident' : 'casual',
      },
      emotionalExpression: {
        reserved: progress > 0.7 ? 'expressive' : progress > 0.3 ? 'measured' : 'reserved',
        direct: progress > 0.5 ? 'nuanced' : 'direct',
        expressive: 'expressive',
      },
    };

    const category = Object.keys(evolutionMap).find((cat) =>
      Object.keys(evolutionMap[cat] || {}).includes(original),
    );

    if (category && evolutionMap[category]?.[original]) {
      return evolutionMap[category][original];
    }

    return original;
  }

  function calculateConsistencyScore(snapshots: VoiceSnapshot[]): number {
    if (snapshots.length < 2) return 100;

    let consistentElements = 0;
    let totalElements = 0;

    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i]?.voiceProfile;
      const next = snapshots[i + 1]?.voiceProfile;

      if (!current || !next) continue;

      // Check core consistency (some evolution is expected)
      const coreTraits = ['vocabulary', 'sentenceLength'] as const;
      coreTraits.forEach((trait) => {
        totalElements++;
        if (current[trait] === next[trait] || isLogicalEvolution(current[trait], next[trait])) {
          consistentElements++;
        }
      });
    }

    return Math.round((consistentElements / totalElements) * 100);
  }

  function calculateEvolutionStrength(snapshots: VoiceSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const first = snapshots[0].voiceProfile;
    const last = snapshots[snapshots.length - 1].voiceProfile;

    let changes = 0;
    let totalAspects = 3;

    if (first.vocabulary !== last.vocabulary) changes++;
    if (first.sentenceLength !== last.sentenceLength) changes++;
    if (first.emotionalExpression !== last.emotionalExpression) changes++;

    return Math.round((changes / totalAspects) * 100);
  }

  function identifyKeyChanges(snapshots: VoiceSnapshot[]): string[] {
    if (snapshots.length < 2) return [];

    const changes = [];
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    if (!first || !last) return [];

    if (first.voiceProfile.vocabulary !== last.voiceProfile.vocabulary) {
      changes.push(
        `Vocabulary evolved from ${first.voiceProfile.vocabulary} to ${last.voiceProfile.vocabulary}`,
      );
    }

    if (first.voiceProfile.emotionalExpression !== last.voiceProfile.emotionalExpression) {
      changes.push(
        `Emotional expression shifted from ${first.voiceProfile.emotionalExpression} to ${last.voiceProfile.emotionalExpression}`,
      );
    }

    const initialTraits = first.voiceProfile.speechPatterns?.length || 0;
    const finalTraits = last.voiceProfile.speechPatterns?.length || 0;
    if (finalTraits > initialTraits) {
      changes.push(`Developed ${finalTraits - initialTraits} new speech patterns`);
    }

    return changes;
  }

  function analyzeVoiceTraits(snapshots: VoiceSnapshot[]) {
    if (snapshots.length === 0) {
      return {
        vocabulary: { initial: '', current: '', changed: false },
        sentenceLength: { initial: '', current: '', changed: false },
        emotionalExpression: { initial: '', current: '', changed: false },
      };
    }

    const first = snapshots[0]?.voiceProfile;
    const last = snapshots[snapshots.length - 1]?.voiceProfile;

    if (!first || !last) {
      return {
        vocabulary: { initial: '', current: '', changed: false },
        sentenceLength: { initial: '', current: '', changed: false },
        emotionalExpression: { initial: '', current: '', changed: false },
      };
    }

    return {
      vocabulary: {
        initial: first.vocabulary,
        current: last.vocabulary,
        changed: first.vocabulary !== last.vocabulary,
      },
      sentenceLength: {
        initial: first.sentenceLength,
        current: last.sentenceLength,
        changed: first.sentenceLength !== last.sentenceLength,
      },
      emotionalExpression: {
        initial: first.emotionalExpression,
        current: last.emotionalExpression,
        changed: first.emotionalExpression !== last.emotionalExpression,
      },
    };
  }

  function isLogicalEvolution(from: string, to: string): boolean {
    const logicalPairs = [
      ['simple', 'moderate'],
      ['moderate', 'complex'],
      ['reserved', 'measured'],
      ['measured', 'expressive'],
      ['short', 'medium'],
      ['medium', 'long'],
    ];

    return logicalPairs.some(([a, b]) => (from === a && to === b) || (from === b && to === a));
  }

  const getConsistencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEvolutionColor = (strength: number) => {
    if (strength >= 60) return 'text-purple-600 dark:text-purple-400';
    if (strength >= 30) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voice Evolution Tracker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor how character voices develop throughout their story arc
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                compareMode
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Compare Mode
            </button>
          </div>
        </div>
      </div>

      {/* Character Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Mic className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {characters.map((character) => (
                <option key={character.name} value={character.name}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEvolution && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">Consistency:</span>
                <span
                  className={`font-medium ${getConsistencyColor(selectedEvolution.consistencyScore)}`}
                >
                  {selectedEvolution.consistencyScore}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">Evolution:</span>
                <span
                  className={`font-medium ${getEvolutionColor(selectedEvolution.evolutionStrength)}`}
                >
                  {selectedEvolution.evolutionStrength}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {selectedEvolution ? (
        <div className="p-6">
          {/* Voice Trait Evolution Overview */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Voice Trait Evolution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(selectedEvolution.voiceTraits).map(([trait, data]) => (
                <div
                  key={trait}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {trait.replace(/([A-Z])/g, ' $1')}
                    </h4>
                    {data.changed ? (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                      {data.initial}
                    </span>
                    {data.changed && (
                      <>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                          {data.current}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Changes */}
          {selectedEvolution.keyChanges.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Key Voice Changes</h3>
              <div className="space-y-2">
                {selectedEvolution.keyChanges.map((change, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Snapshots Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Voice Evolution Timeline
              </h3>
              {compareMode && selectedSnapshots.length === 2 && (
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Comparing 2 snapshots
                </span>
              )}
            </div>

            <div className="space-y-4">
              {selectedEvolution.snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    compareMode && selectedSnapshots.includes(snapshot.id)
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  } ${compareMode ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
                  onClick={() => handleSnapshotToggle(snapshot.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          snapshot.stage === 'initial'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : snapshot.stage === 'final'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}
                      >
                        {snapshot.chapter}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                          {snapshot.stage.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chapter {snapshot.chapter} • {snapshot.emotionalState}
                        </p>
                      </div>
                    </div>
                    {compareMode && (
                      <div
                        className={`w-5 h-5 rounded border-2 ${
                          selectedSnapshots.includes(snapshot.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedSnapshots.includes(snapshot.id) && (
                          <CheckCircle className="w-full h-full text-white" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Voice Characteristics
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vocabulary:</span>
                          <span className="font-medium">{snapshot.voiceProfile.vocabulary}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Sentence Length:</span>
                          <span className="font-medium">
                            {snapshot.voiceProfile.sentenceLength}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expression:</span>
                          <span className="font-medium">
                            {snapshot.voiceProfile.emotionalExpression}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Context
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {snapshot.contextDescription}
                      </p>
                    </div>
                  </div>

                  {snapshot.voiceProfile.speechPatterns && (
                    <div className="flex flex-wrap gap-1">
                      {snapshot.voiceProfile.speechPatterns.map((pattern, patternIndex) => (
                        <span
                          key={patternIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Snapshot Button */}
            {!showAddSnapshot && onAddSnapshot && (
              <button
                onClick={() => setShowAddSnapshot(true)}
                className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Voice Snapshot
              </button>
            )}
          </div>

          {/* Compare View */}
          {compareMode && selectedSnapshots.length === 2 && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Voice Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedSnapshots.map((snapshotId) => {
                  const snapshot = selectedEvolution.snapshots.find((s) => s.id === snapshotId);
                  if (!snapshot) return null;

                  return (
                    <div key={snapshotId} className="space-y-3">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {snapshot.stage} (Chapter {snapshot.chapter})
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vocabulary:</span>
                          <span>{snapshot.voiceProfile.vocabulary}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Sentence Length:</span>
                          <span>{snapshot.voiceProfile.sentenceLength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expression:</span>
                          <span>{snapshot.voiceProfile.emotionalExpression}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a character to track their voice evolution</p>
        </div>
      )}
    </div>
  );
}
