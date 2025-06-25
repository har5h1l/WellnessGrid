import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { llmService } from '@/lib/llm-services';
import { chatService, ChatMessage } from '@/lib/chat-service';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Flask backend configuration (for embeddings and text generation)
const FLASK_API_BASE_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

interface UserContext {
  healthConditions: string[];
  // Add other user context fields as needed
}

interface Source {
  title: string;
  source: string;
  similarity: string;
  rank: number;
}

interface RAGResponse {
  query: string;
  enhancedQuery?: string;
  answer: string;
  improvedAnswer?: string;
  sources: Source[];
  sessionId: string;
  metadata: {
    documentsUsed: number;
    totalFound: number;
    contextLength: number;
    flaskBackendUsed: boolean;
    processingTime: string;
    chatHistoryUsed: boolean;
    messagesInHistory: number;
    llmEnhancement: {
      queryEnhanced: boolean;
      queryEnhancementService?: string;
      responseImproved: boolean;
      responseImprovementService?: string;
      fallbacksUsed: string[];
    };
  };
}

class EnhancedSupabaseRAGSystem {
  private supabase;
  
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  async searchSimilarDocuments(queryEmbedding: number[], topK: number = 5, threshold: number = 0.5) {
    try {
      const { data, error } = await this.supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK
      });
      
