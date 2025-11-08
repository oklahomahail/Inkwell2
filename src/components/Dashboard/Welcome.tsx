// Minimal stub for Welcome component
import { PlusCircle } from 'lucide-react';
import React from 'react';

interface WelcomeProps {
  onCreateProject?: () => void;
  hasProjects?: boolean;
}

export default function _Welcome({ onCreateProject, hasProjects = false }: WelcomeProps) {
  return (
    <section className="mx-auto max-w-3xl text-center py-8">
      {/* Inkwell Logo */}
      <div className="mb-6 flex justify-center">
        <img src="/brand/inkwell-logo-primary.svg" alt="Inkwell" className="h-20 dark:hidden" />
        <img src="/brand/inkwell-logo-alt.svg" alt="Inkwell" className="h-20 hidden dark:block" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
        {hasProjects ? 'Welcome back' : 'Welcome to Inkwell'}
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
        {hasProjects
          ? 'Your professional writing studio awaits. Continue crafting your stories with powerful tools designed for authors.'
          : 'Your professional writing companion for crafting extraordinary stories. Create, organize, and perfect your work with tools built for serious writers.'}
      </p>
      {onCreateProject && (
        <button
          onClick={onCreateProject}
          data-testid="create-first-project"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          {hasProjects ? 'Start New Project' : 'Create Your First Project'}
        </button>
      )}
    </section>
  );
}
