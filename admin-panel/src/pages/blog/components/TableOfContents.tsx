import React from 'react';
import type { TocHeading } from '../types';

interface Props {
  headings: TocHeading[];
  activeId: string;
  onJump: (id: string) => void;
}

const TableOfContents: React.FC<Props> = ({ headings, activeId, onJump }) => {
  if (headings.length === 0) return null;

  return (
    <aside className="blog-toc">
      <h4>Table of Contents</h4>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id} className={`blog-toc__item blog-toc__item--${heading.level} ${activeId === heading.id ? 'is-active' : ''}`}>
            <button onClick={() => onJump(heading.id)}>{heading.text}</button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default TableOfContents;
