// src/components/MessageBubble.tsx
import React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  return (
    <div
      className={`message-bubble ${role === 'user' ? 'user' : 'assistant'} p-3 rounded-lg mb-2 ${
        role === 'user' ? 'bg-blue-500 text-white ml-8' : 'bg-gray-200 dark:bg-gray-700 mr-8'
      }`}
    >
      {content}
    </div>
  );
};

export default MessageBubble;
