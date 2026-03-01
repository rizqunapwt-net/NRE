import React from 'react';
import { Conversation } from '../types';

interface ChatHeaderProps {
  conversation: Conversation;
  onInfoClick?: () => void;
  onPhoneClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onInfoClick,
  onPhoneClick
}) => {
  return (
    <div className="chat-header">
      <div className="chat-header__participant">
        <div className="chat-header__avatar">
          {conversation.participantAvatar ? (
            <img src={conversation.participantAvatar} alt={conversation.participantName} />
          ) : (
            <div className="chat-header__avatar-placeholder">
              {conversation.participantName.charAt(0)}
            </div>
          )}
          {conversation.isOnline && (
            <span className="chat-header__online-indicator" />
          )}
        </div>

        <div className="chat-header__info">
          <h3 className="chat-header__name">{conversation.participantName}</h3>
          <p className="chat-header__status">
            {conversation.isOnline ? (
              <span className="online">Online • Typically replies in minutes</span>
            ) : (
              <span className="offline">Offline</span>
            )}
          </p>
        </div>
      </div>

      <div className="chat-header__actions">
        <button className="chat-header__action-btn" onClick={onPhoneClick} title="Call">
          📞
        </button>
        <button className="chat-header__action-btn" onClick={onInfoClick} title="Info">
          ℹ️
        </button>
        <button className="chat-header__action-btn" title="More">
          ⋮
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
