import React from 'react';
import { Attachment } from '../types';

interface FileAttachmentProps {
  attachment: Attachment;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ attachment }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel')) return '📗';
    if (mimeType.includes('zip')) return '📦';
    return '📄';
  };

  return (
    <div className="file-attachment">
      <div className="file-attachment__icon">
        {getFileIcon(attachment.mimeType)}
      </div>
      
      <div className="file-attachment__info">
        <span className="file-attachment__name">{attachment.name}</span>
        <span className="file-attachment__size">{formatFileSize(attachment.size)}</span>
      </div>

      <a 
        href={attachment.url} 
        download={attachment.name}
        className="file-attachment__download"
        title="Download"
      >
        ⬇️
      </a>
    </div>
  );
};

export default FileAttachment;
