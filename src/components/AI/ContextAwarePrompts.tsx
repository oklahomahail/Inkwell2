// Context-Aware Prompts Enhancement
// Provides intelligent AI prompts based on current writing context

import { BookOpen, Users, MapPin, Clock, Lightbulb, Target } from 'lucide-react';
import React, { useMemo } from 'react';

import { useAppContext } from '@/context/AppContext';

export interface ContextAwarePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
  contextType: 'chapter' | 'scene' | 'character' | 'project' | 'selection';
  priority: number;
}

interface ContextAwarePromptsProps {
  selectedText?: string;
  currentChapter?: any;
  currentScene?: any;
  onPromptSelect: (prompt: ContextAwarePrompt) => void;
  className?: string;
}

export const ContextAwarePrompts: React.FC<ContextAwarePromptsProps> = ({
  selectedText,
  currentChapter,
  currentScene,
  onPromptSelect,
  className = '',
}) => {
  const { currentProject } = useAppContext();

  const contextualPrompts = useMemo(() => {
    const prompts: ContextAwarePrompt[] = [];

    // Project-level context prompts
    if (currentProject) {
      prompts.push({
        id: 'project-theme-analysis',
        title: 'Analyze Project Themes',
        description: `Identify and analyze the main themes in "${currentProject.name}"`,
        prompt: `Analyze the main themes, motifs, and underlying messages in this story: "${currentProject.name}". ${currentProject.description ? `Context: ${currentProject.description}` : ''}. What are the key themes being explored and how effectively are they woven throughout the narrative?`,
        icon: <Target className="w-4 h-4" />,
        contextType: 'project',
        priority: 3,
      });

      prompts.push({
        id: 'project-pacing-analysis',
        title: 'Review Story Pacing',
        description: 'Get feedback on the overall pacing and story flow',
        prompt: `Review the pacing and story flow of "${currentProject.name}". Are there areas that feel rushed or too slow? How can the narrative momentum be improved?`,
        icon: <Clock className="w-4 h-4" />,
        contextType: 'project',
        priority: 4,
      });
    }

    // Chapter-level context prompts
    if (currentChapter) {
      prompts.push({
        id: 'chapter-purpose-analysis',
        title: 'Analyze Chapter Purpose',
        description: `Review the narrative function of "${currentChapter.title}"`,
        prompt: `Analyze the narrative purpose and effectiveness of this chapter: "${currentChapter.title}". What story goals does it accomplish? How does it advance the plot and develop characters? What could be strengthened?`,
        icon: <BookOpen className="w-4 h-4" />,
        contextType: 'chapter',
        priority: 2,
      });

      prompts.push({
        id: 'chapter-transition',
        title: 'Improve Chapter Transitions',
        description: 'Enhance the flow between chapters',
        prompt: `How can I improve the transition into and out of "${currentChapter.title}"? Suggest ways to create better narrative flow and maintain reader engagement across chapter boundaries.`,
        icon: <Lightbulb className="w-4 h-4" />,
        contextType: 'chapter',
        priority: 3,
      });
    }

    // Scene-level context prompts
    if (currentScene) {
      prompts.push({
        id: 'scene-conflict-analysis',
        title: 'Enhance Scene Conflict',
        description: `Intensify the conflict and tension in this scene`,
        prompt: `Analyze the conflict and tension in this scene. How can I heighten the stakes, increase emotional impact, and make the conflict more compelling? What obstacles or complications could be added?`,
        icon: <Target className="w-4 h-4" />,
        contextType: 'scene',
        priority: 1,
      });

      prompts.push({
        id: 'scene-setting-enhancement',
        title: 'Enhance Scene Setting',
        description: 'Improve the atmospheric and setting details',
        prompt: `How can I enhance the setting and atmosphere of this scene? Suggest specific sensory details, environmental elements, and atmospheric touches that would make the scene more immersive and support the emotional tone.`,
        icon: <MapPin className="w-4 h-4" />,
        contextType: 'scene',
        priority: 2,
      });
    }

    // Selection-based context prompts
    if (selectedText && selectedText.trim().length > 10) {
      const textPreview =
        selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText;

      prompts.push({
        id: 'selection-character-voice',
        title: 'Strengthen Character Voice',
        description: `Enhance the character voice in selected text`,
        prompt: `Analyze and enhance the character voice in this passage: "${selectedText}". Make the dialogue and internal thoughts more distinct and authentic to this character. What specific voice patterns, speech habits, or thought processes could be emphasized?`,
        icon: <Users className="w-4 h-4" />,
        contextType: 'selection',
        priority: 1,
      });

      prompts.push({
        id: 'selection-show-dont-tell',
        title: 'Convert to "Show Don\'t Tell"',
        description: `Transform exposition into vivid scenes`,
        prompt: `Transform this text into a "show don't tell" approach: "${selectedText}". Replace exposition with concrete actions, dialogue, sensory details, and scenes that demonstrate the same information through character behavior and environmental details.`,
        icon: <BookOpen className="w-4 h-4" />,
        contextType: 'selection',
        priority: 1,
      });

      prompts.push({
        id: 'selection-emotional-depth',
        title: 'Add Emotional Depth',
        description: `Enhance the emotional resonance of selected text`,
        prompt: `Enhance the emotional depth and resonance of this passage: "${selectedText}". Add internal thoughts, physical reactions, sensory details, and subtle character behaviors that convey deeper emotional layers without being heavy-handed.`,
        icon: <Target className="w-4 h-4" />,
        contextType: 'selection',
        priority: 1,
      });

      // Short text prompts
      if (selectedText.length < 200) {
        prompts.push({
          id: 'selection-expand-moment',
          title: 'Expand This Moment',
          description: `Develop this moment with more detail`,
          prompt: `Expand and develop this moment: "${selectedText}". Add sensory details, internal thoughts, environmental context, and character reactions to make this moment more vivid and impactful. Show the reader more about what's happening physically and emotionally.`,
          icon: <Lightbulb className="w-4 h-4" />,
          contextType: 'selection',
          priority: 2,
        });
      }

      // Long text prompts
      if (selectedText.length > 500) {
        prompts.push({
          id: 'selection-tighten-prose',
          title: 'Tighten Prose',
          description: `Make the writing more concise and impactful`,
          prompt: `Tighten and streamline this passage: "${textPreview}". Remove unnecessary words, strengthen weak verbs, eliminate redundancy, and make every sentence count while preserving the meaning and tone.`,
          icon: <Target className="w-4 h-4" />,
          contextType: 'selection',
          priority: 2,
        });
      }
    }

    // Character-focused prompts when characters are available
    if (currentProject?.characters && currentProject.characters.length > 0) {
      prompts.push({
        id: 'character-development-analysis',
        title: 'Character Development Review',
        description: 'Analyze character growth and development',
        prompt: `Analyze the character development in my story so far. Which characters feel well-developed and which need more depth? How can I strengthen character arcs and make personalities more distinct and compelling?`,
        icon: <Users className="w-4 h-4" />,
        contextType: 'character',
        priority: 3,
      });
    }

    // Sort by priority (lower number = higher priority) and contextType relevance
    return prompts.sort((a, b) => {
      // Prioritize by context relevance first
      const contextPriority = {
        selection: 1,
        scene: 2,
        chapter: 3,
        character: 4,
        project: 5,
      };

      const aContextPriority = contextPriority[a.contextType];
      const bContextPriority = contextPriority[b.contextType];

      if (aContextPriority !== bContextPriority) {
        return aContextPriority - bContextPriority;
      }

      // Then by individual priority
      return a.priority - b.priority;
    });
  }, [selectedText, currentChapter, currentScene, currentProject]);

  // Group prompts by context type for better organization
  const groupedPrompts = useMemo(() => {
    return contextualPrompts.reduce(
      (groups, prompt) => {
        const group = groups[prompt.contextType] || [];
        group.push(prompt);
        groups[prompt.contextType] = group;
        return groups;
      },
      {} as Record<string, ContextAwarePrompt[]>,
    );
  }, [contextualPrompts]);

  const getContextTypeLabel = (contextType: string) => {
    const labels = {
      selection: 'Selected Text',
      scene: 'Current Scene',
      chapter: 'Current Chapter',
      character: 'Characters',
      project: 'Overall Story',
    };
    return labels[contextType as keyof typeof labels] || contextType;
  };

  const _getContextTypeDescription = (contextType: string) => {
    const descriptions = {
      selection: 'AI suggestions based on your selected text',
      scene: 'Scene-specific writing assistance',
      chapter: 'Chapter-level narrative analysis',
      character: 'Character development and voice',
      project: 'Story-wide themes and structure',
    };
    return descriptions[contextType as keyof typeof descriptions] || '';
  };

  if (contextualPrompts.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start writing or select text to see context-aware AI suggestions</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          Context-Aware Suggestions
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          AI prompts tailored to your current writing context
        </p>
      </div>

      {Object.entries(groupedPrompts).map(([contextType, prompts]) => (
        <div key={contextType} className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {getContextTypeLabel(contextType)}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {prompts.length} suggestion{prompts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {prompts.slice(0, 3).map(
              (
                prompt, // Show max 3 per category
              ) => (
                <button
                  key={prompt.id}
                  onClick={() => onPromptSelect(prompt)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {prompt.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-100">
                        {prompt.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      ))}

      {contextualPrompts.length > 9 && (
        <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing top suggestions • More available based on your context
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextAwarePrompts;
