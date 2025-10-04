// src/components/Planning/CharacterArcTemplates.tsx - Library of character arc templates and presets
import { BookOpen, Crown, Heart, Shield, Sword, Plus, Download, Eye } from 'lucide-react';
import React, { useState } from 'react';

import type { GeneratedCharacter, CharacterArcStage } from '../../services/storyArchitectService';

interface ArcTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'classic' | 'modern' | 'romance' | 'action' | 'redemption' | 'tragedy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalChapters: number;
  arcStages: CharacterArcStage[];
  sampleCharacter: {
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    internalConflict: string;
    externalConflict: string;
    arc: string;
  };
}

interface CharacterArcTemplatesProps {
  onApplyTemplate?: (template: ArcTemplate, character?: GeneratedCharacter) => void;
  onPreviewTemplate?: (template: ArcTemplate) => void;
  characters?: GeneratedCharacter[];
  className?: string;
}

const arcTemplates: ArcTemplate[] = [
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    description:
      'The classic monomyth structure following a protagonist from ordinary world to transformation',
    icon: Crown,
    category: 'classic',
    difficulty: 'beginner',
    totalChapters: 20,
    arcStages: [
      {
        stage: 'introduction',
        chapter: 1,
        description: 'Character in their familiar environment before the story begins',
        growth: 'establishment',
        internalState: 'comfortable',
        externalChallenge: 'none',
      },
      {
        stage: 'inciting_incident',
        chapter: 3,
        description: 'Character is presented with a problem or challenge',
        growth: 'awakening',
        internalState: 'curious',
        externalChallenge: 'opportunity',
      },
      {
        stage: 'first_plot_point',
        chapter: 4,
        description: 'Character hesitates or refuses the adventure',
        growth: 'resistance',
        internalState: 'fearful',
        externalChallenge: 'doubt',
      },
      {
        stage: 'first_plot_point',
        chapter: 5,
        description: 'Character encounters a wise figure who gives advice',
        growth: 'guidance',
        internalState: 'encouraged',
        externalChallenge: 'learning',
      },
      {
        stage: 'first_plot_point',
        chapter: 7,
        description: 'Character commits to the adventure and enters a new world',
        growth: 'commitment',
        internalState: 'determined',
        externalChallenge: 'transition',
      },
      {
        stage: 'midpoint',
        chapter: 10,
        description: 'Character faces challenges and makes allies and enemies',
        growth: 'development',
        internalState: 'tested',
        externalChallenge: 'conflicts',
      },
      {
        stage: 'crisis',
        chapter: 15,
        description: 'Character faces their greatest fear or most difficult challenge',
        growth: 'crisis',
        internalState: 'desperate',
        externalChallenge: 'life_threat',
      },
      {
        stage: 'climax',
        chapter: 16,
        description: 'Character survives and gains something from the experience',
        growth: 'victory',
        internalState: 'triumphant',
        externalChallenge: 'achievement',
      },
      {
        stage: 'climax',
        chapter: 18,
        description: 'Character begins the journey back to ordinary world',
        growth: 'return',
        internalState: 'changed',
        externalChallenge: 'consequences',
      },
      {
        stage: 'climax',
        chapter: 19,
        description: 'Character faces a final test and is transformed',
        growth: 'transformation',
        internalState: 'reborn',
        externalChallenge: 'final_test',
      },
      {
        stage: 'resolution',
        chapter: 20,
        description: 'Character returns home with wisdom or power to help others',
        growth: 'mastery',
        internalState: 'wise',
        externalChallenge: 'sharing',
      },
    ],
    sampleCharacter: {
      role: 'protagonist',
      internalConflict: 'Lack of self-confidence and fear of taking risks',
      externalConflict: 'Must save their community from a growing threat',
      arc: 'transformation from reluctant hero to confident leader',
    },
  },
  {
    id: 'redemption-arc',
    name: 'Redemption Arc',
    description: 'A character seeking to atone for past mistakes and find redemption',
    icon: Shield,
    category: 'redemption',
    difficulty: 'intermediate',
    totalChapters: 18,
    arcStages: [
      {
        stage: 'introduction',
        chapter: 1,
        description: 'Character established with morally questionable background',
        growth: 'introduction',
        internalState: 'guilt_ridden',
        externalChallenge: 'reputation',
      },
      {
        stage: 'inciting_incident',
        chapter: 3,
        description: 'Event that triggers desire for change and redemption',
        growth: 'awakening',
        internalState: 'regretful',
        externalChallenge: 'consequences',
      },
      {
        stage: 'inciting_incident',
        chapter: 6,
        description: 'Character makes initial attempts to do good but struggles',
        growth: 'effort',
        internalState: 'trying',
        externalChallenge: 'skepticism',
      },
      {
        stage: 'first_plot_point',
        chapter: 9,
        description: 'Old habits or external forces cause character to falter',
        growth: 'regression',
        internalState: 'disappointed',
        externalChallenge: 'relapse',
      },
      {
        stage: 'midpoint',
        chapter: 11,
        description: 'Character finds new resolve and deeper understanding',
        growth: 'renewal',
        internalState: 'determined',
        externalChallenge: 'proving_worth',
      },
      {
        stage: 'crisis',
        chapter: 15,
        description: 'Character makes significant personal sacrifice for others',
        growth: 'selflessness',
        internalState: 'noble',
        externalChallenge: 'high_stakes',
      },
      {
        stage: 'resolution',
        chapter: 17,
        description: "Others begin to accept the character's transformation",
        growth: 'recognition',
        internalState: 'peaceful',
        externalChallenge: 'trust_building',
      },
      {
        stage: 'resolution',
        chapter: 18,
        description: 'Character finds their new role in the world',
        growth: 'fulfillment',
        internalState: 'purposeful',
        externalChallenge: 'leadership',
      },
    ],
    sampleCharacter: {
      role: 'protagonist',
      internalConflict: 'Guilt over past actions and self-worth issues',
      externalConflict: "Must overcome others' distrust while facing old enemies",
      arc: 'transformation from villain to hero through acts of selflessness',
    },
  },
  {
    id: 'romance-arc',
    name: 'Romance Arc',
    description: 'Character development through romantic relationship and emotional growth',
    icon: Heart,
    category: 'romance',
    difficulty: 'beginner',
    totalChapters: 16,
    arcStages: [
      {
        stage: 'introduction',
        chapter: 2,
        description: 'Character meets love interest in memorable way',
        growth: 'attraction',
        internalState: 'intrigued',
        externalChallenge: 'first_impression',
      },
      {
        stage: 'inciting_incident',
        chapter: 4,
        description: 'Characters spend time together and build connection',
        growth: 'bonding',
        internalState: 'interested',
        externalChallenge: 'compatibility',
      },
      {
        stage: 'first_plot_point',
        chapter: 7,
        description: 'Character realizes deeper feelings are developing',
        growth: 'emotional_awakening',
        internalState: 'confused',
        externalChallenge: 'vulnerability',
      },
      {
        stage: 'midpoint',
        chapter: 10,
        description: 'External or internal obstacle threatens the relationship',
        growth: 'testing',
        internalState: 'conflicted',
        externalChallenge: 'relationship_threat',
      },
      {
        stage: 'crisis',
        chapter: 12,
        description: 'Relationship seems impossible due to misunderstanding or obstacle',
        growth: 'separation',
        internalState: 'heartbroken',
        externalChallenge: 'loss',
      },
      {
        stage: 'crisis',
        chapter: 14,
        description: 'Character understands what they must do for love',
        growth: 'clarity',
        internalState: 'resolved',
        externalChallenge: 'action_needed',
      },
      {
        stage: 'climax',
        chapter: 15,
        description: 'Character makes significant effort to win back love',
        growth: 'courage',
        internalState: 'brave',
        externalChallenge: 'risk_taking',
      },
      {
        stage: 'resolution',
        chapter: 16,
        description: 'Characters unite and commit to their future together',
        growth: 'fulfillment',
        internalState: 'complete',
        externalChallenge: 'new_beginning',
      },
    ],
    sampleCharacter: {
      role: 'protagonist',
      internalConflict: 'Fear of commitment and vulnerability in relationships',
      externalConflict: 'External circumstances keeping lovers apart',
      arc: 'learning to open heart and fight for love despite obstacles',
    },
  },
  {
    id: 'fall-from-grace',
    name: 'Fall from Grace',
    description: "Character's descent from a position of power or virtue to downfall",
    icon: Sword,
    category: 'tragedy',
    difficulty: 'advanced',
    totalChapters: 18,
    arcStages: [
      {
        stage: 'introduction',
        chapter: 1,
        description: 'Character at height of power, success, or moral standing',
        growth: 'establishment',
        internalState: 'confident',
        externalChallenge: 'maintaining_status',
      },
      {
        stage: 'inciting_incident',
        chapter: 3,
        description: "Character's weakness or vice is revealed",
        growth: 'flaw_introduction',
        internalState: 'prideful',
        externalChallenge: 'temptation',
      },
      {
        stage: 'first_plot_point',
        chapter: 5,
        description: 'Character makes initial poor decision due to their flaw',
        growth: 'first_fall',
        internalState: 'rationalizing',
        externalChallenge: 'consequences',
      },
      {
        stage: 'crisis',
        chapter: 8,
        description: "Character's mistakes compound and situation worsens",
        growth: 'spiral',
        internalState: 'desperate',
        externalChallenge: 'mounting_pressure',
      },
      {
        stage: 'midpoint',
        chapter: 12,
        description: "Character crosses line from which there's no easy return",
        growth: 'corruption',
        internalState: 'hardened',
        externalChallenge: 'moral_compromise',
      },
      {
        stage: 'crisis',
        chapter: 14,
        description: 'Friends and supporters begin to abandon character',
        growth: 'isolation',
        internalState: 'alone',
        externalChallenge: 'betrayal',
      },
      {
        stage: 'climax',
        chapter: 17,
        description: 'Character loses everything they once held dear',
        growth: 'destruction',
        internalState: 'broken',
        externalChallenge: 'total_loss',
      },
      {
        stage: 'resolution',
        chapter: 18,
        description: 'Character faces consequences of their choices',
        growth: 'reckoning',
        internalState: 'regretful',
        externalChallenge: 'judgment',
      },
    ],
    sampleCharacter: {
      role: 'protagonist',
      internalConflict: 'Hubris and inability to admit mistakes or weakness',
      externalConflict: "External pressures that test character's moral boundaries",
      arc: 'descent from respected leader to cautionary tale',
    },
  },
];