      if (error) {
        console.error('Supabase search error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error searching similar documents:', error);
      return [];
    }
  }
  
  async generateResponse(query: string, context: string, chatHistory: ChatMessage[] = []): Promise<string | null> {
    try {
      // Format chat history for BioMistral
      const historyString = chatService.formatForBioMistral(chatHistory);
      
      // Prepare the payload with chat history
      const payload = {
        query: query,
        context: context,
        history: chatHistory, // Send as array for Flask to handle
        max_tokens: 200,
        temperature: 0.7
      };

      console.log(`🔬 Sending to BioMistral with ${chatHistory.length} history messages`);
      if (historyString) {
        console.log(`\n[API] Chat History for BioMistral:\n${'-'.repeat(50)}\n${historyString}${'-'.repeat(50)}`);
      }
      
      // Call Flask /generate endpoint for GPU-accelerated text generation
      const response = await fetch(`${FLASK_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000) // 120 second timeout (increased from 60s)
      });
      
      if (!response.ok) {
        console.error(`Flask generate error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details from Flask: ${errorText}`);
        return null;
      }
      
      const result = await response.json();
      return result.answer || null;
    } catch (error: any) {
      console.error('Error calling Flask backend for generation:', error);
      if (error.name === 'TimeoutError') {
        console.error('TimeoutError: The request to the Flask generate endpoint timed out.');
        console.error('Possible causes: \n1. The Flask server is not running. \n2. The model is taking too long to load or generate. \n3. The FLASK_API_BASE_URL is incorrect.');
      }
      return null;
    }
  }
  
  async getQueryEmbedding(query: string): Promise<number[] | null> {
    try {
      console.log('🔍 Generating PubMedBERT embedding via Flask...');
      console.log(`🌐 Flask URL: ${FLASK_API_BASE_URL}/embed`);
      
      // Call Flask /embed endpoint for PubMedBERT embeddings (medical accuracy)
      const response = await fetch(`${FLASK_API_BASE_URL}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ text: query }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        console.error(`Flask embed error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details from Flask: ${errorText}`);
        return null;
      }
      
      const result = await response.json();
      console.log(`✅ Generated PubMedBERT embedding (${result.embedding?.length || 0} dimensions)`);
      return result.embedding || null;
    } catch (error: any) {
      console.error('Error calling Flask backend for embedding:', error);
       if (error.name === 'TimeoutError') {
        console.error('TimeoutError: The request to the Flask embed endpoint timed out.');
        console.error('Possible causes: \n1. The Flask server is not running. \n2. The embedding model is taking too long to load. \n3. The FLASK_API_BASE_URL is incorrect.');
      }
      return null;
    }
  }
  
  async query(question: string, sessionId: string): Promise<RAGResponse> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    
    console.log('🚀 Starting enhanced RAG query with LLM integration...');
    console.log('📝 Original query:', question);
    console.log('🆔 Session ID:', sessionId);
    
    // Step 1: Get chat history
    const chatHistory = await chatService.getChatHistory(sessionId);
    const hasHistory = chatHistory.messages.length > 0;
    
    if (hasHistory) {
      console.log(`📚 Retrieved ${chatHistory.messages.length} messages from chat history`);
      console.log('\n[API] Chat History:');
      chatHistory.messages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
      });
    } else {
      console.log('📚 No chat history found, starting new conversation');
    }
    
    // Step 2: Enhance query using Gemini/OpenRouter with chat history
    let finalQuery = question;
    let queryEnhanced = false;
    let queryEnhancementService: string | undefined;
    
    console.log('🧠 Enhancing query with LLM...');
    const queryEnhancement = await llmService.enhanceQuery(question, chatHistory.messages);
    if (queryEnhancement.success && queryEnhancement.content !== question) {
      finalQuery = queryEnhancement.content;
      queryEnhanced = true;
      queryEnhancementService = queryEnhancement.service;
      console.log('✅ Query enhanced via:', queryEnhancement.service);
      console.log(`\n[API] Enhanced query for BioMistral:\n${'-'.repeat(50)}\n${finalQuery}\n${'-'.repeat(50)}`);
    } else {
      console.log('⚠️ Query enhancement failed or no improvement:', queryEnhancement.error);
      if (queryEnhancement.error) {
        fallbacksUsed.push('query_enhancement_failed');
      }
    }
    
    // Step 3: Get query embedding using Flask PubMedBERT (medical accuracy)
    const queryEmbedding = await this.getQueryEmbedding(finalQuery);
    
    if (!queryEmbedding) {
      // Fallback response when embedding fails
      fallbacksUsed.push('embedding_failed');
      const answer = "I'm currently experiencing technical difficulties with the embedding service. This might be due to the backend model taking too long to respond. Please try again in a moment.";
      const improvedAnswer = await llmService.improveResponse(answer, chatHistory.messages);
      
      return {
        query: question,
        enhancedQuery: queryEnhanced ? finalQuery : undefined,
        answer: improvedAnswer.success ? improvedAnswer.content : answer,
        sources: [],
        sessionId: chatHistory.sessionId,
        metadata: {
          documentsUsed: 0,
          totalFound: 0,
          contextLength: 0,
          flaskBackendUsed: false,
          processingTime: new Date().toISOString(),
          chatHistoryUsed: hasHistory,
          messagesInHistory: chatHistory.messages.length,
          llmEnhancement: {
            queryEnhanced,
            queryEnhancementService,
            responseImproved: false,
            fallbacksUsed
          }
        }
      };
    }
    
    // Step 4: Search for similar documents in Supabase
    const similarDocs = await this.searchSimilarDocuments(queryEmbedding);
    
    // Step 5: Prepare context from retrieved documents
    const contextParts: string[] = [];
    let totalChars = 0;
    const maxContextLength = 2000;
    
    for (const doc of similarDocs) {
      const docText = `Source: ${doc.source}\n${doc.chunk_content}`;
      if (totalChars + docText.length <= maxContextLength) {
        contextParts.push(docText);
        totalChars += docText.length;
      } else {
        break;
      }
    }
    
    const context = contextParts.join('\n\n');
    
    // Step 6: Generate response using Flask BioGPT (GPU-accelerated) with chat history
    let generatedAnswer = null;
    let flaskBackendUsed = false;
    if (context.length > 0) {
      console.log('🔬 Generating response with BioMistral/BioGPT...');
      generatedAnswer = await this.generateResponse(finalQuery, context, chatHistory.messages);
      if(generatedAnswer) {
        flaskBackendUsed = true;
        console.log(`\n[API] Raw Answer from BioMistral:\n${'-'.repeat(50)}\n${generatedAnswer}\n${'-'.repeat(50)}`);
      } else {
        fallbacksUsed.push('generation_failed');
        console.log('\n[API] BioMistral response generation failed.');
      }
    }
    
    // Step 7: Prepare initial response
    const rawAnswer = generatedAnswer || 
      (similarDocs.length > 0 
        ? "Based on the available medical information, I found relevant context but couldn't generate a response. This may be due to a timeout from the medical generation model. Please try again, and if the issue persists, a simpler query might work better."
        : "I couldn't find relevant information for your query. Please consult with a healthcare professional for medical advice.");
    
    // Step 8: Improve response communication using Gemini/OpenRouter with chat history
    let finalAnswer = rawAnswer;
    let responseImproved = false;
    let responseImprovementService: string | undefined;
    
    console.log('💬 Improving response communication with LLM...');
    const responseImprovement = await llmService.improveResponse(rawAnswer, chatHistory.messages);
    if (responseImprovement.success && responseImprovement.content !== rawAnswer) {
      finalAnswer = responseImprovement.content;
      responseImproved = true;
      responseImprovementService = responseImprovement.service;
      console.log('✅ Response improved via:', responseImprovement.service);
      console.log(`\n[API] Final Answer from Gemini:\n${'-'.repeat(50)}\n${finalAnswer}\n${'-'.repeat(50)}`);
    } else {
      console.log('⚠️ Response improvement failed or no improvement:', responseImprovement.error);
      if (responseImprovement.error) {
        fallbacksUsed.push('response_improvement_failed');
      }
    }
    
    // Step 9: Save conversation to database
    console.log('💾 Saving conversation to database...');
    await chatService.insertMessagePair(
      chatHistory.sessionId,
      question, // Original user query
      finalAnswer, // Final improved response
      {
        queryEnhanced,
        responseImproved,
        documentsUsed: contextParts.length,
        flaskBackendUsed
      }
    );
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
    console.log('⏱️ Total processing time:', processingTime);
    
    return {
      query: question,
      enhancedQuery: queryEnhanced ? finalQuery : undefined,
      answer: finalAnswer,
      improvedAnswer: responseImproved ? finalAnswer : undefined,
      sources: similarDocs.map((doc, index) => ({
        title: doc.title || 'Medical Information',
        source: doc.source,
        similarity: doc.similarity.toFixed(3),
        rank: index + 1
      })),
      sessionId: chatHistory.sessionId,
      metadata: {
        documentsUsed: contextParts.length,
        totalFound: similarDocs.length,
        contextLength: context.length,
        flaskBackendUsed: flaskBackendUsed,
        processingTime: new Date().toISOString(),
        chatHistoryUsed: hasHistory,
        messagesInHistory: chatHistory.messages.length,
        llmEnhancement: {
          queryEnhanced,
          queryEnhancementService,
          responseImproved,
          responseImprovementService,
          fallbacksUsed
        }
      }
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { query, sessionId, userContext } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('🏥 Processing enhanced medical query:', query);
    console.log('🆔 Session ID:', sessionId || 'Not provided (will generate new)');
    console.log('👤 User context:', userContext);
    
    // Check LLM service status
    const serviceStatus = llmService.getServiceStatus();
    console.log('🔧 LLM Services Status:', serviceStatus);

    // Initialize Enhanced Supabase RAG system
    const ragSystem = new EnhancedSupabaseRAGSystem();
    
    // Use provided sessionId or generate new one
    const finalSessionId = sessionId || chatService.generateSessionId();
    
    // Process the query using the enhanced RAG system with chat history
    const result = await ragSystem.query(query, finalSessionId);
    
    console.log('📊 Enhanced RAG response summary:', {
      originalQuery: result.query,
      sessionId: result.sessionId,
      chatHistoryUsed: result.metadata.chatHistoryUsed,
      messagesInHistory: result.metadata.messagesInHistory,
      queryEnhanced: result.metadata.llmEnhancement.queryEnhanced,
      responseImproved: result.metadata.llmEnhancement.responseImproved,
      answerLength: result.answer?.length,
      sourcesCount: result.sources?.length,
      documentsUsed: result.metadata.documentsUsed,
      flaskBackendUsed: result.metadata.flaskBackendUsed,
      servicesUsed: {
        queryEnhancement: result.metadata.llmEnhancement.queryEnhancementService,
        responseImprovement: result.metadata.llmEnhancement.responseImprovementService
      },
      fallbacksUsed: result.metadata.llmEnhancement.fallbacksUsed
    });

    // Return the enhanced response with session info
    return NextResponse.json({
      query: result.query,
      enhancedQuery: result.enhancedQuery,
      answer: result.answer,
      improvedAnswer: result.improvedAnswer,
      sources: result.sources,
      sessionId: result.sessionId,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Error in enhanced /api/ask:', error);
    
    return NextResponse.json({
      query: body?.query || '',
      answer: "I apologize, but I'm having trouble processing your request. Please try again later or consult with a healthcare professional for immediate assistance.",
      sources: [],
      sessionId: body?.sessionId || chatService.generateSessionId(),
      metadata: {
        documentsUsed: 0,
        totalFound: 0,
        contextLength: 0,
        flaskBackendUsed: false,
        processingTime: new Date().toISOString(),
        chatHistoryUsed: false,
        messagesInHistory: 0,
        llmEnhancement: {
          queryEnhanced: false,
          responseImproved: false,
          fallbacksUsed: ['system_error']
        }
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('medical_documents').select('*', { count: 'exact', head: true });
    
    const docCount = data?.length || 0;
    
    // Check LLM service status
    const serviceStatus = llmService.getServiceStatus();
    
    return NextResponse.json({ 
      message: 'WellnessGrid Enhanced AI API with Multi-turn Chat Support',
      supabaseConnected: !error,
      documentsInDatabase: docCount,
      flaskUrl: FLASK_API_BASE_URL,
      llmServices: serviceStatus,
      features: {
        queryEnhancement: serviceStatus.hasAnyService,
        responseImprovement: serviceStatus.hasAnyService,
        fallbackSupport: serviceStatus.geminiAvailable && serviceStatus.openrouterAvailable,
        multiTurnChat: true,
        chatHistory: true,
        sessionManagement: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      message: 'WellnessGrid AI API is running with limited functionality',
      supabaseConnected: false,
      llmServices: { geminiAvailable: false, openrouterAvailable: false, hasAnyService: false },
      features: { multiTurnChat: false, chatHistory: false },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 