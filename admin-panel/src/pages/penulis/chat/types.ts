export interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantAvatar?: string;
  participantType: 'admin' | 'editor' | 'support' | 'isbn';
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
  typing?: boolean;
  updatedAt: string;
  subject?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: 'user' | 'admin';
  senderName?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachments?: Attachment[];
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: number;
}

export interface Attachment {
  id: number;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType?: string;
}

export interface ChatState {
  conversations: Conversation[];
  selectedConversationId: number | null;
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  searchTerm: string;
}

export type ParticipantType = 'admin' | 'editor' | 'support' | 'isbn';

export interface ChatSocketEvents {
  'join-conversation': { conversationId: number };
  'leave-conversation': { conversationId: number };
  'send-message': { conversationId: number; content: string; type: string };
  'typing': { conversationId: number };
  'mark-read': { conversationId: number; messageId: number };
  'new-message': Message;
  'read-receipt': { messageId: number; status: string };
  'user-online': { userId: number };
  'user-offline': { userId: number };
}
