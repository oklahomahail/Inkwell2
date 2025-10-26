/**
 * Preview Dashboard Component
 * Shows demo project overview with stats and quick actions
 */

import { BookOpen, FileText, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';

import { useGo } from '@/utils/navigate';

import { trackPreviewOpened, trackPreviewCTA } from './analytics';
import PreviewBanner from './PreviewBanner';
import { getDemoProjectStats, useDemoStore } from './useDemoStore';

export function PreviewDashboard() {
  const { project } = useDemoStore();
  const navigate = useGo();
  const stats = getDemoProjectStats();

  useEffect(() => {
    trackPreviewOpened('dashboard');
  }, []);

  const handleStartWriting = () => {
    trackPreviewCTA('write', 'dashboard_cta');
    navigate('/preview/write');
  };

  const handleSignup = () => {
    trackPreviewCTA('signup', 'dashboard_hero');
    navigate('/signup?from=preview');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PreviewBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{project.name}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">{project.description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            label="Chapters"
            value={stats.chapterCount.toString()}
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            label="Total Words"
            value={stats.totalWords.toLocaleString()}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />}
            label="Avg per Chapter"
            value={stats.avgWordsPerChapter.toString()}
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            label="Est. Reading Time"
            value={`${stats.estimatedReadingTime} min`}
          />
        </div>

        {/* Chapters List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Chapters</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {project.chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Chapter {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {chapter.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {chapter.content.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {chapter.wordCount} words
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(chapter.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to start writing your own story?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Create a free account to unlock all features, save your work, and get AI-powered
            insights on your writing.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleStartWriting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try the Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignup}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors ring-2 ring-white/20"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

export default PreviewDashboard;
