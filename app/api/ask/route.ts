import { NextRequest, NextResponse } from 'next/server';

// Mock document database for demonstration
const MOCK_DOCUMENTS = [
  {
    id: 1,
    title: "Understanding Blood Pressure",
    content: "Blood pressure is the force of blood against the walls of your arteries. High blood pressure (hypertension) can lead to serious health problems including heart disease, stroke, and kidney disease. Normal blood pressure is typically around 120/80 mmHg.",
    embedding: null // Will be populated with actual embeddings in real implementation
  },
  {
    id: 2,
    title: "Heart Rate and Exercise",
    content: "Your heart rate is the number of times your heart beats per minute. During exercise, your heart rate increases to pump more oxygen-rich blood to your muscles. A normal resting heart rate for adults ranges from 60 to 100 beats per minute.",
    embedding: null
  },
  {
    id: 3,
    title: "Nutrition and Wellness",
    content: "A balanced diet rich in fruits, vegetables, whole grains, and lean proteins is essential for maintaining good health. Proper nutrition helps prevent chronic diseases, supports immune function, and promotes overall well-being.",
    embedding: null
  },
  {
    id: 4,
    title: "Sleep and Health",
    content: "Getting adequate sleep is crucial for physical and mental health. Adults should aim for 7-9 hours of sleep per night. Poor sleep can affect immune function, weight management, and cognitive performance.",
    embedding: null
  },
  {
    id: 5,
    title: "Stress Management",
    content: "Chronic stress can negatively impact both physical and mental health. Effective stress management techniques include regular exercise, meditation, deep breathing, and maintaining social connections.",
    embedding: null
  }
];

// Hugging Face API configuration
const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/';

// Model configurations
const BIOGPT_MODEL = 'microsoft/BioGPT-Large';
const BIOBERT_MODEL = 'dmis-lab/biobert-base-cased-v1.1';

interface Document {
  id: number;
  title: string;
  content: string;
  embedding: number[] | null;
  similarity?: number;
}

async function generateEmbedding(text: string): Promise<number[]> {
  // If no API token, return mock embedding immediately
  if (!HF_API_TOKEN) {
    console.log('No API token - using mock embedding');
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }

  try {
    const response = await fetch(`${HF_API_URL}${BIOBERT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Embedding API error ${response.status}:`, errorText);
      
      // Handle specific error cases gracefully
      if (response.status === 401) {
        console.warn('Invalid API token for embeddings - using mock embedding');
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded for embeddings - using mock embedding');
      } else if (response.status === 503) {
        console.warn('Embedding model unavailable - using mock embedding');
      }
      
      // Always fall back to mock embedding instead of throwing
      return Array(768).fill(0).map(() => Math.random() - 0.5);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return mock embedding for demonstration
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

async function generateAnswer(query: string, relevantDocs: Document[]): Promise<string> {
  // If no API token, return mock answer immediately
  if (!HF_API_TOKEN) {
    console.log('No API token - using mock answer generation');
    const context = relevantDocs.map(doc => doc.content).join(' ');
    return `Based on the available health information, here's what I can tell you about "${query}": 
      
${relevantDocs[0]?.content || 'I found relevant information in our health database.'} 

Please consult with a healthcare professional for personalized medical advice.`;
  }

  try {
    // Construct context from relevant documents
    const context = relevantDocs.map(doc => 
      `Document: ${doc.title}\nContent: ${doc.content}`
    ).join('\n\n');

    const prompt = `Based on the following medical and health information, answer the question: "${query}"\n\nContext:\n${context}\n\nAnswer:`;

    const response = await fetch(`${HF_API_URL}${BIOGPT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        },
        options: { wait_for_model: true }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Generation API error ${response.status}:`, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        console.warn('Invalid API token - falling back to mock mode');
        return `Based on the available health information, here's what I can tell you about "${query}": 
        
${relevantDocs[0]?.content || 'I found relevant information in our health database.'} 

Please consult with a healthcare professional for personalized medical advice.`;
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded - falling back to mock mode');
        return `I'm currently experiencing high demand. Based on the available health information: "${query}" - ${relevantDocs[0]?.content || 'Please try again in a moment.'}`;
      } else if (response.status === 503) {
        console.warn('Model unavailable - falling back to mock mode');
        return `The AI model is currently loading. Based on our health database: "${query}" - ${relevantDocs[0]?.content || 'Please try again in a moment.'}`;
      }
      
      // For other errors, fall back to mock response
      throw new Error(`Generation API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Extract the generated text, removing the prompt
    let generatedText = result[0]?.generated_text || '';
    if (generatedText.includes('Answer:')) {
      generatedText = generatedText.split('Answer:')[1].trim();
    }
    
    return generatedText || 'I apologize, but I cannot provide a complete answer based on the available information.';
  } catch (error) {
    console.error('Error generating answer:', error);
    // Fallback to mock response
    return `Based on the available health information, here's what I can tell you about "${query}": 
    
${relevantDocs[0]?.content || 'I found relevant information in our health database.'} 

Please consult with a healthcare professional for personalized medical advice.`;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function mockSearchDocuments(queryEmbedding: number[], topK: number = 3): Document[] {
  // In a real implementation, you would:
  // 1. Retrieve document embeddings from a vector database
  // 2. Calculate similarity scores
  // 3. Return top K most similar documents
  
  // For mock purposes, we'll randomly select documents and add similarity scores
  const documentsWithScores = MOCK_DOCUMENTS.map(doc => ({
    ...doc,
    similarity: Math.random() * 0.6 + 0.4 // Mock similarity between 0.4 and 1.0
  }));
  
  // Sort by similarity and return top K
  return documentsWithScores
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, topK);
}

export async function POST(request: NextRequest) {
  try {
    // Check for API token (allow running without token for development)
    if (!HF_API_TOKEN) {
      console.warn('Hugging Face API token not configured - running in mock mode');
    }

    // Parse request body
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Processing query:', query);

    // Step 1: Generate embedding for the query
    console.log('Generating embedding for query...');
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search for relevant documents (mocked)
    console.log('Searching for relevant documents...');
    const relevantDocs = mockSearchDocuments(queryEmbedding, 3);

    // Step 3: Generate answer using BioGPT with relevant documents
    console.log('Generating answer with BioGPT...');
    let answer: string;
    
    if (HF_API_TOKEN) {
      answer = await generateAnswer(query, relevantDocs);
    } else {
      // Provide a mock answer based on the query and relevant docs
      answer = `Based on the available health information, here's what I can tell you about "${query}": 
      
${relevantDocs[0]?.content || 'I found relevant information in our health database.'} 

Please consult with a healthcare professional for personalized medical advice.`;
    }

    // Return the response
    return NextResponse.json({
      query,
      answer,
      sources: relevantDocs.map(doc => ({
        title: doc.title,
        similarity: doc.similarity?.toFixed(3) || '0.000'
      })),
      metadata: {
        documentsUsed: relevantDocs.length,
        processingTime: Date.now(),
        mockMode: !HF_API_TOKEN
      }
    });

  } catch (error) {
    console.error('Error in ask API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit queries.' },
    { status: 405 }
  );
} 