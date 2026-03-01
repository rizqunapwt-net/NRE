import React from 'react';
import type { Article } from '../types';

interface Props {
  author: Article['author'];
}

const AuthorBio: React.FC<Props> = ({ author }) => {
  return (
    <div style={{
      marginTop: 64,
      padding: '32px 40px',
      background: '#f2f5fb',
      borderRadius: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      border: '1px solid #dde3ef'
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#008B94',
        color: '#fff',
        fontSize: 32,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {author.name.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{ color: '#008B94', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>Penulis</div>
        <h4 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          fontWeight: 400,
          color: '#06072c',
          margin: '0 0 10px'
        }}>{author.name}</h4>
        <p style={{
          color: '#4f5669',
          fontSize: 16,
          lineHeight: 1.6,
          margin: 0
        }}>{author.bio || 'Penulis aktif di Penerbit Rizquna Elfath yang berfokus pada pengembangan literasi di Indonesia.'}</p>
      </div>
    </div>
  );
};

export default AuthorBio;
