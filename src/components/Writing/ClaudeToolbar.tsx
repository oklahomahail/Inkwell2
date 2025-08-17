// src/components/Writing/ClaudeToolbar.tsx - Fixed Lucide React icons
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Eye, 
  Zap, 
  MessageSquare, 
  Copy, 
  Check, 
  RotateCcw,
  Users,
  ChevronUp,
  ChevronDown,
  Pin,
  PinOff,
  X
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';

interface ClaudeToolbarProps {
  selectedText?: string;
  onInsertText?: (text: string, replaceSelection?: boolean) => void;
  sceneTitle?: string;
  currentContent?: string;
  position?: 'panel' | 'popup';
  popupPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
}

interface QuickPrompt {
  id: string;
  label: string;
  shortLabel?: string; // For popup mode
  icon: string; // Changed to string identifier
  prompt: (text: string, context?: string) => string;
  color: string;
  category: 'enhance' | 'generate' | 'analyze';
  needsSelection?: boolean;
}

const ClaudeToolbar: React.FC<ClaudeToolbarProps> = ({
  selectedText = '',
  onInsertText,
  sceneTitle = '',
  currentContent = '',
  position = 'panel',
  popupPosition = { x: 0, y: 0 },
  onClose,
  className = '',
}) => {
  const { claudeActions } = useAppContext();
  const { showToast } = useToast();
  
  const [lastResult, setLastResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  // Icon mapping function
  const getIcon = (iconName: string) => {
    const icons = {
      Sparkles,
      Zap,
      RotateCcw,
      MessageSquare,
      Eye,
      Users,
      Brain,
    };
    return icons[iconName as keyof typeof icons] || Sparkles;
  };

  const quickPrompts: QuickPrompt[] = [
    // Enhancement actions (work best with selected text)
    {
      id: 'improve',
      label: 'Improve Writing',
      shortLabel: 'Improve',
      icon: 'Sparkles',
      prompt: (text) =>
        `Improve this text for clarity, flow, and engagement while maintaining the original meaning and voice:\n\n"${text}"`,
      color: 'bg-purple-600 hover:bg-purple-700',
      category: 'enhance',
      needsSelection: true,
    },
    {
      id: 'continue',
      label: 'Continue Writing',
      shortLabel: 'Continue',
      icon: 'Zap',
      prompt: (text) =>
        `Continue this story naturally from where it leaves off. Write the next 1-2 paragraphs, maintaining the same tone, style, and perspective:\n\n"${text}"`,
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'generate',
    },
    {
      id: 'rewrite',
      label: 'Rewrite Style',
      shortLabel: 'Rewrite',
      icon: 'RotateCcw',
      prompt: (text) =>
        `Rewrite this text with a different tone or style. Make it more engaging and vivid:\n\n"${text}"`,
      color: 'bg-green-600 hover:bg-green-700',
      category: 'enhance',
      needsSelection: true,
    },
    {
      id: 'dialogue',
      label: 'Add Dialogue',
      shortLabel: 'Dialogue',
      icon: 'MessageSquare',
      prompt: (text) =>
        `Rewrite this scene to include natural dialogue that reveals character and advances the plot:\n\n"${text}"`,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      category: 'enhance',
    },
    {
      id: 'sensory',
      label: 'Add Details',
      shortLabel: 'Details',
      icon: 'Eye',
      prompt: (text) =>
        `Enhance this scene with vivid sensory details, specific imagery, and atmospheric elements:\n\n"${text}"`,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      category: 'enhance',
    },
    {
      id: 'analyze',
      label: 'Analyze Writing',
      shortLabel: 'Analyze',
      icon: 'Eye',
      prompt: (text) =>
        `Analyze this writing for pacing, character development, dialogue quality, and plot advancement. Provide specific feedback:\n\n"${text}"`,
      color: 'bg-orange-600 hover:bg-orange-700',
      category: 'analyze',
    },
    {
      id: 'character',
      label: 'Character Development',
      shortLabel: 'Character',
      icon: 'Users',
      prompt: (text) =>
        `Analyze the character development in this text. Suggest ways to deepen character voice, motivation, and growth:\n\n"${text}"`,
      color: 'bg-pink-600 hover:bg-pink-700',
      category: 'analyze',
    },
    {
      id: 'brainstorm',
      label: 'Brainstorm Ideas',
      shortLabel: 'Ideas',
      icon: 'Brain',
      prompt: (text, context) =>
        `Based on this scene "${sceneTitle}" and content: "${text}", brainstorm 5 creative directions this story could take next. Consider plot twists, character conflicts, and dramatic possibilities.`,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      category: 'generate',
    },
  ];

  const handlePromptClick = async (promptConfig: QuickPrompt): Promise<void> => {
    const targetText = selectedText || currentContent || '';
    
    // Check if prompt needs selection but none exists
    if (promptConfig.needsSelection && !selectedText) {
      showToast('Please select text first for this action', 'error');
      return;
    }
    
    if (!targetText && promptConfig.id !== 'brainstorm') {
      showToast('Please select some text or write content first', 'error');
      return;
    }

    setIsLoading(true);
    setActivePrompt(promptConfig.id);
    
    try {
      const prompt = promptConfig.prompt(targetText, sceneTitle);
      let result: string;
      
      // Use appropriate Claude action based on prompt type
      switch (promptConfig.id) {
        case 'improve':
        case 'rewrite':
          result = await claudeActions.improveText(targetText);
          break;
        case 'continue':
          result = await claudeActions.suggestContinuation(targetText);
          break;
        case 'analyze':
          result = await claudeActions.analyzeWritingStyle(targetText);
          break;
        case 'character':
          result = claudeActions.analyzeCharacter 
            ? await claudeActions.analyzeCharacter(targetText)
            : await claudeActions.sendMessage(prompt);
          break;
        case 'brainstorm':
          result = await claudeActions.brainstormIdeas(targetText || `Scene: ${sceneTitle}`);
          break;
        default:
          result = await claudeActions.sendMessage(prompt);
      }
      
      setLastResult(result);
      
      // For analysis actions, also show Claude panel
      if (promptConfig.category === 'analyze') {
        claudeActions.toggleVisibility();
      }
      
    } catch (error) {
      console.error(`Failed to ${promptConfig.label.toLowerCase()}:`, error);
      setLastResult(`Error: Failed to ${promptConfig.label.toLowerCase()}. Please try again.`);
      showToast(`Failed to ${promptConfig.label.toLowerCase()}`, 'error');
    } finally {
      setIsLoading(false);
      setActivePrompt('');
    }
  };

  const handleInsert = (replaceSelection: boolean = false): void => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult, replaceSelection);
      setLastResult('');
      showToast(replaceSelection ? 'Text replaced' : 'Text inserted', 'success');
      
      // Close popup after insert
      if (position === 'popup' && onClose) {
        onClose();
      }
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (lastResult) {
      try {
        await navigator.clipboard.writeText(lastResult);
        setCopied(true);
        showToast('Copied to clipboard', 'success');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
        showToast('Failed to copy text', 'error');
      }
    }
  };

  // Filter prompts based on context
  const getFilteredPrompts = () => {
    if (position === 'popup' && selectedText) {
      // In popup mode with selection, prioritize enhancement actions
      return quickPrompts.filter(p => 
        p.category === 'enhance' || (p.category === 'analyze' && selectedText.length > 50)
      );
    }
    return quickPrompts;
  };

  const filteredPrompts = getFilteredPrompts();
  const hasSelectedText = Boolean(selectedText);
  const hasContent = Boolean(currentContent);

  // Popup positioning
  useEffect(() => {
    if (position === 'popup' && popupPosition.x && popupPosition.y) {
      // Position will be handled by parent component
    }
  }, [position, popupPosition]);

  const toolbarClasses = position === 'popup' 
    ? `fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`
    : `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`;

  const buttonGrid = position === 'popup' 
    ? 'grid grid-cols-2 gap-1'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2';

  return (
    <div 
      className={toolbarClasses}
      style={position === 'popup' ? { 
        left: popupPosition.x, 
        top: popupPosition.y,
        maxWidth: '320px'
      } : undefined}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} color="#a855f7" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {position === 'popup' ? 'AI Assistant' : 'Claude Writing Assistant'}
            </h3>
            {hasSelectedText && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                {selectedText.length} chars
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {position === 'panel' && (
              <>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                  title={isPinned ? 'Unpin toolbar' : 'Pin toolbar'}
                >
                  {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </>
            )}
            {position === 'popup' && onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        {isExpanded && (
          <div className={buttonGrid}>
            {filteredPrompts.map((promptConfig) => {
              const IconComponent = getIcon(promptConfig.icon);
              const isDisabled = promptConfig.needsSelection ? !hasSelectedText : (!hasSelectedText && !hasContent && promptConfig.id !== 'brainstorm');
              const isActive = activePrompt === promptConfig.id;
              const buttonLabel = position === 'popup' ? (promptConfig.shortLabel || promptConfig.label) : promptConfig.label;

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
                    ${position === 'popup' ? 'text-xs px-2 py-1' : ''}
                  `}
                  title={isDisabled ? 'Select text or add content first' : promptConfig.label}
                >
                  {isActive && isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IconComponent size={16} />
                  )}
                  <span className={position === 'popup' ? 'hidden sm:inline' : ''}>{buttonLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        {lastResult && isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Claude's Suggestion:</h4>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {onInsertText && (
                  <>
                    {selectedText && (
                      <button
                        onClick={() => handleInsert(true)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Replace
                      </button>
                    )}
                    <button
                      onClick={() => handleInsert(false)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Insert
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={`p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 overflow-y-auto ${position === 'popup' ? 'max-h-32' : 'max-h-40'}`}>
              {lastResult}
            </div>
          </div>
        )}

        {/* Usage Tip */}
        {!hasSelectedText && !hasContent && isExpanded && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
            💡 <strong>Tip:</strong> Select text in your scene or write some content to unlock AI assistance
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaudeToolbar;