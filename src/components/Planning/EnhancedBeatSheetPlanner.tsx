// src/components/Planning/EnhancedBeatSheetPlanner.tsx
import { BookOpen, Edit3, RotateCcw, CheckCircle, Circle, Lightbulb, Link2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import type { Chapter } from '@/types/project';
import { STORY_TEMPLATES, StoryTemplate } from '@/types/storyTemplates';
import { triggerBeatSheetCompleted } from '@/utils/tourTriggers';

import { BeatChapterMapper } from './BeatChapterMapper';
import { TemplatePickerModal } from './TemplatePickerModal';

interface BeatContent {
  id: string;
  content: string;
  completed: boolean;
}

const EnhancedBeatSheetPlanner: React.FC = () => {
  const { currentProject, updateProject } = useAppContext();
  const { showToast } = useToast();

  const [isPickerOpen, setPickerOpen] = useState(false);
  const [editingBeat, setEditingBeat] = useState<string | null>(null);
  const [beatContents, setBeatContents] = useState<Record<string, BeatContent>>({});
  const [showMapper, setShowMapper] = useState(false);

  // Get current template
  const currentTemplate = currentProject?.storyTemplateId
    ? STORY_TEMPLATES.find((t) => t.id === currentProject.storyTemplateId)
    : null;

  // Load beat contents from localStorage (temporary until integrated with project storage)
  useEffect(() => {
    if (currentProject && currentTemplate) {
      const storageKey = `inkwell_beat_contents_${currentProject.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setBeatContents(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse beat contents:', e);
        }
      }
    }
  }, [currentProject, currentTemplate]);

  // Save beat contents to localStorage
  const saveBeatContents = (contents: Record<string, BeatContent>) => {
    if (currentProject) {
      const storageKey = `inkwell_beat_contents_${currentProject.id}`;
      localStorage.setItem(storageKey, JSON.stringify(contents));
      setBeatContents(contents);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: StoryTemplate) => {
    if (!currentProject) return;

    const beatToChapter: Record<string, string | null> = {};
    template.beats.forEach((beat) => {
      beatToChapter[beat.id] = null;
    });

    updateProject({
      ...currentProject,
      storyTemplateId: template.id,
      storyTemplateVersion: '1.0.0',
      beatMapping: beatToChapter,
    });

    showToast(`Template "${template.name}" selected`, 'success');
  };

  // Update beat content
  const updateBeat = (beatId: string, content: string, completed: boolean) => {
    if (!currentTemplate) return;

    // Check if this is the first beat content addition
    const isFirstBeatContent =
      content.trim() && Object.values(beatContents).every((b) => !b.content || !b.content.trim());

    const updated = {
      ...beatContents,
      [beatId]: { id: beatId, content, completed },
    };

    saveBeatContents(updated);

    // Fire tour trigger on first beat content addition
    if (isFirstBeatContent) {
      triggerBeatSheetCompleted();
    }
  };

  // Toggle beat completion
  const toggleBeatCompletion = (beatId: string) => {
    const current = beatContents[beatId] || { id: beatId, content: '', completed: false };
    updateBeat(beatId, current.content, !current.completed);
  };

  // Handle beat-to-chapter mapping change
  const handleMappingChange = (updated: Record<string, string | null>) => {
    if (!currentProject || !currentTemplate) return;

    updateProject({
      ...currentProject,
      beatMapping: updated,
    });
  };

  // Create a new chapter from a beat
  const handleCreateChapterFromBeat = (beatId: string) => {
    if (!currentProject || !currentTemplate) return;

    const beat = currentTemplate.beats.find((b) => b.id === beatId);
    if (!beat) return;

    const newChapter: Chapter = {
      id: `chapter_${Date.now()}`,
      title: beat.label,
      summary: beat.prompt,
      content: '',
      wordCount: 0,
      status: 'planned',
      order: currentProject.chapters?.length || 0,
      charactersInChapter: [],
      plotPointsResolved: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedChapters = [...(currentProject.chapters || []), newChapter];
    const beatToChapter = currentProject.beatMapping || {};

    updateProject({
      ...currentProject,
      chapters: updatedChapters,
      beatMapping: {
        ...beatToChapter,
        [beatId]: newChapter.id,
      },
    });

    showToast(`Chapter "${newChapter.title}" created`, 'success');
  };

  // Calculate completion
  const completedBeats = Object.values(beatContents).filter((b) => b.completed).length;
  const totalBeats = currentTemplate?.beats.length || 0;
  const completionPercentage = totalBeats > 0 ? Math.round((completedBeats / totalBeats) * 100) : 0;

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-sm">Select a project to start planning your story</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Beat Sheet Planner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentTemplate
                  ? `Using ${currentTemplate.name}`
                  : 'Structure your story with proven templates'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {currentTemplate && (
                <>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {completedBeats}/{totalBeats} Complete
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {completionPercentage}% Progress
                    </div>
                  </div>

                  {currentProject.chapters && currentProject.chapters.length > 0 && (
                    <button
                      onClick={() => setShowMapper(!showMapper)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{showMapper ? 'Hide Mapper' : 'Map to Chapters'}</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => setPickerOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{currentTemplate ? 'Change Template' : 'Choose Template'}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {currentTemplate && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!currentTemplate ? (
            // No template selected
            <div className="p-6">
              <div className="max-w-2xl mx-auto text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Choose a Beat Sheet Template
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select from 8 proven story structure templates to organize your narrative
                </p>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Browse Templates
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Tip</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      Beat sheets help you plot before you write, saving time and preventing
                      writer's block. Fill out each beat with a few sentences describing what
                      happens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Template selected - show beats
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Beat-to-Chapter Mapper */}
                {showMapper && currentProject.chapters && currentProject.chapters.length > 0 && (
                  <BeatChapterMapper
                    template={currentTemplate}
                    chapters={currentProject.chapters}
                    beatToChapter={currentProject.beatMapping || {}}
                    onChange={handleMappingChange}
                    onCreateChapterFromBeat={handleCreateChapterFromBeat}
                  />
                )}

                {/* Beats List */}
                <div className="space-y-4">
                  {currentTemplate.beats.map((beat, index) => {
                    const beatContent = beatContents[beat.id] || {
                      id: beat.id,
                      content: '',
                      completed: false,
                    };
                    const isEditing = editingBeat === beat.id;

                    return (
                      <div
                        key={beat.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <button onClick={() => toggleBeatCompletion(beat.id)} className="mt-1">
                              {beatContent.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {index + 1}. {beat.label}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {beat.prompt}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingBeat(isEditing ? null : beat.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={beatContent.content}
                            onChange={(e) =>
                              updateBeat(beat.id, e.target.value, beatContent.completed)
                            }
                            placeholder="Describe what happens in this beat..."
                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <div className="text-gray-700 dark:text-gray-300 text-sm">
                            {beatContent.content || (
                              <span className="text-gray-400 italic">
                                Click the edit button to add your story notes...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Picker Modal */}
      <TemplatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedTemplateId={currentProject.storyTemplateId ?? undefined}
        onSelect={handleSelectTemplate}
      />
    </>
  );
};

export default EnhancedBeatSheetPlanner;
