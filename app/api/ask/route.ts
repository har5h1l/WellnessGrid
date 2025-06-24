import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  answer: string;
  sources: Source[];
  metadata: {
    documentsUsed: number;
    totalFound: number;
    contextLength: number;
    flaskBackendUsed: boolean;
    processingTime: string;
  };
}

class SupabaseRAGSystem {
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
  
  async generateResponse(query: string, context: string): Promise<string | null> {
    try {
      // Call Flask /generate endpoint for GPU-accelerated text generation
      const response = await fetch(`${FLASK_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          query: query,
          context: context,
          max_tokens: 200,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });
      
      if (!response.ok) {
        console.error(`Flask generate error: ${response.status}`);
        return null;
      }
      
      const result = await response.json();
      return result.answer || null;
    } catch (error) {
      console.error('Error calling Flask backend:', error);
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
        console.error(`Error details: ${errorText}`);
        return null;
      }
      
      const result = await response.json();
      console.log(`✅ Generated PubMedBERT embedding (${result.embedding?.length || 0} dimensions)`);
      return result.embedding || null;
    } catch (error) {
      console.error('Error generating PubMedBERT embedding:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      return null;
    }
  }
  
  async query(question: string): Promise<RAGResponse> {
    const startTime = Date.now();
    
    // Step 1: Get query embedding using Flask PubMedBERT (medical accuracy)
    const queryEmbedding = await this.getQueryEmbedding(question);
    
    if (!queryEmbedding) {
      // Fallback response when embedding fails
      return {
        query: question,
        answer: "I'm currently experiencing technical difficulties with the embedding service. Please try again later or consult with a healthcare professional for immediate assistance.",
        sources: [],
        metadata: {
          documentsUsed: 0,
          totalFound: 0,
          contextLength: 0,
          flaskBackendUsed: false,
          processingTime: new Date().toISOString()
        }
      };
    }
    
    // Step 2: Search for similar documents in Supabase
    const similarDocs = await this.searchSimilarDocuments(queryEmbedding);
    
    // Step 3: Prepare context from retrieved documents
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
    
    // Step 4: Generate response using Flask BioGPT (GPU-accelerated)
    let generatedAnswer = null;
    if (context.length > 0) {
      generatedAnswer = await this.generateResponse(question, context);
    }
    
    // Step 5: Prepare final response
    const answer = generatedAnswer || 
      (similarDocs.length > 0 
        ? "Based on the available medical information, I found relevant context but couldn't generate a response. Please consult with a healthcare professional for specific medical advice."
        : "I couldn't find relevant information for your query. Please consult with a healthcare professional for medical advice.");
    
    return {
      query: question,
      answer: answer,
      sources: similarDocs.map((doc, index) => ({
        title: doc.title || 'Medical Information',
        source: doc.source,
        similarity: doc.similarity.toFixed(3),
        rank: index + 1
      })),
      metadata: {
        documentsUsed: contextParts.length,
        totalFound: similarDocs.length,
        contextLength: context.length,
        flaskBackendUsed: !!generatedAnswer,
        processingTime: new Date().toISOString()
      }
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { query, userContext } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Processing query with Supabase RAG:', query);
    console.log('User context:', userContext);

    // Initialize Supabase RAG system
    const ragSystem = new SupabaseRAGSystem();
    
    // Process the query using the RAG system
    const result = await ragSystem.query(query);
    
    console.log('RAG response:', {
      answerLength: result.answer?.length,
      sourcesCount: result.sources?.length,
      documentsUsed: result.metadata.documentsUsed,
      flaskBackendUsed: result.metadata.flaskBackendUsed
    });

    // Return the response in the same format as before for compatibility
    return NextResponse.json({
      query: result.query,
      answer: result.answer,
      sources: result.sources,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Error in /api/ask:', error);
    
    return NextResponse.json({
      query: body?.query || '',
      answer: "I apologize, but I'm having trouble processing your request. Please try again later or consult with a healthcare professional for immediate assistance.",
      sources: [],
      metadata: {
        documentsUsed: 0,
        totalFound: 0,
        contextLength: 0,
        flaskBackendUsed: false,
        processingTime: new Date().toISOString()
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
    
  return NextResponse.json({ 
      message: 'WellnessGrid AI API is running with Supabase RAG',
      supabaseConnected: !error,
      documentsInDatabase: docCount,
    flaskUrl: FLASK_API_BASE_URL,
    timestamp: new Date().toISOString()
  });
  } catch (error) {
    return NextResponse.json({
      message: 'WellnessGrid AI API is running with limited functionality',
      supabaseConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 