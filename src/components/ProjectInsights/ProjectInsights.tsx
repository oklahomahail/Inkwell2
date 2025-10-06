// src/components/ProjectInsights/ProjectInsights.tsx
import {
  TrendingUp,
  Clock,
  FileText,
  Target,
  Zap,
  Award,
  BarChart3,
  Star,
  BookOpen,
} from 'lucide-react';
import React, { useMemo } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useProjectMetadata, formatTimeSpent } from '@/hooks/useProjectMetadata';

interface ProjectInsightsProps {
  compact?: boolean;
}

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ compact = false }) => {
  const { currentProject: _currentProject } = useAppContext();
  const { getUsageStats, getProjectMetadata, getAllTags, getFavoriteProjectIds } =
    useProjectMetadata();

  const insights = useMemo(() => {
    const usageStats = getUsageStats();
    const favoriteIds = getFavoriteProjectIds();
    const allTags = getAllTags();

    // Calculate writing streaks and patterns
    const now = Date.now();
    const weekMs = 7 * dayMs;

    // Get projects with recent activity (last 30 days)
    const recentProjects = state.projects.filter((project) => {
      const daysSinceUpdate = (now - project.updatedAt) / dayMs;
      return daysSinceUpdate <= 30;
    });

    // Calculate word count growth over time
    const totalWords = state.projects.reduce((sum, project) => {
      return sum + (project.content?.split(' ').filter((w) => w.length > 0).length || 0);
    }, 0);

    // Estimate reading time (average 200 words per minute)
    const estimatedReadingTime = Math.ceil(totalWords / 200);

    // Calculate average project completion (mock data for now)
    const avgCompletion =
      state.projects.length > 0
        ? Math.round(
            (state.projects.filter((p) => p.content && p.content.length > 1000).length /
              state.projects.length) *
              100,
          )
        : 0;

    // Find most worked project
    const projectsWithTime = state.projects
      .map((project) => ({
        project,
        metadata: getProjectMetadata(project.id),
        wordCount: project.content?.split(' ').filter((w) => w.length > 0).length || 0,
      }))
      .sort((a, b) => b.metadata.totalTimeSpent - a.metadata.totalTimeSpent);

    const mostWorkedProject = projectsWithTime[0];

    // Writing velocity (words per hour of writing)
    const totalWritingTime = usageStats.totalTimeSpent; // in minutes
    const wordsPerHour =
      totalWritingTime > 0 ? Math.round((totalWords / totalWritingTime) * 60) : 0;

    // Genre distribution
    const genreCount: Record<string, number> = {};
    state.projects.forEach((project) => {
      const genre = (project as any).genre || 'Unspecified';
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    const topGenre = Object.entries(genreCount).sort(([, a], [, b]) => b - a)[0];

    return {
      totalProjects: state.projects.length,
      totalWords,
      estimatedReadingTime,
      avgCompletion,
      recentProjectsCount: recentProjects.length,
      favoriteCount: favoriteIds.length,
      totalTags: allTags.length,
      totalWritingTime: usageStats.totalTimeSpent,
      averageTimePerProject: usageStats.averageTimePerProject,
      totalSessions: usageStats.totalOpens,
      mostWorkedProject,
      wordsPerHour,
      topGenre: topGenre ? { genre: topGenre[0], count: topGenre[1] } : null,
    };
  }, [state.projects, getUsageStats, getProjectMetadata, getAllTags, getFavoriteProjectIds]);

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {insights.totalProjects}
          </div>
          <div className="text-xs text-slate-500">Projects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {(insights.totalWords / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {formatTimeSpent(insights.totalWritingTime)}
          </div>
          <div className="text-xs text-slate-500">Writing Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {insights.favoriteCount}
          </div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-insights">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Total Projects</h3>
                <p className="text-xs text-slate-500">Your writing portfolio</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {insights.totalProjects}
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              {insights.favoriteCount} favorites
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Total Words</h3>
                <p className="text-xs text-slate-500">Across all projects</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {insights.totalWords.toLocaleString()}
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 mr-1" />~{insights.estimatedReadingTime}min read
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Writing Time</h3>
                <p className="text-xs text-slate-500">Total time spent</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {formatTimeSpent(insights.totalWritingTime)}
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              {insights.totalSessions} sessions
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Progress</h3>
                <p className="text-xs text-slate-500">Average completion</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {insights.avgCompletion}%
            </div>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <Award className="w-4 h-4 mr-1" />
              {insights.recentProjectsCount} active
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Writing Velocity */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Writing Velocity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Words per hour</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {insights.wordsPerHour}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Avg. time per project
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatTimeSpent(insights.averageTimePerProject)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total tags used</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {insights.totalTags}
                </span>
              </div>
            </div>
            {insights.wordsPerHour > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>
                    {insights.wordsPerHour > 300
                      ? 'Fast'
                      : insights.wordsPerHour > 150
                        ? 'Steady'
                        : 'Thoughtful'}{' '}
                    writer
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Most Worked Project */}
        {insights.mostWorkedProject && (
          <div className="card">
            <div className="card-content">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Most Worked Project
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {insights.mostWorkedProject.project.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {insights.mostWorkedProject.project.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Time spent:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formatTimeSpent(insights.mostWorkedProject.metadata.totalTimeSpent)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Word count:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {insights.mostWorkedProject.wordCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Sessions:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {insights.mostWorkedProject.metadata.openCount}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Tags:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {insights.mostWorkedProject.metadata.tags.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Genre Distribution */}
      {insights.topGenre && (
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Writing Preferences
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Favorite genre</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {insights.topGenre.genre}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Projects in this genre
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {insights.topGenre.count} / {insights.totalProjects}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {Math.round((insights.topGenre.count / insights.totalProjects) * 100)}%
                </div>
                <div className="text-xs text-slate-500">of projects</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {insights.totalProjects > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                  Keep up the great work!
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  You've written {insights.totalWords.toLocaleString()} words across{' '}
                  {insights.totalProjects} projects.
                  {insights.totalWritingTime > 0 && (
                    <>
                      {' '}
                      That's {formatTimeSpent(insights.totalWritingTime)} of dedicated writing time!
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInsights;
