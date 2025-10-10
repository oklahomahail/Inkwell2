// src/components/Dashboard/Welcome.tsx
import { PlusCircle } from 'lucide-react';
import React from 'react';

import Logo from '@/components/Logo';

interface WelcomeProps {
  onCreateProject?: () => void;
  hasProjects?: boolean;
}

export default function Welcome({ onCreateProject, hasProjects = false }: WelcomeProps) {
  return (
    <section className="mx-auto max-w-3xl text-center py-8">
      {/* Branded logo circle */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-inkwell-navy-50 to-inkwell-gold-50 dark:from-inkwell-navy-800 dark:to-inkwell-gold-700/20 border border-inkwell-navy-200 dark:border-inkwell-navy-700">
        {/* Light theme: gold feather, dark theme: light feather */}
        <div className="hidden dark:block">
          <Logo variant="mark-light" size={56} />
        </div>
        <div className="block dark:hidden">
          <Logo variant="mark-light" size={56} />
        </div>
      </div>

      {/* Welcome content */}
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 font-serif">
        {hasProjects ? 'Welcome back to' : 'Welcome to'} Inkwell
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        {hasProjects
          ? 'Your professional writing studio awaits. Continue crafting your stories with powerful tools designed for authors.'
          : 'Your professional writing companion for crafting extraordinary stories. Create, organize, and perfect your work with tools built for serious writers.'}
      </p>

      {/* CTA button */}
      {onCreateProject && (
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-6 py-3 bg-inkwell-navy text-white rounded-lg hover:bg-inkwell-navy-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          <PlusCircle className="w-5 h-5" />
          {hasProjects ? 'Start New Project' : 'Create Your First Project'}
        </button>
      )}
    </section>
  );
}
