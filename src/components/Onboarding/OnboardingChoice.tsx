// src/components/Onboarding/OnboardingChoice.tsx
import { FileEdit, Map, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useGo } from '@/utils/navigate';

/**
 * Two-Path Onboarding Flow
 *
 * Presents new authors with two distinct starting paths:
 * 1. Start Writing (Discoverer Path) - Jump straight into writing
 * 2. Build Your World (Architect Path) - Plan characters and world first
 */
export default function OnboardingChoice() {
  const go = useGo();
  const { createProject, setActiveProject, setActiveSection, setCreationMode } = useAppContext();
  const [loading, setLoading] = useState<'writing' | 'planning' | null>(null);

  const handleChoice = async (mode: 'writing' | 'planning') => {
    setLoading(mode);

    try {
      // Set creation mode first
      setCreationMode('blank');

      // Create project with appropriate mode
      const project = await createProject({
        title: 'My First Project',
        description:
          mode === 'writing'
            ? 'Start writing and discover your story'
            : 'Plan your world and characters first',
        creationMode: mode,
      });

      // Set as active project
      setActiveProject(project.id);

      // For writing mode, create a first chapter section
      if (mode === 'writing') {
        // Import Chapters service to create first section
        const { Chapters } = await import('@/services/chaptersService');

        const firstSection = await Chapters.create({
          projectId: project.id,
          title: 'Chapter 1',
          content: '',
          type: 'chapter',
          index: 0,
        });

        // Set as active section in context and localStorage
        setActiveSection(firstSection.id);
        localStorage.setItem(`lastSection-${project.id}`, firstSection.id);
      }

      // Navigate to appropriate view
      setTimeout(() => {
        if (mode === 'writing') {
          go('/dashboard?view=writing');
        } else {
          go('/dashboard?view=planning');
        }
      }, 300);
    } catch (error) {
      console.error('Failed to create project:', error);
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="flex items-center justify-center mb-6">
          <img src="/brand/inkwell-icon.svg" alt="Inkwell" className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-bold mb-3 text-white">Welcome to Inkwell</h1>
        <p className="text-xl text-slate-400 italic">find your story, weave it well</p>
        <p className="text-lg text-slate-300 mt-6">
          Choose how you'd like to begin your creative journey.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="flex flex-col lg:flex-row gap-8 max-w-5xl w-full">
        <ChoiceCard
          title="Start Writing"
          subtitle="The Discoverer's Path"
          description="Jump straight into your first chapter. Let the story flow and discover your characters along the way. Add world-building and planning details later as you need them."
          icon={FileEdit}
          features={[
            'Begin with a blank chapter',
            'Immediate writing interface',
            'AI suggestions available',
            'Add structure as you go',
          ]}
          onClick={() => handleChoice('writing')}
          loading={loading === 'writing'}
          accentColor="amber"
          keyboardShortcut="W"
        />

        <ChoiceCard
          title="Build Your World"
          subtitle="The Architect's Path"
          description="Sketch out your universe before writing begins. Define characters, locations, and plot threads. Create a solid foundation for your story."
          icon={Map}
          features={[
            'Character templates',
            'World-building tools',
            'Timeline planning',
            'Structured approach',
          ]}
          onClick={() => handleChoice('planning')}
          loading={loading === 'planning'}
          accentColor="blue"
          keyboardShortcut="P"
        />
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-sm text-slate-400 max-w-md">
        <p>
          Don't worry - you can switch between modes anytime. Both paths give you access to all
          Inkwell features.
        </p>
      </div>
    </div>
  );
}

interface ChoiceCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  onClick: () => void;
  loading: boolean;
  accentColor: 'amber' | 'blue';
  keyboardShortcut: string;
}

function ChoiceCard({
  title,
  subtitle,
  description,
  icon: Icon,
  features,
  onClick,
  loading,
  accentColor,
  keyboardShortcut,
}: ChoiceCardProps) {
  const accentClasses = {
    amber: {
      border: 'border-amber-500/50 hover:border-amber-400',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      text: 'text-amber-400',
      icon: 'text-amber-400',
      button: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    },
    blue: {
      border: 'border-blue-500/50 hover:border-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20',
      text: 'text-blue-400',
      icon: 'text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-400 text-white',
    },
  };

  const accent = accentClasses[accentColor];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative flex-1 bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl p-8
        text-left transition-all duration-300 group
        ${accent.border} ${accent.bg}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 hover:shadow-2xl
      `}
    >
      {/* Keyboard Shortcut Badge */}
      <div className="absolute top-4 right-4 bg-slate-700/50 text-slate-300 text-xs font-mono px-2 py-1 rounded">
        {keyboardShortcut}
      </div>

      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${accent.bg}`}>
          <Icon className={`w-8 h-8 ${accent.icon}`} />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p className={`text-sm font-medium ${accent.text}`}>{subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-300 leading-relaxed mb-6">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
            <div className={`w-1.5 h-1.5 rounded-full ${accent.bg}`} />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="flex items-center justify-between">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating project...</span>
          </div>
        ) : (
          <>
            <span className={`text-sm font-medium ${accent.text} group-hover:underline`}>
              Choose this path
            </span>
            <ArrowRight
              className={`w-5 h-5 ${accent.icon} group-hover:translate-x-1 transition-transform`}
            />
          </>
        )}
      </div>
    </button>
  );
}
