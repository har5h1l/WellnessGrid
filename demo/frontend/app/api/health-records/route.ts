import { NextRequest, NextResponse } from 'next/server'
import mockData from '@/lib/mock-data.json'

export async function GET(request: NextRequest) {
    // simulate delay like express version
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    return NextResponse.json({
        success: true,
        data: mockData.healthRecords
    })
}

