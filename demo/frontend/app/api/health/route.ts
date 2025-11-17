import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'WellnessGrid Demo API is running',
        mode: 'demo',
        timestamp: new Date().toISOString()
    })
}

