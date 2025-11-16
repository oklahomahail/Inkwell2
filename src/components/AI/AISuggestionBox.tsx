// src/components/AI/AISuggestionBox.tsx
import { X, Send, Wand2, Sparkles, MessageCircle, Settings2, StopCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { AIDisclosureHint } from '@/components/AI/AIDisclosureHint';
import claudeService from '@/services/claudeService';

interface AISuggestionBoxProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  onInsert?: (text: string, mode: 'insert' | 'replace') => void;
}

type QuickPromptType = 'finish' | 'dialogue' | 'scene' | 'tighten';

export default function AISuggestionBox({
  isOpen,
  onClose,
  context,
  onInsert,
}: AISuggestionBoxProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<'claude' | 'gpt'>('claude');
  const [isConfigured, setIsConfigured] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Check if Claude API key is configured
  useEffect(() => {
    setIsConfigured(claudeService.isConfigured());
  }, []);

  // Auto-scroll as response grows
  useEffect(() => {
    if (outputRef.current && isStreaming) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [response, isStreaming]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setResponse('');
      setError(null);
      setIsStreaming(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  const handleQuickPrompt = useCallback(
    (type: QuickPromptType) => {
      const prompts: Record<QuickPromptType, string> = {
        finish: `Finish this passage naturally while keeping the tone consistent:\n\n"${context}"`,
        dialogue: `Refine this dialogue to sound natural and emotionally authentic:\n\n"${context}"`,
        scene: `Develop this scene with vivid sensory detail and forward motion:\n\n"${context}"`,
        tighten: `Tighten and polish this writing without losing voice:\n\n"${context}"`,
      };
      setPrompt(prompts[type]);
    },
    [context],
  );

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() && !context.trim()) {
      setError('Please provide some text or context');
      return;
    }

    if (!claudeService.isConfigured()) {
      setError('Claude API key not configured. Please set it up in Settings.');
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setResponse('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const input = prompt.trim() || `Improve or continue this text:\n\n${context}`;

      // Use Claude streaming service
      if (model === 'claude') {
        for await (const token of claudeService.generateStream(input, {
          signal: controller.signal,
          useFallback: true, // Enable fallback mode for unconfigured users
        })) {
          setResponse((prev) => prev + token);
        }
      } else {
        // GPT placeholder - implement when useOpenAI hook exists
        setError('GPT integration coming soon. Please use Claude for now.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream was cancelled by user - this is expected
      } else {
        console.error('AI Suggestion error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate suggestion');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [prompt, context, model]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  const handleInsert = (mode: 'insert' | 'replace') => {
    if (!response) return;

    if (onInsert) {
      onInsert(response, mode);
    } else {
      // Fallback: try to insert into the textarea directly
      const textarea = document.querySelector('textarea.writing-editor');
      if (textarea instanceof HTMLTextAreaElement) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        let newValue = '';
        if (mode === 'replace') {
          newValue = value.substring(0, start) + response + value.substring(end);
        } else {
          newValue = value.substring(0, end) + '\n\n' + response + '\n\n' + value.substring(end);
        }

        textarea.value = newValue;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 text-slate-100 w-[640px] max-h-[80vh] overflow-y-auto rounded-xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI Suggestion Assistant
        </h2>

        {/* API Key Status Banner */}
        {!isConfigured && (
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-200 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span>
                <strong>Basic Mode:</strong> Running without Claude API key. Add your API key in
                Settings for full AI-powered suggestions.
              </span>
            </p>
          </div>
        )}

        {/* Model selector */}
        <div className="flex items-center gap-3 mb-3">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <label className="text-sm text-slate-300">Model:</label>
          <select
            className="bg-slate-800 text-sm rounded-md px-2 py-1 border border-slate-700 focus:border-primary-500 focus:outline-none"
            value={model}
            onChange={(e) => setModel(e.target.value as 'claude' | 'gpt')}
            disabled={isLoading}
          >
            <option value="claude">Claude {!isConfigured && '(Basic Mode)'}</option>
            <option value="gpt" disabled>
              GPT (Coming Soon)
            </option>
          </select>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          <QuickButton
            icon={Wand2}
            label="Finish Thought"
            onClick={() => handleQuickPrompt('finish')}
            disabled={isLoading}
          />
          <QuickButton
            icon={MessageCircle}
            label="Improve Dialogue"
            onClick={() => handleQuickPrompt('dialogue')}
            disabled={isLoading}
          />
          <QuickButton
            icon={Sparkles}
            label="Develop Scene"
            onClick={() => handleQuickPrompt('scene')}
            disabled={isLoading}
          />
          <QuickButton
            icon={Wand2}
            label="Tighten Writing"
            onClick={() => handleQuickPrompt('tighten')}
            disabled={isLoading}
          />
        </div>

        {/* Context display (if available) */}
        {context && (
          <div className="mb-3 p-3 bg-slate-800/50 rounded-md border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">Selected context:</div>
            <div className="text-sm text-slate-300 line-clamp-3">{context}</div>
          </div>
        )}

        {/* User input */}
        <textarea
          className="w-full h-24 bg-slate-800 rounded-md p-3 text-sm resize-none border border-slate-700 focus:border-primary-500 focus:outline-none transition-colors"
          placeholder="Describe what you want help with or use a quick prompt… (Cmd+Enter to submit)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />

        {/* Error display */}
        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-md text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit/Cancel buttons */}
        <div className="flex justify-end mt-3 gap-2">
          {isStreaming ? (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!prompt.trim() && !context.trim())}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Thinking…' : 'Generate'}
            </button>
          )}
        </div>

        {/* Output */}
        {response && (
          <div className="mt-4 bg-slate-800 p-4 rounded-md border border-slate-700">
            <div
              ref={outputRef}
              className="text-sm whitespace-pre-wrap text-slate-100 max-h-64 overflow-y-auto"
            >
              {response}
              {isStreaming && <StreamingCursor />}
            </div>
            {!isStreaming && (
              <>
                <div className="flex gap-3 mt-4 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => handleInsert('insert')}
                    className="flex-1 text-primary-400 hover:text-primary-300 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-700/50 transition-colors"
                  >
                    Insert Below
                  </button>
                  <button
                    onClick={() => handleInsert('replace')}
                    className="flex-1 text-amber-400 hover:text-amber-300 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-700/50 transition-colors"
                  >
                    Replace Selection
                  </button>
                </div>

                {/* AI Disclosure Hint */}
                <AIDisclosureHint />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function QuickButton({ icon: Icon, label, onClick, disabled }: QuickButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs text-slate-300 border border-slate-700 transition-colors"
    >
      <Icon className="w-3 h-3 text-slate-400" />
      {label}
    </button>
  );
}

function StreamingCursor() {
  return <span className="inline-block w-1 h-4 bg-amber-400 ml-1 animate-pulse align-middle" />;
}
