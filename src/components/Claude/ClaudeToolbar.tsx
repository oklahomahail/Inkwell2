import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  FileText,
  MessageCircle,
  Heart,
  Zap,
  ArrowRight,
  Lightbulb,
  User,
  MapPin,
} from 'lucide-react';
import { useClaude } from '@/context/ClaudeProvider';

interface ClaudeToolbarProps {
  selectedText?: string;
  onTextInsert?: (text: string) => void;
  onTextReplace?: (newText: string) => void;
  className?: string;
}

interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  requiresSelection?: boolean;
  action: () => Promise<void>;
}

const ClaudeToolbar: React.FC<ClaudeToolbarProps> = ({
  selectedText,
  onTextInsert,
  onTextReplace,
  className = '',
}) => {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const { improveText, generatePlotIdeas, callClaude } = useClaude();

  const setActionLoading = (id: string, isLoading: boolean) => {
    setLoadingActions((prev) => {
      const copy = new Set(prev);
      isLoading ? copy.add(id) : copy.delete(id);
      return copy;
    });
  };

  const executeAction = async (id: string, fn: () => Promise<string>, replace = false) => {
    if (loadingActions.has(id)) return;
    setActionLoading(id, true);
    try {
      const result = await fn();
      replace ? onTextReplace?.(result) : onTextInsert?.(result);
    } catch (e) {
      console.error(`Action ${id} failed:`, e);
      alert(`Failed to ${id}. Try again.`);
    } finally {
      setActionLoading(id, false);
    }
  };

  const safeText = selectedText ?? '';

  const actions: ToolbarAction[] = [
    {
      id: 'improve',
      label: 'Improve',
      icon: Sparkles,
      description: 'Polish text clarity',
      requiresSelection: true,
      action: async () => executeAction('improve', () => improveText(safeText), true),
    },
    {
      id: 'rewrite',
      label: 'Rewrite',
      icon: RotateCcw,
      description: 'Rewrite differently',
      requiresSelection: true,
      action: async () =>
        executeAction(
          'rewrite',
          async () => callClaude(`Rewrite engagingly:\n\n${safeText}`),
          true,
        ),
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: FileText,
      description: 'Add detail',
      requiresSelection: true,
      action: async () =>
        executeAction('expand', async () => callClaude(`Expand detail:\n\n${safeText}`), true),
    },
    {
      id: 'dialogue',
      label: 'Dialogue',
      icon: MessageCircle,
      description: 'Add dialogue',
      requiresSelection: true,
      action: async () =>
        executeAction('dialogue', async () => callClaude(`Add dialogue:\n\n${safeText}`), true),
    },
    {
      id: 'ideas',
      label: 'Plot Ideas',
      icon: Lightbulb,
      description: 'Generate ideas',
      action: async () => executeAction('ideas', () => generatePlotIdeas()),
    },
  ];

  const getButtonClass = (action: ToolbarAction) => {
    const base =
      'flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 border shadow-sm';
    const disabled = action.requiresSelection && !selectedText;
    const loading = loadingActions.has(action.id);
    if (disabled) return `${base} bg-gray-100 text-gray-400 cursor-not-allowed`;
    if (loading) return `${base} bg-blue-100 text-blue-700 cursor-wait animate-pulse`;
    return `${base} bg-white text-gray-700 hover:bg-blue-50 border-gray-200 cursor-pointer hover:shadow-md`;
  };

  return (
    <div className={`bg-gray-50 border-t p-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {actions.map(({ id, label, icon: Icon, description, requiresSelection, action }) => {
          const disabled = requiresSelection && !selectedText;
          const loading = loadingActions.has(id);
          return (
            <div
              key={id}
              className="relative"
              onMouseEnter={() => setShowTooltip(id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <button
                onClick={action}
                disabled={disabled || loading}
                className={getButtonClass({
                  id,
                  label,
                  icon: Icon,
                  description,
                  requiresSelection,
                  action,
                })}
              >
                <Icon size={16} className={`mr-2 ${loading ? 'animate-pulse' : ''}`} />
                <span>{loading ? 'Working…' : label}</span>
              </button>
              {showTooltip === id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                  {description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClaudeToolbar;
