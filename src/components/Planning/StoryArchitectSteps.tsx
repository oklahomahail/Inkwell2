// Story Architect Flow Step Components
// Additional components for Options, Review, and Integration steps

import {
  ChevronRight,
  ChevronLeft,
  Users,
  Eye,
  BookOpen,
  Target,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  TrendingUp,
} from 'lucide-react';
import React from 'react';

import type { StoryPremise, GeneratedOutline } from '@/services/storyArchitectService';

// Options Step Component
interface OptionsStepProps {
  premise: StoryPremise;
  onChange: (premise: StoryPremise) => void;
  onNext: () => void;
  onPrevious: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const OptionsStep: React.FC<OptionsStepProps> = ({
  premise,
  onChange,
  onNext: _onNext,
  onPrevious,
  onGenerate,
  isGenerating,
}) => {
  const handleGenerate = () => {
    onGenerate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Story Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fine-tune your story generation with these advanced options. These settings will help
          Claude create a more tailored outline for your specific needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Character Options */}
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Character Development
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Story Focus
                </label>
                <select
                  value={premise.focusType}
                  onChange={(e) =>
                    onChange({ ...premise, focusType: e.target.value as StoryPremise['focusType'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="plot-driven">Plot-Driven (Action & Events)</option>
                  <option value="character-driven">Character-Driven (Internal Journey)</option>
                  <option value="balanced">Balanced (Plot + Character)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Character Count
                </label>
                <select
                  value={premise.characterCount}
                  onChange={(e) =>
                    onChange({
                      ...premise,
                      characterCount: e.target.value as StoryPremise['characterCount'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="minimal">Minimal (2-3 characters)</option>
                  <option value="moderate">Moderate (4-6 characters)</option>
                  <option value="ensemble">Ensemble (6+ characters)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Development Depth
                </label>
                <select
                  value={premise.characterDevelopmentDepth}
                  onChange={(e) =>
                    onChange({
                      ...premise,
                      characterDevelopmentDepth: e.target
                        .value as StoryPremise['characterDevelopmentDepth'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="light">Light (Basic arcs)</option>
                  <option value="moderate">Moderate (Detailed arcs)</option>
                  <option value="deep">Deep (Complex psychology)</option>
                </select>
              </div>
            </div>
          </div>

          {/* POV Options */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Point of View
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  POV Style
                </label>
                <select
                  value={premise.povStyle}
                  onChange={(e) =>
                    onChange({ ...premise, povStyle: e.target.value as StoryPremise['povStyle'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single-pov">Single POV (One character)</option>
                  <option value="dual-pov">Dual POV (Two main characters)</option>
                  <option value="multi-pov">Multi POV (3-4 characters)</option>
                  <option value="alternating-pov">Alternating POV (Systematic switching)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Narrative Perspective
                </label>
                <select
                  value={premise.narrativePerspective}
                  onChange={(e) =>
                    onChange({
                      ...premise,
                      narrativePerspective: e.target.value as StoryPremise['narrativePerspective'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="first-person">First Person (I, me)</option>
                  <option value="third-limited">Third Limited (Close to one character)</option>
                  <option value="third-omniscient">Third Omniscient (All-knowing)</option>
                  <option value="mixed">Mixed (Varies by scene)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Story Details */}
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Story Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Setting (Optional)
                </label>
                <input
                  type="text"
                  value={premise.setting || ''}
                  onChange={(e) => onChange({ ...premise, setting: e.target.value })}
                  placeholder="e.g., Medieval fantasy kingdom, Modern-day New York, Space station"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Themes (Optional)
                </label>
                <input
                  type="text"
                  value={premise.themes?.join(', ') || ''}
                  onChange={(e) =>
                    onChange({
                      ...premise,
                      themes: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., friendship, betrayal, redemption, coming of age"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate themes with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship Focus (Optional)
                </label>
                <input
                  type="text"
                  value={premise.relationshipFocus?.join(', ') || ''}
                  onChange={(e) =>
                    onChange({
                      ...premise,
                      relationshipFocus: e.target.value
                        .split(',')
                        .map((r) => r.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., romance, family bonds, mentor-student, rivalry"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Types of relationships to emphasize</p>
              </div>
            </div>
          </div>

          {/* Generation Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              What You'll Get
            </h3>

            <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Complete story outline with chapter summaries</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Detailed character profiles with development arcs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Scene-by-scene breakdowns with POV assignments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Character relationships and voice profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Timeline integration for visual story mapping</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Premise
        </button>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Story Outline
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Review Step Component
interface ReviewStepProps {
  outline: GeneratedOutline;
  onNext: () => void;
  onPrevious: () => void;
  onRegenerate: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  outline,
  onNext,
  onPrevious,
  onRegenerate,
}) => {
  const totalWords = outline.chapters.reduce((sum, chapter) => sum + chapter.wordTarget, 0);
  const totalScenes = outline.chapters.reduce((sum, chapter) => sum + chapter.scenes.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Review Your Generated Outline
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review the generated story outline below. You can regenerate if needed, or proceed to
          integrate it with your project.
        </p>
      </div>

      {/* Outline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {outline.chapters.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Chapters</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalScenes}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Scenes</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {outline.characters.length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Characters</div>
        </div>
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Math.round(totalWords / 1000)}k
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Words</div>
        </div>
      </div>

      {/* Story Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {outline.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{outline.summary}</p>
        <div className="flex flex-wrap gap-2">
          {outline.themes.map((theme, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs for detailed view */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white">Quick Preview</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            First few chapters and characters - full details will be available after integration
          </p>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chapters Preview */}
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                Chapters (showing first 3)
              </h5>
              <div className="space-y-3">
                {outline.chapters.slice(0, 3).map((chapter, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h6 className="font-medium text-gray-900 dark:text-white">{chapter.title}</h6>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {chapter.plotFunction}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {chapter.summary}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{chapter.scenes.length} scenes</span>
                      <span>{chapter.wordTarget.toLocaleString()} words</span>
                    </div>
                  </div>
                ))}
                {outline.chapters.length > 3 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                    ... and {outline.chapters.length - 3} more chapters
                  </div>
                )}
              </div>
            </div>

            {/* Characters Preview */}
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Characters</h5>
              <div className="space-y-3">
                {outline.characters.map((character, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h6 className="font-medium text-gray-900 dark:text-white">
                        {character.name}
                      </h6>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          character.role === 'protagonist'
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : character.role === 'antagonist'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {character.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {character.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Arc:</strong> {character.arc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <button
            onClick={onPrevious}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Options
          </button>

          <button
            onClick={onRegenerate}
            className="px-4 py-2 border border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        <button
          onClick={onNext}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          Proceed to Integration
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Integration Step Component
interface IntegrationStepProps {
  outline: GeneratedOutline;
  options: {
    replaceProject: boolean;
    mergeCharacters: boolean;
    generateTimeline: boolean;
    createChapters: boolean;
    preserveExisting: boolean;
  };
  onOptionsChange: (options: any) => void;
  onIntegrate: () => void;
  onPrevious: () => void;
  currentProject: any;
}

export const IntegrationStep: React.FC<IntegrationStepProps> = ({
  outline,
  options,
  onOptionsChange,
  onIntegrate,
  onPrevious,
  currentProject,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Integration Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose how to integrate the generated outline with your project. You can merge with
          existing content or replace it entirely.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Integration Options */}
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Project Integration
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={options.mergeCharacters}
                  onChange={(e) =>
                    onOptionsChange({ ...options, mergeCharacters: e.target.checked })
                  }
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Merge Characters</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Add generated characters to your existing character list
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={options.createChapters}
                  onChange={(e) =>
                    onOptionsChange({ ...options, createChapters: e.target.checked })
                  }
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Create Chapter Structure
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Generate chapters and scenes in your project
                  </div>
                </div>
              </label>

              {options.createChapters && (
                <div className="ml-6 pl-4 border-l border-gray-200 dark:border-gray-600">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={options.preserveExisting}
                      onChange={(e) =>
                        onOptionsChange({ ...options, preserveExisting: e.target.checked })
                      }
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Preserve Existing Chapters
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Add new chapters alongside existing ones
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Timeline Integration
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={options.generateTimeline}
                  onChange={(e) =>
                    onOptionsChange({ ...options, generateTimeline: e.target.checked })
                  }
                  className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Generate Timeline</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Create timeline events from the story outline for visual mapping
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview of Changes */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            What Will Be Added
          </h3>

          <div className="space-y-3 text-sm">
            {options.mergeCharacters && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-4 h-4" />
                <span>{outline.characters.length} new characters</span>
              </div>
            )}

            {options.createChapters && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {outline.chapters.length} chapters with{' '}
                  {outline.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0)} scenes
                </span>
              </div>
            )}

            {options.generateTimeline && (
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <CheckCircle className="w-4 h-4" />
                <span>Timeline with story events and character arcs</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>
                  {currentProject
                    ? `Integrating with "${currentProject.name}"`
                    : 'No current project selected'}
                </span>
              </div>
            </div>
          </div>

          {!options.mergeCharacters && !options.createChapters && !options.generateTimeline && (
            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Select at least one integration option to proceed</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Review
        </button>

        <button
          onClick={onIntegrate}
          disabled={
            !options.mergeCharacters && !options.createChapters && !options.generateTimeline
          }
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
        >
          Integrate Story Outline
          <Target className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
