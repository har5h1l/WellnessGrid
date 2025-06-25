// LLM Services for WellnessGrid
// Provides Gemini API integration with OpenRouter fallback
// Used for prompt enhancement and response communication

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { ChatMessage } from './chat-service';

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize services
let geminiClient: GoogleGenerativeAI | null = null;
let openrouterClient: OpenAI | null = null;

try {
  if (GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  if (OPENROUTER_API_KEY) {
    openrouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
    });
  }
} catch (error) {
  console.error('Error initializing LLM clients:', error);
}

// Prompts for different use cases
const PROMPT_ENHANCEMENT_TEMPLATE = `
You are a medical query enhancement specialist. Your role is to reformulate user health queries for optimal processing by a medical information retrieval system (RAG). The enhanced query will be used to search through medical documents and generate appropriate responses.

Your task:
- Transform the user's query into a medically precise search query
- Preserve the user's original intent and specific concerns
- Add relevant medical context that would help retrieve appropriate information
- Use proper medical terminology where helpful
- Consider what type of response the user likely needs (causes, treatment, prevention, etc.)
- If the query is about immediate care/injury, focus on management rather than causes
- Keep the enhanced query focused and concise

User query: "{originalQuery}"

Enhanced medical search query:`;

const PROMPT_ENHANCEMENT_WITH_HISTORY_TEMPLATE = `
You are a medical query enhancement specialist. Your role is to reformulate user health queries for optimal processing by a medical information retrieval system (RAG). The enhanced query will be used to search through medical documents and generate appropriate responses.

Your task:
- Transform the user's query into a medically precise search query
- Preserve the user's original intent and specific concerns
- Add relevant medical context that would help retrieve appropriate information
- Use proper medical terminology where helpful
- Consider what type of response the user likely needs (causes, treatment, prevention, etc.)
- If the query is about immediate care/injury, focus on management rather than causes
- Keep the enhanced query focused and concise
- Reference the conversation history above to maintain context and avoid repetition
- Build upon previous topics discussed if relevant to the current query

Based on the conversation history above, enhance this user query for medical AI processing:

User query: "{originalQuery}"

Enhanced medical search query:`;

const RESPONSE_COMMUNICATION_TEMPLATE = `
You are a medical communication assistant. Your task is to take a technical medical response and make it more accessible and user-friendly while maintaining accuracy.

Guidelines:
1. Use clear, simple language that patients can understand
2. Maintain all medical accuracy - do not change medical facts
3. Add empathetic and supportive tone
4. Structure information clearly with bullet points or numbered lists when helpful
5. Include appropriate disclaimers about consulting healthcare professionals
6. If there are technical terms, provide brief explanations
7. Make the response actionable when possible
8. Keep the response informative but not overwhelming

If the response is overly generic or suggests "see a doctor" without insight, regenerate a useful and medically responsible answer with 2-3 plausible causes, self-care tips, warning signs, and disclaimer.

Original medical response: "{originalResponse}"

User-friendly version:`;

const RESPONSE_COMMUNICATION_WITH_HISTORY_TEMPLATE = `
You are a medical communication assistant. Your task is to take a technical medical response and make it more accessible and user-friendly while maintaining accuracy.

Guidelines:
1. Use clear, simple language that patients can understand
2. Maintain all medical accuracy - do not change medical facts
3. Add empathetic and supportive tone
4. Structure information clearly with bullet points or numbered lists when helpful
5. Include appropriate disclaimers about consulting healthcare professionals
6. If there are technical terms, provide brief explanations
7. Make the response actionable when possible
8. Keep the response informative but not overwhelming
9. Consider the conversation history to maintain continuity and avoid repetition
10. Reference previous discussions if relevant to provide better context

If the response is overly generic or suggests "see a doctor" without insight, regenerate a useful and medically responsible answer with 2-3 plausible causes, self-care tips, warning signs, and disclaimer.

Based on the conversation history above, improve this medical response for the user: "{originalResponse}"

User-friendly version:`;

