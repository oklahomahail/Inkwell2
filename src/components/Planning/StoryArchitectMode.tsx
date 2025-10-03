// src/components/Planning/StoryArchitectMode.tsx
import { Wand2, BookOpen, Target, Palette, MapPin, Lightbulb } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../hooks/useLoading';
import {
  storyArchitectService,
  type StoryPremise,
  type GeneratedOutline,
} from '../../services/storyArchitectService';

interface StoryArchitectModeProps {
  onOutlineGenerated: (outline: GeneratedOutline) => void;
  onClose: () => void;
}

export const StoryArchitectMode: React.FC<StoryArchitectModeProps> = ({
  onOutlineGenerated,
  onClose,
}) => {
  const [premise, setPremise] = useState<StoryPremise>({
    title: '',
    genre: '',
    premise: '',
    targetLength: 'novel',
    tone: '',
    themes: [],
    setting: '',
  });

  const [currentTheme, setCurrentTheme] = useState('');
  const { showToast } = useToast();
  const { isLoading: _isLoading } = useLoading();

  // Local loading state since useLoading doesn't have setIsLoading
  const [isGenerating, setIsGenerating] = useState(false);

  // Simple loading wrapper
  const withLoading = async (fn: () => Promise<void>) => {
    setIsGenerating(true);
    try {
      await fn();
    } finally {
      setIsGenerating(false);
    }
  };

  const genres = [
    'Fantasy',
    'Science Fiction',
    'Mystery',
    'Thriller',
    'Romance',
    'Literary Fiction',
    'Historical Fiction',
    'Horror',
    'Adventure',
    'Young Adult',
    'Contemporary Fiction',
    'Dystopian',
    'Urban Fantasy',
  ];

  const tones = [
    'Dark and Gritty',
    'Light and Humorous',
    'Epic and Grand',
    'Intimate and Personal',
    'Fast-paced and Action-packed',
    'Contemplative and Philosophical',
    'Romantic and Emotional',
    'Mysterious and Suspenseful',
    'Satirical and Witty',
  ];

  const addTheme = () => {
    if (currentTheme.trim() && !premise.themes?.includes(currentTheme.trim())) {
      setPremise((prev) => ({
        ...prev,
        themes: [...(prev.themes || []), currentTheme.trim()],
      }));
      setCurrentTheme('');
    }
  };

  const removeTheme = (theme: string) => {
    setPremise((prev) => ({
      ...prev,
      themes: prev.themes?.filter((t) => t !== theme) || [],
    }));
  };

  const handleGenerate = async () => {
    if (!premise.title.trim() || !premise.genre || !premise.premise.trim()) {
      showToast('Please fill in title, genre, and premise', 'error');
      return;
    }

    await withLoading(async () => {
      try {
        const outline = await storyArchitectService.generateOutline(premise);
        onOutlineGenerated(outline);
        showToast('Story outline generated successfully!', 'success');
      } catch (error) {
        console.error('Generation failed:', error);
        showToast('Failed to generate outline. Please try again.', 'error');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Wand2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Story Architect Mode
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate a complete story outline from your premise
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <BookOpen className="w-4 h-4" />
                Story Title
              </label>
              <input
                type="text"
                value={premise.title}
                onChange={(e) => setPremise((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your story title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Genre and Length */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <Target className="w-4 h-4" />
                  Genre
                </label>
                <select
                  value={premise.genre}
                  onChange={(e) => setPremise((prev) => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select genre...</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Target Length
                </label>
                <select
                  value={premise.targetLength}
                  onChange={(e) =>
                    setPremise((prev) => ({ ...prev, targetLength: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="short">Short Story (10-40k words)</option>
                  <option value="novella">Novella (40-70k words)</option>
                  <option value="novel">Novel (70-120k words)</option>
                  <option value="epic">Epic (120k+ words)</option>
                </select>
              </div>
            </div>

            {/* Premise */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Lightbulb className="w-4 h-4" />
                Story Premise
              </label>
              <textarea
                value={premise.premise}
                onChange={(e) => setPremise((prev) => ({ ...prev, premise: e.target.value }))}
                placeholder="Describe your story idea in 2-3 sentences. What happens? Who are the main characters? What's at stake?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Tone and Setting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <Palette className="w-4 h-4" />
                  Tone
                </label>
                <select
                  value={premise.tone}
                  onChange={(e) => setPremise((prev) => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select tone...</option>
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <MapPin className="w-4 h-4" />
                  Setting (Optional)
                </label>
                <input
                  type="text"
                  value={premise.setting}
                  onChange={(e) => setPremise((prev) => ({ ...prev, setting: e.target.value }))}
                  placeholder="e.g., Medieval England, Future Mars, Modern NYC..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Themes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Themes (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTheme())}
                  placeholder="Add themes like 'redemption', 'power', 'love'..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addTheme}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Add
                </button>
              </div>
              {premise.themes && premise.themes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {premise.themes.map((theme) => (
                    <span
                      key={theme}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md text-sm"
                    >
                      {theme}
                      <button
                        onClick={() => removeTheme(theme)}
                        className="hover:text-purple-900 dark:hover:text-purple-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating || !premise.title.trim() || !premise.genre || !premise.premise.trim()
              }
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Outline
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
