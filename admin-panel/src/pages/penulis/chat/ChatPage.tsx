import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import MessagesArea from './components/MessagesArea';
import MessageInput from './components/MessageInput';
import { Conversation, Message } from './types';
import { API_BASE } from '../../../api/base';
import './ChatPage.css';

type ApiChatMessage = {
  id?: number;
  sender?: 'author' | 'admin';
  message?: string;
  created_at?: string;
  is_read?: boolean;
};

// The backend has a single conversation per author (with admin).
// We adapt it into the multi-conversation UI by creating a single
// "Admin Support" conversation from the flat messages list.
const ADMIN_CONVERSATION: Omit<Conversation, 'lastMessage' | 'unreadCount' | 'updatedAt'> = {
  id: 1,
  participantId: 0,
  participantName: 'Admin Support',
  participantType: 'support',
  isOnline: true,
};

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(1); // Auto-select admin
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping] = useState(false); // Reserved for future typing indicator feature
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeader = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  }), []);

  // Map flat API messages → internal Message type
  const mapApiMessages = (raw: ApiChatMessage[]): Message[] =>
    raw.map((m, idx) => ({
      id: m.id ?? idx,
      conversationId: 1,
      senderId: m.sender === 'author' ? 1 : 0,
      senderType: m.sender === 'author' ? 'user' : 'admin',
      content: m.message ?? '',
      type: 'text' as const,
      timestamp: m.created_at ?? new Date().toISOString(),
      status: m.is_read ? 'read' as const : 'sent' as const,
    }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/user/chat`, { headers: authHeader() });
      const json = await res.json();
      if (!json.success) return;

      const mapped = mapApiMessages((json.data ?? []) as ApiChatMessage[]);
      setMessages(mapped);

      // Build the single conversation card
      const last = mapped[mapped.length - 1];
      const unread = ((json.data ?? []) as ApiChatMessage[]).filter((m) => !m.is_read && m.sender === 'admin').length;

      setConversations([{
        ...ADMIN_CONVERSATION,
        lastMessage: last ?? {
          id: 0, conversationId: 1, senderId: 0, senderType: 'admin',
          content: 'Mulai percakapan dengan admin...', type: 'text',
          timestamp: new Date().toISOString(), status: 'read',
        },
        unreadCount: unread,
        updatedAt: last?.timestamp ?? new Date().toISOString(),
      }]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authHeader]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(iv);
  }, [fetchMessages]);

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    // Optimistic
    const optimistic: Message = {
      id: Date.now(),
      conversationId: 1,
      senderId: 1,
      senderType: 'user',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_BASE}/v1/user/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ message: content }),
      });
      const json = await res.json();
      if (json.success) {
        // Replace optimistic with real message
        const real = mapApiMessages([json.data])[0];
        setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
      }
    } catch { /* keep optimistic */ }

    // Update last message on conversation card
    setConversations(prev => prev.map(c =>
      c.id === selectedConversationId
        ? { ...c, lastMessage: optimistic, updatedAt: optimistic.timestamp }
        : c
    ));
  };

  if (loading) {
    return (
      <div className="chat-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32 }}>💬</div>
          <p>Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <ChatSidebar
        conversations={filteredConversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {selectedConversation ? (
        <div className="chat-main">
          <ChatHeader conversation={selectedConversation} />

          <MessagesArea
            messages={messages.filter(m => m.conversationId === selectedConversationId)}
            isTyping={isTyping}
          />
          <div ref={messagesEndRef} />
          
          <MessageInput
            onSend={handleSendMessage}
            disabled={!selectedConversationId}
          />
        </div>
      ) : (
        <div className="chat-empty-state">
          <div className="chat-empty-state__content">
            <div className="chat-empty-state__icon">💬</div>
            <h2>Pilih percakapan untuk mulai chatting</h2>
            <p>Pilih salah satu percakapan di sidebar untuk melihat pesan</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
