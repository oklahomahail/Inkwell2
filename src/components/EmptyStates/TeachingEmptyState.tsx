// src/components/EmptyStates/TeachingEmptyState.tsx
import React from 'react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export interface TeachingEmptyStateProps {
  title: string;
  what: string;
  when: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  exampleBullets?: string[];
  icon?: React.ReactNode;
  helpText?: string;
  isInFirstDraftPath?: boolean;
  stepNumber?: number;
}

export function TeachingEmptyState({
  title,
  what,
  when,
  primaryActionLabel,
  onPrimaryAction,
  exampleBullets,
  icon,
  helpText,
  isInFirstDraftPath = false,
  stepNumber,
}: TeachingEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          {icon && <div className="text-6xl mb-4">{icon}</div>}

          {/* Step indicator for First Draft Path */}
          {isInFirstDraftPath && stepNumber && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              Step {stepNumber} of 5
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

          {/* What it is */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              What this is
            </p>
            <p className="text-gray-700">{what}</p>
          </div>

          {/* When to use it */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              When to use it
            </p>
            <p className="text-gray-700">{when}</p>
          </div>

          {/* Examples */}
          {exampleBullets && exampleBullets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Examples</p>
              <ul className="text-gray-700 space-y-1">
                {exampleBullets.map((example, index) => (
                  <li key={index} className="text-sm">
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary action */}
          <div className="pt-4">
            <Button onClick={onPrimaryAction} size="lg" className="w-full">
              {primaryActionLabel}
            </Button>
          </div>

          {/* Help text */}
          {helpText && <p className="text-sm text-gray-500 mt-4">{helpText}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// Pre-configured empty states for core panels
export function ProjectsEmptyState({
  onCreateProject,
  isInFirstDraftPath = false,
}: {
  onCreateProject: () => void;
  isInFirstDraftPath?: boolean;
}) {
  return (
    <TeachingEmptyState
      title="Welcome to Inkwell"
      what="a container for your book"
      when="anytime you start a new idea"
      primaryActionLabel="Create project"
      onPrimaryAction={onCreateProject}
      exampleBullets={['River City Mystery', 'The Summer Map', 'Untitled Project']}
      icon="📚"
      helpText="You can change the name later."
      isInFirstDraftPath={isInFirstDraftPath}
      stepNumber={1}
    />
  );
}

export function ChaptersEmptyState({
  onAddChapter,
  isInFirstDraftPath = false,
}: {
  onAddChapter: () => void;
  isInFirstDraftPath?: boolean;
}) {
  return (
    <TeachingEmptyState
      title="Add your first chapter"
      what="a large unit in your book"
      when="to group related scenes"
      primaryActionLabel="Add chapter"
      onPrimaryAction={onAddChapter}
      exampleBullets={['Chapter 1', 'The Beginning', 'Morning Coffee']}
      icon="📑"
      helpText="Short titles keep you moving. You can refine later."
      isInFirstDraftPath={isInFirstDraftPath}
      stepNumber={2}
    />
  );
}

export function ScenesEmptyState({
  onAddScene,
  isInFirstDraftPath = false,
}: {
  onAddScene: () => void;
  isInFirstDraftPath?: boolean;
}) {
  return (
    <TeachingEmptyState
      title="Add your first scene"
      what="where writing happens"
      when="for a single unit of action"
      primaryActionLabel="Add scene"
      onPrimaryAction={onAddScene}
      exampleBullets={['Opening scene', 'The discovery', 'Coffee shop conversation']}
      icon="✍️"
      helpText="Inkwell saves while you type."
      isInFirstDraftPath={isInFirstDraftPath}
      stepNumber={3}
    />
  );
}

export function NotesEmptyState({
  onCreateNote,
  isInFirstDraftPath = false,
}: {
  onCreateNote: () => void;
  isInFirstDraftPath?: boolean;
}) {
  return (
    <TeachingEmptyState
      title="Create your first note"
      what="simple scratchpad for ideas"
      when="names, places, to-dos"
      primaryActionLabel="Create note"
      onPrimaryAction={onCreateNote}
      exampleBullets={['Character names', 'Plot ideas', 'Research notes']}
      icon="📝"
      helpText="Keep all your ideas in one place."
      isInFirstDraftPath={isInFirstDraftPath}
    />
  );
}

export function ExportEmptyState({
  onExport,
  isInFirstDraftPath = false,
}: {
  onExport: () => void;
  isInFirstDraftPath?: boolean;
}) {
  return (
    <TeachingEmptyState
      title="Export a snippet"
      what="a copy of your work for backups or sharing"
      when="after a writing session"
      primaryActionLabel="Export snippet"
      onPrimaryAction={onExport}
      exampleBullets={['PDF for printing', 'Word doc for sharing', 'Markdown for web']}
      icon="📤"
      helpText="Default format: Markdown"
      isInFirstDraftPath={isInFirstDraftPath}
      stepNumber={5}
    />
  );
}

export function FocusWriteEmptyState({
  onStartWriting,
  wordCount = 0,
  targetWords = 300,
  isInFirstDraftPath = false,
}: {
  onStartWriting: () => void;
  wordCount?: number;
  targetWords?: number;
  isInFirstDraftPath?: boolean;
}) {
  const percentage = Math.min(Math.round((wordCount / targetWords) * 100), 100);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center space-y-6">
          {/* Step indicator */}
          {isInFirstDraftPath && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              Step 4 of 5
            </div>
          )}

          {/* Icon */}
          <div className="text-6xl mb-4">✍️</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">Write for five minutes</h2>

          {/* Goal */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Goal</p>
            <p className="text-gray-700">get words on the page</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>{targetWords} target</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Primary action */}
          <div className="pt-4">
            <Button onClick={onStartWriting} size="lg" className="w-full">
              Start Focus writing
            </Button>
          </div>

          {/* Help text */}
          <div className="space-y-2 text-sm text-gray-600">
            <p>Focus mode hides distractions. Write freely. You can edit later.</p>
            <p>If you want help, try "Tighten this paragraph" above the editor.</p>
            <p className="font-medium">
              Progress hint: Aim for {targetWords} words. The counter updates as you type.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
