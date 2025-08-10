// Chat Manager for Multiple Conversations
// Handles creation, switching, and management of multiple chat sessions

import { v4 as uuidv4 } from 'uuid';

export interface ChatSession {
  id: string;
  title: string;
  sessionId: string; // Backend session ID for API calls
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

export interface StoredChatSessions {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

export class ChatManager {
  private static readonly STORAGE_KEY = 'wellnessGrid_chatSessions';
  
  /**
   * Get all chat sessions from localStorage
   */
  static getChatSessions(): StoredChatSessions {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return { sessions: [], activeSessionId: null };
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.sessions = parsed.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }));
        return parsed;
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
    
    return { sessions: [], activeSessionId: null };
  }
  
  /**
   * Save chat sessions to localStorage
   */
  static saveChatSessions(data: StoredChatSessions): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  }
  
  /**
   * Create a new chat session
   */
  static createNewChat(title?: string): ChatSession {
    const chatId = uuidv4();
    const sessionId = uuidv4(); // Backend session ID
    const now = new Date();
    
    const newSession: ChatSession = {
      id: chatId,
      title: title || 'New Chat',
      sessionId: sessionId,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessage: undefined
    };
    
    const data = this.getChatSessions();
    data.sessions.unshift(newSession); // Add to beginning
    data.activeSessionId = chatId;
    this.saveChatSessions(data);
    
    console.log('Created new chat session:', chatId);
    return newSession;
  }
  
  /**
   * Switch to a different chat session
   */
  static switchToChat(chatId: string): ChatSession | null {
    const data = this.getChatSessions();
    const session = data.sessions.find(s => s.id === chatId);
    
    if (session) {
      data.activeSessionId = chatId;
      this.saveChatSessions(data);
      console.log('Switched to chat session:', chatId);
      return session;
    }
    
    console.error('Chat session not found:', chatId);
    return null;
  }
  
  /**
   * Get the currently active chat session
   */
  static getActiveChat(): ChatSession | null {
    const data = this.getChatSessions();
    
    if (data.activeSessionId) {
      const session = data.sessions.find(s => s.id === data.activeSessionId);
      if (session) {
        return session;
      }
    }
    
    // No active session or session not found - create new one
    return this.createNewChat();
  }
  
  /**
   * Update chat session metadata
   */
  static updateChatSession(chatId: string, updates: Partial<ChatSession>): void {
    const data = this.getChatSessions();
    const sessionIndex = data.sessions.findIndex(s => s.id === chatId);
    
    if (sessionIndex !== -1) {
      data.sessions[sessionIndex] = {
        ...data.sessions[sessionIndex],
        ...updates,
        updatedAt: new Date()
      };
      this.saveChatSessions(data);
    }
  }
  
  /**
   * Delete a chat session
   */
  static deleteChat(chatId: string): void {
    const data = this.getChatSessions();
    data.sessions = data.sessions.filter(s => s.id !== chatId);
    
    // If we deleted the active session, switch to another one or create new
    if (data.activeSessionId === chatId) {
      if (data.sessions.length > 0) {
        data.activeSessionId = data.sessions[0].id;
      } else {
        data.activeSessionId = null;
      }
    }
    
    this.saveChatSessions(data);
    console.log('Deleted chat session:', chatId);
  }
  
  /**
   * Generate a title for a chat based on the first message
   */
  static generateChatTitle(message: string): string {
    // Truncate to reasonable length and clean up
    const maxLength = 40;
    let title = message.trim();
    
    // Remove common question words at the start
    title = title.replace(/^(what|how|why|when|where|can|could|should|would|will|is|are|do|does|did)\s+/i, '');
    
    // Truncate and add ellipsis if needed
    if (title.length > maxLength) {
      title = title.substring(0, maxLength).trim() + '...';
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title || 'New Chat';
  }
  
  /**
   * Update chat title based on first message
   */
  static updateChatTitle(chatId: string, firstMessage: string): void {
    const title = this.generateChatTitle(firstMessage);
    this.updateChatSession(chatId, { title });
  }
  
  /**
   * Increment message count for a chat
   */
  static incrementMessageCount(chatId: string, lastMessage?: string): void {
    const data = this.getChatSessions();
    const session = data.sessions.find(s => s.id === chatId);
    
    if (session) {
      session.messageCount += 1;
      session.updatedAt = new Date();
      if (lastMessage) {
        session.lastMessage = lastMessage.length > 100 
          ? lastMessage.substring(0, 100) + '...' 
          : lastMessage;
      }
      this.saveChatSessions(data);
    }
  }
  
  /**
   * Get formatted display date for a chat
   */
  static getDisplayDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
} 