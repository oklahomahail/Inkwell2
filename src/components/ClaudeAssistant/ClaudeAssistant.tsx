import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useClaude } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import AccessibleTabs from '../AccessibleTabs';
import MessageBubble from '../MessageBubble';
import { MessageCircle, Zap, Search, BoltIcon, CatIcon, SearchIcon } from 'lucide-react';

interface ClaudeAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

const ClaudeAssistant: React.FC<ClaudeAssistantProps> = ({ selectedText = '', onInsertText }) => {
  const { messages, sendMessage, isLoading, error, toggleVisibility, clearMessages } = useClaude();

  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'quick-actions' | 'analysis'>('chat');
  const [lastResult, setLastResult] = useState<string>('');
  const [characterName, setCharacterName] = useState('');
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus chat input when active
  useEffect(() => {
    if (!isMinimized && activeMode === 'chat') {
      inputRef.current?.focus();
    }
  }, [isMinimized, activeMode]);

  // Focus insert button when lastResult changes
  useEffect(() => {
    if (lastResult && onInsertText) {
      insertButtonRef.current?.focus();
    }
  }, [lastResult, onInsertText]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    try {
      await sendMessage(input);
      setInput('');
    } catch {
      showToast('Failed to send message', 'error');
    }
  }, [input, isLoading, sendMessage, showToast]);

  const handleQuickAction = useCallback(
    async (action: string) => {
      if (isLoading) return;

      try {
        let result = '';
        let description = '';

        switch (action) {
          case 'continue':
            if (!selectedText) {
              showToast('Please select some text to continue', 'error');
              return;
            }
            description = `Continue text: "${selectedText.slice(0, 40)}..."`;
            result = await sendMessage(description);
            break;

          case 'improve':
            if (!selectedText) {
              showToast('Please select some text to improve', 'error');
              return;
            }
            description = `Improve text: "${selectedText.slice(0, 40)}..."`;
            result = await sendMessage(description);
            break;

          case 'analyze-style':
            if (!selectedText) {
              showToast('Please select some text to analyze', 'error');
              return;
            }
            description = `Analyze style: "${selectedText.slice(0, 40)}..."`;
            result = await sendMessage(description);
            break;

          case 'plot-ideas':
            description = selectedText
              ? `Plot ideas for: "${selectedText.slice(0, 40)}..."`
              : 'Generate plot ideas';
            result = await sendMessage(description);
            break;

          case 'character-analysis':
            if (!characterName.trim()) {
              showToast('Please enter a character name', 'error');
              return;
            }
            description = `Analyze character: ${characterName}`;
            result = await sendMessage(description);
            setCharacterName('');
            break;

          case 'brainstorm':
            if (!brainstormTopic.trim()) {
              showToast('Please enter a topic to brainstorm', 'error');
              return;
            }
            description = `Brainstorm: ${brainstormTopic}`;
            result = await sendMessage(description);
            setBrainstormTopic('');
            break;

          default:
            return;
        }

        setLastResult(result);
        showToast('Claude provided suggestions', 'success');
      } catch {
        showToast('Action failed. Please try again.', 'error');
      }
    },
    [isLoading, selectedText, characterName, brainstormTopic, sendMessage, showToast],
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
          className="w-14 h-14 bg-[#0073E6] text-white rounded-full shadow-2xl hover:bg-blue-500 transition-colors flex items-center justify-center"
          aria-label="Open Claude Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-2.319-.371l-6.104 2.103a.5.5 0 01-.65-.65l2.103-6.104A8.013 8.013 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
            />
          </svg>
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
      icon: <CatIcon size={14} />,
      content: (
        <>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm text-gray-600 select-none">
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
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))
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
                disabled={isLoading}
                placeholder={
                  selectedText
                    ? `Ask about: "${selectedText.slice(0, 20)}..."`
                    : 'Ask Claude about your writing... (Ctrl+Enter to send)'
                }
                className="flex-1 px-3 py-2 rounded-md bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50 transition-colors text-sm text-gray-600"
                aria-label="Chat input"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-[#0073E6] text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
                aria-label="Send message"
              >
                {isLoading ? '...' : 'Send'}
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
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleQuickAction('continue')}
              disabled={isLoading || !selectedText}
              className="px-3 py-2 text-xs text-gray-500 bg-[#0073E6] text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText}
            >
              📝 Continue Text
            </button>
            <button
              onClick={() => handleQuickAction('improve')}
              disabled={isLoading || !selectedText}
              className="px-3 py-2 text-xs text-gray-500 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText}
            >
              ✨ Improve Text
            </button>
            <button
              onClick={() => handleQuickAction('analyze-style')}
              disabled={isLoading || !selectedText}
              className="px-3 py-2 text-xs text-gray-500 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading || !selectedText}
            >
              🎨 Analyze Style
            </button>
            <button
              onClick={() => handleQuickAction('plot-ideas')}
              disabled={isLoading}
              className="px-3 py-2 text-xs text-gray-500 bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-disabled={isLoading}
            >
              💡 Plot Ideas
            </button>
          </div>

          {!selectedText && (
            <div className="text-xs text-gray-500 text-gray-400 bg-gray-800 p-2 rounded select-none">
              💡 Select text in your document to enable text-specific actions
            </div>
          )}

          {lastResult && onInsertText && (
            <div className="border border-gray-600 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 font-medium text-[#0073E6]">
                  Claude's Suggestion:
                </span>
                <button
                  ref={insertButtonRef}
                  onClick={handleInsert}
                  className="px-2 py-1 text-xs text-gray-500 bg-yellow-500 text-white rounded hover:bg-yellow-400 transition-colors focus:ring-2 focus:ring-yellow-300"
                  aria-label="Insert Claude's suggestion into draft"
                >
                  Insert
                </button>
              </div>
              <div className="text-xs text-gray-500 text-gray-300 max-h-20 overflow-y-auto whitespace-pre-wrap">
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
          <div>
            <label
              htmlFor="character-name-input"
              className="block text-xs text-gray-500 font-medium text-gray-300 mb-2 select-none"
            >
              Character Analysis
            </label>
            <div className="flex gap-2">
              <input
                id="character-name-input"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Character name..."
                className="flex-1 px-2 py-1 text-xs text-gray-500 rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
                aria-label="Character name for analysis"
              />
              <button
                onClick={() => handleQuickAction('character-analysis')}
                disabled={isLoading || !characterName.trim()}
                className="px-3 py-1 text-xs text-gray-500 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
                aria-disabled={isLoading || !characterName.trim()}
              >
                Analyze
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="brainstorm-topic-input"
              className="block text-xs text-gray-500 font-medium text-gray-300 mb-2 select-none"
            >
              Brainstorm Ideas
            </label>
            <div className="flex gap-2">
              <input
                id="brainstorm-topic-input"
                value={brainstormTopic}
                onChange={(e) => setBrainstormTopic(e.target.value)}
                placeholder="Topic to explore..."
                className="flex-1 px-2 py-1 text-xs text-gray-500 rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
                aria-label="Topic to brainstorm ideas for"
              />
              <button
                onClick={() => handleQuickAction('brainstorm')}
                disabled={isLoading || !brainstormTopic.trim()}
                className="px-3 py-1 text-xs text-gray-500 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
                aria-disabled={isLoading || !brainstormTopic.trim()}
              >
                💭 Ideas
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-gray-400 bg-gray-800 p-2 rounded select-none">
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
          <h2 className="text-lg font-medium font-semibold text-[#0073E6]">Claude</h2>
          {isLoading && (
            <div
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0073E6]"
              aria-label="Loading"
              role="status"
            />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white text-sm text-gray-600 transition-colors"
            aria-label="Minimize assistant"
          >
            —
          </button>
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-white text-sm text-gray-600 transition-colors"
            aria-label="Clear chat messages"
          >
            🗑️
          </button>
          <button
            onClick={toggleVisibility}
            className="text-red-400 hover:text-red-500 text-sm text-gray-600 transition-colors"
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
