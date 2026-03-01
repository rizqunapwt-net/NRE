import React from 'react';
import { Conversation } from '../types';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect
}) => {
  if (conversations.length === 0) {
    return (
      <div className="conversation-list--empty">
        <p>Tidak ada percakapan</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedId}
          onSelect={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
};

export default ConversationList;
