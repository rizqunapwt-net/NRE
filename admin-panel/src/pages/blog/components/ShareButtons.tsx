import React from 'react';
import type { Article } from '../types';

interface Props {
  article: Article;
}

const ShareButtons: React.FC<Props> = ({ article }) => {
  const url = window.location.href;
  const text = encodeURIComponent(article.title);
  const encodedUrl = encodeURIComponent(url);

  const open = (target: string) => window.open(target, '_blank', 'noopener,noreferrer');

  return (
    <div className="blog-share">
      <h4>Share</h4>
      <div className="blog-share__buttons">
        <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}>Facebook</button>
        <button onClick={() => open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`)}>Twitter</button>
        <button onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}>LinkedIn</button>
        <button onClick={() => open(`https://wa.me/?text=${text}%20${encodedUrl}`)}>WhatsApp</button>
        <button onClick={() => navigator.clipboard.writeText(url)}>Copy Link</button>
      </div>
    </div>
  );
};

export default ShareButtons;
