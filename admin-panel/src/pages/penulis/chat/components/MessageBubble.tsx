import React, { useState } from 'react';
import { Message } from '../types';
import FileAttachment from './FileAttachment';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = true
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const isSent = message.senderType === 'user';

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <span className="read">✓✓</span>;
      case 'delivered': return <span>✓✓</span>;
      case 'sent': return <span>✓</span>;
      default: return null;
    }
  };

  const handleImageClick = () => {
    if (message.type === 'image' && message.attachments?.[0]) {
      setShowImageModal(true);
    }
  };

  return (
    <>
      <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
        {message.type === 'text' && (
          <div className="message-bubble__content">
            <p className="message-bubble__text">{message.content}</p>
          </div>
        )}

        {message.type === 'image' && message.attachments?.[0] && (
          <div className="message-bubble__image-container" onClick={handleImageClick}>
            <img 
              src={message.attachments[0].url} 
              alt="Attachment" 
              className="message-bubble__image"
            />
          </div>
        )}

        {message.type === 'file' && message.attachments?.[0] && (
          <FileAttachment attachment={message.attachments[0]} />
        )}

        {showTimestamp && (
          <div className="message-bubble__meta">
            <span className="message-bubble__time">{formatTime(message.timestamp)}</span>
            {isSent && (
              <span className="message-bubble__status">
                {getStatusIcon(message.status)}
              </span>
            )}
          </div>
        )}
      </div>

      {showImageModal && message.attachments?.[0] && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="image-modal__content" onClick={(e) => e.stopPropagation()}>
            <img src={message.attachments[0].url} alt="Full size" />
            <button 
              className="image-modal__close"
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;
