import { NextRequest, NextResponse } from 'next/server'
import mockData from '@/lib/mock-data.json'

// helper function to find matching chat response
function findChatResponse(query: string): string {
    const lowerQuery = query.toLowerCase()
    const keywords = mockData.chatResponses.keywords
    
    // check for keywords in query
    for (const [keyword, responses] of Object.entries(keywords)) {
        if (lowerQuery.includes(keyword)) {
            // return a random response from the matching category
            const randomIndex = Math.floor(Math.random() * responses.length)
            return responses[randomIndex]
        }
    }
    
    // return a random fallback response
    const fallbacks = mockData.chatResponses.fallback
    const randomIndex = Math.floor(Math.random() * fallbacks.length)
    return fallbacks[randomIndex]
}

export async function POST(request: NextRequest) {
    // simulate delay like express version
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    try {
        const body = await request.json()
        const { query, sessionId } = body
        
        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'Query is required'
            }, { status: 400 })
        }
        
        const answer = findChatResponse(query)
        
        return NextResponse.json({
            success: true,
            answer: answer,
            metadata: {
                sessionId: sessionId || 'demo-session',
                timestamp: new Date().toISOString(),
                mode: 'demo',
                note: 'This is a simulated response from the demo system'
            }
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Error generating response',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

