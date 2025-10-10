// Story Structure Visualizer - Professional story health dashboard
// File: src/components/Planning/StoryStructureVisualizer.tsx

import { BarChart3, CheckCircle, BookOpen, Users, Zap, Target, Award } from 'lucide-react';
import React, { useMemo } from 'react';

import { useAppContext } from '@/context/AppContext';

interface StoryStructureVisualizerProps {
  className?: string;
  compact?: boolean;
}

interface ChapterAnalysis {
  id: string;
  title: string;
  wordCount: number;
  sceneCount: number;
  completionStatus: 'complete' | 'partial' | 'outline' | 'empty';
  pacing: 'fast' | 'medium' | 'slow';
  dialogueRatio: number;
  characterCount: number;
  beatSheetItems: number;
  beatSheetCompleted: number;
}

interface StoryHealth {
  overallScore: number;
  pacing: 'balanced' | 'too-fast' | 'too-slow';
  structure: 'strong' | 'needs-work' | 'incomplete';
  characterDevelopment: 'excellent' | 'good' | 'needs-attention';
  plotProgression: number;
}

const StoryStructureVisualizer: React.FC<StoryStructureVisualizerProps> = ({
  className = '',
  compact = false,
}) => {
  const { currentProject } = useAppContext();

  // Analyze current project structure
  const { chaptersAnalysis, storyHealth, beatSheetProgress } = useMemo(() => {
    if (!currentProject) {
      return {
        chaptersAnalysis: [],
        storyHealth: {
          overallScore: 0,
          pacing: 'balanced' as const,
          structure: 'incomplete' as const,
          characterDevelopment: 'needs-attention' as const,
          plotProgression: 0,
        },
        beatSheetProgress: 0,
      };
    }

    // Safely access chapters - handle different possible structures
    const chapters = currentProject.chapters || [];

    // Analyze chapters
    const chaptersAnalysis: ChapterAnalysis[] = chapters.map((chapter: any, index: number) => {
      // Safely access scenes with fallback
      const scenes = chapter.scenes || [];
      const totalWords = scenes.reduce((sum: number, scene: any) => {
        // Handle different possible content properties
        const content = scene.content || scene.text || '';
        return sum + (typeof content === 'string' ? content.length : 0);
      }, 0);
      const sceneCount = scenes.length;

      // Determine completion status
      let completionStatus: ChapterAnalysis['completionStatus'] = 'empty';
      if (totalWords > 1000) completionStatus = 'complete';
      else if (totalWords > 100) completionStatus = 'partial';
      else if (
        scenes.some((scene: any) => {
          const content = scene.content || scene.text || '';
          return content && content.trim().length > 0;
        })
      )
        completionStatus = 'outline';

      // Analyze pacing (words per scene)
      const wordsPerScene = sceneCount > 0 ? totalWords / sceneCount : 0;
      let pacing: ChapterAnalysis['pacing'] = 'medium';
      if (wordsPerScene > 800) pacing = 'slow';
      else if (wordsPerScene < 300) pacing = 'fast';

      // Estimate dialogue ratio (simplified)
      const allText = scenes.map((scene: any) => scene.content || scene.text || '').join(' ');
      const dialogueMatches = allText.match(/["']/g) || [];
      const dialogueRatio =
        allText.length > 0 ? (dialogueMatches.length / allText.length) * 100 : 0;

      // Count unique character mentions (simplified) - safely access characters
      const characters = currentProject.characters || [];
      const characterCount = characters.filter((char: any) => {
        const charName = char.name || char.title || '';
        return charName && allText.toLowerCase().includes(charName.toLowerCase());
      }).length;

      // Beat sheet analysis - safely access beatSheet
      const beatSheet = currentProject.beatSheet || [];
      const chapterBeats = beatSheet.filter((beat: any) => {
        // Handle different possible beat sheet structures
        return beat.chapter === chapter.id || beat.chapterId === chapter.id;
      });
      const beatSheetItems = chapterBeats.length;
      const beatSheetCompleted = chapterBeats.filter(
        (beat: any) => beat.completed || beat.isComplete,
      ).length;

      return {
        id: chapter.id || `chapter-${index}`,
        title: chapter.title || chapter.name || `Chapter ${index + 1}`,
        wordCount: totalWords,
        sceneCount,
        completionStatus,
        pacing,
        dialogueRatio: Math.min(dialogueRatio, 100),
        characterCount,
        beatSheetItems,
        beatSheetCompleted,
      };
    });

    // Calculate story health
    const _totalWords = chaptersAnalysis.reduce((sum, ch) => sum + ch.wordCount, 0);
    const completedChapters = chaptersAnalysis.filter(
      (ch) => ch.completionStatus === 'complete',
    ).length;
    const totalChapters = chaptersAnalysis.length;

    const plotProgression = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    // Overall pacing analysis
    const pacingDistribution = chaptersAnalysis.reduce(
      (acc, ch) => {
        acc[ch.pacing]++;
        return acc;
      },
      { fast: 0, medium: 0, slow: 0 },
    );

    let overallPacing: StoryHealth['pacing'] = 'balanced';
    if (pacingDistribution.fast > pacingDistribution.medium + pacingDistribution.slow) {
      overallPacing = 'too-fast';
    } else if (pacingDistribution.slow > pacingDistribution.medium + pacingDistribution.fast) {
      overallPacing = 'too-slow';
    }

    // Structure analysis
    let structure: StoryHealth['structure'] = 'incomplete';
    if (completedChapters >= 3) structure = 'strong';
    else if (completedChapters >= 1) structure = 'needs-work';

    // Character development analysis
    const avgCharacterCount =
      chaptersAnalysis.length > 0
        ? chaptersAnalysis.reduce((sum, ch) => sum + ch.characterCount, 0) / chaptersAnalysis.length
        : 0;

    let characterDevelopment: StoryHealth['characterDevelopment'] = 'needs-attention';
    if (avgCharacterCount >= 3) characterDevelopment = 'excellent';
    else if (avgCharacterCount >= 2) characterDevelopment = 'good';

    // Calculate overall score
    const overallScore = Math.round(
      plotProgression * 0.4 +
        (structure === 'strong' ? 30 : structure === 'needs-work' ? 15 : 0) +
        (characterDevelopment === 'excellent' ? 20 : characterDevelopment === 'good' ? 10 : 0) +
        (overallPacing === 'balanced' ? 10 : 5),
    );

    // Beat sheet progress - safely access beatSheet
    const totalBeats = (currentProject.beatSheet || []).length;
    const completedBeats = (currentProject.beatSheet || []).filter(
      (beat: any) => beat.completed || beat.isComplete,
    ).length;
    const beatProgress = totalBeats > 0 ? (completedBeats / totalBeats) * 100 : 0;

    return {
      chaptersAnalysis,
      storyHealth: {
        overallScore,
        pacing: overallPacing,
        structure,
        characterDevelopment,
        plotProgression,
      },
      beatSheetProgress: beatProgress,
    };
  }, [currentProject]);

  const getCompletionColor = (status: ChapterAnalysis['completionStatus']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'outline':
        return 'bg-blue-500';
      case 'empty':
        return 'bg-gray-300';
    }
  };

  const getPacingColor = (pacing: ChapterAnalysis['pacing']) => {
    switch (pacing) {
      case 'fast':
        return 'text-red-600';
      case 'medium':
        return 'text-green-600';
      case 'slow':
        return 'text-blue-600';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle empty project state
  if (!currentProject) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create or select a project to view story health analytics.
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact version for sidebar/smaller spaces
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={16} />
            Story Health
          </h3>
          <div className={`text-lg font-bold ${getHealthColor(storyHealth.overallScore)}`}>
            {storyHealth.overallScore}%
          </div>
        </div>

        {/* Chapter Progress Mini-bars */}
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-600 dark:text-gray-400">Chapter Progress</div>
          <div className="grid grid-cols-5 gap-1">
            {chaptersAnalysis.slice(0, 5).map((chapter, index) => (
              <div
                key={chapter.id}
                className="h-8 rounded flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700"
                title={`${chapter.title}: ${chapter.wordCount} words`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${getCompletionColor(chapter.completionStatus)}`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{index + 1}</span>
              </div>
            ))}
            {/* Show placeholders if fewer than 5 chapters */}
            {Array.from({ length: Math.max(0, 5 - chaptersAnalysis.length) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="h-8 rounded flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700"
              >
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {chaptersAnalysis.length + index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Beat Sheet Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Beat Sheet</span>
            <span className="font-medium">{Math.round(beatSheetProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${beatSheetProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full version for main dashboard
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-purple-600" />
          Story Structure Visualizer
        </h2>
        <div className="flex items-center gap-2">
          <div className={`text-2xl font-bold ${getHealthColor(storyHealth.overallScore)}`}>
            {storyHealth.overallScore}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Story Health</div>
        </div>
      </div>

      {/* Story Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-purple-600" size={16} />
            <h3 className="font-medium text-gray-900 dark:text-white">Plot Progress</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(storyHealth.plotProgression)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {chaptersAnalysis.filter((ch) => ch.completionStatus === 'complete').length} of{' '}
            {chaptersAnalysis.length} chapters
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-green-600" size={16} />
            <h3 className="font-medium text-gray-900 dark:text-white">Pacing</h3>
          </div>
          <div className="text-lg font-bold text-green-600 capitalize">
            {storyHealth.pacing.replace('-', ' ')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Story rhythm analysis</div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" size={16} />
            <h3 className="font-medium text-gray-900 dark:text-white">Characters</h3>
          </div>
          <div className="text-lg font-bold text-blue-600 capitalize">
            {storyHealth.characterDevelopment.replace('-', ' ')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Development quality</div>
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-orange-600" size={16} />
            <h3 className="font-medium text-gray-900 dark:text-white">Structure</h3>
          </div>
          <div className="text-lg font-bold text-orange-600 capitalize">
            {storyHealth.structure.replace('-', ' ')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overall organization</div>
        </div>
      </div>

      {/* Chapter Breakdown */}
      {chaptersAnalysis.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={18} />
            Chapter Analysis
          </h3>

          <div className="space-y-3">
            {chaptersAnalysis.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Chapter Number & Status */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${getCompletionColor(chapter.completionStatus)}`}
                  />
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {chapter.title || `Chapter ${index + 1}`}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{chapter.wordCount.toLocaleString()} words</span>
                    <span>{chapter.sceneCount} scenes</span>
                    <span className={getPacingColor(chapter.pacing)}>{chapter.pacing} pacing</span>
                  </div>
                </div>

                {/* Chapter Metrics */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Dialogue</div>
                    <div className="font-medium">{Math.round(chapter.dialogueRatio)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Characters</div>
                    <div className="font-medium">{chapter.characterCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400">Beats</div>
                    <div className="font-medium">
                      {chapter.beatSheetCompleted}/{chapter.beatSheetItems}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-20">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getCompletionColor(chapter.completionStatus)}`}
                      style={{
                        width: `${
                          chapter.completionStatus === 'complete'
                            ? 100
                            : chapter.completionStatus === 'partial'
                              ? 60
                              : chapter.completionStatus === 'outline'
                                ? 30
                                : 10
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beat Sheet Progress */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle size={18} />
          Beat Sheet Progress
        </h3>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Overall Completion</span>
            <span className="font-medium text-purple-600">{Math.round(beatSheetProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${beatSheetProgress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Story structure roadmap completion
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Award className="text-blue-600" size={16} />
          Improvement Suggestions
        </h3>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {chaptersAnalysis.length === 0 && (
            <div>• Create your first chapter to start tracking your story's health</div>
          )}
          {storyHealth.plotProgression < 50 && chaptersAnalysis.length > 0 && (
            <div>• Focus on completing more chapters to strengthen your story foundation</div>
          )}
          {storyHealth.pacing === 'too-fast' && (
            <div>• Consider adding more descriptive passages to slow down the pacing</div>
          )}
          {storyHealth.pacing === 'too-slow' && (
            <div>• Try adding more dialogue and action to increase story momentum</div>
          )}
          {storyHealth.characterDevelopment === 'needs-attention' && (
            <div>• Develop character interactions and dialogue in your scenes</div>
          )}
          {beatSheetProgress < 75 && (
            <div>• Complete more beat sheet items to improve story structure planning</div>
          )}
          {storyHealth.overallScore >= 80 && (
            <div className="text-green-600">
              🎉 Excellent work! Your story structure is very strong
            </div>
          )}
          {storyHealth.overallScore < 40 && chaptersAnalysis.length > 0 && (
            <div>
              • Consider using the Beat Sheet and Character Manager to strengthen your foundation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryStructureVisualizer;
