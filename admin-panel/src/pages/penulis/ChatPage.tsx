import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../api/base';

interface ChatMessage {
    id: number;
    sender: 'author' | 'admin';
    message: string;
    is_read: boolean;
    created_at: string;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ChatPage: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMessages = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/v1/user/chat`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) setMessages(json.data || []);
        } catch { /* ignore */ }
        if (!silent) setLoading(false);
    }, []);

    useEffect(() => {
        fetchMessages();
        // Poll every 5 seconds for new messages
        pollRef.current = setInterval(() => fetchMessages(true), 5000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);

        // Optimistic update
        const optimistic: ChatMessage = {
            id: Date.now(),
            sender: 'author',
            message: input.trim(),
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInput('');

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/v1/user/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: optimistic.message }),
            });
            // Refresh to get real message from server
            await fetchMessages(true);
        } catch { /* keep optimistic */ }

        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e as unknown as React.FormEvent);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', maxWidth: 720 }}>
            {/* Header */}
            <div className="pp-card pp-card--shadow" style={{ marginBottom: 0, borderRadius: '14px 14px 0 0', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #008B95, #007A83)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                    }}>A</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Admin Rizquna</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tim Penerbit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '20px',
                background: '#F8FAF9',
                borderLeft: '1px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                        <div className="pl-loading__spinner" style={{ margin: '0 auto 12px' }} />
                        <p>Memuat percakapan...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
                        <p style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Belum ada percakapan</p>
                        <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                            Kirim pesan kepada admin untuk bertanya seputar naskah, kontrak, atau royalti.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isAuthor = msg.sender === 'author';
                            const showDate = idx === 0 ||
                                new Date(messages[idx - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDate && (
                                        <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                                            <span style={{
                                                fontSize: '0.72rem', color: '#9CA3AF',
                                                background: '#fff', padding: '4px 12px',
                                                borderRadius: 20, border: '1px solid #E5E7EB',
                                            }}>
                                                {new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: isAuthor ? 'flex-end' : 'flex-start',
                                        marginBottom: 12,
                                    }}>
                                        {!isAuthor && (
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #008B95, #007A83)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                                flexShrink: 0, marginRight: 8, alignSelf: 'flex-end',
                                            }}>A</div>
                                        )}
                                        <div style={{ maxWidth: '75%' }}>
                                            <div style={{
                                                background: isAuthor
                                                    ? 'linear-gradient(135deg, #008B95, #007A83)'
                                                    : '#fff',
                                                color: isAuthor ? '#fff' : '#1F2937',
                                                padding: '10px 14px',
                                                borderRadius: isAuthor ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                fontSize: '0.88rem',
                                                lineHeight: 1.5,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                                border: isAuthor ? 'none' : '1px solid #F3F4F6',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}>
                                                {msg.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem', color: '#9CA3AF',
                                                marginTop: 4, textAlign: isAuthor ? 'right' : 'left',
                                            }}>
                                                {formatTime(msg.created_at)}
                                                {isAuthor && (
                                                    <span style={{ marginLeft: 4 }}>
                                                        {msg.is_read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isAuthor && (
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #008B95, #00666E)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                                flexShrink: 0, marginLeft: 8, alignSelf: 'flex-end',
                                            }}>
                                                {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                style={{
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: '0 0 14px 14px',
                    border: '1px solid #E5E7EB',
                    borderTop: 'none',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-end',
                }}
            >
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter baris baru)"
                    rows={1}
                    style={{
                        flex: 1,
                        resize: 'none',
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: '0.88rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        maxHeight: 120,
                        overflowY: 'auto',
                        lineHeight: 1.5,
                    }}
                    onInput={e => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                    }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="pp-btn pp-btn--primary"
                    style={{
                        width: 44, height: 44, borderRadius: '50%',
                        padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', flexShrink: 0,
                        opacity: !input.trim() || sending ? 0.5 : 1,
                    }}
                >
                    {sending ? '⏳' : '➤'}
                </button>
            </form>
        </div>
    );
};

export default ChatPage;