export default function CharacterArcTemplates({
  onApplyTemplate,
  onPreviewTemplate,
  characters: _characters = [],
  className = '',
}: CharacterArcTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [previewingTemplate, setPreviewingTemplate] = useState<ArcTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'classic', name: 'Classic' },
    { id: 'modern', name: 'Modern' },
    { id: 'romance', name: 'Romance' },
    { id: 'action', name: 'Action' },
    { id: 'redemption', name: 'Redemption' },
    { id: 'tragedy', name: 'Tragedy' },
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
  ];

  const filteredTemplates = arcTemplates.filter((template) => {
    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
    const difficultyMatch =
      selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const handlePreview = (template: ArcTemplate) => {
    setPreviewingTemplate(template);
    onPreviewTemplate?.(template);
  };

  const handleApply = (template: ArcTemplate) => {
    onApplyTemplate?.(template);
    setPreviewingTemplate(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
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
              Character Arc Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose from proven character arc patterns and customize for your story
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTemplates.length} templates available
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Difficulty:
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}
                          >
                            {template.difficulty}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {template.totalChapters} chapters
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Arc: </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {template.sampleCharacter.arc}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Stages: </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {template.arcStages.length} key moments
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleApply(template)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No templates match the selected filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previewingTemplate.name} - Preview
                </h3>
                <button
                  onClick={() => setPreviewingTemplate(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Template Overview
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Description:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {previewingTemplate.description}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Character Arc:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {previewingTemplate.sampleCharacter.arc}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Sample Character Conflicts
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Internal Conflict:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {previewingTemplate.sampleCharacter.internalConflict}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        External Conflict:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {previewingTemplate.sampleCharacter.externalConflict}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Arc Stages ({previewingTemplate.arcStages.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewingTemplate.arcStages.map((stage, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                          {stage.stage.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ch. {stage.chapter}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {stage.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{stage.growth}</span>
                        <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                          {stage.internalState}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => handleApply(previewingTemplate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Apply Template
                </button>
                <button
                  onClick={() => setPreviewingTemplate(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
