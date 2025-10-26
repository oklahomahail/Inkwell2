/**
 * Preview Landing Page
 * Marketing page for unauthenticated users to explore Inkwell's features
 */

import { BookOpen, Sparkles, FileText, ArrowRight, Zap } from 'lucide-react';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useGo } from '@/utils/navigate';

import { trackPreviewOpened, trackPreviewCTA } from './analytics';

export function PreviewLandingPage() {
  const navigate = useGo();

  useEffect(() => {
    // Track preview mode entry
    trackPreviewOpened('landing');
  }, []);

  const handleStartWriting = () => {
    trackPreviewCTA('write', 'hero');
    navigate('/preview/write');
  };

  const handleSignup = () => {
    trackPreviewCTA('signup', 'hero');
    navigate('/signup?from=preview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Write your story with
              <span className="block text-blue-600 dark:text-blue-400">AI-powered insights</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Inkwell combines a beautiful writing experience with intelligent plot analysis,
              helping you craft compelling narratives from first draft to final manuscript.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={handleStartWriting}
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Try the Demo
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
              <button
                onClick={handleSignup}
                className="rounded-lg bg-white dark:bg-slate-800 px-6 py-3 text-base font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Create free account
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No credit card required • Explore a sample story instantly
            </p>
          </div>
        </div>

        {/* Decorative background */}
        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-blue-400 to-purple-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
            title="Distraction-Free Writing"
            description="Focus on your story with our minimalist editor designed specifically for long-form fiction."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
            title="AI Plot Analysis"
            description="Get intelligent insights on pacing, character arcs, and story structure as you write."
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8 text-green-600 dark:text-green-400" />}
            title="Professional Export"
            description="Export to manuscript-ready PDFs with industry-standard formatting in one click."
          />
        </div>
      </div>

      {/* Demo Preview Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 text-center">
          <Zap className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Try it now — no signup needed
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
            Explore a complete sample story with three chapters. Edit the text, navigate between
            chapters, and experience Inkwell's writing interface firsthand.
          </p>
          <button
            onClick={handleStartWriting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Changes won't be saved unless you create an account
          </p>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to write your story?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Create a free account to save your work and unlock all features.
          </p>
          <Link
            to="/signup?from=preview"
            onClick={() => trackPreviewCTA('signup', 'footer')}
            className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

export default PreviewLandingPage;
