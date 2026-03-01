import React from 'react';
import { Conversation } from '../types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return '✓✓';
      case 'delivered': return '✓✓';
      case 'sent': return '✓';
      default: return '';
    }
  };

  return (
    <div
      className={`conversation-item ${isSelected ? 'active' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}`}
      onClick={onSelect}
    >
      <div className="conversation-item__avatar">
        {conversation.participantAvatar ? (
          <img src={conversation.participantAvatar} alt={conversation.participantName} />
        ) : (
          <div className="conversation-item__avatar-placeholder">
            {conversation.participantName.charAt(0)}
          </div>
        )}
        {conversation.isOnline && (
          <span className="conversation-item__online-indicator" />
        )}
      </div>

      <div className="conversation-item__content">
        <div className="conversation-item__header">
          <h3 className="conversation-item__name">{conversation.participantName}</h3>
          <span className="conversation-item__time">
            {formatTime(conversation.lastMessage.timestamp)}
          </span>
        </div>

        <div className="conversation-item__message">
          <span className="conversation-item__message-text">
            {conversation.lastMessage.senderType === 'user' && 'You: '}
            {truncateText(conversation.lastMessage.content, 30)}
          </span>
          {conversation.lastMessage.senderType === 'user' && (
            <span className={`conversation-item__status ${conversation.lastMessage.status === 'read' ? 'read' : ''}`}>
              {getStatusIcon(conversation.lastMessage.status)}
            </span>
          )}
        </div>

        {conversation.unreadCount > 0 && (
          <span className="conversation-item__badge">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
