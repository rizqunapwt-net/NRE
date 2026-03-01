import React from 'react';
import { Conversation } from '../types';
import ConversationList from './ConversationList';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar__header">
        <h2 className="chat-sidebar__title">💬 Chat dengan Admin</h2>
      </div>

      <div className="chat-sidebar__search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="chat-sidebar__search-input"
        />
      </div>

      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={onSelectConversation}
      />
    </div>
  );
};

export default ChatSidebar;
