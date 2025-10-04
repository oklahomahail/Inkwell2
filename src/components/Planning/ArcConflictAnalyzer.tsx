// src/components/Planning/ArcConflictAnalyzer.tsx - Intelligent character arc conflict analysis and recommendations
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import type { GeneratedCharacter } from '../../services/storyArchitectService';

interface ConflictAnalysis {
  id: string;
  type: 'pacing' | 'development' | 'relationship' | 'structure' | 'balance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedCharacters: string[];
  chapters: number[];
  suggestions: string[];
  impact: 'story_flow' | 'character_growth' | 'reader_engagement' | 'narrative_balance';
}

interface DevelopmentMetrics {
  character: string;
  totalGrowthMoments: number;
  arcStageDistribution: { [stage: string]: number };
  povBalance: number;
  relationshipComplexity: number;
  developmentScore: number;
  pacingScore: number;
}

interface ArcConflictAnalyzerProps {
  characters: GeneratedCharacter[];
  totalChapters: number;
  onApplySuggestion?: (conflictId: string, suggestion: string) => void;
  className?: string;
}

export default function ArcConflictAnalyzer({
  characters = [],
  totalChapters = 20,
  onApplySuggestion,
  className = '',
}: ArcConflictAnalyzerProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedAnalysis, setExpandedAnalysis] = useState<Set<string>>(new Set());

  // Calculate comprehensive development metrics for each character
  const developmentMetrics = useMemo(() => {
    return characters.map((character): DevelopmentMetrics => {
      const arcStages = character.arcStages || [];
      const relationships = character.relationships || [];
      const povChapters = character.povChapters || [];
      const growthMoments = character.growthMoments || [];

      // Arc stage distribution analysis
      const stageDistribution: { [stage: string]: number } = {};
      arcStages.forEach((stage) => {
        stageDistribution[stage.stage] = (stageDistribution[stage.stage] || 0) + 1;
      });

      // POV balance calculation
      const povBalance = povChapters.length / totalChapters;

      // Relationship complexity score
      const relationshipComplexity = relationships.reduce((score, rel) => {
        const typeWeight =
          {
            ally: 1,
            enemy: 1.5,
            love_interest: 1.2,
            mentor: 1,
            family: 1.1,
          }[rel.type] || 1;

        const influenceWeight =
          {
            major: 3,
            moderate: 2,
            minor: 1,
          }[rel.arcInfluence] || 1;

        return score + typeWeight * influenceWeight;
      }, 0);

      // Development score calculation
      const developmentScore = Math.min(
        100,
        arcStages.length * 10 +
          relationships.length * 5 +
          growthMoments.length * 8 +
          (character.voiceProfile ? 20 : 0) +
          (character.internalConflict && character.externalConflict ? 15 : 0),
      );

      // Pacing score based on arc stage distribution
      const idealChapterGaps = totalChapters / Math.max(arcStages.length, 1);
      const actualGaps = arcStages
        .map((stage, index) => {
          const nextStage = arcStages[index + 1];
          return nextStage ? nextStage.chapter - stage.chapter : 0;
        })
        .filter((gap) => gap > 0);

      const avgGap =
        actualGaps.length > 0
          ? actualGaps.reduce((a, b) => a + b, 0) / actualGaps.length
          : idealChapterGaps;
      const pacingScore = Math.max(0, 100 - Math.abs(avgGap - idealChapterGaps) * 10);

      return {
        character: character.name,
        totalGrowthMoments: growthMoments.length,
        arcStageDistribution: stageDistribution,
        povBalance,
        relationshipComplexity,
        developmentScore,
        pacingScore,
      };
    });
  }, [characters, totalChapters]);

  // Perform comprehensive conflict analysis
  const conflictAnalyses = useMemo(() => {
    const conflicts: ConflictAnalysis[] = [];
    const metrics = developmentMetrics;

    // 1. Pacing Conflicts
    characters.forEach((character, charIndex) => {
      const arcStages = character.arcStages || [];
      if (arcStages.length > 1) {
        // Check for stages too close together
        for (let i = 0; i < arcStages.length - 1; i++) {
          const current = arcStages[i];
          const next = arcStages[i + 1];
          if (next.chapter - current.chapter < 2) {
            conflicts.push({
              id: `pacing-tight-${character.name}-${i}`,
              type: 'pacing',
              severity: 'medium',
              title: 'Arc Stages Too Close',
              description: `${character.name}'s "${current.stage}" and "${next.stage}" stages are only ${next.chapter - current.chapter} chapter(s) apart, which may rush character development.`,
              affectedCharacters: [character.name],
              chapters: [current.chapter, next.chapter],
              suggestions: [
                `Move "${next.stage}" to chapter ${next.chapter + 2} or later`,
                `Add transitional development between the stages`,
                `Consider combining the stages if they serve similar purposes`,
              ],
              impact: 'character_growth',
            });
          }
        }

        // Check for large gaps
        for (let i = 0; i < arcStages.length - 1; i++) {
          const current = arcStages[i];
          const next = arcStages[i + 1];
          if (next.chapter - current.chapter > 6) {
            conflicts.push({
              id: `pacing-gap-${character.name}-${i}`,
              type: 'pacing',
              severity: 'low',
              title: 'Large Gap in Character Development',
              description: `${character.name} has a ${next.chapter - current.chapter}-chapter gap between "${current.stage}" and "${next.stage}", which may cause development to feel disconnected.`,
              affectedCharacters: [character.name],
              chapters: [current.chapter, next.chapter],
              suggestions: [
                'Add intermediate development moments or smaller arc stages',
                'Include character reflection or growth scenes in the gap',
                'Consider subplot development during this period',
              ],
              impact: 'story_flow',
            });
          }
        }
      }
    });

    // 2. Development Balance Conflicts
    const avgDevelopmentScore =
      metrics.reduce((sum, m) => sum + m.developmentScore, 0) / metrics.length;
    metrics.forEach((metric) => {
      if (metric.developmentScore < avgDevelopmentScore * 0.7) {
        conflicts.push({
          id: `development-low-${metric.character}`,
          type: 'development',
          severity: metric.developmentScore < 30 ? 'high' : 'medium',
          title: 'Underdeveloped Character Arc',
          description: `${metric.character} has a development score of ${metric.developmentScore}%, significantly below the story average of ${avgDevelopmentScore.toFixed(1)}%.`,
          affectedCharacters: [metric.character],
          chapters: [],
          suggestions: [
            'Add more arc stages to show character growth',
            'Develop additional relationships and conflicts',
            'Include more growth moments and challenges',
            'Create a more detailed voice profile',
          ],
          impact: 'character_growth',
        });
      }
    });

    // 3. POV Balance Conflicts
    const povCharacters = characters.filter((char) => (char.povChapters?.length || 0) > 0);
    if (povCharacters.length > 1) {
      const povBalances = povCharacters.map((char) => ({
        character: char.name,
        balance: (char.povChapters?.length || 0) / totalChapters,
        chapters: char.povChapters?.length || 0,
      }));

      const avgPovBalance =
        povBalances.reduce((sum, pov) => sum + pov.balance, 0) / povBalances.length;
      povBalances.forEach((pov) => {
        if (pov.balance < avgPovBalance * 0.5 && pov.chapters > 0) {
          conflicts.push({
            id: `pov-imbalance-${pov.character}`,
            type: 'balance',
            severity: 'medium',
            title: 'POV Chapter Imbalance',
            description: `${pov.character} has only ${pov.chapters} POV chapters (${(pov.balance * 100).toFixed(1)}%) compared to the average of ${(avgPovBalance * 100).toFixed(1)}%.`,
            affectedCharacters: [pov.character],
            chapters: [],
            suggestions: [
              `Add ${Math.ceil((avgPovBalance - pov.balance) * totalChapters)} more POV chapters for ${pov.character}`,
              'Consider if this character needs POV representation for their arc',
              'Balance POV distribution more evenly across key characters',
            ],
            impact: 'reader_engagement',
          });
        }
      });
    }

    // 4. Relationship Conflicts
    const relationshipMatrix: { [key: string]: { [key: string]: string } } = {};
    characters.forEach((character) => {
      character.relationships?.forEach((rel) => {
        if (!relationshipMatrix[character.name]) relationshipMatrix[character.name] = {};
        if (!relationshipMatrix[rel.withCharacter]) relationshipMatrix[rel.withCharacter] = {};

        relationshipMatrix[character.name][rel.withCharacter] = rel.type;

        // Check for reciprocal relationships
        const reciprocalChar = characters.find((c) => c.name === rel.withCharacter);
        const reciprocalRel = reciprocalChar?.relationships?.find(
          (r) => r.withCharacter === character.name,
        );

        if (reciprocalRel && reciprocalRel.type !== rel.type) {
          conflicts.push({
            id: `relationship-mismatch-${character.name}-${rel.withCharacter}`,
            type: 'relationship',
            severity: 'high',
            title: 'Conflicting Relationship Definitions',
            description: `${character.name} views ${rel.withCharacter} as "${rel.type}" but ${rel.withCharacter} views ${character.name} as "${reciprocalRel.type}".`,
            affectedCharacters: [character.name, rel.withCharacter],
            chapters: [],
            suggestions: [
              'Align relationship definitions between characters',
              'Create intentional relationship tension if this is deliberate',
              'Add character development to resolve relationship conflicts',
            ],
            impact: 'narrative_balance',
          });
        }
      });
    });

    // 5. Structural Conflicts
    const protagonists = characters.filter((char) => char.role === 'protagonist');
    const antagonists = characters.filter((char) => char.role === 'antagonist');

    if (protagonists.length === 0) {
      conflicts.push({
        id: 'structure-no-protagonist',
        type: 'structure',
        severity: 'critical',
        title: 'No Protagonist Identified',
        description:
          'Your story has no characters marked as protagonists, which may confuse readers about the main character(s).',
        affectedCharacters: [],
        chapters: [],
        suggestions: [
          'Designate at least one character as the protagonist',
          'Consider if you have an ensemble cast with multiple protagonists',
          'Review character roles and adjust accordingly',
        ],
        impact: 'reader_engagement',
      });
    }

    if (antagonists.length === 0 && characters.length > 2) {
      conflicts.push({
        id: 'structure-no-antagonist',
        type: 'structure',
        severity: 'medium',
        title: 'No Clear Antagonist',
        description:
          'Your story may benefit from a clear antagonistic force to create conflict and drive character development.',
        affectedCharacters: [],
        chapters: [],
        suggestions: [
          'Consider designating one character as the primary antagonist',
          'Create internal conflicts that serve as antagonistic forces',
          'Develop environmental or situational antagonists',
        ],
        impact: 'story_flow',
      });
    }

    return conflicts;
  }, [characters, totalChapters, developmentMetrics]);

  // Filter conflicts based on selected filters
  const filteredConflicts = useMemo(() => {
    return conflictAnalyses.filter((conflict) => {
      const typeMatch = selectedFilter === 'all' || conflict.type === selectedFilter;
      const severityMatch = selectedSeverity === 'all' || conflict.severity === selectedSeverity;
      return typeMatch && severityMatch;
    });
  }, [conflictAnalyses, selectedFilter, selectedSeverity]);

  const toggleExpanded = (conflictId: string) => {
    const newExpanded = new Set(expandedAnalysis);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedAnalysis(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const conflictTypes = [
    { id: 'all', name: 'All Issues', icon: BarChart3 },
    { id: 'pacing', name: 'Pacing', icon: Clock },
    { id: 'development', name: 'Development', icon: TrendingUp },
    { id: 'relationship', name: 'Relationships', icon: Users },
    { id: 'structure', name: 'Structure', icon: Target },
    { id: 'balance', name: 'Balance', icon: BarChart3 },
  ];

  const severityLevels = [
    { id: 'all', name: 'All Severities' },
    { id: 'critical', name: 'Critical' },
    { id: 'high', name: 'High' },
    { id: 'medium', name: 'Medium' },
    { id: 'low', name: 'Low' },
  ];

  const conflictStats = useMemo(() => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0, total: conflictAnalyses.length };
    conflictAnalyses.forEach((conflict) => {
      stats[conflict.severity as keyof typeof stats]++;
    });
    return stats;
  }, [conflictAnalyses]);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Arc Conflict Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intelligent analysis of character development conflicts and recommendations
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredConflicts.length} of {conflictAnalyses.length} issues shown
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {conflictStats.critical}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {conflictStats.high}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {conflictStats.medium}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {conflictStats.low}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Low</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {conflictStats.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Issues</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {conflictTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Severity:
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {severityLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredConflicts.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredConflicts.map((conflict) => (
              <div key={conflict.id} className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpanded(conflict.id)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1 rounded ${getSeverityColor(conflict.severity)}`}>
                      {getSeverityIcon(conflict.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {conflict.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(conflict.severity)}`}
                        >
                          {conflict.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {conflict.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {conflict.affectedCharacters.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {conflict.affectedCharacters.join(', ')}
                          </div>
                        )}
                        {conflict.chapters.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Ch. {conflict.chapters.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedAnalysis.has(conflict.id) ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {expandedAnalysis.has(conflict.id) && (
                  <div className="mt-4 pl-10">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white">Suggestions</h4>
                      </div>
                      <ul className="space-y-2">
                        {conflict.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {suggestion}
                              </span>
                              {onApplySuggestion && (
                                <button
                                  onClick={() => onApplySuggestion(conflict.id, suggestion)}
                                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-medium mb-2">No Issues Found</h3>
            <p className="text-sm">
              {conflictAnalyses.length === 0
                ? 'Your character arcs look well-balanced!'
                : 'No issues match the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
