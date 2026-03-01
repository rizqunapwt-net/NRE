import React from 'react';
import '../LandingPage_Bokify.css';

const MARKETPLACES = {
    indonesia: [
        { key: 'tokopedia', name: 'Tokopedia', color: '#42b549', emoji: '🟢', url: 'https://www.tokopedia.com/penerbitrizquna' },
        { key: 'shopee', name: 'Shopee', color: '#f26722', emoji: '🟠', url: 'https://shopee.co.id/penerbitrizquna' },
        { key: 'lazada', name: 'Lazada', color: '#0f146d', emoji: '🔵', url: 'https://www.lazada.co.id/shop/penerbitrizquna' },
        { key: 'blibli', name: 'Blibli', color: '#0095da', emoji: '🔵', url: 'https://www.blibli.com/merchant/penerbitrizquna' },
        { key: 'bukalapak', name: 'Bukalapak', color: '#e31e25', emoji: '🔴', url: 'https://www.bukalapak.com/u/penerbitrizquna' },
        { key: 'tiktok', name: 'TikTok Shop', color: '#010101', emoji: '⚫', url: 'https://www.tiktok.com/@penerbitrizquna' },
        { key: 'gramedia', name: 'Gramedia', color: '#e31e25', emoji: '🔴', url: 'https://ebooks.gramedia.com' },
    ],
    internasional: [
        { key: 'google_play', name: 'Google Play', color: '#4285f4', emoji: '🎮', url: 'https://play.google.com/store/books' },
        { key: 'amazon', name: 'Amazon', color: '#ff9900', emoji: '🟠', url: 'https://www.amazon.com' },
        { key: 'apple', name: 'Apple Books', color: '#000000', emoji: '🍎', url: 'https://books.apple.com' },
        { key: 'kobo', name: 'Kobo', color: '#e6004c', emoji: '🔴', url: 'https://www.kobo.com' },
        { key: 'scribd', name: 'Scribd', color: '#1e7b85', emoji: '🟦', url: 'https://www.scribd.com' },
        { key: 'ipusnas', name: 'iPusnas', color: '#0066cc', emoji: '🔵', url: 'https://ipusnas.id' },
    ],
};

const MarketplaceGrid: React.FC = () => (
    <div className="lp-mkt-wrapper">
        <div className="lp-mkt-group">
            <div className="lp-mkt-group-label">🇮🇩 Indonesia</div>
            <div className="lp-mkt-grid">
                {MARKETPLACES.indonesia.map(m => (
                    <a key={m.key} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="lp-mkt-card" style={{ '--mkt-color': m.color } as React.CSSProperties}>
                        <span className="lp-mkt-emoji">{m.emoji}</span>
                        <span className="lp-mkt-name">{m.name}</span>
                    </a>
                ))}
            </div>
        </div>
        <div className="lp-mkt-group">
            <div className="lp-mkt-group-label">🌍 Internasional</div>
            <div className="lp-mkt-grid">
                {MARKETPLACES.internasional.map(m => (
                    <a key={m.key} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="lp-mkt-card" style={{ '--mkt-color': m.color } as React.CSSProperties}>
                        <span className="lp-mkt-emoji">{m.emoji}</span>
                        <span className="lp-mkt-name">{m.name}</span>
                    </a>
                ))}
            </div>
        </div>
    </div>
);

export default MarketplaceGrid;
