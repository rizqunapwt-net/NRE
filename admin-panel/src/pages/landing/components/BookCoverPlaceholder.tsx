import React, { useState } from 'react';

const BookCoverPlaceholder: React.FC<{
    title: string;
    author?: string;
    isbn?: string;
    size?: 'large' | 'small';
    imageUrl?: string | null;
}> = ({ title, author, isbn, size = 'large', imageUrl }) => {
    const isLarge = size === 'large';
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);

    // If imageUrl is null/empty, or if there was an error loading it, use the placeholder UI
    const showPlaceholder = !imageUrl || imageError;

    return (
        <div
            style={{
                width: '100%', height: '100%',
                position: 'relative',
                perspective: '1500px',
                background: 'transparent',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The 3D Book Volume */}
            <div style={{
                position: 'relative',
                width: '92%',
                height: '96%',
                transformStyle: 'preserve-3d',
                transform: isHovered
                    ? 'rotateY(-10deg) rotateX(0deg) translateY(-5px)'
                    : 'rotateY(-22deg) rotateX(3deg)',
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isHovered
                    ? '35px 25px 60px rgba(0,0,0,0.45)'
                    : (isLarge ? '25px 20px 50px rgba(0,0,0,0.35)' : '10px 8px 20px rgba(0,0,0,0.25)'),
            }}>

                {/* Front Cover Face */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    background: !showPlaceholder ? `url(${imageUrl}) center/cover no-repeat` : '#1b3764',
                    backgroundColor: '#1b3764',
                    borderRadius: '0 4px 4px 0',
                    overflow: 'hidden',
                    backfaceVisibility: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Hidden image to detect load errors */}
                    {imageUrl && !imageError && (
                        <img
                            src={imageUrl}
                            style={{ display: 'none' }}
                            onError={() => setImageError(true)}
                        />
                    )}

                    {showPlaceholder && (
                        <div style={{
                            padding: isLarge ? 30 : 12,
                            color: '#fff',
                            textAlign: 'center',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #008B94 0%, #1b3764 100%)'
                        }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, opacity: 0.5 }}>RIZQUNA</div>
                            <div>
                                <div style={{ fontSize: isLarge ? 18 : 10, fontWeight: 700, fontFamily: "'DM Serif Display', serif", marginBottom: 10, lineHeight: 1.2 }}>{title}</div>
                                <div style={{ width: 30, height: 2, background: '#d4af37', margin: '0 auto 10px' }} />
                                <div style={{ fontSize: isLarge ? 12 : 8, opacity: 0.8, fontStyle: 'italic' }}>{author}</div>
                            </div>
                            <div style={{ fontSize: 8, opacity: 0.3 }}>{isbn || 'PREMIUM EDITION'}</div>
                        </div>
                    )}

                    {/* Premium Glossy Reflection Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, height: '100%',
                        background: isHovered
                            ? 'linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 20%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                            : 'linear-gradient(105deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                        transition: 'background 0.6s ease',
                        pointerEvents: 'none'
                    }} />

                    {/* Spine Shadow / Fold Line */}
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: isLarge ? 12 : 6,
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',
                        zIndex: 3
                    }} />
                </div>

                {/* Right Side (Page Edges / Paper stack) */}
                <div style={{
                    position: 'absolute',
                    right: isLarge ? -12 : -6,
                    top: '0.5%',
                    bottom: '0.5%',
                    width: isLarge ? 12 : 6,
                    background: '#fcfcfc',
                    backgroundImage: 'repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, #fff 1px, #fff 2px)',
                    transform: 'rotateY(90deg)',
                    transformOrigin: 'left center',
                    boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.1)',
                    zIndex: 1
                }} />

                {/* Bottom Side (Edge) */}
                <div style={{
                    position: 'absolute',
                    bottom: isLarge ? -8 : -4,
                    left: '0.5%',
                    right: '0.5%',
                    height: isLarge ? 8 : 4,
                    background: '#d1d5db',
                    transform: 'rotateX(-90deg)',
                    transformOrigin: 'center top',
                    zIndex: 1
                }} />

                {/* Left Side (The actual Spine) */}
                <div style={{
                    position: 'absolute',
                    left: isLarge ? -15 : -8,
                    top: 0,
                    bottom: 0,
                    width: isLarge ? 15 : 8,
                    background: '#0f172a',
                    backgroundImage: 'linear-gradient(90deg, #0a1521 0%, #1b3764 100%)',
                    transform: 'rotateY(-90deg)',
                    transformOrigin: 'right center',
                    borderRadius: '3px 0 0 3px',
                    zIndex: 1
                }} />
            </div>

            {/* Subtle Floor Shadow for Depth */}
            <div style={{
                position: 'absolute',
                bottom: '-4%',
                left: '12%',
                right: '12%',
                height: '8%',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 80%)',
                filter: 'blur(10px)',
                zIndex: -1,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.6s ease'
            }} />
        </div>
    );
};

export default BookCoverPlaceholder;
