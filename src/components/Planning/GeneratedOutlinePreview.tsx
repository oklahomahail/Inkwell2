// src/components/Planning/GeneratedOutlinePreview.tsx
import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  List,
  ChevronDown,
  ChevronRight,
  Check,
  Edit3,
  Target,
  Clock,
  User,
} from 'lucide-react';

import { type GeneratedOutline } from '../../services/storyArchitectService';

interface GeneratedOutlinePreviewProps {
  outline: GeneratedOutline;
  onAccept: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export const GeneratedOutlinePreview: React.FC<GeneratedOutlinePreviewProps> = ({
  outline,
  onAccept,
  onRegenerate,
  onClose,
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'characters'>('overview');

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const totalWords = outline.chapters.reduce((sum, chapter) => sum + chapter.wordTarget, 0);
  const totalScenes = outline.chapters.reduce((sum, chapter) => sum + chapter.scenes.length, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{outline.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {outline.genre} • {totalWords.toLocaleString()} words • {outline.chapters.length}{' '}
                chapters
              </p>
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {outline.chapters.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Chapters</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalScenes}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Scenes</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {outline.characters.length}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Characters</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(totalWords / 1000)}k
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Words</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'chapters', label: 'Chapters', icon: List },
              { id: 'characters', label: 'Characters', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Story Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {outline.summary}
                </p>
              </div>

              {/* Themes */}
              {outline.themes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Themes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {outline.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Plot Points */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Key Plot Points
                </h3>
                <div className="space-y-2">
                  {outline.plotPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-4">
              {outline.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleChapter(index)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedChapters.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Chapter {index + 1}: {chapter.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {chapter.plotFunction} • {chapter.scenes.length} scenes •{' '}
                          {chapter.wordTarget.toLocaleString()} words
                        </p>
                      </div>
                    </div>
                  </button>

                  {expandedChapters.has(index) && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{chapter.summary}</p>

                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Scenes:</h5>
                        {chapter.scenes.map((scene, sceneIndex) => (
                          <div
                            key={sceneIndex}
                            className="pl-4 border-l-2 border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-800 dark:text-gray-200">
                                  {scene.title}
                                </h6>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {scene.summary}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {scene.characters.join(', ')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {scene.purpose}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {scene.wordTarget} words
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="grid gap-4">
              {outline.characters.map((character, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {character.name}
                      </h4>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          character.role === 'protagonist'
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : character.role === 'antagonist'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : character.role === 'supporting'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {character.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {character.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Motivation
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {character.motivation}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Conflict
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {character.conflict}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Character Arc
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{character.arc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Regenerate
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onAccept}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Accept & Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