// RAG failure fallback prompt template
const RAG_FAILURE_FALLBACK_TEMPLATE = `
You are a medical assistant providing guidance when specific medical documents are not available. A user has asked a health-related question, but our medical document retrieval system could not find relevant information to answer their query.

Your role:
- Provide helpful, general medical guidance based on established medical knowledge
- Assess what type of response the user needs (immediate care, general advice, etc.)
- Consider the user's specific concern and tailor your response appropriately
- Potentially explore relevant factors like physiology, lifestyle, or environmental aspects if applicable
- Always prioritize safety and appropriate medical disclaimers

Guidelines:
- If it's an injury/emergency situation, focus on immediate care steps
- If it's a general health question, provide balanced information
- Include practical self-care advice when appropriate
- Mention warning signs that require professional attention
- Always include a disclaimer about professional medical care

User query: "{originalUserQuery}"

Helpful response:`;

export interface LLMResponse {
  success: boolean;
  content: string;
  service: 'gemini' | 'openrouter' | 'none';
  model?: string;
  error?: string;
}

export class LLMService {
  private async callGemini(prompt: string, retries = 1): Promise<LLMResponse> {
    if (!geminiClient) {
      return {
        success: false,
        content: '',
        service: 'none',
        error: 'Gemini API key not configured'
      };
    }

    try {
      // Use Gemini Pro 1.5 for enhanced capabilities
      const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text.trim(),
        service: 'gemini',
        model: 'gemini-1.5-pro'
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Check for quota/credit issues
      if (error?.message?.includes('quota') || 
          error?.message?.includes('limit') || 
          error?.status === 429) {
        console.log('Gemini quota exceeded, will fallback to OpenRouter');
        return {
          success: false,
          content: '',
          service: 'none',
          error: 'Quota exceeded'
        };
      }

      // Retry once for transient errors
      if (retries > 0) {
        console.log('Retrying Gemini request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callGemini(prompt, retries - 1);
      }

      return {
        success: false,
        content: '',
        service: 'none',
        error: error.message || 'Unknown Gemini error'
      };
    }
  }

  private async callGeminiWithHistory(
    messages: Array<{ role: string; parts: Array<{ text: string }> }>,
    retries = 1
  ): Promise<LLMResponse> {
    if (!geminiClient) {
      return {
        success: false,
        content: '',
        service: 'none',
        error: 'Gemini API key not configured'
      };
    }

    try {
      // Use Gemini Pro 1.5 for enhanced capabilities
      const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Start a chat session with history
      const chat = model.startChat({
        history: messages.slice(0, -1), // All messages except the last one
      });
      
      // Send the last message
      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text.trim(),
        service: 'gemini',
        model: 'gemini-1.5-pro'
      };
    } catch (error: any) {
      console.error('Gemini API error with history:', error);
      
      // Check for quota/credit issues
      if (error?.message?.includes('quota') || 
          error?.message?.includes('limit') || 
          error?.status === 429) {
        console.log('Gemini quota exceeded, will fallback to OpenRouter');
        return {
          success: false,
          content: '',
          service: 'none',
          error: 'Quota exceeded'
        };
      }

      // Retry once for transient errors
      if (retries > 0) {
        console.log('Retrying Gemini request with history...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callGeminiWithHistory(messages, retries - 1);
      }

      return {
        success: false,
        content: '',
        service: 'none',
        error: error.message || 'Unknown Gemini error'
      };
    }
  }

  private async callOpenRouter(prompt: string): Promise<LLMResponse> {
    if (!openrouterClient) {
      return {
        success: false,
        content: '',
        service: 'none',
        error: 'OpenRouter API key not configured'
      };
    }

    try {
      // Use a free model on OpenRouter (like Mistral 7B or Llama models)
      const completion = await openrouterClient.chat.completions.create({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        success: true,
        content: content.trim(),
        service: 'openrouter',
        model: 'mistralai/mistral-7b-instruct:free'
      };
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      return {
        success: false,
        content: '',
        service: 'none',
        error: error.message || 'Unknown OpenRouter error'
      };
    }
  }

  private async callOpenRouterWithHistory(messages: ChatMessage[]): Promise<LLMResponse> {
    if (!openrouterClient) {
      return {
        success: false,
        content: '',
        service: 'none',
        error: 'OpenRouter API key not configured'
      };
    }

    try {
      // Convert chat messages to OpenAI format
      const openaiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const completion = await openrouterClient.chat.completions.create({
        model: "mistralai/mistral-7b-instruct:free",
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        success: true,
        content: content.trim(),
        service: 'openrouter',
        model: 'mistralai/mistral-7b-instruct:free'
      };
    } catch (error: any) {
      console.error('OpenRouter API error with history:', error);
      return {
        success: false,
        content: '',
        service: 'none',
        error: error.message || 'Unknown OpenRouter error'
      };
    }
  }

  /**
   * Enhance user query for better medical AI processing
   */
  async enhanceQuery(originalQuery: string, chatHistory: ChatMessage[] = []): Promise<LLMResponse> {
    // Choose template and method based on whether we have chat history
    if (chatHistory.length > 0) {
      console.log(`🧠 Enhancing query with chat history (${chatHistory.length} messages)`);
      
      // Format messages for Gemini
      const geminiMessages = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Add the enhancement prompt as the final message
      const enhancementPrompt = PROMPT_ENHANCEMENT_WITH_HISTORY_TEMPLATE.replace('{originalQuery}', originalQuery);
      geminiMessages.push({
        role: 'user',
        parts: [{ text: enhancementPrompt }]
      });
      
      console.log(`\n[LLM Service] Chat History + Enhancement Prompt:\n${'-'.repeat(50)}`);
      geminiMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.role}: ${msg.parts[0].text.substring(0, 100)}...`);
      });
      console.log(`${'-'.repeat(50)}`);
      
      // Try Gemini with history first
      const geminiResult = await this.callGeminiWithHistory(geminiMessages);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter with history
      console.log('Falling back to OpenRouter for query enhancement with history');
      const historyWithPrompt = [...chatHistory, { 
        session_id: '', 
        role: 'user' as const, 
        content: enhancementPrompt 
      }];
      const openRouterResult = await this.callOpenRouterWithHistory(historyWithPrompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    } else {
      // No history - use simple prompt
      const prompt = PROMPT_ENHANCEMENT_TEMPLATE.replace('{originalQuery}', originalQuery);
      console.log(`\n[LLM Service] Prompt for Query Enhancement:\n${'-'.repeat(50)}\n${prompt}\n${'-'.repeat(50)}`);
      
      // Try Gemini first
      const geminiResult = await this.callGemini(prompt);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter
      console.log('Falling back to OpenRouter for query enhancement');
      const openRouterResult = await this.callOpenRouter(prompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    }

    // If both fail, return original query
    return {
      success: true,
      content: originalQuery,
      service: 'none',
      error: 'Both services failed, using original query'
    };
  }

  /**
   * Improve medical response communication for users
   */
  async improveResponse(originalResponse: string, chatHistory: ChatMessage[] = []): Promise<LLMResponse> {
    // Choose template and method based on whether we have chat history
    if (chatHistory.length > 0) {
      console.log(`💬 Improving response with chat history (${chatHistory.length} messages)`);
      
      // Format messages for Gemini
      const geminiMessages = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Add the improvement prompt as the final message
      const improvementPrompt = RESPONSE_COMMUNICATION_WITH_HISTORY_TEMPLATE.replace('{originalResponse}', originalResponse);
      geminiMessages.push({
        role: 'user',
        parts: [{ text: improvementPrompt }]
      });
      
      console.log(`\n[LLM Service] Chat History + Improvement Prompt:\n${'-'.repeat(50)}`);
      geminiMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.role}: ${msg.parts[0].text.substring(0, 100)}...`);
      });
      console.log(`${'-'.repeat(50)}`);
      
      // Try Gemini with history first
      const geminiResult = await this.callGeminiWithHistory(geminiMessages);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter with history
      console.log('Falling back to OpenRouter for response improvement with history');
      const historyWithPrompt = [...chatHistory, { 
        session_id: '', 
        role: 'user' as const, 
        content: improvementPrompt 
      }];
      const openRouterResult = await this.callOpenRouterWithHistory(historyWithPrompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    } else {
      // No history - use simple prompt
      const prompt = RESPONSE_COMMUNICATION_TEMPLATE.replace('{originalResponse}', originalResponse);
      console.log(`\n[LLM Service] Prompt for Response Improvement:\n${'-'.repeat(50)}\n${prompt}\n${'-'.repeat(50)}`);
      
      // Try Gemini first
      const geminiResult = await this.callGemini(prompt);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter
      console.log('Falling back to OpenRouter for response improvement');
      const openRouterResult = await this.callOpenRouter(prompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    }

    // If both fail, return original response
    return {
      success: true,
      content: originalResponse,
      service: 'none',
      error: 'Both services failed, using original response'
    };
  }

  /**
   * Handle RAG failure with diagnostic fallback
   */
  async handleRAGFailure(originalUserQuery: string, chatHistory: ChatMessage[] = []): Promise<LLMResponse> {
    console.log('🚨 RAG failure detected, using diagnostic fallback...');
    
    // Choose method based on whether we have chat history
    if (chatHistory.length > 0) {
      console.log(`🚨 Using RAG failure fallback with chat history (${chatHistory.length} messages)`);
      
      // Format messages for Gemini
      const geminiMessages = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Add context about the conversation and the current query
      const contextualPrompt = `
You are a medical assistant providing guidance when specific medical documents are not available. The user has been having a conversation with our medical AI system, and now has asked a question that our document retrieval system could not find relevant information for.

Your role:
- Provide helpful, general medical guidance based on established medical knowledge
- Consider the conversation history above to maintain context and continuity
- Assess what type of response the user needs (immediate care, general advice, etc.)
- Consider the user's specific concern and tailor your response appropriately
- Reference previous topics discussed if relevant to the current query
- Potentially explore relevant factors like physiology, lifestyle, or environmental aspects if applicable
- Always prioritize safety and appropriate medical disclaimers

Guidelines:
- If it's an injury/emergency situation, focus on immediate care steps
- If it's a general health question, provide balanced information
- Include practical self-care advice when appropriate
- Mention warning signs that require professional attention
- Always include a disclaimer about professional medical care
- Build upon the conversation context when relevant

Based on the conversation history above, provide guidance for this user query: "${originalUserQuery}"

Helpful response:`;
      
      geminiMessages.push({
        role: 'user',
        parts: [{ text: contextualPrompt }]
      });
      
      console.log(`\n[LLM Service] RAG Failure Fallback with History:\n${'-'.repeat(50)}`);
      geminiMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.role}: ${msg.parts[0].text.substring(0, 100)}...`);
      });
      console.log(`${'-'.repeat(50)}`);
      
      // Try Gemini with history first
      const geminiResult = await this.callGeminiWithHistory(geminiMessages);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter with history
      console.log('Falling back to OpenRouter for RAG failure handling with history');
      const historyWithPrompt = [...chatHistory, { 
        session_id: '', 
        role: 'user' as const, 
        content: contextualPrompt 
      }];
      const openRouterResult = await this.callOpenRouterWithHistory(historyWithPrompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    } else {
      // No history - use simple prompt
      const fallbackPrompt = RAG_FAILURE_FALLBACK_TEMPLATE.replace('{originalUserQuery}', originalUserQuery);
      console.log(`\n[LLM Service] RAG Failure Fallback Prompt:\n${'-'.repeat(50)}\n${fallbackPrompt}\n${'-'.repeat(50)}`);
      
      // Try Gemini first
      const geminiResult = await this.callGemini(fallbackPrompt);
      if (geminiResult.success) {
        return geminiResult;
      }

      // Fallback to OpenRouter
      console.log('Falling back to OpenRouter for RAG failure handling');
      const openRouterResult = await this.callOpenRouter(fallbackPrompt);
      if (openRouterResult.success) {
        return openRouterResult;
      }
    }

    // If both fail, return a basic fallback response
    return {
      success: true,
      content: `I understand you're experiencing: "${originalUserQuery}". While I couldn't retrieve specific medical documents, here are some general considerations:

**Possible causes to consider:**
• Lifestyle factors (sleep, stress, diet, hydration)
• Physical activity levels or recent changes
• Environmental factors (weather, air quality)
• Underlying health conditions

**General self-care steps:**
• Ensure adequate hydration and rest
• Monitor symptoms and their patterns
• Consider recent changes in routine or environment
• Practice stress management techniques

**Seek medical attention if:**
• Symptoms are severe or worsening
• You experience concerning warning signs
• Symptoms persist beyond a reasonable time
• You have underlying health conditions

**Important:** This information is not a substitute for professional medical care. Please consult with a healthcare provider for proper evaluation and treatment.`,
      service: 'none',
      error: 'Both LLM services failed, using hardcoded fallback'
    };
  }

  /**
   * Check service availability
   */
  getServiceStatus() {
    return {
      geminiAvailable: !!geminiClient && !!GEMINI_API_KEY,
      openrouterAvailable: !!openrouterClient && !!OPENROUTER_API_KEY,
      hasAnyService: !!(geminiClient || openrouterClient)
    };
  }
}

// Export singleton instance
export const llmService = new LLMService(); 