import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessagesAreaProps {
  messages: Message[];
  isTyping: boolean;
}

const MessagesArea: React.FC<MessagesAreaProps> = ({
  messages,
  isTyping
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      // Future: Implement load more on scroll
      if (scrollTop < 100) {
        // TODO: implement pagination for older messages
      }
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="messages-area" ref={containerRef} onScroll={handleScroll}>
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="messages-date-group">
          <div className="messages-date-divider">
            <span>{date}</span>
          </div>

          {dateMessages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              showTimestamp={index === dateMessages.length - 1 ||
                dateMessages[index + 1]?.senderType !== message.senderType}
            />
          ))}
        </div>
      ))}

      {isTyping && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesArea;
