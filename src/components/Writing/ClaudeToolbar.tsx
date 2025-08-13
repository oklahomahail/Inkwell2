// src/components/Writing/ClaudeToolbar.tsx - REPLACE your existing ClaudeToolbar
import React, { useState } from 'react';
import { useClaude } from '@/context/ClaudeProvider';
import { Sparkles, Brain, Eye, Zap, MessageSquare, Copy, Check } from 'lucide-react';

interface ClaudeToolbarProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
  sceneTitle?: string;
  currentContent?: string;
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: (text: string, context?: string) => string;
  color: string;
}

const ClaudeToolbar: React.FC<ClaudeToolbarProps> = ({
  selectedText = '',
  onInsertText,
  sceneTitle = '',
  currentContent = '',
}) => {
  const { sendMessage } = useClaude();
  const [lastResult, setLastResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>('');

  const quickPrompts: QuickPrompt[] = [
    {
      id: 'continue',
      label: 'Continue',
      icon: <Zap className="w-4 h-4" />,
      prompt: (text) =>
        `Continue this story naturally, maintaining the same tone and style. Write the next 1-2 paragraphs:\n\n"${text}"`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'improve',
      label: 'Improve',
      icon: <Sparkles className="w-4 h-4" />,
      prompt: (text) =>
        `Improve this text for clarity, flow, and engagement while maintaining the original meaning:\n\n"${text}"`,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'dialogue',
      label: 'Add Dialogue',
      icon: <MessageSquare className="w-4 h-4" />,
      prompt: (text) =>
        `Rewrite this scene to include natural dialogue that reveals character and advances the plot:\n\n"${text}"`,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      id: 'tension',
      label: 'Add Tension',
      icon: <Zap className="w-4 h-4" />,
      prompt: (text) =>
        `Rewrite this scene to increase dramatic tension and conflict:\n\n"${text}"`,
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      id: 'sensory',
      label: 'Add Details',
      icon: <Eye className="w-4 h-4" />,
      prompt: (text) =>
        `Enhance this scene with vivid sensory details and specific imagery:\n\n"${text}"`,
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      id: 'brainstorm',
      label: 'Brainstorm',
      icon: <Brain className="w-4 h-4" />,
      prompt: (text, context) =>
        `Based on this scene "${sceneTitle}" and content: "${text}", brainstorm 5 creative directions this story could take next.`,
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ];

  const handlePromptClick = async (promptConfig: QuickPrompt): Promise<void> => {
    const targetText = selectedText || currentContent || '';
    if (!targetText && promptConfig.id !== 'brainstorm') {
      setLastResult('Please select some text or write content first.');
      return;
    }

    setIsLoading(true);
    setActivePrompt(promptConfig.id);
    try {
      const prompt = promptConfig.prompt(targetText, sceneTitle);
      const result = await sendMessage(prompt);
      setLastResult(result);
    } catch (error) {
      console.error(`Failed to ${promptConfig.label.toLowerCase()}:`, error);
      setLastResult(`Error: Failed to ${promptConfig.label.toLowerCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
      setActivePrompt('');
    }
  };

  const handleInsert = (): void => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
      setLastResult('');
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (lastResult) {
      try {
        await navigator.clipboard.writeText(lastResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  const hasSelectedText = Boolean(selectedText);
  const hasContent = Boolean(currentContent);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">Claude Writing Assistant</h3>
        {hasSelectedText && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            {selectedText.length} chars selected
          </span>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {quickPrompts.map((promptConfig) => {
          const isDisabled = !hasSelectedText && !hasContent && promptConfig.id !== 'brainstorm';
          const isActive = activePrompt === promptConfig.id;

          return (
            <button
              key={promptConfig.id}
              onClick={() => handlePromptClick(promptConfig)}
              disabled={isDisabled || isLoading}
              className={`
                flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-all
                ${isActive ? 'opacity-75 animate-pulse' : ''}
                ${
                  isDisabled
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                    : promptConfig.color
                }
              `}
              title={isDisabled ? 'Select text or add content first' : ''}
            >
              {isActive && isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                promptConfig.icon
              )}
              {promptConfig.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {lastResult && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Claude's Suggestion:</h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {onInsertText && (
                <button
                  onClick={handleInsert}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Insert
                </button>
              )}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
            {lastResult}
          </div>
        </div>
      )}

      {/* Usage Tip */}
      {!hasSelectedText && !hasContent && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          💡 <strong>Tip:</strong> Select text in your scene or write some content to unlock AI
          assistance
        </div>
      )}
    </div>
  );
};

export default ClaudeToolbar;
