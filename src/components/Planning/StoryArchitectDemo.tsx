// Story Architect Demo Integration
// Shows how to integrate the StoryArchitectFlow with existing Inkwell components

import { Wand2, BookOpen, Clock, Users } from 'lucide-react';
import React, { useState } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import { storyArchitectService, type GeneratedOutline } from '@/services/storyArchitectService';

import { StoryArchitectFlow } from './StoryArchitectFlow';

interface StoryArchitectDemoProps {
  onNavigateToTimeline?: () => void;
  onNavigateToWriting?: () => void;
}

export const StoryArchitectDemo: React.FC<StoryArchitectDemoProps> = ({
  onNavigateToTimeline,
  onNavigateToWriting: _onNavigateToWriting,
}) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  const [showArchitectFlow, setShowArchitectFlow] = useState(false);
  const [generatedOutlines, setGeneratedOutlines] = useState<GeneratedOutline[]>([]);

  const handleOutlineComplete = async (outline: GeneratedOutline) => {
    setGeneratedOutlines((prev) => [...prev, outline]);
    setShowArchitectFlow(false);

    showToast('Story outline integrated successfully!', 'success');

    // Optional: Navigate to different views
    if (onNavigateToTimeline) {
      setTimeout(() => {
        showToast('Check out your story timeline!', 'info');
      }, 2000);
    }
  };

  const isAvailable = storyArchitectService.isAvailable();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-4">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Story Architect
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Transform your story ideas into comprehensive outlines with detailed characters, chapters,
          and scenes. Powered by Claude AI and integrated with Inkwell's timeline system.
        </p>
      </div>

      {/* Status and Action */}
      <div className="max-w-4xl mx-auto">
        {!isAvailable ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Setup Required
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              {storyArchitectService.getSetupMessage()}
            </p>
            <button
              onClick={() => {
                // You could navigate to settings here
                showToast('Please configure your Claude API key in Settings', 'info');
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Go to Settings
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Action */}
            <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">
                Generate Your Story Outline
              </h3>
              <p className="text-purple-700 dark:text-purple-300 mb-6">
                Start with just your story premise and let Claude create a complete outline with
                characters, chapters, scenes, and timeline integration. Perfect for overcoming
                writer's block or exploring new story directions.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setShowArchitectFlow(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Wand2 className="w-5 h-5" />
                  Start Story Architect
                </button>

                {currentProject && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 text-center">
                    Will integrate with: "{currentProject.name}"
                  </p>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Complete Outlines
                  </h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Chapters, scenes, and detailed breakdowns
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Character Arcs</h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Rich character profiles with development stages
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">
                    Timeline Integration
                  </h4>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Visual story mapping and event tracking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Previous Outlines */}
        {generatedOutlines.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Outlines
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {generatedOutlines.map((outline, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {outline.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{outline.summary}</p>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{outline.chapters.length} chapters</span>
                    <span>{outline.characters.length} characters</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tips for Best Results
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Be Specific</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provide clear premises with conflict, stakes, and main character details
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Use Advanced Options
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure POV style, character count, and development depth for tailored results
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Review & Refine</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generated outlines are starting points - customize them to fit your vision
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Integrate Smartly</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose integration options that work with your existing project structure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Architect Flow Modal */}
      {showArchitectFlow && (
        <StoryArchitectFlow
          initialProject={currentProject}
          onComplete={handleOutlineComplete}
          onClose={() => setShowArchitectFlow(false)}
        />
      )}
    </div>
  );
};

export default StoryArchitectDemo;
