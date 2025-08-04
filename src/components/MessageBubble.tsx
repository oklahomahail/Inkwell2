// src/components/MessageBubble.tsx
import React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  className = '',
}) => {
  const isUser = role === 'user';

  return (
    <div
      className={`p-3 rounded-lg text-sm max-w-[85%] ${
        isUser
          ? 'bg-[#0073E6]/20 text-white ml-6 self-end'
          : 'bg-gray-700 text-gray-200 mr-6 self-start'
      } ${className}`}
    >
      <div className="text-xs opacity-60 mb-1 font-medium">
        {isUser ? 'You' : 'Claude'}
        {timestamp && (
          <span className="ml-2 opacity-40">
            {timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
    </div>
  );
};

export default MessageBubble;
