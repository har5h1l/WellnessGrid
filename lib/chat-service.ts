// Chat Service for Multi-turn Conversation Support
// Handles message storage and retrieval from Supabase

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}
if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

export interface ChatMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatHistory {
  messages: ChatMessage[];
  sessionId: string;
}

export class ChatService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Get recent messages for a session (ordered by most recent first)
   */
  async getSessionMessages(sessionId: string, limit: number = 5): Promise<ChatMessage[]> {
    try {
      console.log(`📚 Retrieving last ${limit} messages for session: ${sessionId}`);
      
      const { data, error } = await this.supabase.rpc('get_session_messages', {
        p_session_id: sessionId,
        p_limit: limit * 2 // Get more to ensure we have pairs
      });

      if (error) {
        console.error('Error fetching session messages:', error);
        return [];
      }

      // Reverse to get chronological order (oldest first)
      const messages = (data || []).reverse();
      
      // Ensure we have complete user-assistant pairs and limit to requested count
      const pairedMessages: ChatMessage[] = [];
      let userMessage: ChatMessage | null = null;
      
      for (const message of messages) {
        if (message.role === 'user') {
          userMessage = message;
        } else if (message.role === 'assistant' && userMessage) {
          pairedMessages.push(userMessage, message);
          userMessage = null;
          
          // Stop if we've reached our limit (counting pairs)
          if (pairedMessages.length >= limit * 2) {
            break;
          }
        }
      }
      
      // If we have an unpaired user message at the end, include it
      if (userMessage && pairedMessages.length < limit * 2) {
        pairedMessages.push(userMessage);
      }
      
      console.log(`✅ Retrieved ${pairedMessages.length} messages for session ${sessionId}`);
      return pairedMessages.slice(-limit * 2); // Take last N pairs
      
    } catch (error) {
      console.error('Error in getSessionMessages:', error);
      return [];
    }
  }

  /**
   * Insert a new message into the session
   */
  async insertMessage(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      console.log(`💾 Storing ${role} message for session: ${sessionId}`);
      
      const { data, error } = await this.supabase.rpc('insert_message', {
        p_session_id: sessionId,
        p_role: role,
        p_content: content,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error inserting message:', error);
        return null;
      }

      console.log(`✅ Message stored with ID: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in insertMessage:', error);
      return null;
    }
  }

  /**
   * Insert both user and assistant messages as a pair
   */
  async insertMessagePair(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    metadata: Record<string, any> = {}
  ): Promise<{ userMessageId: string | null; assistantMessageId: string | null }> {
    try {
      console.log(`💾 Storing message pair for session: ${sessionId}`);
      
      const userMessageId = await this.insertMessage(sessionId, 'user', userMessage, metadata);
      const assistantMessageId = await this.insertMessage(sessionId, 'assistant', assistantMessage, metadata);
      
      return { userMessageId, assistantMessageId };
    } catch (error) {
      console.error('Error in insertMessagePair:', error);
      return { userMessageId: null, assistantMessageId: null };
    }
  }

  /**
   * Format messages for Gemini API (role + content format)
   */
  formatForGemini(messages: ChatMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  /**
   * Format messages for BioMistral (conversation string format)
   */
  formatForBioMistral(messages: ChatMessage[]): string {
    if (messages.length === 0) return '';
    
    const formattedMessages = messages.map(msg => {
      const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
      return `${roleLabel}: ${msg.content}`;
    });
    
    return formattedMessages.join('\n') + '\n';
  }

  /**
   * Get chat history with proper formatting
   */
  async getChatHistory(sessionId: string | null, limit: number = 5): Promise<ChatHistory> {
    // Generate session ID if not provided
    const finalSessionId = sessionId || this.generateSessionId();
    
    // Get messages if session exists
    const messages = sessionId ? await this.getSessionMessages(sessionId, limit) : [];
    
    return {
      sessionId: finalSessionId,
      messages
    };
  }

  /**
   * Clean up old messages (optional utility)
   */
  async cleanupOldMessages(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const { count, error } = await this.supabase
        .from('messages')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old messages:', error);
        return 0;
      }

      console.log(`🧹 Cleaned up ${count} old messages`);
      return count || 0;
    } catch (error) {
      console.error('Error in cleanupOldMessages:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService(); 