import { ChevronLeft, Sparkles } from 'lucide-react';
import React from 'react';

import type { StoryPremise, GeneratedOutline } from '@/services/storyArchitectService';

// Options Step Component
interface OptionsStepProps {
  premise: StoryPremise;
  onChange: (_premise: StoryPremise) => void;
  onNext: () => void;
  onPrevious: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const OptionsStep: React.FC<OptionsStepProps> = ({
  premise,
  onChange,
  onPrevious,
  onGenerate,
  isGenerating,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Advanced Story Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your story's structure and character development
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Story Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Story Focus
          </label>
          <select
            value={premise.focusType}
            onChange={(e) =>
              onChange({
                ...premise,
                focusType: e.target.value as StoryPremise['focusType'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="plot-driven">Plot-Driven (Action & Events)</option>
            <option value="character-driven">Character-Driven (Internal Journey)</option>
            <option value="balanced">Balanced (Plot & Character)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {premise.focusType === 'plot-driven' &&
              'Focus on external conflicts, action scenes, and plot progression'}
            {premise.focusType === 'character-driven' &&
              'Focus on character growth, relationships, and internal conflicts'}
            {premise.focusType === 'balanced' &&
              'Equal emphasis on plot advancement and character development'}
          </p>
        </div>

        {/* POV Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Point of View
          </label>
          <select
            value={premise.povStyle}
            onChange={(e) =>
              onChange({
                ...premise,
                povStyle: e.target.value as StoryPremise['povStyle'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="single-pov">Single POV (One Protagonist)</option>
            <option value="dual-pov">Dual POV (Two Perspectives)</option>
            <option value="multi-pov">Multi POV (3+ Perspectives)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {premise.povStyle === 'single-pov' && "Story told from one character's perspective"}
            {premise.povStyle === 'dual-pov' && 'Alternating between two character perspectives'}
            {premise.povStyle === 'multi-pov' && 'Multiple character viewpoints throughout'}
          </p>
        </div>

        {/* Narrative Perspective */}
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="first-person">First Person (I/We)</option>
            <option value="third-limited">Third Person Limited</option>
            <option value="third-omniscient">Third Person Omniscient</option>
            <option value="second-person">Second Person (You)</option>
          </select>
        </div>

        {/* Character Count */}
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="minimal">Minimal (2-4 characters)</option>
            <option value="moderate">Moderate (5-8 characters)</option>
            <option value="large">Large Cast (9+ characters)</option>
          </select>
        </div>

        {/* Character Development Depth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Character Development Depth
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="light">Light (Action-focused)</option>
            <option value="moderate">Moderate (Balanced)</option>
            <option value="deep">Deep (Character Study)</option>
          </select>
        </div>

        {/* Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Setting (Optional)
          </label>
          <input
            type="text"
            value={premise.setting || ''}
            onChange={(e) => onChange({ ...premise, setting: e.target.value })}
            placeholder="e.g., Medieval Europe, Future Mars Colony, Modern New York"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Themes (optional multi-input) */}
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
          placeholder="e.g., redemption, power corrupts, coming of age (comma separated)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Separate multiple themes with commas
        </p>
      </div>

      {/* Story Summary Preview */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
          Story Configuration Summary
        </h3>
        <div className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
          <p>
            <strong>Title:</strong> {premise.title || 'Not set'}
          </p>
          <p>
            <strong>Genre:</strong> {premise.genre || 'Not set'}
          </p>
          <p>
            <strong>Length:</strong> {premise.targetLength}
          </p>
          <p>
            <strong>Focus:</strong> {premise.focusType}
          </p>
          <p>
            <strong>POV:</strong> {premise.povStyle}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between pt-4">
        <button
          onClick={onPrevious}
          disabled={isGenerating}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Story Outline
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Review Your Story Outline
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review the generated outline and make any adjustments before integrating
        </p>
      </div>

      {/* Story Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{outline.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{outline.summary}</p>
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <strong>Genre:</strong> {outline.genre}
          </span>
          {outline.themes && outline.themes.length > 0 && (
            <span>
              <strong>Themes:</strong> {outline.themes.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Characters */}
      {outline.characters && outline.characters.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Characters ({outline.characters.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {outline.characters.map((character, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <h4 className="font-medium text-gray-900 dark:text-white">{character.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {character.description}
                </p>
                {character.role && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    {character.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot Points */}
      {outline.plotPoints && outline.plotPoints.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Plot Points ({outline.plotPoints.length})
          </h3>
          <div className="space-y-2">
            {outline.plotPoints.map((point, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <p className="text-sm text-gray-900 dark:text-white">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters */}
      {outline.chapters && outline.chapters.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Chapters ({outline.chapters.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {outline.chapters.map((chapter, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Chapter {index + 1}: {chapter.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{chapter.summary}</p>
                {chapter.plotFunction && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {chapter.plotFunction}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between pt-4">
        <div className="flex gap-3">
          <button
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Options
          </button>

          <button
            onClick={onRegenerate}
            className="px-6 py-2 border border-purple-300 dark:border-purple-600 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        <button
          onClick={onNext}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Continue to Integration
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
  onOptionsChange: (_options: any) => void;
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Integration Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose how to integrate this outline into your project
        </p>
      </div>

      {/* Integration Options */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.mergeCharacters}
              onChange={(e) => onOptionsChange({ ...options, mergeCharacters: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Add Characters</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Import {outline.characters?.length || 0} characters from the outline into your
                project
              </div>
            </div>
          </label>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.createChapters}
              onChange={(e) => onOptionsChange({ ...options, createChapters: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                Create Chapter Structure
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Generate {outline.chapters?.length || 0} chapter sections based on the outline
              </div>
            </div>
          </label>

          {options.createChapters && currentProject?.chapters?.length > 0 && (
            <div className="mt-3 ml-7 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.preserveExisting}
                  onChange={(e) =>
                    onOptionsChange({ ...options, preserveExisting: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Preserve Existing Chapters
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Keep your {currentProject.chapters.length} existing chapters and add new ones
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.generateTimeline}
              onChange={(e) => onOptionsChange({ ...options, generateTimeline: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                Generate Timeline Events
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create timeline entries from major plot points and chapter events
              </div>
            </div>
          </label>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.replaceProject}
              onChange={(e) => onOptionsChange({ ...options, replaceProject: e.target.checked })}
              className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <div className="flex-1">
              <div className="font-medium text-orange-600 dark:text-orange-400">
                Replace Project Metadata
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ⚠️ Replace project description, genre, and other metadata with outline data
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Preview Summary */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
          Integration Summary
        </h3>
        <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
          {options.mergeCharacters && <li>✓ Add {outline.characters?.length || 0} characters</li>}
          {options.createChapters && (
            <li>
              ✓ Create {outline.chapters?.length || 0} chapter sections
              {options.preserveExisting && currentProject?.chapters?.length > 0
                ? ` (${currentProject.chapters.length} existing preserved)`
                : ''}
            </li>
          )}
          {options.generateTimeline && <li>✓ Generate timeline from plot structure</li>}
          {options.replaceProject && <li>⚠️ Replace project metadata</li>}
          {!options.mergeCharacters &&
            !options.createChapters &&
            !options.generateTimeline &&
            !options.replaceProject && <li className="text-gray-500">No changes selected</li>}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between pt-4">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Review
        </button>

        <button
          onClick={onIntegrate}
          disabled={
            !options.mergeCharacters &&
            !options.createChapters &&
            !options.generateTimeline &&
            !options.replaceProject
          }
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Integrate Story Outline
        </button>
      </div>
    </div>
  );
};
