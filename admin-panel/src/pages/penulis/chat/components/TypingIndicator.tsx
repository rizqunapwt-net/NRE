import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator__bubble">
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
      </div>
      <span className="typing-indicator__text">typing...</span>
    </div>
  );
};

export default TypingIndicator;
