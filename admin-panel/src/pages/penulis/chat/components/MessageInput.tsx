import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttachmentClick?: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onAttachmentClick,
  disabled = false
}) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <div className="message-input__container">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="message-input__textarea"
          rows={1}
          disabled={disabled}
        />

        <div className="message-input__actions">
          <div className="message-input__left-actions">
            <button 
              className="message-input__btn message-input__btn--emoji"
              title="Emoji"
              type="button"
            >
              😊
            </button>
            <button 
              className="message-input__btn message-input__btn--attach"
              onClick={onAttachmentClick}
              title="Attach file"
              type="button"
            >
              📎
            </button>
            <button 
              className="message-input__btn message-input__btn--image"
              title="Upload image"
              type="button"
            >
              📷
            </button>
          </div>

          <button
            className={`message-input__send-btn ${content.trim() ? 'active' : ''}`}
            onClick={handleSend}
            disabled={!content.trim() || disabled}
          >
            Send ➤
          </button>
        </div>
      </div>

      <div className="message-input__counter">
        {content.length} / 2000
      </div>
    </div>
  );
};

export default MessageInput;
