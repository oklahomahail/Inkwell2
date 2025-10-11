import React from 'react';
const ChatPanel: React.FC<{
  messages: any[];
  input: string;
  setInput: (_value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  selectedText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}> = ({ messages, input, setInput, onSend, isLoading, selectedText, messagesEndRef, inputRef }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  return (
    <>
      {' '}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {' '}
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm text-gray-600">
            {' '}
            <div className="mb-2">👋</div> <p>Start a conversation with Claude!</p>{' '}
            <p className="text-xs text-gray-500 mt-1">
              {' '}
              I have full context of your writing project.{' '}
            </p>{' '}
            <p className="text-xs text-gray-500 mt-2 opacity-75">
              {' '}
              💡 Tip: Use Ctrl+Enter to send messages{' '}
            </p>{' '}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg text-sm text-gray-600 ${msg.role === 'user' ? 'bg-[#0073E6]/20 text-white ml-6' : 'bg-gray-700 text-gray-200 mr-6'}`}
            >
              {' '}
              <div className="text-xs text-gray-500 opacity-60 mb-1 font-medium">
                {' '}
                {msg.role === 'user' ? 'You' : 'Claude'}{' '}
              </div>{' '}
              <div className="whitespace-pre-wrap">{msg.content}</div>{' '}
            </div>
          ))
        )}{' '}
        <div ref={messagesEndRef} />{' '}
      </div>{' '}
      <div className="p-4 border-t border-gray-700">
        {' '}
        <div className="flex gap-2">
          {' '}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            placeholder={
              selectedText
                ? `Ask about: "${selectedText.slice(0, 20)}..."`
                : 'Ask Claude about your writing... (Ctrl+Enter to send)'
            }
            className="flex-1 px-3 py-2 rounded-md bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6] disabled:opacity-50 transition-colors text-sm text-gray-600"
          />{' '}
          <button
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-[#0073E6] text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
          >
            {' '}
            {isLoading ? '...' : 'Send'}{' '}
          </button>{' '}
        </div>{' '}
      </div>{' '}
    </>
  );
};
export default ChatPanel;
