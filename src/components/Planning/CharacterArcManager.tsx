// src/components/Planning/CharacterArcManager.tsx - Advanced character arc visualization and management
import {
  Users,
  TrendingUp,
  Heart,
  Brain,
  Edit3,
  Plus,
  ChevronRight,
  ChevronDown,
  Clock,
  MousePointer2,
  BookTemplate,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import CharacterArcTemplates from './CharacterArcTemplates';
import InteractiveArcEditor from './InteractiveArcEditor';
import RelationshipMapper from './RelationshipMapper';

import type { GeneratedCharacter } from '../../services/storyArchitectService';

interface CharacterArcManagerProps {
  characters: GeneratedCharacter[];
  totalChapters: number;
  onCharacterUpdate?: (character: GeneratedCharacter) => void;
  onAddCharacter?: () => void;
  className?: string;
}

type ViewMode =
  | 'overview'
  | 'arcs'
  | 'relationships'
  | 'timeline'
  | 'voice'
  | 'editor'
  | 'templates';

export default function CharacterArcManager({
  characters = [],
  totalChapters = 20,
  onCharacterUpdate,
  onAddCharacter,
  className = '',
}: CharacterArcManagerProps) {
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [_selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: Users, description: 'Character summary and stats' },
    {
      id: 'editor',
      label: 'Arc Editor',
      icon: MousePointer2,
      description: 'Interactive drag & drop timeline',
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: BookTemplate,
      description: 'Pre-built character arc patterns',
    },
    {
      id: 'arcs',
      label: 'Arc Development',
      icon: TrendingUp,
      description: 'Character growth stages',
    },
    {
      id: 'relationships',
      label: 'Relationships',
      icon: Heart,
      description: 'Character connections',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      description: 'Chapter-by-chapter progression',
    },
    {
      id: 'voice',
      label: 'Voice Profiles',
      icon: Brain,
      description: 'Character voice and dialogue',
    },
  ];

  const characterStats = useMemo(() => {
    return characters.map((char) => ({
      character: char,
      arcStages: char.arcStages?.length || 0,
      relationships: char.relationships?.length || 0,
      povChapters: char.povChapters?.length || 0,
      growthMoments: char.growthMoments?.length || 0,
      developmentScore: calculateDevelopmentScore(char),
    }));
  }, [characters]);

  function calculateDevelopmentScore(character: GeneratedCharacter): number {
    let score = 0;
    if (character.arcStages?.length) score += character.arcStages.length * 10;
    if (character.relationships?.length) score += character.relationships.length * 5;
    if (character.growthMoments?.length) score += character.growthMoments.length * 8;
    if (character.voiceProfile) score += 20;
    if (character.internalConflict && character.externalConflict) score += 15;
    return Math.min(score, 100);
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Character Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {characterStats.map(
          ({ character, arcStages, relationships, povChapters, developmentScore }) => (
            <div
              key={character.name}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => setSelectedCharacter(character.name)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{character.name}</h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      character.role === 'protagonist'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : character.role === 'antagonist'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : character.role === 'supporting'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {character.role}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {developmentScore}% developed
                  </div>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mt-1">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${developmentScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {character.description}
              </p>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{arcStages}</div>
                  <div className="text-gray-500 dark:text-gray-400">Arc Stages</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{relationships}</div>
                  <div className="text-gray-500 dark:text-gray-400">Relationships</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{povChapters}</div>
                  <div className="text-gray-500 dark:text-gray-400">POV Chapters</div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Add Character Button */}
      {onAddCharacter && (
        <button
          onClick={onAddCharacter}
          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <Plus className="w-6 h-6 mx-auto mb-2" />
          Add New Character
        </button>
      )}
    </div>
  );

  const renderArcDevelopment = () => (
    <div className="space-y-6">
      {characters.map((character) => (
        <div
          key={character.name}
          className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleSection(`arc-${character.name}`)}
            className="w-full p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has(`arc-${character.name}`) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">{character.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {character.arcStages?.length || 0} arc stages • {character.arc}
                </p>
              </div>
            </div>
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>

          {expandedSections.has(`arc-${character.name}`) && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              {/* Character Arc Visualization */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Arc Progression</h4>
                <div className="relative">
                  {/* Arc Timeline */}
                  <div className="flex items-center justify-between mb-4">
                    {(character.arcStages || []).map((stage, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            stage.stage === 'climax'
                              ? 'bg-red-500 border-red-500'
                              : stage.stage === 'resolution'
                                ? 'bg-green-500 border-green-500'
                                : 'bg-blue-500 border-blue-500'
                          }`}
                        />
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                          Ch. {stage.chapter}
                        </div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white mt-1 text-center">
                          {stage.stage.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Arc Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Internal Conflict
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {character.internalConflict || character.conflict}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        External Conflict
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {character.externalConflict || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arc Stages Detail */}
              {character.arcStages?.map((stage, index) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {stage.stage.replace('_', ' ')} - Chapter {stage.chapter}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{stage.growth}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {stage.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Internal:{' '}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {stage.internalState}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Challenge:{' '}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {stage.externalChallenge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const _renderRelationships = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        {characters.map((character) => (
          <div
            key={character.name}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {character.name}'s Relationships
            </h3>

            {character.relationships?.length ? (
              <div className="space-y-2">
                {character.relationships.map((rel, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rel.type === 'ally'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : rel.type === 'enemy'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                              : rel.type === 'love_interest'
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {rel.type.replace('_', ' ')}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rel.withCharacter}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      Arc Influence: {rel.arcInfluence}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No relationships defined</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Chapter Headers */}
          <div className="flex mb-4">
            <div className="w-32 flex-shrink-0"></div>
            {Array.from({ length: totalChapters }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-600 px-1"
              >
                Ch {i + 1}
              </div>
            ))}
          </div>

          {/* Character Timeline Rows */}
          {characters.map((character) => (
            <div key={character.name} className="flex mb-2">
              <div className="w-32 flex-shrink-0 flex items-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {character.name}
                </div>
              </div>
              <div className="flex-1 flex relative">
                {Array.from({ length: totalChapters }, (_, i) => {
                  const chapterNum = i + 1;
                  const hasPOV = character.povChapters?.includes(chapterNum);
                  const hasArcStage = character.arcStages?.some(
                    (stage) => stage.chapter === chapterNum,
                  );

                  return (
                    <div
                      key={i}
                      className="flex-1 border-l border-gray-200 dark:border-gray-600 px-1 py-2 relative"
                    >
                      {hasPOV && (
                        <div
                          className="w-full h-4 bg-blue-500 rounded opacity-60 mb-1"
                          title="POV Chapter"
                        />
                      )}
                      {hasArcStage && (
                        <div
                          className="w-full h-2 bg-green-500 rounded opacity-80"
                          title="Arc Stage"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded opacity-60" />
              <span className="text-gray-600 dark:text-gray-400">POV Chapter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded opacity-80" />
              <span className="text-gray-600 dark:text-gray-400">Arc Stage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceProfiles = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        {characters.map((character) => (
          <div
            key={character.name}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {character.name}'s Voice Profile
            </h3>

            {character.voiceProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speech Characteristics
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vocabulary:</span>
                      <span className="font-medium capitalize">
                        {character.voiceProfile.vocabulary}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sentence Length:</span>
                      <span className="font-medium capitalize">
                        {character.voiceProfile.sentenceLength}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Emotional Expression:
                      </span>
                      <span className="font-medium capitalize">
                        {character.voiceProfile.emotionalExpression}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Distinctive Traits
                  </h4>
                  <div className="space-y-2">
                    {character.voiceProfile.speechPatterns?.map((pattern, index) => (
                      <div
                        key={index}
                        className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
                      >
                        {pattern}
                      </div>
                    ))}
                    {character.voiceProfile.distinctiveTraits?.map((trait, index) => (
                      <div
                        key={index}
                        className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded px-2 py-1"
                      >
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No voice profile defined</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Character Arc Manager
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualize and manage character development across your story
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {characters.length} characters • {totalChapters} chapters
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <div className="flex overflow-x-auto">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ViewMode)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeView === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={activeView === 'editor' || activeView === 'relationships' ? '' : 'p-6'}>
        {activeView === 'overview' && renderOverview()}
        {activeView === 'editor' && (
          <InteractiveArcEditor
            characters={characters}
            totalChapters={totalChapters}
            onCharacterUpdate={onCharacterUpdate}
          />
        )}
        {activeView === 'templates' && (
          <CharacterArcTemplates
            characters={characters}
            onApplyTemplate={(template) => {
              console.log('Applying template:', template);
              // Template application logic would go here
            }}
            onPreviewTemplate={(template) => {
              console.log('Previewing template:', template);
            }}
          />
        )}
        {activeView === 'arcs' && renderArcDevelopment()}
        {activeView === 'relationships' && (
          <RelationshipMapper
            characters={characters}
            totalChapters={totalChapters}
            onRelationshipUpdate={(sourceChar, targetChar, relationship) => {
              console.log('Relationship updated:', sourceChar, targetChar, relationship);
              // Relationship update logic would go here
            }}
          />
        )}
        {activeView === 'timeline' && renderTimeline()}
        {activeView === 'voice' && renderVoiceProfiles()}
      </div>
    </div>
  );
}
