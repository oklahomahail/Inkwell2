// src/components/ClaudeAssistant.tsx
import { BoltIcon, MessageCircleIcon, SearchIcon } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useClaude } from '@/context/ClaudeProvider';
import { useToast } from '@/context/toast';

import AccessibleTabs from './AccessibleTabs';
import { StatusBadge, LoadingIndicator, TypingIndicator } from './Claude';
import MessageBubble from './MessageBubble';

interface ClaudeAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

const ClaudeAssistant: React.FC<ClaudeAssistantProps> = ({ selectedText = '', onInsertText }) => {
  const {
    claude: { messages, isLoading, error, isConfigured },
    sendMessage,
    toggleVisibility,
    clearMessages,
  } = useClaude();

  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'quick-actions' | 'analysis'>('chat');
  const [lastResult, setLastResult] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isMinimized && activeMode === 'chat') {
      inputRef.current?.focus();
    }
  }, [isMinimized, activeMode]);

  useEffect(() => {
    if (lastResult && onInsertText) {
      insertButtonRef.current?.focus();
    }
  }, [lastResult, onInsertText]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    if (!isConfigured) {
      showToast('Please configure your Claude API key in Settings first', 'error');
      return;
    }

    try {
      await sendMessage(input);
      setInput('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      showToast(errorMessage, 'error');
    }
  }, [input, isLoading, isConfigured, sendMessage, showToast]);

  const handleQuickAction = useCallback(
    async (action: string) => {
      if (isLoading) return;

      if (!isConfigured) {
        showToast('Please configure your Claude API key in Settings first', 'error');
        return;
      }

      try {
        let description = '';
        switch (action) {
          case 'continue':
            if (!selectedText) return showToast('Please select text to continue', 'error');
            description = `Continue this text naturally: "${selectedText.slice(
              0,
              100,
            )}${selectedText.length > 100 ? '...' : ''}"`;
            break;
          case 'improve':
            if (!selectedText) return showToast('Please select text to improve', 'error');
            description = `Improve this text for clarity and engagement: "${selectedText.slice(
              0,
              100,
            )}${selectedText.length > 100 ? '...' : ''}"`;
            break;
          case 'analyze-style':
            if (!selectedText) return showToast('Please select text to analyze', 'error');
            description = `Analyze the writing style of this text: "${selectedText.slice(
              0,
              100,
            )}${selectedText.length > 100 ? '...' : ''}"`;
            break;
          case 'plot-ideas':
            description = selectedText
              ? `Generate plot ideas based on this text: "${selectedText.slice(
                  0,
                  100,
                )}${selectedText.length > 100 ? '...' : ''}"`
              : 'Generate creative plot ideas for a story';
            break;
          case 'character-analysis':
            if (!characterName.trim()) return showToast('Please enter character name', 'error');
            description = `Analyze the character "${characterName}" and suggest development ideas`;
            setCharacterName('');
            break;
          case 'brainstorm':
            if (!brainstormTopic.trim())
              return showToast('Please enter topic to brainstorm', 'error');
            description = `Brainstorm creative ideas about: ${brainstormTopic}`;
            setBrainstormTopic('');
            break;
          default:
            return;
        }

        const result = await sendMessage(description);
        setLastResult(result);
        showToast('Claude provided suggestions', 'success');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Action failed. Please try again.';
        showToast(errorMessage, 'error');
      }
    },
    [isLoading, isConfigured, selectedText, characterName, brainstormTopic, sendMessage, showToast],
  );

  const handleInsert = () => {
    if (onInsertText && lastResult) {
      onInsertText(lastResult);
      showToast('Text inserted into your draft', 'success');
      setLastResult('');
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-[#0073E6] text-white rounded-full shadow-2xl hover:bg-blue-500 transition-colors flex items-center justify-center relative"
          aria-label="Open Claude Assistant"
        >
          <MessageCircleIcon size={24} />
          {!isConfigured && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </button>
      </div>
    );
  }

  const handleTabChange = (id: string) => {
    if (id === 'chat' || id === 'quick-actions' || id === 'analysis') {
      setActiveMode(id);
    }
  };

  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageCircleIcon size={14} />,
      content: (
        <>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-600 select-none">
                <div className="mb-2" aria-hidden="true">
                  👋
                </div>
                <p>Start a conversation with Claude!</p>
                <p className="text-xs text-gray-500 mt-1">
                  I have full context of your writing project.
                </p>
                <p className="text-xs text-gray-500 mt-2 opacity-75">
                  💡 Tip: Use Ctrl+Enter to send messages
                </p>
                {!isConfigured && (
                  <p className="text-xs text-red-400 mt-3 bg-red-900/20 p-2 rounded">
                    ⚠️ API key not configured. Go to Settings to set up Claude.
                  </p>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || !isConfigured}
                placeholder={
                  !isConfigured
                    ? 'Configure API key in Settings first...'
                    : selectedText
                      ? `Ask about: "${selectedText.slice(0, 20)}..."`
                      : 'Ask Claude about your writing... (Ctrl+Enter to send)'
                }
                className="flex-1 px-3 py-2 rounded-md bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50 transition-colors text-sm"
                aria-label="Chat input"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !isConfigured}
                className="px-4 py-2 bg-[#0073E6] text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                aria-label="Send message"
              >
                {isLoading ? <LoadingIndicator size="sm" message="" /> : 'Send'}
              </button>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'quick-actions',
      label: 'Quick',
      icon: <BoltIcon size={14} />,
      content: (
        <div className="p-4 space-y-3">
          {!isConfigured && (
            <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mb-4">
              ⚠️ Configure your Claude API key in Settings to use Quick Actions.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleQuickAction('continue')}
              disabled={isLoading || !selectedText || !isConfigured}
              className="px-3 py-2 text-xs bg-[#0073E6] text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText || !isConfigured}
            >
              📝 Continue Text
            </button>
            <button
              onClick={() => handleQuickAction('improve')}
              disabled={isLoading || !selectedText || !isConfigured}
              className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText || !isConfigured}
            >
              ✨ Improve Text
            </button>
            <button
              onClick={() => handleQuickAction('analyze-style')}
              disabled={isLoading || !selectedText || !isConfigured}
              className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText || !isConfigured}
            >
              🎨 Analyze Style
            </button>
            <button
              onClick={() => handleQuickAction('plot-ideas')}
              disabled={isLoading || !isConfigured}
              className="px-3 py-2 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !isConfigured}
            >
              💡 Plot Ideas
            </button>
          </div>

          {!selectedText && isConfigured && (
            <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded select-none">
              💡 Select text in your document to enable text-specific actions
            </div>
          )}

          {lastResult && onInsertText && (
            <div className="border border-gray-600 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-[#0073E6]">
                  Claude&apos;s Suggestion:
                </span>
                <button
                  ref={insertButtonRef}
                  onClick={handleInsert}
                  className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-400 transition-colors focus:ring-2 focus:ring-yellow-300"
                  aria-label="Insert Claude&aposs suggestion into draft"
                >
                  Insert
                </button>
              </div>
              <div className="text-xs text-gray-300 max-h-20 overflow-y-auto whitespace-pre-wrap">
                {lastResult.length > 200 ? lastResult.slice(0, 200) + '...' : lastResult}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <SearchIcon size={14} />,
      content: (
        <div className="p-4 space-y-4">
          {!isConfigured && (
            <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mb-4">
              ⚠️ Configure your Claude API key in Settings to use Analysis tools.
            </div>
          )}

          <div>
            <label
              htmlFor="character-name-input"
              className="block text-xs font-medium text-gray-300 mb-2 select-none"
            >
              Character Analysis
            </label>
            <div className="flex gap-2">
              <input
                id="character-name-input"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Character name..."
                disabled={!isConfigured}
                className="flex-1 px-2 py-1 text-xs rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50"
                aria-label="Character name for analysis"
              />
              <button
                onClick={() => handleQuickAction('character-analysis')}
                disabled={isLoading || !characterName.trim() || !isConfigured}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
                aria-disabled={isLoading || !characterName.trim() || !isConfigured}
              >
                Analyze
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="brainstorm-topic-input"
              className="block text-xs font-medium text-gray-300 mb-2 select-none"
            >
              Brainstorm Ideas
            </label>
            <div className="flex gap-2">
              <input
                id="brainstorm-topic-input"
                value={brainstormTopic}
                onChange={(e) => setBrainstormTopic(e.target.value)}
                placeholder="Topic to explore..."
                disabled={!isConfigured}
                className="flex-1 px-2 py-1 text-xs rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50"
                aria-label="Topic to brainstorm ideas for"
              />
              <button
                onClick={() => handleQuickAction('brainstorm')}
                disabled={isLoading || !brainstormTopic.trim() || !isConfigured}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
                aria-disabled={isLoading || !brainstormTopic.trim() || !isConfigured}
              >
                💭 Ideas
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded select-none">
            🔍 Advanced analysis tools that understand your full project context
            <br />
            💡 Tip: Use Ctrl+← → to switch tabs, or Ctrl+1/2/3
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      className="fixed bottom-6 right-6 w-96 max-w-full bg-[#0F1522] border border-[#0073E6] rounded-xl shadow-2xl z-50 flex flex-col text-gray-100 max-h-[80vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Claude AI Writing Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold font-semibold text-[#0073E6]">Claude</h2>
          <StatusBadge isConfigured={isConfigured} isLoading={isLoading} error={error} />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            aria-label="Minimize assistant"
          >
            —
          </button>
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            aria-label="Clear chat messages"
          >
            🗑️
          </button>
          <button
            onClick={toggleVisibility}
            className="text-red-400 hover:text-red-500 text-sm transition-colors"
            aria-label="Close assistant"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <AccessibleTabs tabs={tabs} initialSelectedId={activeMode} onChange={handleTabChange} />
    </div>
  );
};

export default ClaudeAssistant;
