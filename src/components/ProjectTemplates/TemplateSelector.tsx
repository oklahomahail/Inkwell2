// src/components/ProjectTemplates/TemplateSelector.tsx
import { BookOpen, Zap, Heart, Rocket, Check, ArrowRight, X } from 'lucide-react';
import React, { useState } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { PROJECT_TEMPLATES } from '@/data/sampleProject';

import { ChapterStatus } from '../../domain/types';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  icon: React.ElementType;
  color: string;
  features: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedLength: string;
  chapters: Array<{ title: string }>;
  characters: Array<{ name: string; role: string }>;
  beatSheet: Array<{ title: string; description: string }>;
}

const TEMPLATE_OPTIONS: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start completely fresh with an empty project',
    genre: 'Any',
    icon: BookOpen,
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    features: ['Complete creative freedom', 'No predefined structure', 'Build from scratch'],
    difficulty: 'Beginner',
    estimatedLength: 'Any length',
    chapters: [],
    characters: [],
    beatSheet: [],
  },
  {
    id: 'mystery',
    name: 'Mystery Novel',
    description: 'Classic detective story with clues, suspects, and resolution',
    genre: 'Mystery',
    icon: Zap,
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    features: ['Crime setup structure', 'Character suspect templates', 'Clue tracking system'],
    difficulty: 'Intermediate',
    estimatedLength: '60,000-80,000 words',
    chapters: PROJECT_TEMPLATES.mystery.chapters,
    characters: PROJECT_TEMPLATES.mystery.characters,
    beatSheet: PROJECT_TEMPLATES.mystery.beatSheet,
  },
  {
    id: 'romance',
    name: 'Romance Novel',
    description: 'Love story with emotional beats and character development',
    genre: 'Romance',
    icon: Heart,
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    features: ['Romance arc structure', 'Relationship milestones', 'Emotional beat tracking'],
    difficulty: 'Beginner',
    estimatedLength: '50,000-90,000 words',
    chapters: PROJECT_TEMPLATES.romance.chapters,
    characters: PROJECT_TEMPLATES.romance.characters,
    beatSheet: PROJECT_TEMPLATES.romance.beatSheet,
  },
  {
    id: 'scifi',
    name: 'Science Fiction',
    description: 'Futuristic or speculative fiction with advanced concepts',
    genre: 'Science Fiction',
    icon: Rocket,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    features: ['World-building framework', 'Technology tracking', 'Character development'],
    difficulty: 'Advanced',
    estimatedLength: '70,000-120,000 words',
    chapters: PROJECT_TEMPLATES.scifi.chapters,
    characters: PROJECT_TEMPLATES.scifi.characters,
    beatSheet: PROJECT_TEMPLATES.scifi.beatSheet,
  },
];

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const { addProject, setCurrentProjectId, dispatch } = useAppContext();

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);

    // Auto-populate project name based on template
    const timestamp = new Date().toLocaleDateString();
    setProjectName(`${template.name} - ${timestamp}`);
    setProjectDescription(template.description);
  };

  const createProjectFromTemplate = () => {
    if (!selectedTemplate) return;

    const newProject = {
      id: `project-${Date.now()}`,
      name: projectName || selectedTemplate.name,
      description: projectDescription || selectedTemplate.description,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      genre: selectedTemplate.genre,
      chapters: selectedTemplate.chapters.map((chapter, index) => ({
        id: `chapter-${index + 1}`,
        title: chapter.title,
        order: index + 1,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      characters: selectedTemplate.characters.map((character, index) => ({
        id: `character-${index + 1}`,
        name: character.name,
        role: character.role,
        description: '',
        traits: [],
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      })),
      beatSheet: selectedTemplate.beatSheet.map((beat, index) => ({
        id: `beat-${index + 1}`,
        title: beat.title,
        description: beat.description,
        type: 'plot',
        order: index + 1,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };

    // Convert to AppContext Project format
    const contextProject = {
      ...newProject,
      createdAt: newProject.createdAt.getTime(),
      updatedAt: newProject.updatedAt.getTime(),
      characters: [] as never[],
      beatSheet: newProject.beatSheet as never[],
    };
    addProject(contextProject);
    setCurrentProjectId(newProject.id);

    // Navigate to appropriate view based on template
    if (selectedTemplate.id === 'blank') {
      dispatch({ type: 'SET_VIEW', payload: View.Writing });
    } else {
      dispatch({ type: 'SET_VIEW', payload: View.Timeline }); // Show structure first
    }

    onSelect?.(selectedTemplate.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Choose a Template
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Start with a structure designed for your genre
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Template Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATE_OPTIONS.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">{template.genre}</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Difficulty:</span>
                        <span
                          className={`px-2 py-1 rounded ${
                            template.difficulty === 'Beginner'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : template.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {template.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Length:</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {template.estimatedLength}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {template.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-1 h-1 bg-primary-500 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Details & Project Setup */}
          {selectedTemplate && (
            <div className="w-80 bg-slate-50 dark:bg-slate-800/50 p-6 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedTemplate.color}`}
                  >
                    <selectedTemplate.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-slate-500">{selectedTemplate.genre}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {selectedTemplate.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Includes:
                  </h4>
                  <ul className="space-y-1">
                    {selectedTemplate.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Structure Preview */}
                {selectedTemplate.id !== 'blank' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Chapters ({selectedTemplate.chapters.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedTemplate.chapters.slice(0, 3).map((chapter, index) => (
                          <div
                            key={index}
                            className="text-xs text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded"
                          >
                            {chapter.title}
                          </div>
                        ))}
                        {selectedTemplate.chapters.length > 3 && (
                          <div className="text-xs text-slate-400 px-2">
                            +{selectedTemplate.chapters.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Characters ({selectedTemplate.characters.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedTemplate.characters.slice(0, 3).map((character, index) => (
                          <div
                            key={index}
                            className="text-xs text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded flex items-center justify-between"
                          >
                            <span>{character.name}</span>
                            <span className="text-slate-400">{character.role}</span>
                          </div>
                        ))}
                        {selectedTemplate.characters.length > 3 && (
                          <div className="text-xs text-slate-400 px-2">
                            +{selectedTemplate.characters.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                    placeholder="Brief description of your story"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={createProjectFromTemplate}
                disabled={!projectName.trim()}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Create Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
