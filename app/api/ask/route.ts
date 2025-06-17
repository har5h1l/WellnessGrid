import { NextRequest, NextResponse } from 'next/server';

// Configuration for your ngrok Flask server
// You can update this URL when you get a new ngrok tunnel
const FLASK_API_BASE_URL = process.env.FLASK_API_URL || 'https://your-ngrok-url.ngrok-free.app';

interface UserContext {
  healthConditions: string[];
  // Add other user context fields as needed
}

interface Source {
  title: string;
  content: string;
  similarity?: number;
}

interface FlaskResponse {
  response: string;
  sources: Source[];
  mockMode: boolean;
  error?: string;
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

    console.log('Processing query:', query);
    console.log('User context:', userContext);
    console.log('Using Flask URL:', FLASK_API_BASE_URL);

    // Call your Flask API running on ngrok
    const response = await fetch(`${FLASK_API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add ngrok bypass header if needed
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        query: query,
        userContext: userContext || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Flask API error ${response.status}:`, errorText);
      
      return NextResponse.json({
        response: "I'm currently experiencing technical difficulties connecting to the AI service. Please try again in a moment or consult with a healthcare professional for immediate assistance.",
        sources: [],
        mockMode: true,
        error: `Flask API error: ${response.status}`
      }, { status: 500 });
    }

    const result: FlaskResponse = await response.json();
    
    console.log('Flask API response:', {
      responseLength: result.response?.length,
      sourcesCount: result.sources?.length,
      mockMode: result.mockMode
    });

    // Return the response from your Flask API
    return NextResponse.json({
      response: result.response,
      sources: result.sources || [],
      mockMode: result.mockMode || false,
      error: result.error
    });

  } catch (error) {
    console.error('Error in /api/ask:', error);
    
    return NextResponse.json({
      response: "I apologize, but I'm having trouble connecting to the health information service. Please try again later or consult with a healthcare professional for immediate assistance.",
      sources: [],
      mockMode: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'WellnessGrid AI API is running',
    flaskUrl: FLASK_API_BASE_URL,
    timestamp: new Date().toISOString()
  });
} 