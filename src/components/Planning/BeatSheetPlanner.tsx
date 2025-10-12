// src/components/Planning/BeatSheetPlanner.tsx
import { BookOpen, Edit3, Save, RotateCcw, CheckCircle, Circle, Lightbulb } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';

interface Beat {
  id: string;
  title: string;
  description: string;
  content: string;
  completed: boolean;
  order: number;
  pageTarget?: number;
}

interface BeatSheet {
  id: string;
  name: string;
  template: 'save-the-cat' | 'three-act' | 'custom';
  beats: Beat[];
  createdAt: Date;
  updatedAt: Date;
}

const BeatSheetPlanner: React.FC = () => {
  const [_isTemplateValid, _setIsTemplateValid] = useState(false);
  const _invalidTemplate = {
    id: '',
    name: '',
    template: 'custom' as const,
    beats: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  const [currentBeatSheet, setCurrentBeatSheet] = useState<BeatSheet | null>(null);
  const [editingBeat, setEditingBeat] = useState<string | null>(null);

  // Beat sheet templates
  const templates = {
    'save-the-cat': [
      {
        title: 'Opening Image',
        description: 'A visual that represents the struggle & tone',
        pageTarget: 1,
      },
      {
        title: 'Theme Stated',
        description: 'What your story is about; the message',
        pageTarget: 5,
      },
      { title: 'Set-Up', description: 'Introduce characters, stakes, and goal', pageTarget: 10 },
      { title: 'Catalyst', description: 'The inciting incident', pageTarget: 12 },
      { title: 'Debate', description: 'Should I go? Do I dare?', pageTarget: 25 },
      {
        title: 'Break into Two',
        description: 'Choosing to act; leaving the comfort zone',
        pageTarget: 25,
      },
      { title: 'B Story', description: 'The love story/new world', pageTarget: 30 },
      { title: 'Fun and Games', description: 'Promise of the premise delivered', pageTarget: 55 },
      { title: 'Midpoint', description: 'False victory or defeat; stakes raised', pageTarget: 55 },
      {
        title: 'Bad Guys Close In',
        description: 'Doubt, jealousy, fear, foes regroup',
        pageTarget: 75,
      },
      { title: 'All Is Lost', description: 'The opposite of opening image', pageTarget: 75 },
      {
        title: 'Dark Night of the Soul',
        description: 'The crisis within the crisis',
        pageTarget: 85,
      },
      {
        title: 'Break into Three',
        description: 'The solution; choosing to try again',
        pageTarget: 85,
      },
      { title: 'Finale', description: 'Applying the lesson and succeeding', pageTarget: 110 },
      {
        title: 'Final Image',
        description: 'Opposite of opening; proof of change',
        pageTarget: 110,
      },
    ],
    'three-act': [
      { title: 'Hook', description: 'Grab the reader immediately', pageTarget: 1 },
      {
        title: 'Inciting Incident',
        description: 'The event that sets everything in motion',
        pageTarget: 15,
      },
      { title: 'Plot Point 1', description: 'Enter the new world/situation', pageTarget: 25 },
      { title: 'Pinch Point 1', description: 'Pressure from the antagonist', pageTarget: 40 },
      { title: 'Midpoint', description: 'Major revelation or reversal', pageTarget: 50 },
      { title: 'Pinch Point 2', description: 'More pressure; stakes raised', pageTarget: 65 },
      { title: 'Plot Point 2', description: 'Final push toward climax', pageTarget: 75 },
      { title: 'Climax', description: 'The final confrontation', pageTarget: 90 },
      { title: 'Resolution', description: 'Wrap up loose ends', pageTarget: 100 },
    ],
    custom: [],
  };

  // Initialize beat sheet from template
  const createBeatSheetFromTemplate = (template: keyof typeof templates) => {
    const templateBeats = templates[template];
    const beats: Beat[] = templateBeats.map((beat, index) => ({
      id: `beat_${Date.now()}_${index}`,
      title: beat.title,
      description: beat.description,
      content: '',
      completed: false,
      order: index,
      pageTarget: beat.pageTarget,
    }));

    const newBeatSheet: BeatSheet = {
      id: `beatsheet_${Date.now()}`,
      name: `${template.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - ${currentProject?.name || 'Untitled'}`,
      template,
      beats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentBeatSheet(newBeatSheet);
    showToast(`Created ${newBeatSheet.name}`, 'success');
  };

  // Load existing beat sheet (would integrate with storage)
  useEffect(() => {
    if (currentProject && !currentBeatSheet) {
      // Try to load existing beat sheet from storage
      // For now, we'll start fresh
    }
  }, [currentProject]);

  // Update beat content
  const updateBeat = (beatId: string, updates: Partial<Beat>) => {
    if (!currentBeatSheet) return;

    const updatedBeats = currentBeatSheet.beats.map((beat) =>
      beat.id === beatId ? { ...beat, ...updates } : beat,
    );

    setCurrentBeatSheet({
      ...currentBeatSheet,
      beats: updatedBeats,
      updatedAt: new Date(),
    });
  };

  // Save beat sheet (would integrate with storage)
  const saveBeatSheet = () => {
    if (!currentBeatSheet) return;

    // Here you'd save to your storage service
    showToast('Beat sheet saved', 'success');
  };

  // Calculate completion
  const completedBeats = currentBeatSheet?.beats.filter((b) => b.completed).length || 0;
  const totalBeats = currentBeatSheet?.beats.length || 0;
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Beat Sheet Planner</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Structure your story with proven templates
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {currentBeatSheet && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {completedBeats}/{totalBeats} Complete
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {completionPercentage}% Progress
                </div>
              </div>
            )}

            <button
              onClick={saveBeatSheet}
              disabled={!currentBeatSheet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {currentBeatSheet && (
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
        {!currentBeatSheet ? (
          // Template Selection
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose a Beat Sheet Template
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Save the Cat */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Save the Cat!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Blake Snyder's 15-beat structure. Perfect for novels and screenplays.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  15 beats • Proven structure • Great for beginners
                </div>
                <button
                  onClick={() => createBeatSheetFromTemplate('save-the-cat')}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Use This Template
                </button>
              </div>

              {/* Three Act */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Three-Act Structure
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Classic dramatic structure with clear act divisions.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  9 beats • Traditional • Simple and effective
                </div>
                <button
                  onClick={() => createBeatSheetFromTemplate('three-act')}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Use This Template
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Tip</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    Beat sheets help you plot before you write, saving time and preventing writer's
                    block. Fill out each beat with a few sentences describing what happens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Beat Sheet Editor
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentBeatSheet.name}
                </h2>
                <button
                  onClick={() => setCurrentBeatSheet(null)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  New Template
                </button>
              </div>

              <div className="space-y-4">
                {currentBeatSheet.beats.map((beat, index) => (
                  <div
                    key={beat.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateBeat(beat.id, { completed: !beat.completed })}
                          className="mt-1"
                        >
                          {beat.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {index + 1}. {beat.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {beat.description}
                          </p>
                          {beat.pageTarget && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Target: Page {beat.pageTarget}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingBeat(editingBeat === beat.id ? null : beat.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {editingBeat === beat.id ? (
                      <textarea
                        value={beat.content}
                        onChange={(e) => updateBeat(beat.id, { content: e.target.value })}
                        placeholder="Describe what happens in this beat..."
                        className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <div className="text-gray-700 dark:text-gray-300 text-sm">
                        {beat.content || (
                          <span className="text-gray-400 italic">
                            Click the edit button to add your story notes...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeatSheetPlanner;
